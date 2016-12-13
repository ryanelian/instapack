# Ryan's Awesome Compiler 2.1

> Ryan's awesome client-side application compiler for Angular and SASS, using Browserify + TypeScript!

![screenshot](https://raw.githubusercontent.com/ryanelian/ryan-compiler/master/screenshot.PNG)

## Getting Started

Supported NodeJS version: [6.9 LTS](https://nodejs.org/en/download/)

Install [TypeScript 2.1 for Visual Studio 2015](https://blogs.msdn.microsoft.com/typescript/2016/12/07/announcing-typescript-2-1/).

Install [gulp-cli](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md): `npm install -g gulp-cli`

If you're running Windows, make sure that the Command Prompt is opened in Administrator Mode then install [windows-build-tools](https://www.npmjs.com/package/windows-build-tools): `npm install -g windows-build-tools` (Installs [Python 2](https://www.python.org/downloads/) and [Visual C++ Build Tools 2015](http://landinghub.visualstudio.com/visual-cpp-build-tools)).

Copy everything inside `ryan-compiler` subfolder into your project, then run package restore: `npm update`. Also, it is recommended that you are using [npm-check](https://www.npmjs.com/package/npm-check) to manage your `package.json` dependencies.

Run `gulp` and watch the magic happens!

## Importing Node Modules via TypeScript

As of [TypeScript 2.1](https://blogs.msdn.microsoft.com/typescript/2016/12/07/announcing-typescript-2-1/), you can import any packages in `node_modules` using the `import` syntax. However, like the usual Browserify CommonJS `require()` syntax, you do not get Visual Studio Intellisense.

For enhanced developing experience, it is recommended to use TypeScript definition installed from [@types](http://microsoft.github.io/TypeSearch/) when available.

Installing @types will give you Visual Studio Intellisense when you use [TypeScript Import](https://www.typescriptlang.org/docs/handbook/modules.html) syntax. Then the imported module will be converted to CommonJS syntax, which then will be used by `Browserify` to resolve the dependency from `node_modules`.

For example, if you want to use Lodash while getting Intellisense, do this:

`npm install --save @types/lodash lodash`

Then later in your source code, do this:

```typescript
import * as _ from "lodash"; // Will be compiled into require('lodash') and then resolved by Browserify.
_.padStart("Hello TypeScript!", 20, " ");
```

[Read more](https://blogs.msdn.microsoft.com/typescript/2016/06/15/the-future-of-declaration-files/) about @types.

## Known Quirks: JavaScript Compilation Delay

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

## DEBUG Mode vs RELEASE Mode

By default, the tool is configured to run in DEBUG mode for increased development speed. The resulting JavaScript bundle will NOT be minified, but is compiled in 2-3 seconds.

By providing `--release` or `-r` flag to the command line, the tool will run in RELEASE mode, which minifies the JavaScript bundle but adds 10 seconds or more to the compilation time. 
(By the way, minification of default modules shipped with this compiler will shrink the bundle down from 5.23 MB to 445 KB. Impressive huh?)

Make sure to do a RELEASE mode build before you are pushing your bundle into your source control repository, for reduced upload size. 

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
