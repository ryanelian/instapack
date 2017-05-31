'use strict';

let gutil = require('gulp-util');
let path = require('path');
let fs = require('fs-extra');

let projectFolder = process.cwd();
let settingsJSON = path.join(projectFolder, 'instapack.json');
let settings = {};

if (fs.existsSync(settingsJSON)) {
    gutil.log('Reading settings from', gutil.colors.cyan(settingsJSON));
    settings = require(settingsJSON);
} else {
    gutil.log(gutil.colors.cyan(settingsJSON), 'not found. Using default settings.');
}

if (!settings.input) {
    settings.input = 'client';
}

if (!settings.output) {
    settings.output = 'wwwroot';
}

if (!settings.concat) {
    settings.concat = {};
}

settings.projectFolder = projectFolder;
settings.projectNpmFolder = path.join(projectFolder, 'node_modules');
settings.projectBowerFolder = path.join(projectFolder, 'bower_components');
settings.projectClientFolder = path.join(projectFolder, settings.input)
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
