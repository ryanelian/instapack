<p align="center">
  <a href="https://github.com/ryanelian/instapack">
    <img align="center" src="https://raw.githubusercontent.com/ryanelian/instapack/master/img/icon.png" width="144" height="144" alt="logo" />
  </a>
</p>

<h1 align="center">instapack</h1>

<p align="center">
  <i>All-in-one TypeScript and Sass compiler for web applications!</i> 📦 🚀
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/instapack"><img alt="npm" src="https://badgen.net/npm/v/instapack?icon=npm" /></a>
  <a href="https://github.com/ryanelian/instapack/blob/master/LICENSE"><img alt="MIT License" src="https://badgen.net/npm/license/instapack" /></a>
  <a href="https://ryanelian.visualstudio.com/instapack/_build/latest?definitionId=1"><img alt="Build Status" src="https://ryanelian.visualstudio.com/instapack/_apis/build/status/ryanelian.instapack" /></a>
  <a href="https://dependabot.com"><img alt="Dependabot Status" src="https://api.dependabot.com/badges/status?host=github&repo=ryanelian/instapack" /></a>
  <a href="https://app.fossa.com/projects/git%2Bgithub.com%2Fryanelian%2Finstapack?ref=badge_small"><img alt="FOSSA Status" src="https://app.fossa.com/api/projects/git%2Bgithub.com%2Fryanelian%2Finstapack.svg?type=small" /></a>
</p>

## Install

### Machine-Wide (simpler and convenient)

`npm install -g instapack`

### Per-Project (consistent build)

First, open command prompt in the project folder and install instapack locally: `npm install instapack@[version] -D -E` or `yarn add instapack@[version] -D -E`

Then invoke instapack using command: `npx ipack` or `yarn ipack`

## Quick Start Guide

<img src="https://raw.githubusercontent.com/ryanelian/instapack/master/img/screenshot.png" alt="screenshot" width="450" height="400" />

```powershell
mkdir MyWebApp
cd MyWebApp
ipack new empty
ipack
```

Out of the box, these files will be used as the program entry points:

- `client/js/index.ts` compiled to `wwwroot/js/ipack.js`

  - Include this file at the bottom of your HTML / before `</body>` using `<script>` so the browser can render the page while downloading the script.

  - Anything imported from `node_modules` will be put into `ipack.dll.js`. Please also include this file in your HTML just before `ipack.js`

- `client/css/index.scss` compiled to `wwwroot/css/ipack.css`

  - Include this file at the top of your HTML / before `</head>` using `<link>` so the browser can style and render the page as it loads.

  - Spiced :hot_pepper: with [AutoPrefixer](https://github.com/postcss/autoprefixer) for applying CSS vendor-prefixes automatically!

- Assets (files or folders) declared in `copy` settings in `package.json` will be copied to `wwwroot` sub-folder from `node_modules` packages.

> `client`, `wwwroot`, `ipack.js`, and `ipack.css` can be renamed in project settings. [Read more ↓](#configurations)

## System Requirements

Currently supported Node.js is [the latest version 8 or 10 or 12 LTS](https://nodejs.org/en/download/).

When using [Visual Studio 2017 or 2019](https://www.visualstudio.com/downloads/), install [the latest TypeScript SDK](https://marketplace.visualstudio.com/search?term=typescript&target=VS&category=Tools&cost=free&vsVersion=&subCategory=Programming%20Languages&sortBy=UpdatedDate).

If using [the latest Visual Studio Code](https://code.visualstudio.com/), it should come with the latest TypeScript support out of the box.

## Design Philosophies

- Zero configurations: Hyper-opinionated front-end project build system. **It just works!** :sparkling_heart:

- Unify and standardize team build system across multiple projects, for any JS frameworks. :fist:

- Built-in new project scaffold tool for assorted JS frameworks. :gift:

- Rich debugging experience: set breakpoints, view variables, and step into the TypeScript source code! :mag:

- Beginner-friendly: Lower the barrier of entry for developing a modern web app. :balloon:

- Introduce structures to the front-end source code using standard module systems. :building_construction:

- Improve source code quality and maintainability with type hints and compile-time checks. :eyeglasses:

- Enforce best practices when building apps, which may significantly impact page load time. :hammer_and_wrench: (i.e. tree-shaking, code-splitting, bundling, and minification) 

- Blur the boundary between design-time and coding-time using lightning-fast `watch` + `dev` / `hot` build mode. :zap:

## But... Why?

Recently, *every hecking framework on this planet* :earth_asia: has their own CLI; but only few are able to support TypeScript as first-class feature. Thus, most people gave up on TypeScript right off the bat... :bat:

instapack is an initiative to develop a command line tool for compiling most apps developed using mainstream JS frameworks, with a :lemon: twist: **It can easily build an app written in TypeScript with minimal configurations!**

instapack is battle-tested :hocho: and is designed to cover *most normal use cases* when developing a modern web app. Powered by [webpack](https://webpack.js.org), instapack effortlessly devours modules written using modern JS standards (ES Harmony, CommonJS, AMD, UMD) and more (HTML templates, Vue SFC).

With this powerful tool, you can save time :watch:, save precious SSD space :space_invader:, and save yourself from the pain of manually maintaining project build scripts! :coffee:

## Commands

You may use `instapack` or `ipack` to invoke the command line interface.

### new [template]

Scaffolds a new instapack project into your existing app folder where the command line is invoked. **All templates target [ES2015, compatible with modern major browsers](https://kangax.github.io/compat-table/es6/) unless noted otherwise.** These templates are available:

- `empty` for a minimal clean slate.

- `es5` for an empty template targeting ES5 browsers (Internet Explorer 10+).

- `vue` for developing a web app using [Vue.js](https://vuejs.org/v2/guide/) and [Bootstrap 4](https://getbootstrap.com/).

- `blazor` for developing a web app using the ASP.NET Core Blazor framework, which allows SPA-like experience using C# programming language instead of JS.

  - [This template allows calling instapack-built TypeScript code from C#](https://docs.microsoft.com/en-us/aspnet/core/blazor/javascript-interop?view=aspnetcore-3.0) when a third-party JS library (from npm) is required. [Read more about `namespace` configuration ↓](https://github.com/ryanelian/instapack#configurations)

- `react` for developing a web app using [React](https://reactjs.org/) and [MobX 5](https://github.com/mobxjs/mobx) and [Microsoft UI Fabric](https://developer.microsoft.com/en-us/fabric).

- `react-semantic-ui` is identical to `react` template but ships with [Semantic UI](https://semantic-ui.com/) instead.

- `preact` for developing a web app using [Preact](https://preactjs.com/). (Fast 3kB alternative to React)

- `inferno` for developing a web app using [Inferno](https://infernojs.org/). (Insanely fast, React-like)

- `angularjs` for developing a *legacy* web app targeting ES5 browsers using [AngularJS 1.7](https://angularjs.org/) and [Bootstrap 3](http://getbootstrap.com/docs/3.3/).

  - Includes [jquery-validation-unobtrusive](https://github.com/aspnet/jquery-validation-unobtrusive) for ASP.NET MVC client-side validation and a simple JS concat tool (`concat.cmd` and `concat.js`).

If no template parameter is provided, `vue` will be chosen. :vulcan_salute:

> Most templates are armed with `axios` REST library, which plays nice with [NSwag Studio](https://github.com/RicoSuter/NSwag/releases)-generated TypeScript API clients!

### build [project]

Performs compilation of selected project type. Available projects: `all`, `js`, `css` and `copy`. If no project parameter is provided, `all` will be chosen.

In addition, build flags are available:

- `--watch` or `-w` enables automatic incremental build on source code changes. :robot:

- `--dev` or `-d` disables build outputs optimization and minification for **FAST build!** :fire:

- `--hot` or `-h` enables **Hot Reload** development mode using dedicated build server. :rotating_light: [Read more ↓](#hot-reload-development-mode)

- `--nodebug` or `-b` disables source maps, producing undebuggable outputs. (Slightly improves build speed)

- `--stats` generates `stats.json` next to the TypeScript build outputs, which can be fed to [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer) or [webpack-visualizer](http://chrisbateman.github.io/webpack-visualizer/). For sanity, this flag will be ignored when using `-d` or `-w` flags.

> You can combine multiple build flags, for example: `ipack -dw` = `dev` + `watch` mode for **massive productivity gainz!** :muscle:

### set <key> <value>

- `package-manager` allows setting default package manager to be used for restoring and integrity-checking `node_modules` prior build. Possible values: `yarn`, `npm`, `disabled` (default: `yarn`)

- `silent` disables voice assistant on build fails during watch mode when set to `true`. Possible values: `true` and `false` (default: `false`)

## Configurations

instapack puts configurations inside `package.json` to reduce project files clutter. For example, this is the included `package.json` with `vue` template:

> `name`, `version`, `private`, and `dependencies` fields were removed for brevity.

```json
{
  "instapack": {
    "output": "wwwroot",
    "alias": {
      "vue": "vue/dist/vue.esm",
      "vee-validate": "vee-validate/dist/vee-validate.full"
    }
  }
}
```

- `input` allows setting the input folder name. By default, it is set to `client`

- `output` allows setting the output folder name. By default, it is set to `wwwroot`

- `jsOut` allows setting the JS output file name. By default, it is set to `ipack.js`

- `cssOut` allows setting the CSS output file name. By default, it is set to `ipack.css`

- `namespace` allows exposing modules exported via JS entry point (`index.ts`) to be accessed as an object in the browser `window` global object.

  - For example: `namespace: "instapack"` enables accessing `export function foo()` as `window.instapack.foo()` (which then can be invoked via [Blazor JS Interop](https://docs.microsoft.com/en-us/aspnet/core/blazor/javascript-interop?view=aspnetcore-3.0): `await JsRuntime.InvokeAsync<string>("instapack.foo");`)

- `alias` allows overriding module `import` calls from all files, including dependencies. [Read more ↗](https://webpack.js.org/configuration/resolve/)

  - [TypeScript `paths` compiler option in `tsconfig.json`](https://www.typescriptlang.org/docs/handbook/module-resolution.html) will be translated into aliases with caveats:
  
    - For non-`*` paths: due to technical limitations, only the first path in the string array will be honored.

- `externals` allows rewriting module `import` calls from all files, including dependencies, to globally exposed objects via `window` object. [Read more ↗](https://webpack.js.org/configuration/externals/)

  - This technique enables usage of scripts hosted on [CDN](https://en.wikipedia.org/wiki/Content_delivery_network)!

  - This technique also allows referencing non-module, old-school IIFE JS loaded via `<script>` which provides excellent interop with older libraries!

**Example:**

```json
{
  "instapack": {
    "externals": {
      "jquery": "$"
    }
  }
}
```

```ts
// converts this...
import jQuery from 'jquery';

// into something similar to this...
// const jQuery = window["$"];
```

- `copy` allows copying static assets from the npm folder (`node_modules`) into the project output folder during build.

  - **This is a PREVIEW feature** inspired from [Visual Studio LibMan](https://docs.microsoft.com/en-us/aspnet/core/client-side/libman/libman-vs?view=aspnetcore-3.0). *No overwrites will be performed right now due to safety concerns.*

  - `library` accepts a package name. The package MUST be installed in the project `package.json` and cannot be implicit / sub-dependency of other packages.

  - `files` accepts a list of file names OR folder names OR glob patterns.

  - `destination` accepts a sub-folder path inside project output directory (i.e. `wwwroot`).

  - The copy output preserves the folder structure of the origin folders up to the topmost common directory path. (For example, copying `node_modules/library/a/b/c.txt` and `node_modules/library/a/d/f.txt` will result in `wwwroot/target/b/c.txt` and `wwwroot/target/d/f.txt` to be created)

**Example:** 

> Copy all files inside `node_modules/@fortawesome/fontawesome-free/webfonts` folder, except files in that folder prefixed with `fa-brands` into project output sub-folder `wwwroot/webfonts`

```json
{
  "instapack": {
    "copy": [
      {
        "library": "@fortawesome/fontawesome-free",
        "files": [
          "webfonts",
          "!webfonts/fa-brands*"
        ],
        "destination": "webfonts"
      }
    ]
  }
}
```

- `port1` can be set for declaring a static port number to be used by the Hot Reload server. If not set or is already used, the port number will be randomized. [Read more ↓](#hot-reload-development-mode)

## Babel Integration

instapack supports [`.babelrc`](https://babeljs.io/docs/usage/babelrc/) in the project root folder. **Babel will be run AFTER TypeScript compilation.** Here are some use cases where this feature can be useful:

- You may use Babel instead of TypeScript to transpile JS to ES5: set TypeScript `target` to `esnext` then use [`@babel/preset-env`](https://github.com/babel/babel/tree/master/packages/babel-preset-env). This has an interesting side effect where [polyfills are automatically applied!](https://babeljs.io/docs/en/babel-polyfill)

- You may use Babel instead of TypeScript to compile JSX: set TypeScript `jsx` to `preserve` then use the framework-compatible JSX plugin. For example: `@babel/preset-react`, `babel-plugin-transform-vue-jsx`, `babel-plugin-inferno`

## Hot Reload Development Mode

Hot Reload development mode allows a developer to update application code while preserving runtime states, without triggering browser refresh when not needed.

instapack supports Hot Reload for popular JS frameworks by using `--hot` or `-h` flags, which also enable `watch` and `dev` modes automatically. **Hot Reload requires browsers with [WebSocket](https://caniuse.com/#feat=websockets) feature.**

Compiling a JS project using this mode will:

- Redirect the JS outputs to the build server (instead of the physical JS output folder).

- Create wormholes (script injections) in place of the usual JS output files, directed to respective scripts on the build server.

```
[01:24:26] Hot Reload Server running on http://localhost:28080/
[01:24:28] ipack.dll.js 6.25 MB in http://localhost:28080/
[01:24:28] ipack.js 62.5 kB in http://localhost:28080/
[01:24:28] +wormhole: wwwroot/js/ipack.dll.js --> http://localhost:28080/ipack.dll.js
[01:24:28] +wormhole: wwwroot/js/ipack.js --> http://localhost:28080/ipack.js
```

> No changes should be required for the `<script src="...">` in the app itself!

### Vue.js

Hot Reload for Vue.js project using Single-File Components format (`.vue`) has been enabled out of the box.

> No further configurations necessary!

### React

Install package: https://github.com/gaearon/react-hot-loader

```
yarn add react-hot-loader -D
```

Create a `.babelrc` in the project root folder:

```json
{
    "plugins": [
        "react-hot-loader/babel"
    ]
}
```

Refactor your root component as a *hot-exported* module:

```tsx
// client/js/components/App.tsx
import React from 'react';
import { hot } from "react-hot-loader"
import { Hello } from "./Hello";

export let App = () => <Hello compiler="instapack" framework="React" />;
export let HotApp = hot(module)(App);
```

Import that module, then render:

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { HotApp } from './components/App';

ReactDOM.render(
    <HotApp />,
    document.getElementById('app')
);
```

## TSLint Integration

instapack supports [`tslint.json` / `tslint.yaml`](https://palantir.github.io/tslint/usage/configuration/) in the project root folder. Here are some sensible, useful [rules](https://palantir.github.io/tslint/rules/) which greatly reduce programming blunders:

```json
{
  "rules": {
    "no-non-null-assertion": true,
    "ban-comma-operator": true,
    "curly": true,
    "no-conditional-assignment": true,
    "no-duplicate-super": true,
    "no-duplicate-switch-case": true,
    "no-dynamic-delete": true,
    "no-eval": true,
    "no-for-in-array": true,
    "no-object-literal-type-assertion": true,
    "no-shadowed-variable": true,
    "no-sparse-arrays": true,
    "no-string-throw": true,
    "no-unbound-method": true,
    "no-unsafe-finally": true,
    "no-var-keyword": true,
    "switch-default": true,
    "triple-equals": true,
    "use-isnan": true,
    "new-parens": true,
    "number-literal-format": true,
    "type-literal-delimiter": true
  }
}
```

> Source file will be linted only when it can be compiled correctly.

## Module Systems

### TypeScript / ES Modules

[Imports and exports](https://www.typescriptlang.org/docs/handbook/modules.html) other `.ts` / `.tsx` files in the project or normal JS modules from `node_modules`. This technique allows the ease of development using intellisense for modules with type definitions:

- The module has `"typings": "something.d.ts"` in its `package.json`. For example: `vue`, `linq`

- The module has [@types](https://microsoft.github.io/TypeSearch/) installed. For example, `react` and `@types/react`

```ts
import List from 'linq';
```

> When the imported module does not have any type definitions, it will be imported as `any` data type (no intellisense).

### ES Modules: Dynamic Import

instapack supports code-splitting using ESM dynamic `import()` syntax to load on-demand modules automatically, greatly reducing the initial page load on large application:

```ts
Vue.component(
  'my-component',
  // The `import` function returns a Promise<T>
  () => import('./MyComponent.vue')
)
```

An excerpt of build log when using dynamic import:

```
[02:41:10] ipack.0.js 70.1 kB
[02:41:10] ipack.dll.js 220 kB
[02:41:10] ipack.js 2.76 kB
```

- The number `0` is an auto-generated chunk name, which can be overridden using the *magic comment* `import(/* webpackChunkName: "MyComponent" */ './MyComponent')` (generates `ipack.MyComponent.js` instead).

> To use this syntax within TypeScript, `module` compiler option in `tsconfig.json` must be set to `esnext`

### CommonJS / Node.js require

Easily imports ordinary JS modules within the project or from `node_modules`. However, **you WILL NOT get intellisense!** (Modules will be imported as `any` data type.)

```js
let $ = require('jquery');
```

> CommonJS `require` method in TypeScript is provided through `@types/requirejs` or `@types/node` packages.

### HTML Modules

Imports an `.html` file to be minified and then stringified. This technique is invaluable for working with frameworks relying on HTML-based templates such as AngularJS:

```ts
// ESM syntax
import template from './MyTemplate.html';

// CJS syntax
let templateCJS: string = require('./MyTemplate.html');
```

> A global TypeScript definition file for `*.html` module is required for importing the `.html` file from TypeScript using ESM syntax.

```ts
// html-shim.d.ts

declare module "*.html" {
  const _: string;
  export default _;
}
```

**DEPRECATION WARNING:** HTML modules with special extension `.vue.html` will be compiled to [parameter objects for Vue.js `ComponentOptions`](https://vuejs.org/v2/guide/render-function.html#Template-Compilation). This behavior will be removed in future instapack versions due to improved `.vue` toolings.

```ts
// vue-html-shim.d.ts

declare module "*.vue.html" {
    import { CreateElement, VNode } from 'vue';

    export const render: (createElement: CreateElement) => VNode;
    export const staticRenderFns: ((createElement: CreateElement) => VNode)[];
}
```

```ts
import Vue from 'vue';
import Component from 'vue-class-component';
import { render, staticRenderFns } from './MyComponent.vue.html';

@Component({
    render: render,
    staticRenderFns: staticRenderFns
})
export class MyComponent extends Vue {
}
```

### JSON Modules

instapack 7.0.0 with TypeScript 3.1.0 supports strongly-typed, static JSON file imports in the TypeScript project using the `import` syntax:

```json
{
  "foo": "bar"
}
```

```ts
import * as settings from './settings.json';

let foo: string = settings.foo;
```

> Requires `resolveJsonModule` compiler option in `tsconfig.json` to be set to `true`

> Earlier instapack versions may import JSON file using `require` syntax instead.

### Vue Single-File Components

instapack can compile `.vue` files:

```vue
<template>
<h1>Hello from {{ compiler }} and {{ framework }}!</h1>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
@Component({
    props: ['framework', 'compiler']
})
export default class Hello extends Vue {
    framework: string;
    compiler: string;
}
</script>
```

> Enhance development experience using fabulous :star2: intellisense with Visual Studio 2017 [15.8 improved Vue.js support](https://blogs.msdn.microsoft.com/visualstudio/2018/08/14/visual-studio-2017-version-15-8/) or [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur) extension for Visual Studio Code!

- The HTML `<template>` will be compiled Ahead-of-Time (AoT) for greater app startup performance!

- [A global TypeScript definition file for `*.vue` module](https://github.com/ryanelian/instapack/blob/master/templates/vue/client/js/vue-shim.d.ts) is required for importing the `.vue` file from TypeScript using ESM syntax.

  - This file will be created for you when using the `vue` new project template!

- Notice that basic `<style>` (or `<style scoped>` or `<style module>`) should work, but should *NOT* be used. 

  - **This particular feature is in PREVIEW state / not supported** [at least until webpack ships built-in CSS modules](https://github.com/webpack/webpack/pull/6448).

  - **Limitations:** You cannot use Sass. The CSS will not be auto-prefixed and minified.
  
  - **Reduced project maintainability:** Your CSS will be scattered across obscure files in the JS project, [similar to inline CSS](https://www.lifewire.com/avoid-inline-styles-for-css-3466846).

- Projects with matching `vue-template-compiler` dependency (compiler version === Vue version) will be built using that specific compiler instead of using instapack built-in `vue-template-compiler`.

### Sass CSS Module System

https://github.com/sass/sass/blob/master/accepted/module-system.md

instapack also has a custom Node-like but standard-compliant Sass module system using [`@use`](https://sass-lang.com/documentation/at-rules/use), [`@forward`](https://sass-lang.com/documentation/at-rules/forward), and [`@import`](https://sass-lang.com/documentation/at-rules/import) syntaxes.

> **HEADS UP!** The Sass team discourages the continued use of the `@import` rule. Sass will gradually phase it out over the next few years, and eventually remove it from the language entirely. Prefer the `@use` rule instead.

- Aligned with [the official Sass CSS Imports specification](https://github.com/sass/sass/blob/master/accepted/css-imports.md#handling-an-import-rule), these imports will be treated as *'plain CSS'* `@import` rules (instead of being included in the compiled CSS):

  - The imported URL / query path begins with `http://` or `https://`

  - The query path ends with `.css` **(omit `.css` extension to include the file!)**

  - The query path is syntactically defined as a `url()`

  - The argument has a [media query](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries) and/or a [supports query](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports).

- Includes `.scss` and `.css` files relative to the source. ([Standard Sass behavior](https://jonathantneal.github.io/sass-import-resolve/))

  - Includes _partial.scss files, but NOT _partial.css files!

- Includes files relative to the source in a named folder, but as `index.scss` or `_index.scss` ([Standard Sass behavior](https://github.com/sass/sass/issues/690)) or `index.css`

- Includes files resolved from `node_modules` 

  - Also reads `package.json` to resolve `.css` file in the `style` field!

## Environment Variables

instapack supports defining variables in `process.env` global object. Variables coming from `process.env` are always strings.

> Using `process.env` in your TypeScript project requires `@types/node` package installed.

### .env

The file [`.env`](https://github.com/motdotla/dotenv) in the root project folder will be read and parsed.

**For example:** `FOO=bar` will define `process.env.FOO` as `'bar'`

> Due to technical reasons, `.env` file cannot be watched.

### --env

Build flag `--env` accepts object-like notation: 

- Variables passed using the flag will be merged with variables defined in `.env`

- Variables passed using the flag takes takes priority / overrides the variables defined in `.env`

**For example:** `ipack --env.FOO=bar --env.HELLO=world`

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

**If it worked when using standard JS, it WILL work with instapack.**

Add the packages required for your project using npm / Yarn and then start hacking. We'll take care of the outputs.

Also, pull requests are welcomed if you have a great starting templates and books for those projects. We'd love to expand our collections!

### Is it even safe to target ES2015?

As of June 2017, all major browsers (except Internet Explorer) supports ES2015. iOS 10.3 and above supports ES2015.

### How to build instapack projects using Docker?

This is a sample Dockerfile build recipe for building ASP.NET Core + instapack project:

> This recipe assumes that the project `Dockerfile` is located in the root `/` solution folder (next to `/MyApp.sln`), with the ASP.NET Core + instapack project located in `/MyApp` (`/MyApp/MyApp.csproj` and `/MyApp/package.json`)

```Dockerfile
FROM node:12-alpine AS instapack
RUN npm install -g instapack@7.3.1
COPY . /src
WORKDIR /src/MyApp
RUN ipack

FROM mcr.microsoft.com/dotnet/core/sdk:2.2 as build
COPY --from=instapack /src /src
WORKDIR /src/MyApp
RUN dotnet restore
RUN dotnet publish -c Release

FROM mcr.microsoft.com/dotnet/core/aspnet:2.2-alpine as runtime
COPY --from=build /src/MyApp/bin/Release/netcoreapp2.2/publish /app
WORKDIR /app
ENTRYPOINT ["dotnet", "MyApp.dll"]
```

Build locally using Linux container: `docker build --pull --tag myapp:0.0.1 .`

Run app via command: `docker run -p 12345:80 myapp:0.0.1`

> When developing multiple front-end projects in one solution, simply run instapack multiple times in different `WORKDIR`

### How to build instapack projects on GitLab?

Place `.gitlab-ci.yml` next to the `Dockerfile` to automatically build the image remotely on-commit, then push the image to the GitLab registry:

```yaml
image: docker:latest
services:
- docker:dind

stages:
- build
- release

variables:
  TEST_IMAGE: registry.gitlab.com/$CI_PROJECT_PATH:$CI_COMMIT_REF_NAME
  RELEASE_IMAGE: registry.gitlab.com/$CI_PROJECT_PATH:latest

before_script:
  - docker login -u gitlab-ci-token -p $CI_JOB_TOKEN registry.gitlab.com

build:
  stage: build
  script:
    - docker build --pull -t $TEST_IMAGE .
    - docker push $TEST_IMAGE

release:
  stage: release
  script:
    - docker pull $TEST_IMAGE
    - docker tag $TEST_IMAGE $RELEASE_IMAGE
    - docker push $RELEASE_IMAGE
  only:
    - master
```

### How to debug using Visual Studio Code?

Install the [VS Code extension: Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome), open the project using VS Code (`package.json` should be located on your workspace folder root).

Create a folder `.vscode` and a file `launch.json` inside it:

```json
{
    "configurations": [
        {
            "name": "Chrome",
            "type": "chrome",
            "request": "launch",
            "url": "http://localhost:43371/",
            "webRoot": "${workspaceFolder}",
            "smartStep": true
        }
    ]
}
```

Replace the `url` parameter with the correct URL of your app, then press **F5** on your keyboard!

### I thought files should not be bundled because of HTTP/2?

[Nope.](https://medium.com/@asyncmax/the-right-way-to-bundle-your-assets-for-faster-sites-over-http-2-437c37efe3ff)

Also, in IIS, HTTP/2 is only supported when using Windows Server 2016. Many of our customers are still using Windows Server 2012 R2 to date.

### Can I change the index.ts / index.scss entry point?

Nope.

### Can I change the js / css folder name?

Nope.

### Can I build multiple entry points?

Nope. 

However, you can _eject_ the `client` folder out of the back-end project folder, rename the `jsOut` file, and then redirect the `output` folder path back into the assets folder of the back-end project. This is the preferred way of doing things because:

- You may have multiple front-end projects for a single back-end project.

- Every front-end project can have vastly different `tsconfig.json` and `package.json` setup.

- Prevents front-end projects from screwing around with each other's code.

### My package restore / IDE is slow. Help!

Windows Defender or other anti-virus software appear to slow down package restore and IDEs when opening projects.

For this very reason, it is highly recommended to:

- Add anti-virus exclusion to Yarn installation folder: `C:\Program Files (x86)\Yarn`. To double check, type: `where.exe yarn`

- Add anti-virus exclusion to Yarn cache folder: `C:\Users\Ryan\AppData\Local\Yarn`. To double check, type: `yarn cache dir`

- Add anti-virus exclusion to NodeJS installation folder: `C:\Program Files\nodejs`. To double check, type: `where.exe node`

- Add anti-virus exclusion to `%APPDATA%\npm` and [`%APPDATA%\npm-cache`](https://docs.npmjs.com/cli/cache) folders.

- Add anti-virus exclusion to Git installation folder: `C:\Program Files\Git`. To double check, type: `where.exe git`

- Use very short root folder name for projects, such as `D:\VS`, to avoid potential problems with Windows system paths over 260 characters long. Then exclude the folder from the anti-virus.

### Your PowerShell is cute. How to?

```powershell
Set-ExecutionPolicy RemoteSigned -scope CurrentUser
iex (new-object net.webclient).downloadstring('https://get.scoop.sh')
scoop install concfg
concfg import https://raw.githubusercontent.com/ryanelian/instapack/master/concfg/firefly.json
```

For more information, visit http://scoop.sh/ and https://github.com/lukesampson/concfg
