/**
 * Checkbox list examples
 */

"use strict";
var inquirer = require("inquirer");

inquirer.prompt.registerPrompt('path', require('../lib/prompts/path.js'));

inquirer.prompt([
  {
    type: "path",
    message: "Select toppings",
    name: "toppings",
    cwd: '/Users/user/',
    validate: function( answer ) {
      if ( answer.length < 1 ) {
        return "You must choose at least one topping.";
      }
      return true;
    }
  }
], function( answers ) {
  console.log( JSON.stringify(answers, null, "  ") );
});