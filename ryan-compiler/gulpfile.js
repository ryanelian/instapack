'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Core Modules
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let gulp = require('gulp');
let gutil = require('gulp-util');       // Mostly used for logging.
let yargs = require('yargs').argv;

gutil.log("Ryan's Awesome Compiler", gutil.colors.cyan("3.0.0")); // Running at __dirname

let RELEASE = yargs.release || yargs.r;
if (RELEASE) {
    gutil.log(gutil.colors.yellow("RELEASE"), "mode: Bundles will be minified.", gutil.colors.red("This process will slow down your build."));
} else {
    gutil.log(gutil.colors.yellow("DEBUG"), "mode: Bundles are NOT minified in exchange for compilation speed.");
    gutil.log("Use", gutil.colors.cyan("--release"), "flag for switching to", gutil.colors.yellow("RELEASE"), "mode, which enables JS minification.");
}

let WATCH = yargs.watch || yargs.w;
if (WATCH) {
    gutil.log(gutil.colors.yellow("WATCH"), "mode: Source codes will be automatically be compiled on changes.");
} else {
    gutil.log("Use", gutil.colors.cyan("--watch"), "flag for switching to", gutil.colors.yellow("WATCH"), "mode for automatic compilation on source changes.");
}

gulp.task('default', ['js', 'sass', 'concat']);

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

let uglify = require('uglify-js');
let gulpif = require('gulp-if');
let minifier = require('gulp-uglify/minifier');

function CreateMinificationPipe() {
    let minifyPipe = minifier({
        acorn: true
    }, uglify);

    return gulpif(RELEASE, minifyPipe);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Awesome JQuery Plugins Concatenator
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let fs = require('fs');
let resolve = require('resolve');
let es = require('event-stream');
let concat = require('gulp-concat');

let concatConfig = 'concat.json';
gutil.log('Resolving concatenation targets from', gutil.colors.magenta(concatConfig));

let concatListRaw = fs.readFileSync(concatConfig).toString();
let concatList = JSON.parse(concatListRaw);
let resolver = [];
let resolverLength = 0;

for (let concatResult in concatList) {
    let resolverItems = [];

    let concatItems = concatList[concatResult];
    for (let i in concatItems) {
        let concatModule = concatItems[i];
        let concatModulePath = resolve.sync(concatModule);
        resolverItems.push(concatModulePath);
    }

    resolverLength++;
    resolver[concatResult + '.js'] = resolverItems;
}

gutil.log('Discovered', gutil.colors.yellow(resolverLength), 'concatenation targets.');
if (WATCH) {
    gutil.log(gutil.colors.red("ATTENTION!"), "Concatenation task will only be run once and not watched.");
}

//console.log(concatListRaw);
//console.log(concatList);
//console.log(resolver);

gulp.task('concat', function () {
    let concatStreams = [];
    for (let target in resolver) {
        let targetFiles = resolver[target];
        let targetStream = gulp.src(targetFiles).pipe(concat(target));
        concatStreams.push(targetStream);
    }

    var minifyRELEASE = CreateMinificationPipe();

    return es.merge(concatStreams)
        .pipe(minifyRELEASE)
        .pipe(size(sizeOptions))
        .pipe(gulp.dest(targetFolder + 'js'));
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ryan's Awesome JavaScript Compiler
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let browserify = require('browserify');
let tsify = require('tsify');
let watchify = require('watchify');
let stringify = require('./ryan-modules/stringify');

let source = require('vinyl-source-stream');
let buffer = require('vinyl-buffer');

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
    var minifyRELEASE = CreateMinificationPipe();

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
