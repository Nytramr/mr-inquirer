[![](https://img.shields.io/gratipay/Martin%20Rubinsztein.svg)](https://gratipay.com/Martin%20Rubinsztein/)

Mr Inquirer
===========
Inquirer extended prompts

See [Inquirer on github.com](https://github.com/SBoudrias/Inquirer.js) for an extended introduction and documentation.

Inquirer and Mr Inquirer are licensed under the terms of the MIT License.

## Documentation

### Installation

```bash
$ npm install mr-inquirer
```

### Adding Mr Inquirer

```javascript
var Inquirer = require("inquirer");
var MrInquirer = require("mr-inquirer");
//Adding Mr Inquirer to the propts as path
Inquirer.prompt.registerPrompt('path', MrInquirer.path);
```

#### Yeoman

Inquirer is an important part of the yeoman process and you can add custom prompts to your generators. In order to do that, you must add any custom prompt during the constructor or the initializing method.

If you want to add Mr Inquirer into your yeoman generator add this code to your generator's initializing method

```javascript
this.env.adapter.prompt.registerPrompt('path', require('mr-inquirer').path);
```

### Examples (Run it and see it)
Checkout the `examples/` folder for code and interface examples.

``` shell
node examples/path.js
node examples/graph-path.js
```

Prompts type
---------------------

#### Graphic Path - `{ type: "path" }`

This Prompt allows the user to search for a folder or file using cursor and tab keys.
It can also filter the list by typing some characters.

Take `type`, `name`, `message`, [`cwd`, `absolute`, `dirOnly`] properties.

---

#### Path - `{ type: "path" }`

This Prompt allows the user to search for a folder or file as easy as s/he could do it in the OS console.

Take `type`, `name`, `message`, [`cwd`, `mode`, `absolute`, `dirOnly`] properties.

---
