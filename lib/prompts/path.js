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
 * 
 *  Path Prompt Options:
 *    cwd (optional): base path directory. Current Working Directory by default.
 *    mode (optional):
 *      - bash: linux like terminal behavior (default).
 *      - cmd: windows like command prompt behavior.
 *      - mr
 *    dirOnly (opional): indicates if files are listed in the options, flase by default.
 *    absolute (optional): indicates if the resulting path is express as relative or absolute
 *      , false by default.
 *    
 *  
 */

function Prompt() {
  Base.apply( this, arguments );

  // cwd being a String
  if (this.opt.cwd && !_.isString(this.opt.cwd) ) {
    this.throwParamError("cwd");
  }
  
  this.opt.cwd = this.opt.cwd || './';
  
  this.optionsLines = [];
  this.lines = [];
  this.selected = this.opt.cwd;

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

  //Initialice the line with the cwd
  this.rl.line = this.opt.cwd;
  this.rl.cursor = this.rl.line.length;

  // Init the prompt
  this.render().write(this.rl.line);

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
    
    if ( this.opt.absolute ) {
      this.selected = path.resolve(this.selected);
      if ( isDir(this.selected) ) {
        this.selected += '/';
      }
    }
    
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

function filterListBash(list, filter) {
  if ( !filter ) {
    return list;
  }
  
  var filterStr = '^' + filter.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + '.*';
  
  var regex = RegExp(filterStr);
  
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
  var absDirPath = path.resolve(dirPath);
  //console.log(absDirPath);
  return fs.readdirSync(absDirPath).map(
    function (elem) {
      if ( isDir(path.join(absDirPath, elem)) ) {
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
  var linesLength = Math.min(maxRows, 8);
  var lines = new Array(linesLength);
  
  for (var i = 0; i < linesLength; i++) {
    lines[i] = [];
  }

  list.forEach(function (elem, index) {
    if ( index >= maxColumns*linesLength) {
      return false;
    }
    lines[index % linesLength].push(elem + Array(maxLength - elem.length).join(' '));
  });
  
  var result = lines.map(function (elem) {
    return elem.join(' ');
  });
  
  //Prevent to show more than 8 rows
  if ( maxRows > 8 ) {
    result.push('Too many results, please add some chars to filter the results');
  }
  
  return result;
}

/**
 * This function was taken from: 
 * http://stackoverflow.com/questions/1916218/find-the-longest-common-starting-substring-in-a-set-of-strings
 */

function sharedStart (array) {
    var A= array.concat().sort(), 
    a1= A[0], a2= A[A.length-1], L= a1.length, i= 0;
    while(i<L && a1.charAt(i)=== a2.charAt(i)) i++;
    return a1.substring(0, i);
}

/**
 * When user press a key
 * 
 *  bash:
 *    when tab is pressed, try to fill the prompt:
 *      if a single option is possible, complete with it
 *      if more than an option is possible, complete with the common text between them
 *      if more than an option is possible and no common text exists between them, show options
 * 
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
 
Prompt.prototype.bash = function ( input ) {
  
  if ( input.key && input.key.name === "tab" ) {
    
    this.showOptions = false;
    
    if ( this.list.length === 0 ) {
      this.list = getDirContenList(this.currentDir);
    }
    
    var base = this.currentPath.match(/\/$/)?'':path.basename(this.currentPath);
    this.filteredList = filterListBash(this.list, base);
    
    if (this.filteredList.length === 1) {
      this.rl.line = path.join(this.currentDir, this.filteredList[0]);
      //console.log(this.currentDir + ' | ' + this.filteredList[0]);
      this.rl.cursor = this.rl.line.length;
    } else if (this.filteredList.length > 1) {
      //Get common text
      var commonText = sharedStart(this.filteredList);
      if (commonText.length > base.length) {
        this.rl.line = path.join(this.currentDir, commonText);
        this.rl.cursor = this.rl.line.length;
      } else {
        //Show Options
        this.showOptions = true;
      }
    }
    
  } else if ( input.key && input.key.name === "escape" ) {
    
  } else {
    if ( this.list.length > 0) {
      var base = this.currentPath.match(/\/$/)?'':path.basename(this.currentPath);
      //Filter the current list
      this.filteredList = filterListBash(this.list, base);
      this.showOptions = true;
    }
  }
  
  
};

Prompt.prototype.onKeypress = function( input ) {
  //First, clean previous
  this
    .down(this.optionsLines.length)
    .clean(this.optionsLines.length);
  
  this.currentPath = this.rl.line;
  //Make a function for this (?)
  var currentDir = this.currentPath.match(/.+\/$/) ? this.currentPath.substr(0, this.currentPath.length-1) : path.dirname(this.currentPath);
  //Verify the the user is in the same directory
  if (currentDir !== this.currentDir) {
    this.showOptions = false;
    this.list = [];
    this.currentDir = currentDir;
  }
  
  this.bash(input);
  
  // if ( input.key && input.key.name === "tab" ) {
  //   if ( this.tabPressed ) {
  //     //this.rl.line = 'lala';
  //     //this.rl.cursor = this.rl.line.length;
  //   }
  //   //If there is no options, lets get them
  //   if ( this.list.length === 0 ) {
  //     this.list = getDirContenList(currentDir);
  //   } else {
  //     this.tabPressed = true;
  //     if ( this.filteredList ) {
  //       this.currentOption = this.currentOption + 1;
  //       if ( this.currentOption >= this.filteredList ) {
  //         this.currentOption = 0;
  //       }
  //     }
  //   }
  // } else if ( input.key && input.key.name === "escape" ) {
  //   this.tabPressed = false;
  //   this.list = [];
  // } else {
  //   this.tabPressed = false;
  // }
  
  this.selected = this.rl.line;
  this.cacheCursorPos();
  
  if ( this.showOptions ) {
    //Get the filtered list in string lines
    this.optionsLines = getLines(this.filteredList);
    //console.log(this.optionsLines);
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

