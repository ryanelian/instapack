# Breaking Changes and Migrations Guide

Here are the list of breaking changes when upgrading between instapack major (or minor) versions.

## 7.3.0

- `port2` option is no longer being used and is obsoleted.

- JS build: Exclude `/node_modules/` path from TypeScript, Vue, HTML and CSS loaders. 

  - Explanation: Secure, Contain and Protect projects against bundling *UNCOMPILED* (non-JS) libraries source code!

  - **Example 1:** Imagine someone wrote a `.vue` library in CoffeeScript + Less CSS, shipped it to npm, and expects consumers to compile the thing themselves. instapack will fail to compile that library despite supporting `.vue` file.

  - **Example 2:** Imagine someone wrote a `.ts` library, shipped it to npm, and expects only TypeScript users to import it as-is. He'd be right, except COMPILE ERROR! That library only can be compiled with a specific version of TypeScript `2` and failed to be compiled with the latest TypeScript `3` used by instapack for some reason.

## 7.0.0

- Sass language compiler service has been swapped to the primary Dart implementation!

  - Aligned CSS `@import` syntax to the official specification: [certain import queries](https://github.com/sass/language/blob/master/accepted/css-imports.md) (for example, paths ending with `.css`) will be treated as ordinary CSS import.

- Removed `clean` command and `concat` build tools.

  - Legacy `angularjs` project template is now shipped with a simple concat tool (`concat.cmd`), which can be adopted by projects requiring similar approach for side-loading IIFE JS.

- Disable source map flag `--xdebug` or `-x` has been replaced with `--nodebug` or `-b`

- Automatic resolution for `.html` modules is now disabled, for improved source code clarity. (You will need to explicitly write the extension when importing the file!)

## 6.7.0

- Importing `.vue.html` module is deprecated in favor of **`.vue` Single-File Components (which supports Hot Reload Development Mode)** and will be removed in future versions!

## 6.6.0

- TypeScript 3.0.1 notable breaking changes: 

  - [`unknown` is a reserved type name now.](https://blogs.msdn.microsoft.com/typescript/2018/07/30/announcing-typescript-3-0/#unknown-is-a-reserved-type-name)

  - `resolveJsonModule` regression: [only works in when targeting AMD `module`](https://github.com/Microsoft/TypeScript/issues/25755) *(fixed in TypeScript 3.1 / instapack 7.0.0)*

## 6.2.0

- Flag for disabling source map was changed from `-u` (`uncharted`) to `-x` (`xdebug`).

- Sass can no longer `@import` _partial.scss files from `node_modules` implicitly. *(Behavior re-implemented in instapack 6.5.0)*

## 6.1.0

- Node API now requires project folder path (root) as constructor parameter.

## 5 to 6.0.0

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
