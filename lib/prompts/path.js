/* global process */
/**
 * `path` type prompt
 */

var _ = require('lodash');
var util = require('util');
var chalk = require('chalk');
var Base = require('inquirer/lib/prompts/base');
var observe = require('inquirer/lib/utils/events');
var Paginator = require('inquirer/lib/utils/paginator');

var pathUtils = require('../path-utils');

class PathPrompt extends Base {
    constructor(questions, rl, answers) {
        super(questions, rl, answers);

        // cwd if present must be a string
        if (this.opt.cwd && !_.isString(this.opt.cwd) ) {
            this.throwParamError('cwd is not a string');
        }

        // initialization
        this.opt.cwd = this.opt.cwd || './';
        this.optionsLines = [];
        this.lines = [];
        this.selected = '';
    }

    filterInput(input) {
        if (!input) {
           return this.opt.default == null ? '' : this.opt.default;
        }
        return input;
    }

    _run(cb) {
        this.done = cb;

        // Once user confirm (enter key)
        var events = observe(this.rl);
        var submit = events.line.map(this.filterInput.bind(this));

        var validation = this.handleSubmitEvents(submit);
        validation.success.forEach(this.onEnd.bind(this));
        validation.error.forEach(this.onError.bind(this));

        events.keypress.takeUntil(validation.success).forEach(this.onKeypress.bind(this));

        // Init the prompt
        this.render();

        return this;
    }

    render(error) {
        // Render question
        // var message = this.paginator.paginate(this.getQuestion(), 0, this.opt.pageSize);
        var message = this.getQuestion();

        if ( this.status === "answered" ) {
            message += chalk.cyan( this.selected ) + "\n";
        } else {
            if (this.path) {
                this.rl.line = this.path;
                this.rl.cursor = this.path.length;
            }
            message += this.rl.line;
            this.path = undefined;
        }

        var bottomContent = this.bottomContent;

        if (error) {
            bottomContent = + '\n' + chalk.red('>> ') + error;
        }

        this.screen.render(message, this.bottomContent);
    }

    onEnd(input) {
        if ( input == null || input === "" ) {
          //Error or cwd?
          input = this.rawDefault;
        }

        this.selected = this.opt.cwd + this.selected;

        console.log('selected', this.selected);
        this.status = "answered";

        //Clean previous
        this.bottomContent = undefined;

        if ( this.opt.absolute ) {
            this.selected = pathUtils.resolve(this.selected);
        }

        this.render();
        this.screen.done();
        this.done( this.selected );
    }

    onKeypress(input) {
        // this.screen
        //     .clean(this.optionsLines.length);
        this.currentPath = this.rl.line.replace('\t', '');
        // //Make a function for this (?)
        var currentDir = pathUtils.dirname(this.currentPath);

        //Verify the the user is in the same directory
        if (currentDir !== this.currentDir) {
            this.showOptions = false;
            this.list = [];
            this.currentDir = currentDir;
        }

        //Excecute bash
        this.bash(input);
        this.selected = this.path;

        if ( this.showOptions ) {
            //Get the filtered list in string lines
            this.optionsLines = pathUtils.getLines(this.filteredList);
        } else {
            this.optionsLines = [];
        }

        if (this.optionsLines.length) {
            this.bottomContent = this.optionsLines.join('\n');
        } else {
            this.bottomContent = undefined;
        }

        //this.write.clean();
        this.render();

        //this.write(this.rl.line).restoreCursorPos();
    }

    /**
     * When user press `enter` key
     */

    filterInput(input) {
        if (!input) {
            return this.opt.default == null ? '' : this.opt.default;
        }
        return input;
    }

    bash(input) {
        this.path = this.currentPath;
        if ( input.key && input.key.name === "tab" ) {
            this.showOptions = false;

            if ( this.list.length === 0 ) {
                this.list = pathUtils.getDirContenList(this.opt.cwd + this.currentDir);
            }

            var base = pathUtils.basename(this.currentPath);
            this.filteredList = pathUtils.filterListBash(this.list, base);

            if (this.filteredList.length === 1) {
                this.path = pathUtils.join(this.currentDir, this.filteredList[0]);
            } else if (this.filteredList.length > 1) {
                //Get common text
                var commonText = pathUtils.sharedStart(this.filteredList);
                if (commonText.length > base.length) {
                    this.path = pathUtils.join(this.currentDir, commonText);
                } else {
                    //Show Options
                    this.showOptions = true;
                }
            }

        } else if ( input.key && input.key.name === "escape" ) {
            this.showOptions = false;
        } else {
            if ( this.list.length > 0) {
                var base = pathUtils.basename(this.currentPath);
                  //Filter the current list
                this.filteredList = pathUtils.filterListBash(this.list, base);
                this.showOptions = true;
            }
        }
    }

    onError(state) {
        this.render(state.isValid);
    }
}

module.exports = PathPrompt;