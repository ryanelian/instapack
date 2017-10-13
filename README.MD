# instapack

> All-in-one web application client project compiler using TypeScript and Sass! :package: :rocket:

[![npm](https://img.shields.io/npm/v/instapack.svg)](https://www.npmjs.com/package/instapack) [![Build Status](https://travis-ci.org/ryanelian/instapack.svg?branch=master)](https://travis-ci.org/ryanelian/instapack)

![Screenshot](https://raw.githubusercontent.com/ryanelian/instapack/master/img/screenshot.png)

## Install

`npm install -g instapack`

## Quick Start Guide

```powershell
cd E:\VS\MyWebApp
ipack new empty
ipack -dw
```

[Programmable API](https://github.com/ryanelian/instapack/blob/master/src/index.ts) is also provided if you wish to integrate instapack into your very own build script:

```js
const instapack = require('instapack');

let ipack = new instapack();
ipack.build('all');
```

Practical guides can be read in [books](https://github.com/ryanelian/instapack/tree/master/books) folder.

## System Requirements

Currently supported Node.js is [the latest LTS version](https://nodejs.org/en/download/).

When using Visual Studio 2017 (Update 2 or above), install [the latest TypeScript SDK for Visual Studio 2017](https://www.microsoft.com/en-us/download/details.aspx?id=55258).

## Features

- Hyper-opinionated web app client project builder with zero configurations. It just works. :sparkling_heart:

- Built-in new project scaffold tool. :gift:

- Rich debugging experience using Google Chrome DevTools. You can set breakpoints, view variable values, and step over / into the TypeScript source code directly in the browser! :mag:

## Design Goals

- Lower the barrier of entry for developing a modern web app. :angel:

- Introduce structure to the app client source code. :office:

- Improve source code quality and maintainability with type hints and compile-time checks. :airplane:

- Enforce best practices when building the app, which may significantly impact page load time. (e.g. bundling and minification) :eyeglasses:

- Unify team build system across multiple projects, for any frameworks. :fist:

- Blur the boundary between design time and programming time using blazing fast `watch` + `dev` compilation mode. :zap:

## But... Why?

Recently every f-ing framework on this planet :earth_asia: has their own CLI, but only few are able to support TypeScript out of the box. So most people gave up on TypeScript right off the bat... :broken_heart:

instapack is an initiative to develop a command line tool for compiling most apps developed using mainstream JavaScript frameworks, with a :lemon: twist: **It can easily build an app written in TypeScript with minimal or no further configurations!**

Powered by [webpack](https://webpack.js.org), it effortlessly devours modules written using any standards under the sun (ES Harmony, CommonJS, AMD, UMD) and is capable of importing HTML templates out of the box. instapack is battle-tested :hocho: and is designed to cover 99.99% normal use cases when developing a modern web app.

With **one compiler to rule them all**, you can save time :watch:, save precious SSD space :space_invader:, and save yourself from the pain of manually maintaining project build scripts! :coffee:

## How does it work?

Out of the box, these files will be used as the entry points:

- `client/js/index.ts`, compiled to `wwwroot/js/packed.js`

- `client/css/index.scss`, compiled to `wwwroot/css/packed.css`

  - The Sass language compiler service has been configured to enable `@import` from `node_modules`!

  - Spiced with :hot_pepper: [PostCSS AutoPrefixer](https://github.com/postcss/autoprefixer) for applying CSS vendor-prefixes automatically!

- Concatenate files listed in `package.json`. Read more below.

## Commands

You may use `instapack` or `ipack` or `ipk` to invoke the command line interface.

### new [template]

Scaffolds a new instapack project into your existing application from where the command line is invoked. The following templates are available:

- `empty` when you need a minimal clean slate. Use this template to author new templates!

- `vue` when you want to develop a web app with Vue.js and Bootstrap 4.

- `vue+` when you want to develop a web app with Vue.js and Bootstrap 4, plus :fire: plugins (includes ASP.NET Core MVC validation) and pre-compiled template setup!

- `react` when you want to develop a web app with React and Semantic UI.

- `inferno` when you want to develop a web app with Inferno and Zurb Foundation.

- `angular-bootstrap` when you want to develop a web app with AngularJS (1.X) and Bootstrap 3 (includes ASP.NET Core MVC validation).

- `angular-material` when you want to develop a web app with AngularJS (1.X) and Material Design (includes Angular UI Router).

If no template parameter is provided, `vue` is chosen.

### build [project]

Performs compilation against selected project type. Available projects: `all`, `js`, `css` and `concat`. If no project parameter is provided, `all` is chosen.

In addition, build flags are available:

- `-w` or `--watch` for enabling compilation on change.

- `-d` or `--dev` for disabling minification, for **fast** compilation.

- `-u` or `--unmap` for disabling source maps, for slightly faster compilation.

- `-udw` shorthand for `unmap` + `dev` + `watch` mode together, amusingly named as *Unlimited Dev Works* mode, for **massive productivity gainz!** :muscle:

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
    "@types/node": "^8.0.34",
    "axios": "^0.16.2",
    "bootstrap": "4.0.0-beta",
    "bootstrap.native": "^2.0.17",
    "es6-promise": "^4.1.1",
    "font-awesome": "^4.7.0",
    "linqts": "^1.10.0",
    "moment": "^2.19.1",
    "noty": "^3.1.3",
    "tslib": "^1.8.0",
    "vue": "^2.5.1",
    "vue-class-component": "^6.0.0"
  }
}
```

- `input` allows setting the input folder name. By default, it is set to `client`.

- `output` allows setting the output folder name. By default, it is set to `wwwroot`.

- `alias` allows overriding module `import` calls from all files, including sub-dependencies. Read more: https://webpack.js.org/configuration/resolve/

  - This was needed because the default Vue.js package main file points to runtime-only build, which does not include the HTML template compiler... To avoid using this, read the template configuration below.

- `externals` allows rewriting module `import` calls from all files, including sub-dependencies, to globally exposed objects via `window` object. For example:

```json
{
  "instapack": {
    "externals": {
      "vee-validate": "VeeValidate"
    }
  }
}
```

converts this...

```ts
import VeeValidate from 'vee-validate'
```

into this...

```ts
const VeeValidate = window["VeeValidate"];
```

so that you can use this! :tada: (Read more: https://webpack.js.org/configuration/externals/)

```html
<script src="https://unpkg.com/vee-validate@2.0.0-rc.18/dist/vee-validate.js"></script>
```

- `concat` allows packing browser libraries to be consumed directly from `<script src="...">` rather than as a module. The file names will be resolved node-style (but **NOT** their contents), which allows concatenating packages downloaded from `npm` to be bundled, minified, and then placed into the output JS folder. For example: (produces `vendor.js` bundle)

```json
{
  "instapack": {
    "concat": {
      "vendor": [
        "jquery",
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

> For consuming the libraries within the TypeScript app code, load them before `bundle.js` then reference the library objects from the `window` object (e.g. access jQuery using `window['$']`) or use the `externals` module definitions!

- `template` allows changing the compilation mode of the imported templates to enable **Ahead-of-Time Compilation** of HTML templates for certain frameworks, for improved performance.

  - Default value `string` exports templates as string module. This is handy when working with HTML-based templates for Vue.js, AngularJS, and Mustache / Handlebars using CommonJS module import syntax: `require('./MyTemplate.html') as string`

  - `vue` exports HTML templates as a module containing `render` and `staticRenderFns` to be passed into a component options.

```ts
import Vue from 'vue'
import Component from 'vue-class-component'
import { render, staticRenderFns } from './MyComponent.html'

@Component({
    render, staticRenderFns
})
export class MyComponent extends Vue {
}
```

> You will need to create [a global TypeScript definition file for `*.html` modules](https://github.com/ryanelian/instapack/blob/master/templates/vue%2B/client/js/template.d.ts) in order to import a template using ES Module syntax!

## Release Cadence

Starting version 4.0.0, instapack follows [Semantic Versioning](http://semver.org/).

Bi-weekly releases (usually on 14th and 28th date of each month) will be performed for updating package dependencies. Bug reports will be dealt promptly. These actions will increment the patch version.

New non-breaking features will increment the minor version. Breaking changes will increment the major version.

Occasionally, beta builds will be published (`instapack@beta`) for showcasing the bleeding edge version of the tool.

Alternatively, you may build directly from the source code repository:

```powershell
git clone https://github.com/ryanelian/instapack.git
cd instapack

npm install
npm link        # symlink global to local package for development
npm run build   # alternatively, `npm install -g typescript` then `tsc`
ipack --version
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
