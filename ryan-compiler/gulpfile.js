'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Core Modules
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var gulp = require('gulp');
var gutil = require('gulp-util');       // Mostly used for logging.
var yargs = require('yargs').argv;

gutil.log("Ryan's Awesome Compiler 2.2"); // Running at __dirname

var RELEASE = yargs.release || yargs.r;
if (RELEASE) {
    gutil.log("RELEASE mode detected: Bundles will be minified. SLOWLY.");
} else {
    gutil.log("DEBUG mode detected: Bundles are NOT minified in exchange for development speed!");
    gutil.log("Use --release flag for switching to RELEASE mode, which enables JS minification.");
}

var WATCH = yargs.watch || yargs.w;
if (WATCH) {
    gutil.log("WATCH mode detected. Source codes will be automatically be compiled on changes.");
} else {
    gutil.log("Use --watch flag for switching to WATCH mode for automatic compilation on source changes.");
}

gulp.task('default', ['js', 'sass']);

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

var plumberSettings = {
    errorHandler: function (error) {
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
var stringify = require('./ryan-modules/stringify');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');

var bundler = browserify({
    debug: true,
    noParse: ['angular', 'jquery'],
    cache: {},
    packageCache: {}
}).transform(stringify, {
    minify: true
}).add(jsFolder + 'index.ts').plugin(tsify);

if (WATCH) {
    bundler.plugin(watchify);
    bundler.on('update', compileJs);
    // bundler.on('log', gutil.log);
}

function compileJs() {
    gutil.log('Compiling JavaScript...');

    return bundler.bundle()
        .on('error', gutil.log)
        .pipe(source(targetJs))
        .pipe(buffer())
        .pipe(plumber(plumberSettings))
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(gulpif(RELEASE, uglify({ acorn: true })))
        .pipe(sourcemaps.write('./'))
        .pipe(size(sizeOptions))
        .pipe(gulp.dest(targetFolder + 'js'));
}

gulp.task('js', compileJs);

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
    })
];

if (RELEASE) {
    var nanoOptions = {
        discardComments: {
            removeAll: true
        }
    };
    cssProcessors.push(cssnano(nanoOptions));
}

function sassCompile() {
    var npmPath = path.join(__dirname, 'node_modules');
    var bowerPath = path.join(__dirname, 'bower_components'); // Excluded because nobody use bower anymore LOL.

    var sassOptions = {
        includePaths: [npmPath]
    };

    return gulp.src(cssFolder + mainCss)
        .pipe(plumber(plumberSettings))
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions))
        .pipe(postcss(cssProcessors))
        .pipe(sourcemaps.write('./'))
        .pipe(size(sizeOptions))
        .pipe(gulp.dest(targetFolder + 'css'));
}

gulp.task('sass-compile', sassCompile);

gulp.task('sass-watch', ['sass-compile'], function () {
    watch(cssFolder + '**/*.scss', function () {
        gulp.start('sass-compile');
    });
});

gulp.task('sass', function () {
    if (WATCH) {
        gulp.start('sass-watch');
    } else {
        return sassCompile();
    }
});
