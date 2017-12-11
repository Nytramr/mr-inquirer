/**
 * Path examples
 */

"use strict";
var inquirer = require("inquirer");
inquirer.registerPrompt('path', require('../lib/prompts/path.js'));

inquirer.prompt([
  {
    type: "path",
    message: "Enter path:",
    name: "absolute",
    absolute: true,
    cwd: '../'
  },
  {
    type: "path",
    message: "Enter path:",
    name: "from root",
    absolute: true,
    cwd: '/'
  },
  {
    type: "path",
    message: "Enter path:",
    name: "Current Dirertory",
    absolute: false
  }
]).then(function( answers ) {
  console.log( JSON.stringify(answers, null, "  ") );
});