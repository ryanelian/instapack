# instapack

> Integrated web application client project compiler using TypeScript and Sass!



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

We also provide programmatic API if you wish to integrate `instapack` into your very own build script:

```ts
import { instapack } from 'instapack';

let ipack = new instapack();
ipack.build('all', false, false);
```

## System Requirement

Currently supported Node.js is [latest version 6 LTS](https://nodejs.org/en/download/). The tool will be supported against version 8 when LTS build is released in [October 2017](https://github.com/nodejs/LTS).

When using Visual Studio 2017, select the latest **TypeScript 2.X SDK** from the individual component list during setup.

Optional but highly recommended, install [Python 2](https://www.python.org/downloads/).

## Features

- Hyper opinionated web application client project builder with zero configurations that just works.

- Built-in new project scaffold tool.

- Rich debugging experience using Google Chrome `DevTools`. 

## Design Goals

- Lower the barrier of entry for modern web application client development.

- Enforce development and deployment best practices.

- Improve source code quality with syntax and type checking.

- Unify team tooling accross multiple projects.

- Blurs the boundary behind design time and programming time using blazing fast `watch` + `dev` compilation mode. 

- Stand-alone tooling allows shipping to `npm`, which allows build system upgrade without altering the application.

- High quality tooling supported by latest stable Node.js, using strictly curated, actively maintained dependencies.

## But... Why?

At a glance, the `instapack` looks similar to `webpack`. However, that is where the similarity ends.

Here is an example. Michael wants to develop an ES6-based web application. One of the following events usually happen next...

- Michael would scramble the internet for `gulp` or `grunt` or `webpack` or `brocolli` recipes, configuring it for hours, before starting to code...

- Michael would hit a dead end. Gives up on the entire thing and writes the application in old-school JavaScript...

- Michael next project uses a more evolved version of his build system. However, when he needs to maintain his older applications, he needs to upgrade the build scripts manually...

- Michael's hard drive is now full because each project has their own build system. Ouch.

- Suddenly, Evan from the other team of the same company develops his own build system. So does Kevin.

`instapack` is developed as an answer those problems, and more!

## Is it Windows only? :(

Majority of the developers using `instapack` is working on ASP.NET Core MVC on Windows + Visual Studio full-time on daily basis. This use case will be the core focus for the tooling support.

However, several developers have successfully utilized `instapack` in OS X development environment. So **theoretically** it should work in Linux too without problems.

`instapack` will not suddenly introduce Windows or Visual Studio exclusive feature, and strive to maintain compatibility with multiple platforms.

## How does it work?

Internally, `instapack` uses the following modules:

- `gulp` as task orchestrator, and build pipeline.

- `typescript` as the transpiler, syntax checker, and type checker for the JavaScript language.

- `node-sass` as the transpiler, syntax checker, and type checker for the CSS language.

- `browserify` for merging the JavaScript output modules together.

- `uglify-js` for minifying the resulting JavaScript bundle.

- `postcss` for applying automatic CSS vendor-prefix using `autoprefixer`, then minifying the result using `cssnano`.

Out of the box, the following files will be used as the application entry points:

- `client/js/index.ts`, compiled to `wwwroot/js/bundle.js`.

- `client/css/site.scss`, compiled to `wwwroot/css/site.css`.

- If there are concatenation targets defined, will be resolved and then outputted to `wwwroot/js` folder. Read more below.

## Is this stable?

The manual `gulp` script version of the build system has been used for shipping 7 production-grade `AngularJS` projects across 2 different companies.

The script itself has been refined over the past 3 years in the making, with each revision involving approval from an internal build system improvement group within my company.

The beta version of `instapack` was then tested to reproduce the bundles for the said projects, with successful result (minimal diff), and since then has been used to maintain those projects.

So yes, rock solid stable.

## Release Cadence

Starting version 4.0.0, `instapack` follows [Semantic Versioning](http://semver.org/).

Weekly releases will be performed for updating package dependencies. This will increment the patch version.

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

- `instapack:concat` allows packing libraries from `node_modules` or your custom folder (such as `./client/lib/vue.js`) to be minified and outputted into your output JS folder.

## Improving Package Restore & IDE Performance

Windows Defender or other anti-virus software appears to slow down package restore and Visual Studio when opening projects.

For this very reason, it is highly recommended to:

- Add anti-virus exclusion to Yarn installation folder: `C:\Program Files (x86)\Yarn`. To double check, type: `where yarn`.

- Add anti-virus exclusion to Yarn cache folder: `C:\Users\Ryan\AppData\Local\Yarn`. To double check, type: `yarn cache dir`.

- Add anti-virus exclusion to NodeJS installation folder: `C:\Program Files\nodejs`. To double check, type: `where node`.

- Add anti-virus exclusion to Git installation folder: `C:\Program Files\Git`. To double check, type: `where git`.

- Use very short root folder name for projects, such as `D:\VS`, to avoid problems with Windows system paths over 260 characters long. Then exclude the folder from the anti-virus.

## FAQ

### Can I use other folder than `js` and `css` for input / output?

Nope.

### Can I use entry point other than `index.ts` and `site.scss`?

Nope.

### Why TypeScript?

- Babel is very slow.
- TypeScript is supported by Microsoft.
- TypeScript is growing at exponential rate.
- TypeScript is a strict superset of the JavaScript, which allows porting existing code with ease, then extend it with new features.

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

You may provide `title` attribute to the component for customizing the field name displayed.
