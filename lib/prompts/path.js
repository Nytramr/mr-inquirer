/**
 * `path` type prompt
 */

var _ = require("lodash");
var util = require("util");
var chalk = require("chalk");
var Base = require('inquirer/lib/prompts/base');
var utils = require("inquirer/lib/utils/utils");
var observe = require("inquirer/lib/utils/events");


/**
 * Module exports
 */

module.exports = Prompt;


/**
 * Constructor
 */

function Prompt() {
  
  Base.apply( this, arguments );

  if (!this.opt.choices) {
    this.throwParamError("choices");
  }
  
  var answers = arguments[2];

  this.firstRender = true;
  this.selected = 1;
  this.level = 1;
  this.route = {
    level: 1,
    type: 'Route',
    handler: answers.handlerName,
    name: answers.name,
    path: answers.path
  };

  var def = this.opt.default;

  // Default being a Number
//  if ( _.isNumber(def) && def >= 0 && def < this.opt.choices.realLength ) {
//    this.selected = def;
//  }

  // Default being a String
//  if ( _.isString(def) ) {
//    this.selected = this.opt.choices.pluck("value").indexOf( def );
//  }

  this.opt.choices.setRender( routeTreeRender );

  // Make sure no default is set (so it won't be printed)
  this.opt.default = null;

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

  var events = observe(this.rl);
  events.normalizedUpKey.takeUntil( events.line ).forEach( this.onUpKey.bind(this) );
  events.normalizedDownKey.takeUntil( events.line ).forEach( this.onDownKey.bind(this) );
  events.keypress.takeUntil( events.line ).forEach( this.onTabKey.bind(this) );
  events.line.take(1).forEach( this.onSubmit.bind(this) );

  // Init the prompt
  this.render();
  this.hideCursor();

  // Prevent user from writing
  this.rl.output.mute();

  return this;
};


/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function() {

  // Render question
  var message    = this.getQuestion();
  var choicesStr = "\n" + this.opt.choices.render( this.selected, this.route );

  if ( this.firstRender ) {
    message += chalk.dim( "(Use arrow keys)" );
  }

  // Render choices or answer depending on the state
  if ( this.status === "answered" ) {
    message += chalk.cyan( formatTreeItem(this.route) ) + "\n";
  } else {
    message += choicesStr;
  }

  this.firstRender = false;

  var msgLines = message.split(/\n/);
  this.height = msgLines.length;

  // Write message to screen and setPrompt to control backspace
  this.rl.setPrompt( _.last(msgLines) );
  this.write( message );

  return this;
};


/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function() {
  this.status = "answered";

  // Rerender prompt
  this.rl.output.unmute();
  this.clean().render();

  this.showCursor();

//  this.opt.choices.realChoices.map(function( choice, i , a) {
//    if (i === pointer) {
//      var color = (newRoute.level - a[i-1].level) < 2 ? 'cyan' : 'red';
//      line += levelToSpaces(newRoute.level-1, 4) + '   ' + chalk[color](utils.getPointer() + formatTreeItem(newRoute)) + "\n";
//    }
//
//    line += levelToSpaces(choice.level, 4) + formatTreeItem(choice);
//    output += line + "\n";
//  }.bind(this));
  
  this.opt.choices.realChoices.splice(this.selected, 0, this.route);
  
  this.done( this.opt.choices.realChoices );
};


/**
 * When user press a key
 */

Prompt.prototype.handleKeypress = function(action) {
  this.rl.output.unmute();

  action();

  // Rerender
  this.clean().render();

  this.rl.output.mute();
};

Prompt.prototype.onUpKey = function() {
  this.handleKeypress(function() {
    var len = this.opt.choices.realLength;
    this.selected = (this.selected > 1) ? this.selected - 1 : len;
  }.bind(this));
};

Prompt.prototype.onDownKey = function() {
  this.handleKeypress(function() {
    var len = this.opt.choices.realLength;
    this.selected = (this.selected < len) ? this.selected + 1 : 1;
  }.bind(this));
};

Prompt.prototype.onTabKey = function( input ) {
  this.handleKeypress(function() {
    if (input.key.name === "tab" || input.key.name === "right") {
      this.route.level++;
    }else if (input.key.name === "backspace" || input.key.name === "left") {
      if (--this.route.level < 1) {
        this.route.level = 1;
      }
    }
  }.bind(this));
};


/**
 * Funtion that returns an amount of spaces acording to a level
 * @param  {Number} level  Level of identation
 * @param  {Number} spaces Amount of spaces
 * @return {String}        String full of spaces
 */

function levelToSpaces (level, spaces) {
  var quantity = level*spaces;
  if (quantity > 0) {
    return new Array(quantity+1).join(' ');
  }
  return "";
}

function formatTreeItem (item) {
  var str = "(" + item.type + ")";
  
  str += item.name ? " " + item.name : ""; 
  str += item.path ? " '" + item.path + "'" : ""; 
  str += item.handler ? " [" + item.handler + "]" : "";
  
  return str;
}

/**
 * Function for rendering list choices as a tree of routes
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */

function routeTreeRender( pointer, newRoute ) {
  var output = "";
  
  this.choices.forEach(function( choice, i , a) {
    var line = ""
    if (i === pointer) {
      var color = (newRoute.level - a[i-1].level) < 2 ? 'cyan' : 'red';
      line += levelToSpaces(newRoute.level-1, 4) + '   ' + chalk[color](utils.getPointer() + formatTreeItem(newRoute)) + "\n";
    }
    
    line += levelToSpaces(choice.level, 4) + formatTreeItem(choice);
    output += line + "\n";
  }.bind(this));
  
  if (pointer === this.choices.length) {
    var color = (newRoute.level - this.choices[this.choices.length-1].level) < 2 ? 'cyan' : 'red';
    output += levelToSpaces(newRoute.level-1, 4) + '   ' + chalk[color](utils.getPointer() + formatTreeItem(newRoute)) + "\n";
  }

  return output.replace(/\n$/, "");
}

//TODOs:
// Make a function to validate the route tree
// Make a function to validate the provitional position in which the user is trying to place a new route.