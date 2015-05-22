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
    choices: [
      new inquirer.Separator("The usual:"),
      {
        name: "Peperonni"
      },
      {
        name: "Cheese",
        checked: true
      },
      {
        name: "Mushroom"
      },
      new inquirer.Separator("The extras:"),
      {
        name: "Pineapple",
      },
      {
        name: "Bacon"
      },
      {
        name: "Olives",
        disabled: "out of stock"
      },
      {
        name: "Extra cheese"
      }
    ],
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