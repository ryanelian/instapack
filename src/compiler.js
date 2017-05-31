'use strict';

let gulp = require('gulp');
let gutil = require('gulp-util');
gulp.task('all', ['js', 'css', 'concat']);

module.exports = function (settings, isProduction, watch) {
    let concatResolver = require('./concat-resolve');
    let concatFiles = concatResolver(settings.concat, settings.projectFolder);
    // console.log(concatFiles);

    if (isProduction) {
        gutil.log(gutil.colors.yellow("Production"), "mode: Outputs will be minified.", gutil.colors.red("This process will slow down your build."));
    } else {
        gutil.log(gutil.colors.yellow("Development"), "mode: Outputs are", gutil.colors.red("NOT minified"), "in exchange for compilation speed.");
        gutil.log("Do not forget to minify before pushing to repository or production environment!");
    }

    if (watch) {
        gutil.log(gutil.colors.yellow("Watch"), "mode: Source codes will be automatically be compiled on changes.");
        gutil.log(gutil.colors.red("ATTENTION!"), "Concatenation task will only be run once and not watched.");
    } else {
        gutil.log("Use", gutil.colors.yellow("--watch"), "flag for switching to", gutil.colors.yellow("Watch"), "mode for automatic compilation on source changes.");
    }

    let taskConcat = require('./task-concat');
    let taskJs = require('./task-js');
    let taskCss = require('./task-css');

    taskConcat(gulp, concatFiles, settings.outputJsFolder, isProduction);
    taskJs(gulp, settings.projectJsEntry, settings.outputJsFolder, isProduction, watch);
    taskCss(gulp, settings.projectCssEntry, settings.projectCssWatch, settings.outputCssFolder, isProduction, watch, settings.projectNpmFolder);

    return function (project) {
        gulp.start(project);
    };
};
