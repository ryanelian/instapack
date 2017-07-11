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

> **Be careful.** `module` method with array as second parameter **declares** a module using a given name, while `module` method without a second parameter **retrieves** an existing module of the said name.

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
        a: '<',
        b: '<'
    }
};
```

Explanation:

- `SumController` is a basic class, which contains the following methods:

    - `$onInit()` is executed when the component is ready. **You should never run initialization logic in controller class constructor!**

    - Like components, `implements angular.IController` is technically not required, but encouraged for source code clarity and documentation.

- `SumComponent` uses `SumController` as its controller.

- `SubComponent` view can access controller class members by using `me`. (If not provided, defaults to `$ctrl`)

- Binds `SubComponent` parameters `a` and `b` as controller properties. When binding parameters, the following modes are supported:

    - `=` two-way data binding. Allows passing an object reference to a child component. Changes to object values will update the parent scope.

    - `<` one-way data binding. Allows passing an object reference to a child component. However, changes to object will not update the parent scope.

    - `@` string binding. Allows passing a raw string into a component. Use `{{ }}` within the parameter to evaluate values to be passed as a string.

    - `&` callback binding. Allows passing a function into a child component.

With that knowledge, we can change the `Sum.html` template to:

```html
<p>{{me.a + me.b}}</p>
```

Try calling `<sum a="2" b="3"></sum>`. If done correctly, the web page should display `5`.

## Server API

Before attempting the next section, prepare a web service endpoint that accepts two numbers then returns addition, subtraction, and multiplication results as JSON. Make sure that the API works by using [Postman](https://www.getpostman.com/).

As an example, this is a `POST /api/v1/math` API developed using ASP.NET Core MVC:

```cs
[Produces("application/json")]
[Route("api/v1/math")]
public class MathApiController : Controller
{
    public class MathApiRequestModel
    {
        public double A { set; get; }

        public double B { set; get; }
    }

    public class MathApiResponseModel
    {
        public double Sum { set; get; }

        public double Subtract { set; get; }

        public double Multiply { set; get; }
    }

    [HttpPost]
    public IActionResult Post([FromBody]MathApiRequestModel model)
    {
        var result = new MathApiResponseModel
        {
            Sum = model.A + model.B,
            Subtract = model.A - model.B,
            Multiply = model.A / model.B
        };

        return Ok(result);
    }
}
```

> It is always a good practice to version your APIs. That way, you can retain backwards compatibility during future development.

## Services

In `models/index.ts`, add the following code:

```ts
export class MathApiResponseModel {
    sum: number;
    subtract: number;
    multiply: number;
}
```

After that, in `services/index.ts`, add the following line:

```ts
export * from './MathService';
```

Create a new file `MathService.ts` in the same `services` folder:

```ts
import { MathApiResponseModel } from '../models';

export class MathService {
    static $inject = ['$http'];

    $http: angular.IHttpService;

    constructor($http) {
        this.$http = $http;
    }

    post(a: number, b: number) {
        return this.$http.post<MathApiResponseModel>('/api/v1/math', {
            a: a,
            b: b
        });
    }
}
```

Explanation:

- `constructor($http)` allows AngularJS to perform Dependency Injection via constructor parameter for HTTP Service required to perform request against a web API.

- `static $inject` allows injected services to survive mangling during compilation. For example, `$http` parameter may turn into `a` after minification. By providing a **static $inject** containing service names in an array of string, AngularJS will be able to correctly resolve the required dependencies.

- `post` method uses the HTTP Service to perform a request to a web API, which returns a `Promise<MathApiResponseModel>` object if successful.

To use the service via Dependency Injection, in `angular-project.ts`, add the following line:

```ts
app.service('MathService', services.MathService);
```

Then, modify our `SumController` in `SumComponent.ts`:

```ts
import { MathService } from '../services';

class SumController implements angular.IController {
    static $inject = ['MathService'];

    MathService: MathService;

    a: number;
    b: number;
    total: number;

    constructor(MathService) {
        this.MathService = MathService;
    }

    $onInit() {
    }

    submit() {
        this.MathService.post(this.a, this.b).then(response => {
            this.total = response.data.sum;
        }).catch(error => {
            console.log(error);
        });
    }
}
```

And our `Sum.html` to:

```html
<form ng-submit="me.submit()">
    <input ng-model="me.a" />
    <input ng-model="me.b" />
    <button type="submit">Submit</button>
    <p ng-bind="me.total"></p>
</form>
```

Explanation:

- `SumController` requires `MathService` dependency, used for posting the two numbers to the server and obtaining the result as `total` property. The `MathService` property is type-hinted for improved code quality.

- `MathService.post` returns a [$q](https://docs.angularjs.org/api/ng/service/$q) object, which is a [Promises/A+](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)-compliant implementation of deferred objects. HTTP request is performed asynchronously, and then processed when done.

- Introduce UI for the component using a form, with two input box bound to `a` and `b` properties. When the form is submitted, invoke `submit()` method in the controller. Also, display the sum total.

## async-await

While manipulating `Promise` results using `then()` and `catch()` callbacks are possible, the controller methods can quickly become unreadable if the code contain multiple nested / chained Promises.

For this reason TypeScript and ECMAScript 8 supports async-await, which allows writing asynchronous code just like a synchronous code. This concept is similar to [.NET Task Parallel Library using async-await](https://docs.microsoft.com/en-us/dotnet/csharp/async).

Modify the `submit()` method in `SumController` to:

```ts
async submit() {
    try {
        let response = await this.MathService.post(this.a, this.b);
        this.total = response.data.sum;
    } catch (error) {
        console.log(error);
    }
}
```

Explanation:

- `await` keyword can only be used in an `async` methods.

- `await` can only be performed against a `Promise` object. Successful `await` will unwrap the result of a completed `Promise`.

- Similar to synchronous code, `await` will throw an error if not successful. For this reason, `try-catch` block is required to prevent unhandled error when the request failed.

> **Under the hood:** Normally this technique does not work in AngularJS world because `$q` triggers `$scope.$apply()` but standard `Promise` does not. However, we can trick the browser into using `$q` as `Promise` polyfill by using the following code in `angular-project.ts`:

```ts
// This code has already been included by instapack in template
app.run(['$window', '$q', ($window: angular.IWindowService, $q: angular.IQService) => {
    $window['Promise'] = $q;
}]);
```

## Routing

If you have successfully followed the guide up to this point, **congratulations**! :tada: You have mastered the ways of building a **component-based web application client**. You may use server-based routing to serve pages containing your developed components.

However, there are cases when you need to develop a full Single-Page Application (SPA) powered by client-side routing.

## Role-Based Authorization
