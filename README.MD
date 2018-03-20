# instapack

> All-in-one web application client project compiler using TypeScript and Sass! :package: :rocket:

[![npm](https://img.shields.io/npm/v/instapack.svg)](https://www.npmjs.com/package/instapack) [![Build Status](https://travis-ci.org/ryanelian/instapack.svg?branch=master)](https://travis-ci.org/ryanelian/instapack) [![Build status](https://ci.appveyor.com/api/projects/status/y6v2hde0mhh9o5an/branch/master?svg=true)](https://ci.appveyor.com/project/RyanElian/instapack/branch/master) [![Greenkeeper badge](https://badges.greenkeeper.io/ryanelian/instapack.svg)](https://greenkeeper.io/)

![Screenshot](https://raw.githubusercontent.com/ryanelian/instapack/master/img/screenshot.png)

## Install

`npm install -g instapack`

If you encounter [errors](https://github.com/npm/npm/issues/18380) during installation, try:

- Running install [as Administrator](https://www.howtogeek.com/194041/how-to-open-the-command-prompt-as-administrator-in-windows-8.1/) or using elevated privileges (sudo).

- Or clear the npm cache: `npm cache clean --force` then: `npm install -g instapack --no-optional`

- Or downgrade to npm 4 to avoid [buggy npm 5](https://github.com/npm/npm/issues/16991): `npm install -g npm@4`

- **Or use [Yarn](https://yarnpkg.com/en/docs/install) instead:** `yarn global add instapack`

## Quick Start Guide

```powershell
cd E:\VS\MyWebApp
ipack new empty
ipack
```

[Programmable API](https://github.com/ryanelian/instapack/blob/master/src/index.ts) is also provided if you wish to integrate instapack into your very own build script:

```js
const instapack = require('instapack');

let projectFolder = process.cwd();
let ipack = new instapack(projectFolder);
ipack.build('all');
```

Practical guides can be read in [books](https://github.com/ryanelian/instapack/tree/master/books) folder.

## System Requirements

Currently supported Node.js is [the latest version 8 LTS](https://nodejs.org/en/download/).

When using [Visual Studio 2017 (Update 2 or above)](https://www.visualstudio.com/downloads/), install [the latest TypeScript SDK for Visual Studio 2017](https://www.microsoft.com/en-us/download/details.aspx?id=55258).

When using Visual Studio 2015 (Update 3 or above), install [the latest TypeScript SDK for Visual Studio 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48593).

If using [the latest Visual Studio Code](https://code.visualstudio.com/), it should come with the latest TypeScript support out of the box.

## Features

- Hyper-opinionated web app client project builder with near-zero configurations. It just works. :sparkling_heart:

- Built-in new project scaffold tool. :gift:

- Rich debugging experience using DevTools: set breakpoints, view variable values, and step into the TypeScript source code directly in the browser! :mag:

## Design Goals

- Lower the barrier of entry for developing a modern web app. :angel:

- Introduce structure to the app client source code. :office:

- Improve source code quality and maintainability with type hints and compile-time checks. :eyeglasses:

- Enforce best practices when building apps, which may significantly impact page load time. (e.g. bundling and minification) :airplane:

- Unify team build system across multiple projects, for any frameworks. :fist:

- Blur the boundary between design time and coding time using lightning fast `watch` + `dev` compilation mode. :zap:

## But... Why?

Recently every hecking framework on this planet :earth_asia: has their own CLI, but only few are able to support TypeScript out of the box. So most people gave up on TypeScript right off the bat... :broken_heart:

instapack is an initiative to develop a command line tool for compiling most apps developed using mainstream JavaScript frameworks, with a :lemon: twist: **It can easily build an app written in TypeScript with minimal or no further configurations!**

Powered by [webpack](https://webpack.js.org), instapack effortlessly devours modules written using modern JS standards (ES Harmony, CommonJS, AMD, UMD) and is capable of importing HTML templates out of the box. instapack is battle-tested :hocho: and is designed to cover 99.99% *normal* use cases when developing a modern web app.

With this powerful tool, you can save time :watch:, save precious SSD space :space_invader:, and save yourself from the pain of manually maintaining project build scripts! :coffee:

## How does it work?

Out of the box, these files will be used as the entry points:

- `client/js/index.ts`, compiled to `wwwroot/js/ipack.js`

  - Simply include this file in your HTML using `<script>` at the bottom / before </body> so the browser can render the page while loading the script.

  - Anything imported from `node_modules` will be put into `ipack.dll.js`. Please include this file in your HTML just before `ipack.js`

- `client/css/index.scss`, compiled to `wwwroot/css/ipack.css`

  - Also include this file in your HTML using `<link>` on the top / before `</head>` so the browser can style and render the page as it loads.

  - The Sass language compiler service has been configured to enable `@import` from `node_modules`!

  - Spiced with :hot_pepper: [PostCSS AutoPrefixer](https://github.com/postcss/autoprefixer) for applying CSS vendor-prefixes automatically!

- Concatenate files listed in `package.json`. Usually the output file will be included in the HTML before `ipack.js`. Read more below.

## Commands

You may use `instapack` or `ipack` to invoke the command line interface.

### new [template]

Scaffolds a new instapack project into your existing app folder where the command line is invoked. The following templates are available:

- `empty` when you need a minimal clean slate. (Use this template to author new templates!)

- `vue` when you want to develop a web app with Vue.js and Bootstrap 4. (Includes [aspnet-validation](https://www.npmjs.com/package/aspnet-validation) for ASP.NET MVC client-side validation.)

- `react` when you want to develop a web app with React and Semantic UI.

- `inferno` when you want to develop a web app with Inferno and Bootstrap 4.

- `vue-mobile` when you want to develop a _[Progressive Web Application](https://developers.google.com/web/progressive-web-apps/)_ using Vue.js and Onsen UI! (Cordova-compatible, read FAQ below.)

- `angularjs` when you need to develop a legacy web app with AngularJS 1.7 and Bootstrap 3. (Includes [jquery-validation-unobtrusive](https://github.com/aspnet/jquery-validation-unobtrusive) for ASP.NET MVC client-side validation.)

If no template parameter is provided, `vue` will be chosen.

### build [project]

Performs compilation against selected project type. Available projects: `all`, `js`, `css` and `concat`. If no project parameter is provided, `all` will be chosen.

In addition, build flags are available:

- `-w` or `--watch` enables automatic incremental build on source code changes. :robot:

- `-d` or `--dev` disables build outputs optimization and minification for **fast build!**

- `-x` or `--xdebug` disables source maps, producing undebuggable outputs. (Slightly improves build speed)

- `-a` or `--analyze` generates module size report `analysis.html` next to the TypeScript build output. For sanity, this flag will be ignored when using `-d` or `-w` flags.

> You can combine multiple build flags, for example: `ipack -dw` = `dev` + `watch` mode for **massive productivity gainz!** :muscle:

### clean

Remove all files in the output folders.

### set <key> <value>

- `package-manager` allows setting default package manager to be used for restoring and integrity-checking `node_modules` prior build. Possible values: `yarn` and `npm` 

- `integrity-check` allows disabling package restore prior build. Possible values: `true` and `false`

## Configuration

instapack puts configuration inside `package.json` to reduce project files clutter. For example, this is the included `package.json` with `vue` template:

```json
{
  "name": "aspnet",
  "version": "1.0.0",
  "private": true,
  "instapack": {
    "output": "wwwroot",
    "concat": {
      "vendor": [
        "es6-promise/dist/es6-promise.auto",
        "bootstrap.native/dist/polyfill",
        "bootstrap.native/dist/bootstrap-native-v4"
      ]
    },
    "alias": {
      "vue": "vue/dist/vue.common"
    }
  },
  "dependencies": {
    "@fortawesome/fontawesome": "^1.1.4",
    "@fortawesome/fontawesome-free-regular": "^5.0.8",
    "@fortawesome/fontawesome-free-solid": "^5.0.8",
    "@types/requirejs": "^2.1.31",
    "aspnet-validation": "^0.0.4",
    "axios": "^0.18.0",
    "bootstrap": "4.0.0",
    "bootstrap.native": "^2.0.21",
    "es6-promise": "^4.2.4",
    "linq": "^3.0.9",
    "moment": "^2.21.0",
    "noty": "^3.2.0-beta",
    "tslib": "^1.9.0",
    "vex-js": "^4.1.0",
    "vue": "^2.5.15",
    "vue-class-component": "^6.2.0"
  }
}
```

- `input` allows setting the input folder name. By default, it is set to `client`

- `output` allows setting the output folder name. By default, it is set to `wwwroot`

- `jsOut` allows setting the JS output file name. By default, it is set to `ipack.js`

- `cssOut` allows setting the CSS output file name. By default, it is set to `ipack.css`

- `alias` allows overriding module `import` calls from all files, including dependencies. Read more: https://webpack.js.org/configuration/resolve/

  - This was needed because the default Vue.js package main file points to the runtime-only build, which does not include the HTML template compiler... To avoid using this, use the `.vue.html` template module. (Read below)

  - [TypeScript `paths` compiler option in `tsconfig.json`](https://www.typescriptlang.org/docs/handbook/module-resolution.html) will be translated into aliases with caveats:
    
    - Due to technical limitations, only the first path in the string array will be honored!

    - "All modules" pattern `*` will not be honored because it dirties the packages namespace!
    
> Packages are imported without relative paths, therefore `*` path turns all project modules into package imports. This can cause the project to be less maintainable or confusing...

- `externals` allows rewriting module `import` calls from all files, including dependencies, to globally exposed objects via `window` object. Read more: https://webpack.js.org/configuration/externals/

For example:

```json
{
  "instapack": {
    "externals": {
      "jquery": "$"
    }
  }
}
```

converts this...

```ts
import jQuery from 'jquery';
```

into this...

```ts
const jQuery = window["$"];
```

so [CDN](https://en.wikipedia.org/wiki/Content_delivery_network) can be used! :tada:

```html
<script src="https://unpkg.com/jquery@3.2.1/dist/jquery.js"></script>
```

- `concat` allows packing browser libraries to be consumed directly from `<script src="...">` rather than as a module.

  - The file names will be resolved node-style (**but NOT their contents**), which allows concatenating packages downloaded from `npm` to be bundled, minified, and then placed into the output JS folder. 

  - Use concatenation for libraries that cannot be imported / do not need to be imported (for example, jQuery plugins). This hybrid approach allows greater compatibility with older libraries, while enjoying the rich development experience using TypeScript.

  - For consuming the libraries within the TypeScript app code, load them before `bundle.js` then use the `externals` module configuration. (You may use CommonJS syntax to import the module; read more below...)
  
  - Alternatively, reference the library objects directly from the `window` object (e.g. `window['$']`).

**concat configuration example:** (produces `vendor.js` bundle)

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

## Module Systems

### ES / TypeScript Modules

[Import and export](https://www.typescriptlang.org/docs/handbook/modules.html) other `.ts` / `.tsx` files in the project or normal JavaScript modules from `node_modules`. This technique allows the ease of development using intellisense for modules with type definitions:

- The module has `"typings": "something.d.ts"` in its `package.json`. For example: `vue`, `linq`

- The module has [@types](https://microsoft.github.io/TypeSearch/) installed. For example, `react` and `@types/react`

```ts
import List from 'linq';
```

> When the imported module does not have any type definitions, it will be imported as `any` data type (no intellisense).

### CommonJS / Node.js require

- Easily import normal / legacy / older JavaScript modules within the project or from `node_modules`. However, **you will NOT get intellisense!** (Modules will be imported as `any` data type.)

```js
let $ = require('jquery');
```

- Import a `.html` file to be minified and then stringified. This technique is handy for working with frameworks relying on HTML-based templates such as AngularJS, mustache.js / Handlebars.js, and Vue.js:

```ts
let template = require('./mytemplate.html') as string;
```

- Import a static JSON file content as a JavaScript module object.

```ts
let something = require('./something.json') as ISomething;
```

> CommonJS `require` method in TypeScript is provided through `@types/requirejs` package. Use `as` type-hint for clarity and convenience.

### Vue HTML Templates via ES Modules

In pursuit of greater app performance, instapack allows Ahead-of-Time (AoT) compilation of HTML templates using Vue.js render syntax. HTML files with special file extension `.vue.html` will be compiled into an object to be passed into Vue Component decorator as parameters:

```ts
import Vue from 'vue';
import Component from 'vue-class-component';
import { render, staticRenderFns } from './MyComponent.vue.html';

@Component({
    render, staticRenderFns
})
export class MyComponent extends Vue {
}
```

> [A global TypeScript definition file for `*.vue.html` module](https://github.com/ryanelian/instapack/blob/master/templates/vue/client/js/template.d.ts) is required for importing a template using ES Module syntax. That file will be created for you when using the `vue` new project template!

### Sass @import

instapack also has a custom-made Node-like but standard-compliant Sass module system using `@import` syntax:

- Include files relative to the source, which include _partial.scss files. (Standard Sass behavior)

- Include files relative to the source in a named folder, but as `index.scss` or `index.css`

- Include files, resolved from `node_modules`

  - Also reads `package.json` to locate the file in `sass` or `style` field!

> Unlike Sass which ignores `@import` of files explicitly named with `.css` extension (which often caused confusion), instapack will pick up those files!

## Release Cadence

Starting version 4.0.0, instapack follows [Semantic Versioning](http://semver.org/).

Bi-weekly releases (usually on 14th and 28th date of each month) will be performed for updating package dependencies. Bug reports will be dealt promptly. These actions will increment the patch version.

New non-breaking features will increment the minor version. Breaking changes will increment the major version. [View breaking changes here.](BREAKING.md)

Occasionally, beta builds will be published (`instapack@beta`) for showcasing the bleeding edge version of the tool.

Alternatively, you may build directly from the source code repository:

```powershell
git clone https://github.com/ryanelian/instapack.git
cd instapack
.\link.ps1
.\build.ps1
ipack --version
```

## FAQ

### Can I use [insert_framework_name_here] ?

Yes, absolutely!

You can even use jQuery or plain vanilla JS; don't worry, we're not gonna judge. :smile:

Add the packages required for your project using yarn / npm then start hacking. We'll take care of the outputs.

Also, pull requests are welcomed if you have a great starting templates and books for those projects. We'd love to expand our collections!

### How to develop a Cordova app using vue-mobile template?

```powershell
cordova create MyProject
cd MyProject
ipack new vue-mobile
cordova platform add android ios browser
yarn
ipack -dw               # then change www/index.html <script> and <link> tags.
cordova run browser     # re-run commmand every time build outputs change
```

> **CAUTION:** `cordova platform add` and `cordova plugin add` (or remove) will destroy your `node_modules`. Re-run `yarn` / `npm install` after invoking those commands!

Alternatively, you can use `phonegap serve` for development due to Browsersync playing nice with instapack watch. You will need to remove / comment / edit the `<meta http-equiv="Content-Security-Policy">` tag though.

Later on...

```
cordova build android
cordova build ios
```

### I thought files should not be bundled because of HTTP/2?

[Nope.](https://medium.com/@asyncmax/the-right-way-to-bundle-your-assets-for-faster-sites-over-http-2-437c37efe3ff)

Also, in IIS, HTTP/2 is only supported when using Windows Server 2016. Many of our customers are still using Windows Server 2012 R2 to date.

### Can I change the index.ts / index.scss entry point?

Nope.

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
