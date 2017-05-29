'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Core Modules
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let gulp = require('gulp');
let gutil = require('gulp-util');       // Mostly used for logging.
let yargs = require('yargs').argv;

let version = require('./package.json').version;
gutil.log("RPack", gutil.colors.cyan(version)); // Running at __dirname

let RELEASE = yargs.release || yargs.r;
if (RELEASE) {
    gutil.log(gutil.colors.yellow("RELEASE"), "mode: Bundles will be minified.", gutil.colors.red("This process will slow down your build."));
} else {
    gutil.log(gutil.colors.yellow("DEBUG"), "mode: Bundles are", gutil.colors.red("NOT minified"), "in exchange for compilation speed.");
    gutil.log("Do not forget to minify before pushing to repository or production environment!");
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

let path = require('path');
let watch = require('gulp-watch');      // File watcher that actually works.
let plumber = require('gulp-plumber');  // Prevents gulp-watch from stopping on compilation error!
let sourcemaps = require('gulp-sourcemaps');
let size = require('gulp-size');

let settingsFile = 'rpack.json'
let settings = require('./' + settingsFile);
gutil.log('Reading compiler settings from', gutil.colors.magenta(settingsFile));

let mainCss = 'site.scss';
let targetJs = 'bundle.js';

let outputFolder = settings.output;
let outputJsFolder = path.join(outputFolder, 'js');
let outputCssFolder = path.join(outputFolder, 'css');

let npmPath = path.join(__dirname, 'node_modules');
// let bowerPath = path.join(__dirname, 'bower_components');

let jsFolder = './client/js/';
let cssFolder = './client/css/';
let sassWatch = cssFolder + '**/*.scss';

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

let uglifyjs = require('uglify-js');
let gulpif = require('gulp-if');
let minifier = require('gulp-uglify/composer');

function CreateMinificationPipe() {
    let minify = minifier(uglifyjs, console);
    let minifyOptions = {};
    return gulpif(RELEASE, minify(minifyOptions));
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ryan's Awesome JavaScript Concatenator
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let resolve = require('resolve');
let es = require('event-stream');
let concat = require('gulp-concat');

let concatList = settings.concat;
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

    let minifyRELEASE = CreateMinificationPipe();

    return es.merge(concatStreams)
        .pipe(minifyRELEASE)
        .pipe(size(sizeOptions))
        .pipe(gulp.dest(outputJsFolder));
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ryan's Awesome JavaScript Compiler
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let browserify = require('browserify');
let tsify = require('tsify');
let watchify = require('watchify');
let stringify = require('./ryan_modules/stringify');

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
    let minifyRELEASE = CreateMinificationPipe();

    return bundler.bundle()
        .on('error', gutil.log)
        .pipe(source(targetJs))
        .pipe(buffer())
        .pipe(plumber(plumberSettings))
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(minifyRELEASE)
        .pipe(sourcemaps.write('./'))
        .pipe(size(sizeOptions))
        .pipe(gulp.dest(outputJsFolder));
}

gulp.task('js', compileJs);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ryan's Awesome CSS Compiler
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let sass = require('gulp-sass');
let postcss = require('gulp-postcss');
let autoprefixer = require('autoprefixer');
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
        .pipe(gulp.dest(outputCssFolder));
}

gulp.task('sass-compile', sassCompile);

gulp.task('sass-watch', ['sass-compile'], function () {
    watch(sassWatch, function () {
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
