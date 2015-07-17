/* global process */
/**
 * `path` type prompt
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
 *  bash:
 *    when tab is pressed, try to fill the prompt:
 *      if a single option is possible, complete with it
 *      if more than an option is possible, complete with the common text between them
 *      if more than an option is possible and no common text exists between them, show options
 * 
 *  if the user modifies the path until change the directory, the list will be erased.  
 */
 
Prompt.prototype.bash = function ( input ) {
  
  if ( input.key && input.key.name === "tab" ) {
    
    this.showOptions = false;
    
    if ( this.list.length === 0 ) {
      this.list = pathUtils.getDirContenList(this.currentDir);
    }
    
    var base = pathUtils.basename(this.currentPath);
    this.filteredList = pathUtils.filterListBash(this.list, base);
    
    if (this.filteredList.length === 1) {
      this.rl.line = pathUtils.join(this.currentDir, this.filteredList[0]);
      this.rl.cursor = this.rl.line.length;
    } else if (this.filteredList.length > 1) {
      //Get common text
      var commonText = pathUtils.sharedStart(this.filteredList);
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
      var base = pathUtils.basename(this.currentPath);
      //Filter the current list
      this.filteredList = pathUtils.filterListBash(this.list, base);
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
  var currentDir = pathUtils.dirname(this.currentPath);
  //Verify the the user is in the same directory
  if (currentDir !== this.currentDir) {
    this.showOptions = false;
    this.list = [];
    this.currentDir = currentDir;
  }
  
  //Excecute bash
  this.bash(input);
  
  this.selected = this.rl.line;
  this.cacheCursorPos();
  
  if ( this.showOptions ) {
    //Get the filtered list in string lines
    this.optionsLines = pathUtils.getLines(this.filteredList);
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

  this.write(this.rl.line).restoreCursorPos();
};
