'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');       // Mostly used for logging.
var watch = require('gulp-watch');      // File watcher that actually works.
var plumber = require('gulp-plumber');  // Prevents gulp-watch from stopping on compilation error!
var sourcemaps = require('gulp-sourcemaps');

var mainCss = 'site.scss';
var targetJs = 'bundle.js';
var targetFolder = './wwwroot/';

var jsFolder = './assets/js/';
var cssFolder = './assets/css/';
var templatesSource = './assets/templates/**/*.html';

gutil.log("Loading Ryan's Awesome Compiler Suite! " + __dirname);

var plumberSettings = {
    errorHandler: function (error) {
        gutil.log(error);
        this.emit('end');
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ryan's Awesome JavaScript Compiler
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var watchify = require('watchify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');

var bundler = browserify({
    cache: {},
    packageCache: {},
    entries: [jsFolder],
    plugin: [watchify]
});

bundler.on('update', compileJs);
bundler.on('log', gutil.log);

function compileJs() {
    gutil.log('Compiling JavaScript files...');

    return bundler.bundle()                 // Browserify compile assets/js/index.js
        .on('error', gutil.log)
        .pipe(source(targetJs))             // Bundle to virtual file bundle.js
        .pipe(buffer())
        .pipe(plumber(plumberSettings))
        .pipe(sourcemaps.init())
        .pipe(uglify())                     // Minify
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(targetFolder + 'js'));
}

gulp.task('js', ['lint', 'angular-templates'], function () {
    return compileJs().on('end', function () {
        bundler.close();
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ryan's Awesome JavaScript Checker
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var jshint = require('gulp-jshint');

gulp.task('lint', function () {
    var excludeAngularTemplate = '!' + jsFolder + 'templates.js';

    return gulp.src(['gulpfile.js', jsFolder + '**/*.js', excludeAngularTemplate])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ryan's Awesome CSS Compiler
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var path = require('path');

function sassCompile() {
    var cssProcessors = [
        autoprefixer({
            browsers: ['ie >= 9', 'Android >= 4', 'last 2 versions']
        })
    ];

    var sassOptions = {
        outputStyle: 'compressed',
        includePaths: [
            path.join(__dirname, 'bower_components'),   // bower
            path.join(__dirname, 'node_modules')        // npm
        ]
    };

    return gulp.src(cssFolder + mainCss)
        .pipe(plumber(plumberSettings))
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions))
        .pipe(postcss(cssProcessors))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(targetFolder + 'css'));
}

gulp.task('sass', function () {
    return sassCompile();
});

gulp.task('css', function () {
    return sassCompile();
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ryan's Awesome Angular Templates Compiler
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var htmlmin = require('gulp-htmlmin');
var templateCache = require('gulp-angular-templatecache');

var htmlminOptions = {
    collapseWhitespace: true,
    conservativeCollapse: true,             // If tags have multiple whitespaces between them, collapse to 1 space instead.
    removeComments: true,

    collapseBooleanAttributes: true,        // Collapse attributes: readonly="readonly", checked="checked", readonly="readonly", disabled="disabled"
    removeRedundantAttributes: true,        // Removes attributes: <form> method="get", on-...="javascript:...", <input> type="text"
    removeScriptTypeAttributes: true,       // Removes attribute: <script> type="text/javascript"
    removeStyleLinkTypeAttributes: true,    // Removes attribute: <style> <link> type="text/css"

    sortAttributes: true,                   // Improves gzip
    sortClassName: true                     // Improves gzip
};

gulp.task('angular-templates', function () {
    return gulp.src(templatesSource)
        .pipe(plumber(plumberSettings))
        .pipe(htmlmin(htmlminOptions))
        .pipe(templateCache())
        .pipe(gulp.dest(jsFolder));
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// File Watcher
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

gulp.task('watch', ['sass', 'angular-templates'], function () {
    watch(cssFolder + '**/*.scss', function () {
        gulp.start('sass');
    });

    watch(templatesSource, function () {
        gulp.start('angular-templates');
    });

    compileJs();
});

gulp.task('default', ['watch'], function () { });
