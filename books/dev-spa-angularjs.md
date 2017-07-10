# Developing Single-Page Application With AngularJS

## Getting Started

`ipack new angular-material`

Use your favorite back-end technology and reference `instapack` build artefacts. If you are not familiar, read the [basic tutorial using ASP.NET Core MVC](tutorial-asp-net-core-mvc.md).

## Modules

Open `angular-project.ts`, which is imported by `index.ts`.

An AngularJS application consists of modules:

```ts
let app = angular.module('aspnet', [animate, aria, messages, sanitize, material, router.default]);
```

> Be careful. `module` method with array as second parameter **declares** a module using a given name, while `module` method without a second parameter **retrieves** an existing module of the said name.

The modules listed are imported from `node_modules`, which are resolved as strings:

```ts
import * as animate from 'angular-animate';     // 'angular-animate'
import * as aria from 'angular-aria';           // 'angular-aria'
import * as messages from 'angular-messages';   // 'angular-messages'
import * as sanitize from 'angular-sanitize';   // 'angular-sanitize'
import * as material from 'angular-material';   // 'ngMaterial'
import * as router from '@uirouter/angularjs';  // router.default = 'ui.router'
```

With our registered `aspnet` module, auto-bootstrap your application by using `ng-app` directive / attribute with `aspnet` as parameter on your HTML:

```html
<div ng-app="aspnet" ng-cloak>
    <!-- AngularJS codes work here! -->
    <p>{{1 + 1}}</p>
</div>
```

If everything goes well, the expression will be evaluated to `2` inside the paragraph tag.

You can also manually bootstrap the application instead of using `ng-app` directive:

```js
angular.element(document).ready(function() {
    angular.bootstrap(document, ['aspnet']);
});
```

> Manual bootstrap might be useful if you need to perform asynchronous operation before AngularJS compiles the page.

## Components

A component allows you to develop a reusable HTML tag for use within your AngularJS application.

Before coding one, let's take a moment to look at the JavaScript project structure:

```
client/js/
│   angular-project.ts
│   index.ts
├───components
│       Hello.html
│       Hello.ts
│       Home.html
│       Home.ts
│       index.ts
│       ValidationMessage.html
│       ValidationMessage.ts
├───models
│       index.ts
│       SampleModel.ts
├───services
│       index.ts
│       SampleService.ts
└───states
        index.ts
```

In `angular-project.ts`, you should find the following lines:

```ts
import * as components from './components';
import * as services from './services';
import * as states from './states';
```

These imports refer to `index.ts` in respective folders. Open `components/index.ts` and add the following lines:

```ts
export * from './Sum'
```

Then create new file `Sum.ts` in the same `components` folder. Doing so tells TypeScript to re-export the modules exported from `Sum.ts`. This technique allows adding more components into the application while keeping its source code well-organized.

Write the following codes in `Sum.ts`:

```ts
export let SumComponent: angular.IComponentOptions = {
    template: require('./Sum.html')
};
```

> Technically, you do not need to type-hint `angular.IComponentOptions`. However, doing so provides clarity to the source code and serves as a documentation!

`instapack` supports HTML template compilation for convenience. `Sum.html` next to `Sum.ts` will be stringified, minified, then exported as a module. Make a new file `Sum.html` next to `Sum.ts` file:

```html
<p>{{1 + 1}}</p>
```

Return to `angular-project.ts`. Add the following line below our module declaration:

```ts
app.component('sum', components.SumComponent);
```

Now we can use our newly created component as HTML tag `<sum></sum>`. Try it!

## Controllers

Controller allows adding code-behind for the component view. Revisit `Sum.ts` and change the codes to:

```ts
class SumController implements angular.IController {
    $onInit() {
    }
}

export let SumComponent: angular.IComponentOptions = {
    template: require('./Sum.html'),
    controller: SumController,
    controllerAs: 'me',
    bindings: {
        a: '<'
        b: '<'
    }
};
```

Let's dissect the above codes:

- `SumController` is a basic class, which contains the following methods:

    - `$onInit()` is executed when the component is ready. **You should never run initialization logic in controller class constructor!**

- `SumComponent` uses `SumComponent` as its controller.

- `SubComponent` view can access controller class members by using `me`. (If not provided, defaults to `$ctrl`)

- Binds `SubComponent` parameters `a` and `b` as controller properties. When binding parameters, the following modes are supported:

    - `=` two-way data binding. Allows passing an object reference to a child component. Changes to object values will update the parent scope.

    - `<` one-way data binding. Allows passing an object reference to a child component. However, changes to object will not update the parent scope.

    - `@` string binding. Allows passing a raw string into a component. Use `{{ }}` to evaluate values to be passed as a string.

    - `&` callback binding. Allows passing a function into a child component.

With that knowledge, we can change the `Sum.html` template to:

```html
<p>{{me.a + me.b}}</p>
```

Try calling `<sum a="2" b="3"></sum>`. If done correctly, the web page should display `5`.

## Services

## Async-Await

## Routing

## Role-Based Authorization

