'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Core Modules
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var gulp = require('gulp');
var gutil = require('gulp-util');       // Mostly used for logging.
var yargs = require('yargs').argv;

gutil.log("Ryan's Awesome Compiler 2.1"); // Running at __dirname

var RELEASE = yargs.release || yargs.r;
if (RELEASE) {
    gutil.log("RELEASE mode detected: JS bundle will be minified SLOWLY.");
} else {
    gutil.log("DEBUG mode detected: JS bundle is NOT minified in exchange for development speed!");
    gutil.log("Use --release flag for switching to RELEASE mode, which enables JS minification.");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Shared Modules & Settings
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var watch = require('gulp-watch');      // File watcher that actually works.
var plumber = require('gulp-plumber');  // Prevents gulp-watch from stopping on compilation error!
var sourcemaps = require('gulp-sourcemaps');
var size = require('gulp-size');

var mainCss = 'site.scss';
var targetJs = 'bundle.js';
var targetFolder = './wwwroot/';

var jsFolder = './client/js/';
var cssFolder = './client/css/';
var templatesSource = './client/templates/**/*.html';

var plumberSettings = {
    errorHandler: function(error) {
        gutil.log(error);
        this.emit('end');
    }
};

var sizeOptions = {
    showFiles: true,
    showTotal: false
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ryan's Awesome JavaScript Compiler
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var browserify = require('browserify');
var tsify = require('tsify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');

function jsCompiler() {
    var compiler = {};

    compiler.config = {
        entries: [jsFolder + 'index.ts'],
        plugin: [tsify],
        debug: true,
        noParse: ['angular', 'jquery']  // Skipping parse of two gigantic libraries. Not sure if this actually has any effects...
    };

    compiler.rearm = function() {
        compiler.bundler = browserify(compiler.config);
    };

    compiler.compile = function() {
        gutil.log('Compiling JavaScript...');

        return compiler.bundler.bundle()                  // Browserify compile client/js/index.js
            .on('error', gutil.log)
            .pipe(source(targetJs))                       // Bundle to virtual file bundle.js
            .pipe(buffer())
            .pipe(plumber(plumberSettings))
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(gulpif(RELEASE, uglify({ acorn: true })))
            .pipe(sourcemaps.write('./'))
            .pipe(size(sizeOptions))
            .pipe(gulp.dest(targetFolder + 'js'));
    };

    compiler.watch = function() {
        compiler.config.cache = {};
        compiler.config.packageCache = {};
        compiler.config.plugin.push(watchify);

        compiler.rearm();
        compiler.bundler.on('update', compiler.compile);
        compiler.bundler.on('log', gutil.log);

        return compiler.compile();
    };

    compiler.rearm();
    return compiler;
}

gulp.task('js', ['angular-templates'], function() {
    return jsCompiler().compile();
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ryan's Awesome CSS Compiler
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var path = require('path');
var cssnano = require('cssnano');

var cssProcessors = [
    autoprefixer({
        browsers: ['ie >= 9', 'Android >= 4', 'last 3 versions']
    }),
    cssnano({
        discardComments: {
            removeAll: true
        }
    })
];

var npmPath = path.join(__dirname, 'node_modules');
var bowerPath = path.join(__dirname, 'bower_components'); // Excluded because nobody use bower anymore LOL.

var sassOptions = {
    includePaths: [npmPath]
};

function sassCompile() {
    return gulp.src(cssFolder + mainCss)
        .pipe(plumber(plumberSettings))
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions))
        .pipe(postcss(cssProcessors))
        .pipe(sourcemaps.write('./'))
        .pipe(size(sizeOptions))
        .pipe(gulp.dest(targetFolder + 'css'));
}

gulp.task('sass', function() {
    return sassCompile();
});

gulp.task('css', function() {
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

gulp.task('angular-templates', function() {
    return gulp.src(templatesSource)
        .pipe(plumber(plumberSettings))
        .pipe(htmlmin(htmlminOptions))
        .pipe(templateCache({
            moduleSystem: 'Browserify'
        }))
        .pipe(size(sizeOptions))
        .pipe(gulp.dest(jsFolder));
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// File Watcher
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

gulp.task('watch', ['sass', 'angular-templates'], function() {
    gutil.log("Endless Mode: Source code changes will be automatically compiled.");

    watch(cssFolder + '**/*.scss', function() {
        gulp.start('sass');
    });

    watch(templatesSource, function() {
        gulp.start('angular-templates');
    });

    return jsCompiler().watch();
});

gulp.task('default', ['watch'], function() { });
