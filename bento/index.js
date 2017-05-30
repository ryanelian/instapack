'use strict';

module.exports = {
  build: function (project, isProduction, watch) {
    let settings = require('./src/bento-settings');
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
      template = 'angularjs';
    }

    let scaffold = require('./src/scaffold');
    scaffold(template);
  }
};
