'use strict';

let gutil = require('gulp-util');
let path = require('path');

let projectFolder = process.cwd();
let settingsJSON = path.join(projectFolder, 'bento.json');

gutil.log('Reading settings from', gutil.colors.cyan(settingsJSON));

let settings = require(settingsJSON);
settings.projectFolder = projectFolder;
settings.projectNpmFolder = path.join(projectFolder, 'node_modules');
settings.projectBowerFolder = path.join(projectFolder, 'bower_components');
settings.projectClientFolder = path.join(projectFolder, 'client')
settings.projectJsFolder = path.join(settings.projectClientFolder, 'js');
settings.projectCssFolder = path.join(settings.projectClientFolder, 'css');
settings.projectJsEntry = path.join(settings.projectJsFolder, 'index.ts');
settings.projectCssEntry = path.join(settings.projectCssFolder, 'site.scss');
settings.projectCssWatch = path.join(settings.projectCssFolder, '**/*.scss');
settings.outputFolder = path.join(projectFolder, settings.output);
settings.outputJsFolder = path.join(settings.outputFolder, 'js');
settings.outputCssFolder = path.join(settings.outputFolder, 'css');

gutil.log('Using output folder', gutil.colors.cyan(settings.outputFolder));

module.exports = settings;
