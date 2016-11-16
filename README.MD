# Ryan's Awesome Compiler 2

> Ryan's awesome client-side application compiler for Angular and SASS, using Browserify + TypeScript!

![screenshot](https://raw.githubusercontent.com/ryanelian/ryan-compiler/master/screenshot.PNG)

## Getting Started

Supported NodeJS version: 6.9.1 LTS

Install [TypeScript for Visual Studio 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48593).

Make sure [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) is installed in your computer. `npm install --global gulp-cli`

Copy everything inside `ryan-compiler` subfolder into your project, then run package restore: `npm update`.

## Node Module vs TypeScript Module

This compiler still supports importing module from `node_modules` by using CommonJS `require()` syntax, however you do not get Visual Studio Intellisense.

For enhanced developing experience, it is recommended to use TypeScript definition installed from [@types](http://microsoft.github.io/TypeSearch/) when available.

Installing @types will give you Visual Studio Intellisense when you use [TypeScript Import](https://www.typescriptlang.org/docs/handbook/modules.html) syntax. Then the imported module will be converted to CommonJS syntax, which then will be used by `Browserify` to resolve the dependency from `node_modules`.

For example, if I want to use Lodash while getting Intellisense, I would do this:

`npm install --save @types/lodash lodash`

Then later in my source code I can do this:

```typescript
import * as _ from "lodash"; // Will be transpiled into require('lodash') and then resolved.
_.padStart("Hello TypeScript!", 20, " ");
```

[Read more](https://blogs.msdn.microsoft.com/typescript/2016/06/15/the-future-of-declaration-files/) about @types.

## Known Quirk: JavaScript Compilation Delay

Something to know to save you from mashing `CTRL+F5` on your Google Chrome. When compiling JavaScript, these lines may appear:

```
[12:47:22] Compiling JavaScript...
[12:47:28] 5112898 bytes written (2.63 seconds)
```

However the file isn't actually being written until these lines appear!

```
[12:47:36] bundle.js.map 2.67 MB
[12:47:36] bundle.js 439.87 kB
```

## gulp angular-templates

Compiles and minify all `./assets/templates/**/*.html` files using [gulp-angular-templatecache](https://github.com/miickel/gulp-angular-templatecache) into `assets/js/templates.js`.

## gulp js

Compiles and minify an `index.js` entry point in `assets/js` folder using [Browserify](https://github.com/substack/node-browserify) then outputs the result as `wwwroot/js/bundle.js` (plus its source maps).

Also runs `gulp angular-templates` prior compilation.

## gulp sass

Compiles and minify a `site.scss` entry point in `assets/css` folder using [libsass](https://github.com/sass/libsass), then outputs the result as `wwwroot/css/site.css` (plus its source maps).

Applies [autoprefixer](https://github.com/postcss/autoprefixer) with following browsers parameter: `['ie >= 9', 'Android >= 4', 'last 3 versions']`

Can also be called using `gulp css`.

## gulp watch

Perform endless Browserify, Angular template caches, SASS compilation using `watchify` and `gulp-watch`.

Can also be called using `gulp`.
