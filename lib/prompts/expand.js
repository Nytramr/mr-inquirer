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


function getChildrenList (line, options) {
  var fullPath = path.join(options.cwd, line); 
//  console.log(path.dirname(fullPath));
  return fs.readdirSync(path.dirname(fullPath));
}

function listToLines (list) {
  var screenLentgh = process.stdout.columns;
  
  var index = 0;
  var lines = [];
  
  while (index < list.length) {

    var lineLength = 0;
    var line = [];
    while (index < list.length && lineLength + list[index].length < screenLentgh){
      line.push(list[index]);
      lineLength += list[index].length + 1;
      index++;
    }
    
    lines.push(line.join(' '));
  }
  
  return lines;
}

/**
 * When user press a key
 */

Prompt.prototype.onKeypress = function( input ) {
  this.selectedKey = this.rl.line;
  this.cacheCursorPos();
  
  if (input.key.name === "tab") {
    if(this.tabPress){
      this.tabPressed = false;
    }else{
      this.tabPressed = true;
      this.list = getChildrenList(this.rl.line, this.opt);
//      console.log(this.list);
    }
  }
  
  //Clean previous
  this
    .down(this.optionsLines.length)
    .clean(this.optionsLines.length);
  
  if (this.tabPressed) {
    //Filter the current list
    this.optionsLines = listToLines(this.list);
//    console.log(this.optionsLines);
  }
  
  if (this.optionsLines.length) {
    this
      .down()
      .write(this.optionsLines.join('\n'))
      .up(this.optionsLines.length)
      .clean();
  }
  
  this
//    .write('key |' + (input.key && input.key.name) + '|ñlkjsdfgñlkjds ñslkjdgñljksdfg sdñljkgh sñldkgf sñljkdfg ñlkdjsg sdñljksdñfljkg sdñlkjñlkjdfg g g gjg fjgjg lhsdafñlasdñlfkjasñdlfkjasñlkfjsñdlkfiysargjsdañlkfjsd ñalkjsdñflkjasñdfknryhrglkañsdlfkuhrf rñjklañ´kljsfdgufgnñlkmsñlkdmfrurgf frirgirfgdunfrmfr')
//    .write(' * ' + this.height)
//    .up(2)
//    .down()
//    .write(this.optionsLines.join('\n'))
//    .up(this.optionsLines.length)
//    .clean()
    .render();

  this.write(this.rl.line).restoreCursorPos();
//  this.write(' + ' + this.height).restoreCursorPos();
};

