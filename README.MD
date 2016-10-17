# Ryan's Awesome Compiler!

> Ryan's awesome client-side application compiler suite for Angular using Browserify, and SASS.

## Using it in your project...

Copy `assets` folder, `.jshintrc`, `gulpfile.js` and `package.json`.

Make sure Node.js and a global `gulp` command line tool is installed in your computer.

## gulp lint

Perform JavaScript checking on the `gulpfile.js` and `assets/js/**/*.js` files except `assets/js/templates.js` using [jshint](http://jshint.com/about/) (with Browserify settings in `.jshintrc`).

Performs static type checking using [Facebook's Flow](https://flowtype.org/).

## gulp angular-templates

Compiles and minify all `./assets/templates/**/*.html` files using [gulp-angular-templatecache](https://github.com/miickel/gulp-angular-templatecache) into `assets/js/templates.js`.

## gulp js

Compiles and minify an `index.js` entry point in `assets/js` folder using [Browserify](https://github.com/substack/node-browserify) then outputs the result as `wwwroot/js/bundle.js` (plus its source maps).

In addition, uses `gulp lint` and `gulp angular-templates` prior compilation.

## gulp sass

Compiles and minify a `site.scss` entry point in `assets/css` folder using [libsass](https://github.com/sass/libsass), then outputs the result as `wwwroot/css/site.css` (plus its source maps).

Applies [autoprefixer](https://github.com/postcss/autoprefixer) with following browsers parameter: `['ie >= 9', 'Android >= 4', 'last 3 versions']`

Can also be called using `gulp css`.

## gulp watch

Perform endless Browserify, Angular template caches, SASS compilation using `watchify` and `gulp-watch`.

Can also be called using `gulp`.
