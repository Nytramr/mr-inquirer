/**
 * Expand list examples
 */

"use strict";
var inquirer = require("inquirer");
inquirer.prompt.registerPrompt('path', require('../lib/prompts/path.js'));

inquirer.prompt([
  {
    type: "path",
    message: "Enter path: ",
    name: "overwrite",
    cwd: '/'
  }
], function( answers ) {
  console.log( JSON.stringify(answers, null, "  ") );
});