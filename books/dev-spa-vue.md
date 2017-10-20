# Developing Single-Page Application using Vue.js

> Vue (pronounced /vjuː/, like view) is a progressive framework for building user interfaces. Unlike other monolithic frameworks, Vue is designed from the ground up to be incrementally adoptable. The core library is focused on the view layer only, and is easy to pick up and integrate with other libraries or existing projects. On the other hand, Vue is also perfectly capable of powering sophisticated Single-Page Applications when used in combination with modern tooling and supporting libraries. https://vuejs.org/v2/guide/

## Setup

For this tutorial, we will be using ASP.NET Core MVC 2.0 to serve as the web server of the app. Install [.NET Core SDK 2.0](https://www.microsoft.com/net/download/core) 

instapack requires [the latest Node.js version 8 LTS](https://nodejs.org/en/download) to function. Install if you have not done so; using the command line, type: `npm install -g instapack`

Verify instapack has been installed successfully by typing `ipack --version`.

You may use Visual Studio for editing the project. Install [Visual Studio 2017 Update 4 or later](https://www.visualstudio.com/downloads) with the **ASP.NET and web development** workload. Do not forget to install the latest [TypeScript SDK for Visual Studio 2017](https://www.microsoft.com/en-us/download/details.aspx?id=55258).

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

    <link rel="stylesheet" href="~/css/ipack.css" />
</head>
<body>
    <div class="container" id="app">
        @RenderBody()
    </div>

    <script src="~/js/ipack.js"></script>
</body>
</html>
```

In this arrangement, the style sheets will be loaded first, then the HTML body, to allow progressive page rendering ahead of the JS code.

If using Visual Studio, open the project (by double clicking the `.csproj` file) then launch the app with CTRL + F5 (which, by the way, also recompiles on file changes). Otherwise, use `dotnet run` command.

> Advanced topic: [`dotnet watch run` also recompiles on file changes](https://github.com/aspnet/DotNetTools/tree/dev/src/Microsoft.DotNet.Watcher.Tools)!

## Understanding Entry Points

Open `index.ts`. This is our entry point / main file to the JS app. Notice that there are module imports in this file:

```ts
import ES6Promise from 'es6-promise';
import { ValidationService } from 'aspnet-validation';
import 'bootstrap.native/dist/bootstrap-native-v4';
import './vue-project';
```

This syntax is called [ECMAScript 2015 Module](https://www.typescriptlang.org/docs/handbook/modules.html) syntax.

For now, just keep in mind that it imports `vue-project.ts` module from the same folder. Open it:

```ts
import Vue from 'vue';
import * as Components from './components';

// components must be registered BEFORE the app root declaration
Vue.component('hello', Components.Hello);

// bootstrap the Vue app from the root element <div id="app"></div>
new Vue().$mount('#app');
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

> Advanced topic: [Learn more about Vue.js instance lifecycle](https://vuejs.org/v2/guide/instance.html).

## My First Component

Component is a building block of a modern web app. Component represents reusable code that may be invoked using standard HTML tag syntax. Component allows dividing a complex app into simpler and more maintainable parts.

Create a new file `/client/js/components/Greet.ts`:

```ts
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
    template: '<p>Hello World!</p>'
})
export class Greet extends Vue {
}
```

Let us digest the above code slowly:

- `Vue` imports the `vue` module from the `node_modules` into a single variable, which is defined in the project's `package.json`.

- `Component` imports the `vue-class-component` module from the `node_modules`, which is also defined in the project's `package.json`.

- `@Component` is a [ECMAScript decorator](https://tc39.github.io/proposal-decorators/), akin to [C# class attributes](https://docs.microsoft.com/en-us/dotnet/standard/attributes/writing-custom-attributes) or [Java class annotations](https://docs.oracle.com/javase/tutorial/java/annotations/basics.html). It describes the class as a Vue Component which has a template. 

- `class Greet extends Vue` exposes the class members (properties and methods) to the template.

    - In AngularJS world, this is treated as a Controller. For now, there are nothing here; more on this later.
    
    - We also expose this class to other modules within the app by `export`-ing it.

Open `/client/js/components/index.ts`, modify the content into:

```ts
export * from './Hello';
export * from './Greet';
```

The above code re-exports the Greet module for other modules that imports the components index module, like the `Components` import in `vue-project.ts` file. Now open this file and register the newly-created Greet component:

```ts
Vue.component('greet', Components.Greet);
```

Now, add `<greet></greet>` to our `Index.cshtml`. If you refresh the page, you should see `Hello!` text.

> Advanced topic: [Components can be registered locally within another component to encapsulate / minimize visibility](https://vuejs.org/v2/guide/components.html#Local-Registration).

## My First Component, Part 2

Let us add more functionality to our new component. First, we'll pass down some values to the component using HTML attributes in the `Index.cshtml`:

```html
<greet name="Jono" v-bind:age="21" :is-male="true"></greet>
```

- `Jono` will be passed down as string parameter to the component. This is called **Literal** prop.

- `21` will be passed down as number parameter to the component. This is called **Dynamic** prop, using `v-bind` syntax.

    - Common newbie mistake is to pass down non-string value without binding, which may cause programming errors!

    - Use this feature when you need to pass down a variable from parent component to child component. Whenever the data change in the parent component, the change will also propagate down to the child component. This phenomenon is called **one-way data binding**.

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

If done correctly, the page should display: **Hello, Jono. You are 21 years-old male!**

- `props` string array values define the attributes to be passed into the component class as its property members. camelCase props will be converted into kebab-case HTML attribute.

- Writing template in JS file would be a chore. Therefore, we can use [CommonJS module require syntax](https://nodejs.org/docs/latest/api/modules.html) to include a template file as a string. instapack will automatically compile and minify the required HTML template files.

- Within the template, all component class members are exposed and can be accessed directly.

> Advanced topic: [Props can be validated and set default value](https://vuejs.org/v2/guide/components.html#Prop-Validation).

## Reacting to Changes

Unlike AngularJS Controllers, Vue.js is unable to automatically detect property additions or deletion within the component class.

**However, this restriction is a blessing, not a curse**: it forces the developer to declare and initialize all reactive properties within the class, thus improving code readability and maintainability.

Let us create a new component:

**ClickMe.ts**

```ts
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
    template: require('./ClickMe.html') as string
})
export class ClickMe extends Vue {
    count: number = 0;

    increment() {
        this.count++;
    }
}
```

**ClickMe.html**

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
Vue.component('click-me', Components.ClickMe);
```

Then try using the component in `index.cshtml`:

```html
<click-me></click-me>
```

Because `count` was declared and initialized in the class, its value will be watched. Whenever the button is clicked, the UI will automatically update!

If you forgot to declare and initialize `count`, it will not be watched and vue will display a convenient warning in browser console: `[Vue warn]: Property or method "count" is not defined on the instance but referenced during render. Make sure to declare reactive data properties in the data option.`

> Force re-render view by using `this.$forceUpdate()` from within the component class. That said, only use this as a last-resort technique!

> Advanced topic: Read [Reactivity in Depth](https://vuejs.org/v2/guide/reactivity.html).

## Developing a Simple To-Do List

By now you should be more or less familiarized with the Vue.js project. Let's take it to the next level by creating a simple but functional to-do list using an assortment of language and framework features:

**Todo.ts**

```ts
import Vue from 'vue';
import Component from 'vue-class-component';
import Noty from 'noty';

interface TodoItem {
    id: number,
    text: string
}

let newItemId: number = 0;

@Component({
    template: require('./Todo.html') as string
})
export class Todo extends Vue {
    items: TodoItem[] = [];
    newItemText: string = '';

    get hasItem(): boolean {
        return Boolean(this.items[0]);
    }

    addNew() {
        if (!this.newItemText) {
            new Noty({
                type: 'error',
                text: 'New item text input is required!',
                timeout: 5000
            }).show();

            return;
        }

        this.items.push({
            id: newItemId,
            text: this.newItemText
        });

        newItemId++;
        this.newItemText = '';
    }

    remove(id: number) {
        let item = this.items.filter(Q => Q.id == id)[0];

        if (!item) {
            return;
        }

        let index = this.items.indexOf(item);
        this.items.splice(index, 1);
    }
}
```

**Todo.html**

```html
<div>
    <form @submit.prevent="addNew()">
        <div class="form-group">
            <input v-model="newItemText" class="form-control" placeholder="Add new to-do list item" />
        </div>
        <div class="form-group">
            <button type="submit" class="btn btn-primary">Submit</button>
        </div>
    </form>
    <table class="table" v-if="hasItem">
        <thead>
            <tr>
                <th>My to-do list</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="item in items" :key="item.id">
                <td>{{ item.text }}</td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm" @click="remove(item.id)">Remove</button>
                </td>
            </tr>
        </tbody>
    </table>
    <p class="text-muted" v-else>
        Your to-do list is empty!
    </p>
</div>
```

- `interface TodoItem` is a fantastic way to declare our strongly-typed `items` array.

    - The reason that we are not using a `class` but an `interface` is because that in JS, there are no such thing as a object-oriented class model. [In JS, a class is just a syntactic sugar over the function expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).

- `let newItemId` declares an incrementing Primary Key for our to-do list items.

- `get hasItem()` is a [JS getter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get), similar to [C# getter](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/using-properties).

    - A getter is a method which can be accessed just like a class attribute.

    - In Vue.js world, this is known as a **computed property**, which value is derived from the other properties in the same class.

- `addNew()` is called when the `<form>` is submitted, but prevents the default event / page reload by using the `.prevent` suffix.

- `remove(id)` is called when the remove `<button>` in each row next to the to-do list item is clicked.

- `v-model="newItemText"` binds the text input value to a property in the component class.

    - This phenomenon is known as **two-way data binding**.

- Various tags are decorated using [Bootstrap 4](https://getbootstrap.com/docs/4.0/getting-started/introduction/) CSS classes, such as `btn btn-primary`, `form-control`, `form-group`, `table`, and `text-muted`.

- Empty input validation error is done using a superior alerting library known as [Noty](https://ned.im/noty).

- To-do list table is not displayed when empty by using `v-if` directive, but instead a empty list helper text by using `v-else`. 

- To-do list items are rendered using `v-for` directive.

    - `:key` must be used if the rendered element has a **unique superkey for improved performance**!

> Advanced topic: Read the official [List Rendering](https://vuejs.org/v2/guide/list.html) and [Conditional Rendering](https://vuejs.org/v2/guide/conditional.html) guides.

## Developing a Simple To-Do List, Part 2

Let's emulate a real-world scenario where the to-do list is being stored in the server. The client will fetch and manipulate the data using [JSON Web Service](https://en.wikipedia.org/wiki/JSON).

### Server-Side API

First, let's create a singleton service to store the persistent data:

**/Services/TodoService.cs**

```cs
public class TodoItem
{
    public int Id { set; get; }

    public string Text { set; get; }
}

public class TodoService
{
    public List<TodoItem> Items { get; private set; } = new List<TodoItem>();

    private int AutoIncrement = 0;

    public void Add(string text)
    {
        AutoIncrement++;
        Items.Add(new TodoItem
        {
            Id = AutoIncrement,
            Text = text
        });
    }

    public bool Remove(int id)
    {
        var item = Items.Where(Q => Q.Id == id).FirstOrDefault();
        if (item == null)
        {
            return false;
        }
        Items.Remove(item);
        return true;
    }
}
```

Register the service class in `ConfigureServices` method in **Startup.cs**:

```cs
services.AddSingleton<TodoService>();
```

> **CAUTION:** You should not do this in a real application; our `TodoService` is not [thread-safe](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/threading/thread-synchronization) and [ACID](https://en.wikipedia.org/wiki/ACID). Use database to persist your data and let your services be transient / stateless!

Using ASP.NET Core MVC, we can develop our [REST API](https://en.wikipedia.org/wiki/Representational_state_transfer) using various [HTTP methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods):

**/Controllers/TodoApiController.cs**

```cs
[Produces("application/json")]
[Route("api/v1/todo")]
public class TodoApiController : Controller
{
    private readonly TodoService Todo;

    public TodoApiController(TodoService todo)
    {
        this.Todo = todo;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(Todo.Items);
    }

    [HttpPost]
    public IActionResult Post([FromBody]string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return BadRequest("Todo item text must not be empty!");
        }

        Todo.Add(value);
        return Ok("OK");
    }
    
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var success = Todo.Remove(id);

        if (success == false)
        {
            return NotFound("Item ID Not Found!");
        }

        return Ok("Success!");
    }
}
```

- It is always a good idea to version your Web APIs for backward-compatibility.

- `TodoService` is being [dependency-injected](https://en.wikipedia.org/wiki/Dependency_injection) through the controller class constructor.

    - This allows separation of business logic from the actual HTTP endpoints (*Thin Controllers, Fat Services*). This way, when you need to modify the business logic, you can minimize changes to the controller classes!

    - Let controllers be responsible for parsing incoming requests, enforcing validations (and authorizations), calling service methods, and returning appropriate responses.

> Advanced topic: Read [the official ASP.NET Core Web API guide](https://docs.microsoft.com/en-us/aspnet/core/tutorials/first-web-api).

### Client-Side Component

> TODO

## Validating Inputs

> TODO

## Global Filters

> TODO 

## Event Handlers

> TODO 

## Managing States

> TODO

## Ahead-of-Time Compilation

> TODO
