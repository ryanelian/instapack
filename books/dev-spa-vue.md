# Developing Single-Page Application using Vue.js

> Vue (pronounced /vjuː/, like view) is a progressive framework for building user interfaces. Unlike other monolithic frameworks, Vue is designed from the ground up to be incrementally adoptable. The core library is focused on the view layer only, and is easy to pick up and integrate with other libraries or existing projects. On the other hand, Vue is also perfectly capable of powering sophisticated Single-Page Applications when used in combination with modern tooling and supporting libraries. https://vuejs.org/v2/guide/

## Setup

For this tutorial, we will be using ASP.NET Core MVC 2.0 to serve as the web server of the app. Install [.NET Core SDK 2.0](https://www.microsoft.com/net/download/core) 

instapack requires [Node.js LTS or 8](https://nodejs.org/en/download) to function. Install if you have not done so, then using the command line, type: `npm install -g instapack`

Verify instapack has been installed successfully by typing `ipack --version`.

You may use Visual Studio for editing the project. Install [Visual Studio 2017 Update 3 or later](https://www.visualstudio.com/downloads) with the **ASP.NET and web development** workload. Do not forget to install the latest [TypeScript SDK for Visual Studio 2017](https://www.microsoft.com/en-us/download/details.aspx?id=55258).

Alternatively, you may use [Visual Studio Code](https://code.visualstudio.com) with [C# extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.csharp).

## Create New Project

Create an empty folder, such as `E:\VS\MyWebApp` then run these commands inside the folder (using PowerShell):

```powershell
dotnet new razor
Remove-Item .\.bowerrc              # we'll use npm instead of bower
Remove-Item .\bower.json
Remove-Item .\bundleconfig.json     # we'll use instapack to bundle and minify JS / CSS files
Remove-Item .\wwwroot\ -Recurse
Remove-Item .\Pages\_ValidationScriptsPartial.cshtml    # death to jQuery!
ipack new vue
dotnet build
ipack -dw
```

> `ipack -dw` is a Development + Watch mode, which lets the tool automatically builds on file changes near-instantly. Some files should appear in `wwwroot` folder after invoking this command.

Your project structure should look like this (`node_modules`, `bin`, and `obj` folders are omitted for brevity):

```
├───client
│   ├───css
│   └───js
│       └───components
├───Pages
└───wwwroot
    ├───css
    └───js
```

Modify `/Pages/_Layout.cshtml` to reference the files created by instapack:

```html
<!DOCTYPE html>

<html>
<head>
    <meta name="viewport" content="width=device-width" />
    <title>@ViewData["Title"]</title>

    <link rel="stylesheet" href="~/css/site.css" />
</head>
<body>
    <div class="container" id="app">
        @RenderBody()
    </div>

    <script src="~/js/bundle.js"></script>
</body>
</html>
```

In this arrangement, the style sheets will be loaded first, then the HTML body, to allow progressive page rendering ahead of the JS code.

If using Visual Studio, open the project (by double clicking the `.csproj` file) then launch the app with CTRL + F5 (which, by the way, also recompiles on file changes). Otherwise, use `dotnet run` command.

## Understanding Entry Points

Open `index.ts`. This is our entry point / main file to the JS app. Notice that there are module imports in this file:

```ts
import * as ES6Promise from 'es6-promise';
import { ValidationService } from 'aspnet-validation';
import 'bootstrap.native/dist/bootstrap-native-v4';
import './vue-project';
```

This syntax is called [ECMAScript 2015 Module](https://www.typescriptlang.org/docs/handbook/modules.html) syntax.

For now, just keep in mind that it imports `vue-project.ts` module from the same folder. Open it:

```ts
import * as Vue from 'vue';

import * as Components from './components';

// components must be registered BEFORE the app root declaration
Vue.component('hello', Components.HelloWorld);

// bootstrap the Vue app from the root element <div id="app"></div>
new Vue({
    el: '#app'
});
```

Vue.js has been setup to bootstrap from a root element with HTML `id="app"`, which exists in our new `_Layout.cshtml` file.

**So far, you do not have to do anything**; simply observe and understand the process. **This is important**.

Now open `/Pages/Index.cshtml`. Replace the content with:

```html
@page
@model IndexModel
@{
    ViewData["Title"] = "Home page";
}

<h1>{{ 1 + 1 }}</h1>
```

Then use your web browser to view the app index page. It should display `2` as a heading. **This is caused by Vue.js compiling and evaluating the values inside the double curly braces.**

## My First Component

Component is a building block of a modern web app client. Component represents reusable code that may be invoked using standard HTML tag syntax. Component allows dividing a complex app into simpler and more maintainable parts.

Create a new file `/client/js/components/Greet.ts`:

```ts
import * as Vue from 'vue'
import Component from 'vue-class-component'

@Component({
    template: '<p>Hello World!</p>'
})
export class Greet extends Vue {
}
```

Let us digest the above code slowly:

- `Vue` imports the entire `vue` modules from the `node_modules` into a single variable, which is defined in the project's `package.json`.

- `Component` imports a default `vue-class-component` modules from the `node_modules`, which is also defined in the project's `package.json`.

- `@Component` is a [ECMAScript decorator](https://tc39.github.io/proposal-decorators/), akin to [C# class attributes](https://docs.microsoft.com/en-us/dotnet/standard/attributes/writing-custom-attributes) or [Java class annotations](https://docs.oracle.com/javase/tutorial/java/annotations/basics.html). It describes the class as a Vue Component which has a template. 

- `class Greet extends Vue` exposes the class members (properties and methods) to the template. For now, there are nothing here; more on this later. We also expose this class to other modules that require it within the app by `export`-ing it.

Open `/client/js/components/index.ts`, modify the content into:

```ts
export * from './HelloWorld';
export * from './Greet';
```

The above code re-exports the Greet module for other modules that imports the components index module, like the `Components` import in `vue-project.ts` file. Now open this file and register the newly-created Greet component:

```ts
Vue.component('greet', Components.Greet);
```

Now, add `<greet></greet>` to our `Index.cshtml`. If you refresh the page, you should see `Hello!` text.

> Advanced topic: [components can be locally registered within another component to encapsulate / minimize visibility](https://vuejs.org/v2/guide/components.html#Local-Registration).

## My First Component, Part 2

Let us add more functionality to our new component. First, we'll pass down some values to the component using HTML attributes in the `Index.cshtml`:

```html
<greet name="Cynthia" v-bind:age="21" :is-male="false"></greet>
```

- `Cynthia` will be passed down as string parameter to the component. This is called **Literal** prop.

- `21` will be passed down as number parameter to the component. This is called **Dynamic** prop, using `v-bind` syntax. Common newbie mistake is to pass down non-variable, non-string value without binding, which may cause programming errors!

- `false` will also be passed down as boolean parameter to the component using Dynamic prop. `:` is a short-hand syntax for `v-bind`.

Now modify our component declaration in `Greet.ts`:

```ts
@Component({
    props: ['name', 'age', 'isMale'],
    template: require('./Greet.html') as string
})
export class Greet extends Vue {
    name: string;
    age: number;
    isMale: boolean;

    getGender() {
        return this.isMale ? 'male' : 'female';
    }
}
```

And create `Greet.html` next to it:

```html
<p>
    Hello, {{ name }}. You are {{ age }} years-old {{ getGender() }}!
</p>
```

If done correctly, the page should display: **Hello, Cynthia. You are 21 years-old female!**

- `props` string array values define the attributes to be passed into the component class as its property members. camelCase props will be converted into kebab-case HTML attribute.

- Writing template in JS file would be a chore. Therefore, we can use [CommonJS module require syntax](https://nodejs.org/docs/latest/api/modules.html) to include a template file as a string. instapack will automatically compile and minify the required HTML template files.

- Within the template, all component class members are exposed and can be accessed directly.

> Advanced topic: [props can be validated and set default value](https://vuejs.org/v2/guide/components.html#Prop-Validation).

## Reacting to Changes

Unlike AngularJS Controllers, Vue.js is unable to automatically detect property additions or deletion within the component class.

**However, this restriction is a blessing, not a curse**: it forces the developer to declare and initialize all reactive properties within the class, thus improving code readability and maintainability.

Let us create new component `Todo.ts`:

```ts
import * as Vue from 'vue';
import Component from 'vue-class-component';

@Component({
    template: require('./Todo.html') as string
})
export class Todo extends Vue {
    count: number = 0;

    increment() {
        this.count++;
    }
}
```

```html
<div>
    <p>
        <button type="button" class="btn btn-primary" v-on:click="increment()">Click me!</button>
    </p>
    <p>
        {{ count }}
    </p>
</div>
```

> Just like the `v-bind` prefix, `v-on` also has a shorthand. The `v-on:click` can be expressed as `@click`.

> Fun fact: a Vue.js component template must only have exactly one root element. Wrap everything in `<div>` when in doubt.

Do not forget to register that component in the `vue-project.ts`:

```ts
Vue.component('todo', Components.Todo);
```

Because `count` was declared and initialized in the class, its value will be watched. Whenever the button is clicked, the UI will automatically update!

If you forgot to declare and initialize `count`, it will not be watched and vue will display a convenient warning in browser console: `[Vue warn]: Property or method "count" is not defined on the instance but referenced during render. Make sure to declare reactive data properties in the data option.`

> Advanced topic: [Reactivity in Depth](https://vuejs.org/v2/guide/reactivity.html)

> Force re-render view by using `this.$forceUpdate()` from within the component class. That said, only use this as a last-resort technique!

## Implementing a To-Do List

> TODO

## Server-Side To-Do List API

> TODO

## Validating Inputs

> TODO

## Global Filters

> TODO 

## Event Handlers

> TODO 
