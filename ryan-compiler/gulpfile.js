'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Core Modules
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let gulp = require('gulp');
let gutil = require('gulp-util');       // Mostly used for logging.
let yargs = require('yargs').argv;

gutil.log("Ryan's Awesome Compiler 2.2.5"); // Running at __dirname

let RELEASE = yargs.release || yargs.r;
if (RELEASE) {
    gutil.log("RELEASE mode: Bundles will be minified, slowly.");
} else {
    gutil.log("DEBUG mode: Bundles are NOT minified in exchange for development speed!");
    gutil.log("Use --release flag for switching to RELEASE mode, which enables JS minification.");
}

let WATCH = yargs.watch || yargs.w;
if (WATCH) {
    gutil.log("WATCH mode: Source codes will be automatically be compiled on changes.");
} else {
    gutil.log("Use --watch flag for switching to WATCH mode for automatic compilation on source changes.");
}

gulp.task('default', ['js', 'sass']);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Shared Modules & Settings
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let watch = require('gulp-watch');      // File watcher that actually works.
let plumber = require('gulp-plumber');  // Prevents gulp-watch from stopping on compilation error!
let sourcemaps = require('gulp-sourcemaps');
let size = require('gulp-size');

let mainCss = 'site.scss';
let targetJs = 'bundle.js';
let targetFolder = './wwwroot/';

let jsFolder = './client/js/';
let cssFolder = './client/css/';

let plumberSettings = {
    errorHandler: function (error) {
        gutil.log(error);
        this.emit('end');
    }
};

let sizeOptions = {
    showFiles: true,
    showTotal: false
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ryan's Awesome JavaScript Compiler
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let browserify = require('browserify');
let tsify = require('tsify');
let watchify = require('watchify');
let stringify = require('./ryan-modules/stringify');

let source = require('vinyl-source-stream');
let buffer = require('vinyl-buffer');

let minifier = require('gulp-uglify/minifier');
let uglify = require('uglify-js');
let gulpif = require('gulp-if');

let bundler = browserify({
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

    let minifyPipe = minifier({
        acorn: true
    }, uglify);
    let minifyRELEASE = gulpif(RELEASE, minifyPipe);

    return bundler.bundle()
        .on('error', gutil.log)
        .pipe(source(targetJs))
        .pipe(buffer())
        .pipe(plumber(plumberSettings))
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(minifyRELEASE)
        .pipe(sourcemaps.write('./'))
        .pipe(size(sizeOptions))
        .pipe(gulp.dest(targetFolder + 'js'));
}

gulp.task('js', compileJs);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ryan's Awesome CSS Compiler
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let sass = require('gulp-sass');
let postcss = require('gulp-postcss');
let autoprefixer = require('autoprefixer');
let path = require('path');
let cssnano = require('cssnano');

let cssProcessors = [
    autoprefixer({
        browsers: ['ie >= 9', 'Android >= 4', 'last 3 versions']
    })
];

if (RELEASE) {
    let nanoOptions = {
        discardComments: {
            removeAll: true
        }
    };
    cssProcessors.push(cssnano(nanoOptions));
}

function sassCompile() {
    let npmPath = path.join(__dirname, 'node_modules');
    let bowerPath = path.join(__dirname, 'bower_components'); // Excluded because nobody use bower anymore LOL.

    let sassOptions = {
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
