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
  this.selectedKey

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
    message += chalk.cyan( this.selected.name ) + "\n";
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

  var selected = input;

  if ( selected != null ) {
    this.status = "answered";
    this.selected = selected;

    // Re-render prompt
    this.down().clean(2).render();

    this.lineObs.dispose();
    this.keypressObs.dispose();
    this.done( this.selected.value );
    return;
  }

  // Input is invalid
  this
    .error("Please enter a valid command")
    .clean()
    .render();
};


function getDirContenList (dirPath) {
  return fs.readdirSync(dirPath).map(
    function (elem) {
      var stats = fs.lstatSync(path.join(dirPath, elem));
      if ( !stats.isFile() ) {
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
 */

Prompt.prototype.onKeypress = function( input ) {
  this.selectedKey = this.rl.line;
  //this.cacheCursorPos();
  
  //Verify the the user is in the same directory
  var currentDir = path.dirname(path.join(this.opt.cwd, this.rl.line));
  if (currentDir !== this.currentDir) {
    this.currentDir = currentDir;
  }
  
  if ( input.key.name === "tab" ) {
    if ( this.tabPress ) {
      this.tabPressed = false;
    } else {
      this.tabPressed = true;
      this.list = getDirContenList(currentDir);
//      console.log(this);
    }
    this.rl.line = 'lala';
    //this.rl._refreshLine();
    this.rl.cursor = 4;
    //console.dir(this.rl);
  }
  
  //Clean previous
/*  this
    .down(this.optionsLines.length)
    .clean(this.optionsLines.length);
  
  if (this.tabPressed) {
    //Filter the current list
    this.optionsLines = getLines(this.list);
//    console.log(this.optionsLines);
  }
  
  if (this.optionsLines.length) {
    this
      .down()
      .write(this.optionsLines.join('\n'))
      .up(this.optionsLines.length)
      .clean();
  }*/
  
  this.clean();
  this.render();

  //this.write(this.rl.line).restoreCursorPos();
  
  //var newLength = this.selectedKey.length - this.rl.line.length;
  this.write(this.rl.line).restoreCursorPos();//.rl._refreshLine() ;//.moveCursor(this.rl.output, 0, newLength);
};

