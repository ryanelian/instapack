# Ryan's Awesome Compiler Suite

> Ryan's awesome client-side application compiler suite for Angular and SASS, using Browserify!

## gulp js

Compiles and minify an `index.js` in `assets/js` folder then outputs the result as `wwwroot/js/bundle.js` using Browserify, plus its source maps.

In addition, uses `gulp angular-templates` prior to compile all `./assets/templates/**/*.html` files into `assets/js/templates.js` Angular template caches.

## gulp sass

Compiles and minify a `site.scss` in `assets/css` folder then outputs the result as `wwwroot/css/site.css` using SASS, plus its source maps.

Applies `autoprefixer` with following browsers parameter: `['ie >= 9', 'Android >= 4', 'last 2 versions']`

Can also be called using `gulp css`.

## gulp lint

Perform JavaScript checking on the `gulpfile.js` and `assets/js/**/*.js` files except `assets/js/templates.js` using `jshint` with Browserify settings (in `.jshintrc`).

## gulp watch

Perform endless Browserify, Angular template caches, SASS compilation using `watchify` and `gulp-watch`.

Can also be called using `gulp`.
