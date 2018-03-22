# Breaking Changes and Migrations Guide

Here are the list of breaking changes when upgrading between instapack major (or minor) versions.

## 4 to 5

- Our supported Node.js runtime is now the latest version 8 LTS.

  - [Node.js 8.3.0 and above](https://medium.com/the-node-js-collection/node-js-8-3-0-is-now-available-shipping-with-the-ignition-turbofan-execution-pipeline-aa5875ad3367) ships with [Ignition + Turbofan execution pipeline](https://v8project.blogspot.co.id/2017/05/launching-ignition-and-turbofan.html) which boost overall compiler performance and shrink memory footprints!

  - Internally, we've moved from Browserify to the more modern webpack module bundler.

- We have a new recommended `tsconfig.json`. Type: `ipack new tsconfig` in your project root folder (where the `package.json` and `tsconfig.json` is located) to upgrade!

  - It uses a standardized `ES2015` module code generation instead of `CommonJS`

  - It allows **Synthetic Default Imports** syntax for importing non-ES modules just like a default-exported ES modules!

- We've changed the CSS input file entry point from `site.scss` to `index.scss`. **Please rename the said file!**

- We've changed the default JS and CSS output file names to `ipack.js` (from `bundle.js`) and `ipack.css` (from `site.css`).

  - Make sure to update your `<script src="...">` and `<link href="..." />` references in the HTML files!
  
  - If that action is prohibitive, simply use the new `jsOut` and `cssOut` options to emit output file names identical to instapack 4:

```json
{
  "instapack": {
    "jsOut": "bundle.js",
    "cssOut": "site.css",
  }
}
```

## 5 to 6

Modules imported from `node_modules` will now be split automatically to `[jsOut].dll.js`, for example: `ipack.dll.js`

- **This file must be included using `<script>` tag BEFORE the main app file `ipack.js`**

- Build speed should be improved, hopefully. ([Trying to keep entry chunk size small...](https://webpack.js.org/guides/build-performance/))

HTML template compilation mode in `package.json` (`string` vs `vue`) has been removed in favor of special extension `.vue.html` to:

- Allow a project to have both stringified HTML and pre-compiled Vue.js HTML.

- Simplify instapack, to make it more beginner-friendly by reducing the number of obscure options and templates...

In light of [the final version of AngularJS 1.7 LTS](https://blog.angular.io/stable-angularjs-and-long-term-support-7e077635ee9c), it is recommended for newer projects to use Vue.js / React / Inferno instead.

- Therefore, `angular-material` template has been removed and `angular-bootstrap` template has been renamed to `angularjs`

- jQuery has been re-added into `angularjs` template to improve compatibility with legacy browsers, especially with Bootstrap 3.

Unfortunately, the enterprise world is not ready for JavaScript running natively in ES2015 and beyond...

The [no-longer-maintained](https://github.com/mishoo/UglifyJS2/pull/2897) UglifyES has been dropped in exchange for the hopefully-more-stable UglifyJS 3. This change imposes stricter build requirements:

- Only `es5` build `target` (set in `tsconfig.json`) is currently supported. **Setting ES2015+ as build target WILL cause build error!**

- **Attempting to import a non-TypeScript ES2015+ module will fail the build!** This downgrade guards the project against ninja browser incompatibilities.

## 6.0.0 to 6.1.0

Node API now requires project folder path (root) as constructor parameter.

## 6.1.0 to 6.2.0

- Flag for disabling source map was changed from `-u` (`uncharted`) to `-x` (`xdebug`).

- Sass can no longer `@import` _partial.scss files from `node_modules` implicitly. This was an unfortunate side-effect from adding `node_modules` in Sass included compilation paths. **You need to be explicit in this case.**
