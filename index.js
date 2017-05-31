'use strict';

let packageJSON = require('./package.json');
let chalk = require('chalk');

module.exports = {
  build: function (project, isProduction, watch) {
    let settings = require('./src/compiler-settings');
    // console.log(settings);

    let compiler = require('./src/compiler');
    let compile = compiler(settings, isProduction, watch);

    if (!project) {
      project = 'all';
    }
    compile(project);
  },

  scaffold: function (template) {
    if (!template) {
      template = 'aspnet';
    }

    let scaffold = require('./src/scaffold');
    scaffold(template);
  },

  version: packageJSON.version,

  branding: function (command, writeDescription) {
    console.log(chalk.yellow(packageJSON.name) + ' ' + chalk.green(packageJSON.version) + ' ' + command);
    if (writeDescription) {
        console.log(packageJSON.description);
    }
    console.log();
  }
};
