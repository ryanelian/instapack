# Ryan's Awesome Compiler 2.2.5

> Ryan's awesome client-side application compiler for Angular and SASS, using Browserify + TypeScript!

![screenshot](https://raw.githubusercontent.com/ryanelian/ryan-compiler/master/screenshot.PNG)

## Why Should I Use This?

- [Modern JavaScript is convenient, but stupid](https://hackernoon.com/how-it-feels-to-learn-javascript-in-2016-d3a717dd577f#.wm43f7wca). We need to set up the project 'makefiles' for hours before we even can start coding, if we want to use modern JavaScript features.

- [TypeScript](https://www.typescriptlang.org/) is glorious but stupid at the same time. It compiles the JavaScript files but does not actually merge them and requires us to stitch them together using other tooling such as Browserify or WebPack or SystemJS or RequireJS, which brings us back to the first point.

- [AngularJS](https://angularjs.org/) `templateUrl` is wonderful until our site is being slowed down by dozens of mini HTML templates being loaded remotely. And there are no easy ways to bundle them together without using third-party tools such as Gulp, which brings us back to the first point again.

- Other tooling and bundling issues such as SASS importing files from `node_modules` or `bower_components`, Source Maps output, and so on.

This project attempts to alleviate those burdens away from the developer. By plugging this compiler into our project, we can immediately start coding Angular 1.X applications using TypeScript with a resulting bundle that is easily debuggable under Google Chrome!

In addition, this project is configured to output the bundled files into `wwwroot` folder, which is used for placing ASP.NET Core MVC static files.

## Getting Started

Supported NodeJS version: [6.X LTS](https://nodejs.org/en/download/)

Install [TypeScript 2 for Visual Studio 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48593).

Install [gulp-cli](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md): `npm install -g gulp-cli`

If running Node on Windows, make sure that the Command Prompt is opened in Administrator Mode then install [windows-build-tools](https://www.npmjs.com/package/windows-build-tools): `npm install -g windows-build-tools` (Installs [Python 2](https://www.python.org/downloads/) and [Visual C++ Build Tools 2015](http://landinghub.visualstudio.com/visual-cpp-build-tools)).

Copy everything inside `ryan-compiler` subfolder into our project, then run package restore: `npm update` or `yarn`.

Run `gulp` and watch the magic happens!

## Yarn vs NPM

It is recommended to use [Yarn](https://yarnpkg.com/) instead of NPM for managing packages. [Read more about Yarn here](https://code.facebook.com/posts/1840075619545360).

- Yarn generates packages lockfile similar to ASP.NET `project.json` for added reliability.
- Yarn has built-in interactive package upgrade command. (`yarn upgrade-interactive`)
- Yarn has can install packages previously installed (cached offline) via `--prefer-offline` flag.
- Yarn automatically saves package install to `package.json` without `--save` flag via `yarn add` command. (You may add `--dev` flag for saving `devDependencies`)  

If you prefer to not to use Yarn, it is recommended to use [npm-check](https://www.npmjs.com/package/npm-check) for checking outdated packages and interactively upgrading them.

## Importing Node Modules via TypeScript

As of [TypeScript 2.1](https://blogs.msdn.microsoft.com/typescript/2016/12/07/announcing-typescript-2-1/), any packages can be imported from `node_modules` using the `import` syntax. However, like importing using Browserify CommonJS `require()` syntax, we do not get Visual Studio Intellisense.

For enhanced developing experience, it is recommended to use TypeScript definition installed from [@types](http://microsoft.github.io/TypeSearch/) when available. Installing @types for a library will provide Visual Studio Intellisense when the library is being imported using [TypeScript Import](https://www.typescriptlang.org/docs/handbook/modules.html) syntax. For example:

`npm install --save @types/lodash lodash`

```typescript
import * as _ from "lodash"; // Will be compiled into require('lodash') and then resolved by Browserify.
_.padStart("Hello TypeScript!", 20, " ");
```

[Read more](https://blogs.msdn.microsoft.com/typescript/2016/06/15/the-future-of-declaration-files/) about @types.

## Command List

### gulp js

Compiles an `index.js` entry point in `assets/js` folder using [Browserify](https://github.com/substack/node-browserify) then outputs the result as `wwwroot/js/bundle.js` (plus its source maps).

If there are requires that are pointed to `html` files, the said files will be minified and then converted into string. Handy for Angular's component / directive template parameter.

### gulp sass

Compiles a `site.scss` entry point in `assets/css` folder using [libsass](https://github.com/sass/libsass), then outputs the result as `wwwroot/css/site.css` (plus its source maps).

Applies [autoprefixer](https://github.com/postcss/autoprefixer) with following browsers parameter: `['ie >= 9', 'Android >= 4', 'last 3 versions']`

### gulp

Perform both js and sass compilation.

## Flag List

### --watch / -w

Providing this flag will enable WATCH mode, which enables automatic compilation on source code changes.

### --release / -r

By default, DEBUG mode is used for increased development speed. JavaScript bundle will NOT be minified, but can be compiled in 2-3 seconds.

By providing this flag, bundle minification will be enabled, which uses [gulp-uglify](https://www.npmjs.com/package/gulp-uglify) and [`cssnano`](https://www.npmjs.com/package/cssnano) but adds few seconds to the compilation time. 

Make sure to do a RELEASE mode build before pushing your bundle into your source control repository or production environment!

### -rw

Shorthand flag for invoking RELEASE and WATCH mode.

## Ryan's Angular Validation Message

As demonstration of the compiler's capabilities, a custom Angular input validation message component (written in TypeScript) is added and configured into the project. It allows automatic validation message output using [Angular's input directive](https://docs.angularjs.org/api/ng/directive/input).

Usage example:

```typescript
import ryanValidator from './ryan-validator';
// Simply then add ryanValidator into your Angular application module.
```

```html
<form id="MyForm" name="MyForm">
    <div class="form-group">
        <label for="Name">Name</label>
        <input class="form-control" id="Name" name="Name" ng-model="NameValue" required="required" minlength="2" maxlength="64" />
        <validation-message input="MyForm.Name"></validation-message>
    </div>
    <div class="form-group">
        <button type="submit" class="btn btn-primary">Submit</button>
    </div>
</form>
```

Validation messages shown:
- required
- min
- max
- minlength
- maxlength
- pattern (provide `mismatch` attribute to the component for customizing the message)
- date (when using `type=date`)
- datetimelocal (when using `type=datetime-local`)
- email (when using `type=email`)
- month (when using `type=month`)
- number (when using `type=number`)
- time (when using `type=time`)
- url (when using `type=url`)
- week (when using `type=week`)

You may provide `title` attribute to the component for customizing the field name displayed.
