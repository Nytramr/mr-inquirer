/**
 * `path` type prompt
 */

//var _ = require("lodash");
//var util = require("util");
//var chalk = require("chalk");
//var Base = require("./base");
//var utils = require("../utils/utils");
//var Separator = require("../objects/separator");
//var observe = require("../utils/events");

var _ = require("lodash");
var util = require("util");
var chalk = require("chalk");
var Base = require('inquirer/lib/prompts/base');
var utils = require("inquirer/lib/utils/utils");
var Separator = require("inquirer/lib/objects/separator");
var observe = require("inquirer/lib/utils/events");

var path = require('path');

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


/**
 * When user press a key
 */

Prompt.prototype.onKeypress = function( s, key ) {
  this.selectedKey = this.rl.line.toLowerCase();
  this.cacheCursorPos();
  
  
  
  this
    .down()
    .write("cacakjñlakjsdfñljkasdñlfkjasñdlkfnasdñlkasd vasfgjasfñlkjg sdñfglkjsñlkjgasf lkjasfdñlgkjasdg lkjadsfgñlkjasg ñlakjsdfñlnvsdusrgñojnfdv sdfñknsd\n")
    .write("caca2")
    .up(2)
    .clean()
    .render();

  this.write(this.rl.line).restoreCursorPos();
};

