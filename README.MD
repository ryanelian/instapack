# RPack

> Integrated web application client project compiler using Browserify + TypeScript and SASS

![Screenshot](https://raw.githubusercontent.com/ryanelian/ryan-compiler/master/screenshot.png)

## Why Should I Use This?

- [Modern JavaScript is convenient, but stupid](https://hackernoon.com/how-it-feels-to-learn-javascript-in-2016-d3a717dd577f#.wm43f7wca) due to the needs to setup the project 'makefiles' for hours... (gulpfile, webpack config, gruntfile, brocfile, etc.) 

- [TypeScript](https://www.typescriptlang.org/) is glorious but baffling at the same time. It compiles the JavaScript files but does not actually merge them. Therefore requires the programmers to stitch the outputs together using other tools such as Browserify or WebPack or SystemJS or RequireJS. (Which brings us back to the first point...)

- [AngularJS](https://angularjs.org/) `templateUrl` is wonderful until the website is being slowed down by dozens of mini HTML templates being loaded remotely. ([No, HTTP/2 does not help](https://medium.com/@asyncmax/the-right-way-to-bundle-your-assets-for-faster-sites-over-http-2-437c37efe3ff)) And there are no easy ways to bundle them together without using third-party build tools... (Noticed a pattern here?)

- Other tooling and bundling issues such as Sass importing files from `node_modules` or `bower_components`, configuring Source Maps output, and so on.

This project attempts to alleviate those burdens away from the developer. By plugging this compiler into a web application project, the developer can immediately start coding programming using TypeScript with a resulting bundle that is easily debuggable under **Google Chrome**!

In addition, this project is configured by default to output the bundled files into `wwwroot` folder, which is used by default for placing **ASP.NET Core MVC** static files.

![Build Flow](https://raw.githubusercontent.com/ryanelian/ryan-compiler/master/flow.png)

## Getting Started

Supported NodeJS version: [6.X LTS](https://nodejs.org/en/download/)

Install [TypeScript 2 for Visual Studio 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48593). When using Visual Studio 2017, simply select **TypeScript 2 SDK** from the component list during setup.

Install [gulp-cli](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md): `npm install -g gulp-cli`

Optional but highly recommended:

-  If running Node on Windows, make sure that the Command Prompt is opened in Administrator Mode then install [windows-build-tools](https://www.npmjs.com/package/windows-build-tools): `npm install -g windows-build-tools`. (Installs [Python 2](https://www.python.org/downloads/) and [Visual C++ Build Tools 2015](http://landinghub.visualstudio.com/visual-cpp-build-tools). Please manually install them if the `windows-build-tools` failed to register Python into environment PATH.)

- Use Yarn to manage packages. Install: https://github.com/yarnpkg/yarn/releases

Copy everything inside `ryan-compiler` subfolder into our project, then run package restore: `yarn` or `npm update`.

Run `gulp` and watch the magic happens!

## Yarn vs NPM

It is recommended to use [Yarn](https://yarnpkg.com/) instead of NPM for managing packages. [Read more about Yarn here](https://code.facebook.com/posts/1840075619545360).

- Yarn generates packages lockfile similar to ASP.NET `project.json` for added reliability.

- Yarn has built-in interactive package upgrade command. (`yarn upgrade-interactive`)

- Yarn perform package restore without active internet connection via `--offline` flag.

- Yarn automatically saves package install to `package.json` without `--save` flag via `yarn add` command. (Add `--dev` flag for adding `devDependencies`)  

If you prefer to not to use Yarn, it is recommended to use [npm-check](https://www.npmjs.com/package/npm-check) for checking outdated packages and interactively upgrading them.

## Improving Package Restore & IDE Performance

Windows Defender or other anti-virus software appears to slow down package restore and Visual Studio when opening projects.

For this very reason, it is highly recommended to:

- Add anti-virus exclusion to Yarn installation folder: `C:\Program Files (x86)\Yarn`. To double check, type: `where yarn`.

- Add anti-virus exclusion to Git installation folder: `C:\Program Files\Git`. To double check, type: `where git`.

- Add anti-virus exclusion to NodeJS installation folder: `C:\Program Files\nodejs`. To double check, type: `where node`.

- Add anti-virus exclusion to Yarn cache folder: `C:\Users\Ryan\AppData\Local\Yarn`. To double check, type: `yarn cache dir`.

- Use very short root folder name for projects, such as `D:\VS`, to avoid problems with system paths over 260 characters long. Then exclude the folder from the anti-virus.

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

If there are requires that are pointed to `html` files, the said files will be minified and then converted into string. Handy for AngularJS's component / directive template parameter or Handlebars / Mustache templates.

You may block TypeScript compilation in a Visual Studio 2017 project during Solution Rebuild by adding `<TypeScriptCompileBlocked>true</TypeScriptCompileBlocked>` to the `csproj` in the first `<PropertyGroup>`.

### gulp sass

Compiles a `site.scss` entry point in `assets/css` folder using [libsass](https://github.com/sass/libsass), then outputs the result as `wwwroot/css/site.css` (plus its source maps).

Applies [autoprefixer](https://github.com/postcss/autoprefixer) with following browsers parameter: `['ie >= 9', 'Android >= 4', 'last 3 versions']`

### gulp concat

Unlike node modules, certain jQuery plugins / non-UMD JavaScript libraries require globally defined `$` or `jQuery` variable, such as: **ASP.NET jQuery Validation Unobtrusive**. This may pose compatibility problem when they are imported via TypeScript / Browserify.

Therefore, a `concat` property in `rpack.json` is provided to bundle (and minify) together jQuery modules directly from `node_modules` or specific local file for convenience and maintainability. This file will be parsed and used to concatenate those files, which will be outputted into the `wwwroot/js/`.

For example, concatenation is by default set up for these following modules:

```json
{
    "jquery-bootstrap": [
        "jquery",
        "bootstrap-sass"
    ],
    "aspnet-validator": [
        "jquery-validation",
        "jquery-validation-unobtrusive"
    ]
}
```

... which will result in `wwwroot/js/jquery-bootstrap.js` and `wwwroot/js/aspnet-validator.js`. By including these files using `<script>` **BEFORE** the resulting `bundle.js` from `gulp js` task, the plugins can be correctly loaded and can be used to code the application using TypeScript!

For example, in your `index.ts`:

```typescript
function main(this: any) {
    let $ = window['$'];

    $(() => {
        // Do jQuery logic here.
        // If you only need standard jQuery API, type-hint $: JQueryStatic
    });
}

main();
```

Learn more about callback function `this` parameter type annotation: https://www.typescriptlang.org/docs/handbook/functions.html

Due to the nature of the hack, it is recommended to **only use concatenation against library / plugin files** instead of application source code. By grouping libraries to be concatenated, it is possible to load the libraries only on pages that actually require them. For example:
- `jquery-bootstrap.js` can be included everywhere if the application uses Bootstrap's JavaScript extensively. For example, dropdown in navbar.
- However, `aspnet-validator.js` can be included only when you need to perform validation using Razor's Data Annotation by clever use of `ViewBag`. (For example: `ViewBag.Validation = true;`)

### gulp

Perform both TypeScript, Sass, and concatenation targets compilation.

## Flag List

### --watch / -w

Providing this flag will enable WATCH mode, which enables automatic compilation on source code changes.

### --release / -r

By default, DEBUG mode is used for increased development speed. JavaScript bundle will NOT be minified, but can be compiled in 2-3 seconds.

By providing this flag, bundle minification will be enabled, which uses [gulp-uglify](https://www.npmjs.com/package/gulp-uglify) and [`cssnano`](https://www.npmjs.com/package/cssnano) but adds few seconds to the compilation time. 

Make sure to do a RELEASE mode build before pushing your bundle into your source control repository or production environment!

### -rw

Shorthand flag for invoking RELEASE and WATCH mode.

## AngularJS Validation Message Component

As demonstration of the compiler's capabilities, a custom AngularJS input validation message component (written in TypeScript) is added and configured into the project. It allows automatic validation message output using [AngularJS input directive](https://docs.angularjs.org/api/ng/directive/input).

Usage example:

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
