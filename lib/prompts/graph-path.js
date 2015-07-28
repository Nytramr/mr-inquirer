/* global process */
/**
 * `graph-path` type prompt
 */

var _ = require("lodash");
var util = require("util");
var chalk = require("chalk");
var Base = require('inquirer/lib/prompts/base');
var utils = require("inquirer/lib/utils/utils");
var observe = require("inquirer/lib/utils/events");

var pathUtils = require("../path-utils");

/**
 * Module exports
 */

module.exports = Prompt;

/**
 * Constructor
 * 
 *  Path Prompt Options:
 *    cwd (optional): base path directory. Current Working Directory by default.
 *    dirOnly (opional): indicates if files are listed in the options, flase by default.
 *    absolute (optional): indicates if the resulting path is express as relative or absolute
 *      , false by default.
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
  this.sectionToShow = 0;
  this.optionSelected = 0;
  this.selected = this.opt.cwd;
  this.maxRows = 5; //TODO: Get this value from opt

  this.firstRender = true;
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

  //Initialize the line with the cwd
  this.rl.line = this.opt.cwd;
  this.rl.cursor = this.rl.line.length;
  
  //Initialize properties
  this.currentDir = pathUtils.dirname(this.rl.line);
  this.list = pathUtils.getDirContenList(this.currentDir);
  this.filteredList = pathUtils.filterList(this.list, '');
  this.sectionToShow = 0;
  this.optionSelected = -1;
   

  // Init the prompt
  this.getTree();
  
  if (this.optionsLines.length) {
  this
      .down()
      .write(this.optionsLines.join('\n'))
      .up(this.optionsLines.length)
      .clean(1);
  }
  
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
  
  if ( this.firstRender ) {
    message += chalk.cyan( "(Use arrow keys and 'tab' to select, type to filter)" );
    this.firstRender = false;
  }

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
    
    //Clean previous
    this
      .down(this.optionsLines.length)
      .clean(this.optionsLines.length);
    
    if ( this.opt.absolute ) {
      this.selected = pathUtils.resolve(this.selected);
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

/**
 * When user press a key
 * 
 */
 
Prompt.prototype.update = function ( input ) {
  
  if ( input.key && input.key.name === "up" ) {
    this.optionSelected = Math.max(this.optionSelected-1 , 0);
    this.sectionToShow = Math.max(Math.min(this.optionSelected - Math.floor(this.maxRows/2), this.filteredList.length - this.maxRows), 0);
  } else if ( input.key && input.key.name === "down" ) {
    this.optionSelected = Math.min(this.optionSelected+1 , this.filteredList.length - 1);
    this.sectionToShow = Math.max(Math.min(this.optionSelected - Math.floor(this.maxRows/2), this.filteredList.length - this.maxRows), 0);
  } else {
    if ( input.key && input.key.name === "tab" ) {
      //Use this.optionSelected to complete line
      this.rl.line = pathUtils.join(this.currentDir, this.filteredList[this.optionSelected]);
      this.rl.cursor = this.rl.line.length;
    }
    //Check if the directory has changed
    var currentDir = pathUtils.dirname(this.rl.line);
    if (currentDir !== this.currentDir) {
      this.list = pathUtils.getDirContenList(currentDir);
      this.currentDir = currentDir;
    }
    
    if ( this.list.length > 0) {
      var base = pathUtils.basename(this.rl.line);
      //Filter the current list
      this.filteredList = pathUtils.filterList(this.list, base);
    } else {
      this.filteredList = [];
    }
    this.sectionToShow = 0;
    this.optionSelected = -1;
  }
};

Prompt.prototype.getTree = function (){
  
  //Show current path
  /*
   * /Users/user/Desktop   /Users/user/Desktop   /Users/user/Desktop
   *   ⎮                     ⎮ ▲                   ⎮ ▲
   *   ┝                     ┝                     ┝
   *   ┝                     ┝                     ┝
   *   ┝                     ┝                     ┝
   *   ┝                     ┝                     ┝
   *   ┝                     ┝                     ┝
   *     ▼                     ▼                   └
   *  
   */
   
  var lastIndex = Math.min(this.sectionToShow + this.maxRows, this.filteredList.length);
  
  this.optionsLines = ['     │' + (this.sectionToShow > 0?' ▲':'')];
  
  for (var index = this.sectionToShow; index < lastIndex; index++) {
    var line = index < this.filteredList.length-1?'     ├ ':'     └ ';
    if (index !== this.optionSelected) {
      line += this.filteredList[index];
    } else {
      line += chalk.cyan(this.filteredList[index]);
    }
    this.optionsLines.push(line);
  }
  
  if (lastIndex < this.filteredList.length ) {
    this.optionsLines.push('       ▼');
  }
  
  return this;
};

Prompt.prototype.onKeypress = function( input ) {
  
  //First, clean previous
  this
    .down(this.optionsLines.length)
    .clean(this.optionsLines.length);
  
  this.update(input);
  //Make a method for this (?)
  var currentDir = pathUtils.dirname(this.rl.line);
  //Verify the the user is in the same directory
  if (currentDir !== this.currentDir) {
    this.list = pathUtils.getDirContenList(currentDir);
    this.filteredList = pathUtils.filterList(this.list, '');
    this.currentDir = currentDir;
  }
  
  this.getTree();
  
  if (this.optionsLines.length) {
    this
      .down()
      .write(this.optionsLines.join('\n'))
      .up(this.optionsLines.length);
  }
  
  this.clean();
  this.render();

  this.write(this.rl.line).restoreCursorPos();
};
