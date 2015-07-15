/* global process */
/**
 * `path` type prompt
 */

var _ = require("lodash");
var util = require("util");
var chalk = require("chalk");
var Base = require('inquirer/lib/prompts/base');
var utils = require("inquirer/lib/utils/utils");
var Separator = require("inquirer/lib/objects/separator");
var observe = require("inquirer/lib/utils/events");

var path = require('path');
var fs = require('fs');

/**
 * Module exports
 */

module.exports = Prompt;


/**
 * Constructor
 */

function Prompt() {
  Base.apply( this, arguments );

  // cwd being a String
  if (this.opt.cwd && !_.isString(this.opt.cwd) ) {
    this.throwParamError("cwd");
  }
  
  this.opt.cwd = path.resolve(this.opt.cwd || '.');
  
  

  this.optionsLines = [];
  this.lines = [];
  this.selected = "";

  return this;
}
util.inherits( Prompt, Base );


/**
 * Start the Inquiry session
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function( cb ) {
  this.done = cb;

  // Save user answer and update prompt to show selected option.
  var events = observe(this.rl);
  this.lineObs = events.line.forEach( this.onSubmit.bind(this) );
  this.keypressObs = events.keypress.forEach( this.onKeypress.bind(this) );

  // Init the prompt
  this.render();

  return this;
};


/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function() {

  // Render question
  var message = this.getQuestion();

  if ( this.status === "answered" ) {
    message += chalk.cyan( this.selected ) + "\n";
  }
  
  utils.writeMessage( this, message );

  return this;
};


/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function( input ) {
  if ( input == null || input === "" ) {
    //Error or cwd?
    input = this.rawDefault;
  }

  if ( this.selected ) {
    this.status = "answered";
    //this.selected = selected;

    //Clean previous
    this
      .down(this.optionsLines.length)
      .clean(this.optionsLines.length);
      
    // Re-render prompt
    this.down().clean(2).render();

    this.lineObs.dispose();
    this.keypressObs.dispose();
    this.done( this.selected );
    return;
  }

  // Input is invalid
  this
    .error("Please enter a valid command")
    .clean()
    .render();
};


function filterList(list, filter) {
  if ( !filter ) {
    return list;
  }
  
  var filterStr = filter.split('').map(function(elem){
    return '.*' + elem.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/, "\\$&");
  }).join('') + '.*';
  
  var regex = RegExp(filterStr, 'i');
  
  return list.filter(function (item) {
    return regex.test(item);
  });
}

function isDir(dirPath) {
  try {
    var stats = fs.statSync(dirPath);
    return !stats.isFile();
  } catch (error) {
    return false;
  }
}

function getDirContenList (dirPath, options) {
  return fs.readdirSync(dirPath).map(
    function (elem) {
      if ( isDir(path.join(dirPath, elem)) ) {
        return elem + '/'; 
      }
      return elem;
    }
  );
}

function getMaxLength (list) {
  return Math.max.apply(null, list.map(function (elem) {
    return elem.length;
  }));
}

function getLines (list) {
  
  if ( list.length == 0 ) {
    return [];
  }
  
  var maxLength = getMaxLength(list) + 2; //It is only to add an extra space
  var maxColumns = Math.floor(process.stdout.columns/maxLength); 
  var maxRows = Math.ceil(list.length/maxColumns);

  var lines = new Array(maxRows);
  for (var i = 0; i < maxRows; i++) {
    lines[i] = [];
  }

  list.forEach(function (elem, index) {
    lines[index % maxRows].push(elem + Array(maxLength - elem.length).join(' '));
  });
  
  return lines.map(function (elem) {
    return elem.join(' ');
  });
}

/**
 * When user press a key
 * 
 *  press tab to try to autocomplete the path section
 *    if a single option is possible, the option will be filled in the console
 *    if the list has more than one item and tab is pressed, the first filtered value in the list will be autofilled 
 *    if tab is pressed again, the next filtered value in the list will be autofilled and so on.  
 *  
 *  press escape to erase the list
 * 
 *  if the user modifies the path until change the directory, the list will be erased  
 */

Prompt.prototype.onKeypress = function( input ) {
  //First, clean previous
  this
    .down(this.optionsLines.length)
    .clean(this.optionsLines.length);
  
  var currentPath = path.join(this.opt.cwd, this.rl.line);
  var currentDir = currentPath.match(/.+\/$/) ? currentPath.substr(0, currentPath.length-1) : path.dirname(currentPath);
  //Verify the the user is in the same directory
  if (currentDir !== this.currentDir) {
    this.tabPressed = false;
    this.list = [];
    this.currentDir = currentDir;
  }
  
  if ( input.key && input.key.name === "tab" ) {
    if ( this.tabPressed ) {
      //this.rl.line = 'lala';
      //this.rl.cursor = this.rl.line.length;
    }
    //If there is no options, lets get them
    if ( this.list.length === 0 ) {
      this.list = getDirContenList(currentDir);
    } else {
      this.tabPressed = true;
      if ( this.filteredList ) {
        this.currentOption = this.currentOption + 1;
        if ( this.currentOption >= this.filteredList ) {
          this.currentOption = 0;
        }
      }
    }
  } else if ( input.key && input.key.name === "escape" ) {
    this.tabPressed = false;
    this.list = [];
  } else {
    this.tabPressed = false;
  }
  
  this.selected = this.rl.line;
  this.cacheCursorPos();
  
  if ( this.list.length > 0) {
    if ( !this.tabPressed ) {
      var base = currentPath.match(/\/$/)?'':path.basename(currentPath);
      //Filter the current list
      this.filteredList = filterList(this.list, base);
      //Get the filtered list in string lines
      this.optionsLines = getLines(this.filteredList);
      
      this.currentOption = -1;
  //    console.log(this.optionsLines);
    }
  } else {
    this.optionsLines = [];
  }
  
  if (this.optionsLines.length) {
    this
      .down()
      .write(this.optionsLines.join('\n'))
      .up(this.optionsLines.length)
      .clean();
  }
  
  this.clean();
  this.render();

  //this.write(this.rl.line).restoreCursorPos();
  
  //var newLength = this.selectedKey.length - this.rl.line.length;
  this.write(this.rl.line).restoreCursorPos();
};

