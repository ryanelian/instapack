# instapack

> Integrated web application client project compiler using TypeScript and Sass!

[![npm](https://img.shields.io/npm/v/instapack.svg)](https://www.npmjs.com/package/instapack) [![Build Status](https://travis-ci.org/ryanelian/instapack.svg?branch=master)](https://travis-ci.org/ryanelian/instapack)

![Screenshot](https://raw.githubusercontent.com/ryanelian/instapack/master/img/screenshot.png)

## Install

`yarn global add instapack`

or

`npm install -g instapack`

But seriously, please use Yarn from now on. [Check it out](https://yarnpkg.com/en/).

## Quick Start Guide

```cmd
cd E:\VS\MyWebApp
ipack new
ipack
```

Programmatic API is also provided if you wish to integrate `instapack` into your very own build script:

```ts
import { instapack } from 'instapack';

let ipack = new instapack();
ipack.build('all', false, false);
```

## System Requirements

Currently supported Node.js is [latest version 6 LTS](https://nodejs.org/en/download/). The tool will be supported against version 8 when LTS build is released in [October 2017](https://github.com/nodejs/LTS).

When using Visual Studio 2017, select the latest **TypeScript 2.X SDK** from the individual component list during setup.

Optional but highly recommended, install [Python 2](https://www.python.org/downloads/).

## Features

- Hyper-opinionated web application client project builder with zero configurations. It just works.

- Built-in new project scaffold tool.

- Rich debugging experience using Google Chrome `DevTools`. 

## Design Goals

- Lower the barrier of entry for developing a modern web application client.

- Bring structure to the project source code.

- Improve source code quality and maintainability with type hints and compile-time checks.

- Enforce best practices when building the application, which may significantly impact page load time. (For example: bundling and minification)

- Unify team tooling across multiple projects.

- Blur the boundary behind design time and programming time using blazing fast `watch` + `dev` compilation mode. 

- Stand-alone tooling allows shipping to `npm`, which allows build system upgrade without altering the application.

- High quality tooling supported by latest stable Node.js, using strictly curated, actively maintained dependencies.

## But... Why?

At a glance, the `instapack` looks similar to `webpack`. However, that is where the similarity ends.

Here is an example. Michael wants to develop an ES6-based web application. One of the following events usually happen next...

- Michael would scramble the internet for `gulp` or `grunt` or `webpack` or `brocolli` recipes, configuring it for hours, before starting to code...

- Michael would hit a dead end. Gives up on the entire thing and writes the application in old-school JavaScript...

- Michael next project uses a more evolved version of his build system. However, when he needs to maintain his older applications, he needs to upgrade the build scripts manually...

- Michael's hard drive is now full because each project has their own build system. Ouch.

- Suddenly, Evan from the other team of the same company develops his own build system. So does Jack.

`instapack` is developed as an answer those problems and more!

## How does it work?

![Build Flow](https://github.com/ryanelian/instapack/raw/master/img/flow.png)

Internally, `instapack` uses the following modules:

- `gulp` as task orchestrator and build pipeline.

- `typescript` as the compiler service, syntax checker, and type checker for the JavaScript language.

- `node-sass` as the compiler service and syntax checker for the CSS language. It also configured to allow `@import` from `node_modules`.

- `browserify` for merging the JavaScript output modules together.

- `uglify-js` for minifying the resulting JavaScript bundle.

- `postcss` for applying automatic CSS vendor-prefix using `autoprefixer`, then minifying the result using `cssnano`.

Out of the box, the following files will be used as the application entry points:

- `client/js/index.ts`, compiled to `wwwroot/js/bundle.js`.

- `client/css/site.scss`, compiled to `wwwroot/css/site.css`.

- Concatenate files listed in `package.json`. Read more below.

## Release Cadence

Starting version 4.0.0, `instapack` follows [Semantic Versioning](http://semver.org/).

Bi-weekly releases will be performed for updating package dependencies. This will increment the patch version.

Bug reports will be dealt promptly. This will increment the patch version.

New non-breaking features, such as addition of new task pipeline, will increment the minor version.

Breaking changes, such as behavior or configuration changes to existing task pipeline, will increment the major version.

## Commands

You may use `instapack` or `ipack` or `ipk` to invoke the command line interface.

### new [template]

Scaffolds a new `instapack` project into your existing application from where the command line is invoked. The following templates are available:

- `empty` when you need a clean slate. Just `package.json`, `tsconfig.json`, and JSS + CSS entry files.

- `aspnet` when you want to develop an ASP.NET Core MVC project with Bootstrap + JQuery Validation Unobtrusive.

- `angularjs` when you want to develop a rich client application with Bootstrap + AngularJS 1.X, using a well-defined project stucture.

If no template parameter is provided by default, `aspnet` is chosen.

### build [project]

Performs compilation against selected project type. Available projects: `all`, `js`, `css` and `concat`.

Use concatenation for libraries that cannot be imported / do not need to be imported from within TypeScript (for example, jQuery plugins). This hybrid approach allows great compatibility with older JavaScript libraries (accessed via `window['$']`), while enjoying the rich development experience using TypeScript.

Obviously, the concatenated libraries must be referenced in your HTML before the application source code `bundle.js`.

In addition, build flags are available:

- `-w` or `--watch` for enabling compilation on change.

- `-d` or `--dev` for disabling minification for speed compilation.

- `-dw` shorthand for `watch` and `dev` mode together, for massive productivity.

## Configuration

`instapack` puts configuration inside `package.json` to reduce project files clutter. For example, this is the included `package.json` with `aspnet` template:

```json
{
  "name": "aspnet",
  "version": "1.0.0",
  "private": true,
  "browserslist": [
    "ie >= 11",
    "Android >= 4",
    "last 3 versions"
  ],
  "instapack": {
    "output": "wwwroot",
    "concat": {
      "jquery-bootstrap": [
        "jquery",
        "bootstrap-sass"
      ],
      "aspnet-validator": [
        "jquery-validation",
        "jquery-validation-unobtrusive"
      ]
    }
  },
  "dependencies": {
    "@types/jquery": "^2.0.45",
    "@types/lodash": "^4.14.63",
    "@types/node": "^7.0.22",
    "@types/urijs": "^1.15.32",
    "alertifyjs": "^1.10.0",
    "bootstrap-sass": "^3.3.7",
    "jquery": "^3.2.1",
    "jquery-validation": "^1.16.0",
    "jquery-validation-unobtrusive": "^3.2.6",
    "lodash": "^4.17.4",
    "moment": "^2.18.1",
    "mustache": "^2.3.0",
    "urijs": "^1.18.10"
  }
}
```

- `browserslist` affects CSS `autoprefixer` output result.

- `instapack:input` allows setting the input folder location. By default is set to `client`.

- `instapack:output` allows setting the output folder location. By default is set to `wwwroot`.

- `instapack:concat` allows packing libraries from `node_modules` or a custom folder (for example, `./client/lib/vue.js`). The files will be resolved node-style, bundled, minified, and then placed into the output JS folder.

## FAQ

### Is this stable?

The manual `gulp` script version of the build system has been used for shipping 7 production-grade `AngularJS` projects across 2 different companies.

The script itself has been refined over the past 3 years in the making, with each revision involving approval from an internal build system improvement group within my company.

The beta version of `instapack` was then tested to reproduce the bundles for the said projects, with successful result (minimal diff). Since then `instapack` has been used to maintain those projects.

So yes, rock solid stable.

### Is this Windows only? :(

Majority of the developers using `instapack` are working full-time on ASP.NET Core MVC projects on Windows with Visual Studio on daily basis. This use case will be the core focus for tooling support.

However, there should be no reason for `instapack` to not to run on OS X and Linux.

`instapack` will not suddenly introduce Windows or Visual Studio exclusive feature, and strive to maintain compatibility with multiple platforms.

### My package restore / IDE is slow. Help!

Windows Defender or other anti-virus software appears to slow down package restore and Visual Studio when opening projects.

For this very reason, it is highly recommended to:

- Add anti-virus exclusion to Yarn installation folder: `C:\Program Files (x86)\Yarn`. To double check, type: `where yarn`.

- Add anti-virus exclusion to Yarn cache folder: `C:\Users\Ryan\AppData\Local\Yarn`. To double check, type: `yarn cache dir`.

- Add anti-virus exclusion to NodeJS installation folder: `C:\Program Files\nodejs`. To double check, type: `where node`.

- Add anti-virus exclusion to Git installation folder: `C:\Program Files\Git`. To double check, type: `where git`.

- Use very short root folder name for projects, such as `D:\VS`, to avoid problems with Windows system paths over 260 characters long. Then exclude the folder from the anti-virus.

### Can I use other folder than `js` and `css` for input / output?

Nope.

### Can I use entry point other than `index.ts` and `site.scss`?

Nope.

### I thought files should not be bundled because of HTTP/2?

[Nope.](https://medium.com/@asyncmax/the-right-way-to-bundle-your-assets-for-faster-sites-over-http-2-437c37efe3ff)

Also, in IIS, HTTP/2 is only supported when using Windows Server 2016. Many of our customers are still using Windows Server 2012 R2 to date.

### Why TypeScript?

- Babel is very slow.
- TypeScript is supported by Microsoft.
- TypeScript is an growing at exponential rate.
- TypeScript is a strict superset of the JavaScript, which allows porting and refactoring existing codes with ease.
- TypeScript allows writing JavaScript using features that do not exist yet in browsers, then compile them down to `es5`.

As a testament of TypeScript capabilities, `instapack` is fully written using TypeScript!

### Why Sass instead of Less.js?

- `libsass` is native and fast.
- Sass has better language syntax.
- Sass has more features.
- Sass is more popular. Bootstrap, Foundation, and Angular-Material are written in Sass!

### What is that ValidationMessageComponent in AngularJS template?

A custom AngularJS input validation message component. It allows automatic validation message output using [AngularJS input directive](https://docs.angularjs.org/api/ng/directive/input), similar to Razor's `ValidationMessage` for Core MVC.

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

Provide `title` attribute to the component for customizing the field name displayed.
