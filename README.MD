# instapack

> All-in-one web application client project compiler using TypeScript and Sass! :package: :rocket:

[![npm](https://img.shields.io/npm/v/instapack.svg)](https://www.npmjs.com/package/instapack) [![Build Status](https://travis-ci.org/ryanelian/instapack.svg?branch=master)](https://travis-ci.org/ryanelian/instapack)

![Screenshot](https://raw.githubusercontent.com/ryanelian/instapack/master/img/screenshot.png)

## Install

`yarn global add instapack`

or

`npm install -g instapack`

But seriously, please use Yarn from now on. [Check it out](https://yarnpkg.com/en/).

## Quick Start Guide

```powershell
cd E:\VS\MyWebApp
ipack new
ipack
```

[Programmable API](https://github.com/ryanelian/instapack/blob/master/src/index.ts) is also provided if you wish to integrate instapack into your very own build script:

```js
const instapack = require('instapack');

let ipack = new instapack();
ipack.build('all');
```

Practical guides can be read in [books](https://github.com/ryanelian/instapack/tree/master/books) folder.

## System Requirements

Currently supported Node.js is [latest version 6 LTS](https://nodejs.org/en/download/).

instapack works with Node.js version 8, which is **really fast**. That said, it will be supported once LTS build is released in [October 2017](https://github.com/nodejs/LTS).

When using Visual Studio 2017 Update 2 or above, [install TypeScript 2.5.2 extension](http://download.microsoft.com/download/7/0/A/70A6AC0E-8934-4396-A43E-445059F430EA/2.5.2-TS-release-dev14update3-20170830.5/TypeScript_SDK.exe) from the [release announcement page](https://blogs.msdn.microsoft.com/typescript/2017/08/31/announcing-typescript-2-5).

## Features

- Hyper-opinionated web application client project builder with zero configurations. It just works. :fire:

- Built-in new project scaffold tool. :gift:

- Rich debugging experience using Google Chrome DevTools. You can set breakpoints, view variable values, and step over / into the TypeScript source code directly in the browser! :mag:

## Design Goals

- Lower the barrier of entry for developing a modern web application. :angel:

- Introduce structure to the application client source code. :office:

- Improve source code quality and maintainability with type hints and compile-time checks. :airplane:

- Enforce best practices when building the application, which may significantly impact page load time. (e.g. bundling and minification) :umbrella:

- Unify team build system across multiple projects, for any frameworks. :fist:

- Blur the boundary between design time and programming time using blazing fast `watch` + `dev` compilation mode. :zap:

## But... Why?

At a glance, instapack looks similar to webpack. However, that is where the similarity ends because instapack is **not** designed to replace webpack. Here is an analogy to help to differentiate these build systems:

- gulp is like a DIY PC that you can construct from scratch. Very powerful but requires effort to configure and maintain.

- webpack is like a barebone PC that can be plugged-in with off-the-shelf components. Not very versatile but easy to configure and good enough for most people.

- instapack is like a laptop borrowed from your company, batteries included. You are not expected to modify it. :coffee:

Consider the following example: Michael wants to develop a web application using TypeScript. One of the following events usually happens next...

- Recently, every f-ing framework on this planet has their own CLI, but only few are able to support TypeScript out of the box... So Michael simply gives up on TypeScript! :broken_heart:

- Michael managed to create a working build recipe for his TypeScript project. However, his next project uses an evolved version of his build system. Therefore, Michael needs to manually upgrade every build script in each application... :hourglass_flowing_sand:

- Consequently, Michael's SSD is now full because all projects have their own build system! :skull:

- Suddenly, Jack from the other team of the same company develops his own build system. So does Jono! :collision:

instapack is developed as an answer those problems and more!

## How does it work?

Out of the box, the following files will be used as the entry points:

- `client/js/index.ts`, compiled to `wwwroot/js/bundle.js`

- `client/css/site.scss`, compiled to `wwwroot/css/site.css`

- Concatenate files listed in `package.json`. Read more below.

Internally, instapack uses the following modules:

- [undertaker](https://github.com/gulpjs/undertaker) and [vinyl](https://github.com/gulpjs/vinyl) modules from gulp, as the task orchestrator and build engine.

- [Microsoft's TypeScript](https://github.com/Microsoft/TypeScript) as the compiler service, syntax checker, and type checker for the JavaScript language.

- [node-sass](https://github.com/sass/node-sass) as the compiler service, syntax checker, and minifier for the CSS language. It is also configured to enable `@import` from `node_modules`.

- [Browserify](https://github.com/substack/node-browserify) for bundling the compiled modules.

- [UglifyJS](https://github.com/mishoo/UglifyJS2) for minifying the resulting bundle.

- [PostCSS Autoprefixer](https://github.com/postcss/autoprefixer) for applying CSS vendor-prefixes automatically.

## Commands

You may use `instapack` or `ipack` or `ipk` to invoke the command line interface.

### new [template]

Scaffolds a new instapack project into your existing application from where the command line is invoked. The following templates are available:

- `empty` when you need a minimal clean slate. Use this template to author new templates!

- `vue` when you want to develop a web app with Vue.js and Bootstrap 4 (includes ASP.NET Core MVC validation).

- `react` when you want to develop a web app with React and Semantic UI.

- `inferno` when you want to develop a web app with Inferno and Bootstrap 4.

- `angular-bootstrap` when you want to develop a web app with AngularJS (1.X) and Bootstrap 3 (includes ASP.NET Core MVC validation).

- `angular-material` when you want to develop a web app with AngularJS (1.X) and Material Design (includes Angular UI Router).

If no template parameter is provided, `vue` is chosen.

### build [project]

Performs compilation against selected project type. Available projects: `all`, `js`, `css` and `concat`. If no project parameter is provided, `all` is chosen.

`require(...)` against `.html` file will cause the said file to be minified and then stringified. This is handy when working with HTML-based templates for Vue.js, AngularJS, and Mustache / Handlebars.

In addition, build flags are available:

- `-w` or `--watch` for enabling compilation on change.

- `-d` or `--dev` for disabling minification, for **fast** compilation.

- `-u` or `--unmap` for disabling source maps, for slightly faster compilation.

- `-udw` shorthand for `unmap` + `dev` + `watch` mode together, amusingly named as *Unlimited Dev Works* mode, for **massive productivity gainz**.

- `-s [port number]` or `--server 19991` for experimental server mode. Build artefacts will be served directly to http://localhost:port using GZIP compression without writing to folder / file system.

### clean

Remove files in the output folders.

## Configuration

instapack puts configuration inside `package.json` to reduce project files clutter. For example, this is the included `package.json` with `vue` template:

```json
{
  "name": "aspnet",
  "version": "1.0.0",
  "private": true,
  "instapack": {
    "output": "wwwroot",
    "concat": {},
    "alias": {
      "vue": "vue/dist/vue.common"
    }
  },
  "dependencies": {
    "@types/node": "^8.0.30",
    "@types/urijs": "^1.15.34",
    "aspnet-validation": "^0.0.1",
    "axios": "^0.16.2",
    "bootstrap": "4.0.0-beta",
    "bootstrap.native": "^2.0.15",
    "es6-promise": "^4.1.1",
    "font-awesome": "^4.7.0",
    "moment": "^2.18.1",
    "noty": "^3.1.3",
    "tslib": "^1.7.1",
    "urijs": "^1.18.12",
    "vue": "^2.4.4",
    "vue-class-component": "^5.0.2"
  }
}
```

- `instapack:input` allows setting the input folder name. By default, it is set to `client`.

- `instapack:output` allows setting the output folder name. By default, it is set to `wwwroot`.

- `instapack:alias` allows overriding module `import` calls from all files, including sub-dependencies. This is needed because default Vue.js package main file ships with only runtime and not the HTML template compiler.

- `instapack:externals` allows rewriting module `import` calls from all files, including sub-dependencies, to globally exposed objects via `window` object. For example:

```json
{
  "instapack": {
    "externals": {
      "vue": "Vue"
    }
  }
}
```

Converts this:

```ts
import * as Vue from 'vue'
```

into this:

```ts
let Vue = window["Vue"];
```

> This feature allows usage of CDN-hosted scripts or shimming older libraries that do not support module systems!

- `instapack:concat` allows packing browser libraries to be consumed directly from `<script src="...">` rather than as a module. The file names will be resolved node-style (but **NOT** their contents), which allows concatenating packages downloaded from `npm` to be bundled, minified, and then placed into the output JS folder. For example: (produces `vendor.js` bundle)

```json
{
  "instapack": {
    "concat": {
      "vendor": [
        "jquery",
        "popper.js"
        "bootstrap",
        "jquery-validation",
        "jquery-validation-unobtrusive",
        "./client/lib/my-old-jquery-plugin"
      ]
    }
  }
}
```

> Use concatenation for libraries that cannot be imported / do not need to be imported (for example, jQuery plugins). This hybrid approach allows great compatibility with older libraries, while enjoying the rich development experience using TypeScript.

> For consuming the libraries within the application code, load them before `bundle.js`, then reference the library objects from the `window` object (e.g. access jQuery using `window['$']`) or by using the `externals` module definitions!

## Release Cadence

Starting version 4.0.0, instapack follows [Semantic Versioning](http://semver.org/).

Bi-weekly releases (usually on 14th and 28th date of each month) will be performed for updating package dependencies. Bug reports will be dealt promptly. These actions will increment the patch version.

New non-breaking features will increment the minor version. Breaking changes will increment the major version.

Occasionally, beta builds will be published (`instapack@beta`) for showcasing the bleeding edge version of the tool.

Alternatively, you may use the nightly build directly from the source code repository:

```powershell
yarn global remove instapack  # `yarn link` does not work...
npm install -g instapack

git clone https://github.com/ryanelian/instapack.git
cd instapack

yarn            # package restore... You can also use `npm install` here.
npm link        # symlink global to local package for development
npm run build   # alternatively, `yarn global add typescript` then `tsc`
ipack --help
```

## FAQ

### Can I use [insert_framework_name_here] ?

Yes, absolutely!

You can even use jQuery or plain vanilla JS; don't worry, we're not gonna judge. :smile:

Add the packages required for your project using yarn / npm then start hacking. We'll take care of the outputs.

Also, pull requests are welcomed if you have a great starting templates and books for those projects. We'd love to expand our collections!

### Is this Windows only?

The majority of developers using instapack are working full-time on ASP.NET Core MVC projects on Windows with Visual Studio on daily basis. This use case will be the core focus for tooling support.

However, there should be no reason for instapack to not to run on OS X and Linux.

instapack will not suddenly introduce Windows or Visual Studio exclusive feature, and strive to maintain compatibility with multiple platforms.

### I thought files should not be bundled because of HTTP/2?

[Nope.](https://medium.com/@asyncmax/the-right-way-to-bundle-your-assets-for-faster-sites-over-http-2-437c37efe3ff)

Also, in IIS, HTTP/2 is only supported when using Windows Server 2016. Many of our customers are still using Windows Server 2012 R2 to date.

### Can I change the js / css folder name?

Nope.

### My package restore / IDE is slow. Help!

Windows Defender or other anti-virus software appear to slow down package restore and IDEs when opening projects.

For this very reason, it is highly recommended to:

- Add anti-virus exclusion to Yarn installation folder: `C:\Program Files (x86)\Yarn`. To double check, type: `where.exe yarn`

- Add anti-virus exclusion to Yarn cache folder: `C:\Users\Ryan\AppData\Local\Yarn`. To double check, type: `yarn cache dir`

- Add anti-virus exclusion to NodeJS installation folder: `C:\Program Files\nodejs`. To double check, type: `where.exe node`

- Add anti-virus exclusion to Git installation folder: `C:\Program Files\Git`. To double check, type: `where.exe git`

- Use very short root folder name for projects, such as `D:\VS`, to avoid potential problems with Windows system paths over 260 characters long. Then exclude the folder from the anti-virus.

### Your PowerShell is cute. How to?

```powershell
Set-ExecutionPolicy RemoteSigned -scope CurrentUser
iex (new-object net.webclient).downloadstring('https://get.scoop.sh')
scoop install concfg
concfg import firefly
```

For more information, visit http://scoop.sh/ and https://github.com/lukesampson/concfg
