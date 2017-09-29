# Developing Single-Page Application with Vue.js

> Vue (pronounced /vjuː/, like view) is a progressive framework for building user interfaces. Unlike other monolithic frameworks, Vue is designed from the ground up to be incrementally adoptable. The core library is focused on the view layer only, and is easy to pick up and integrate with other libraries or existing projects. On the other hand, Vue is also perfectly capable of powering sophisticated Single-Page Applications when used in combination with modern tooling and supporting libraries. https://vuejs.org/v2/guide/

## Setup

For this tutorial, we will be using ASP.NET Core MVC 2.0 to serve as the web server of the app. Install [.NET Core SDK 2.0](https://www.microsoft.com/net/download/core) 

instapack requires [Node.js LTS or 8](https://nodejs.org/en/download) to operate. Install if you have not done so, then using the command line, type: `npm install -g instapack`

Verify instapack has been installed successfully by typing `ipack --version`.

You may use Visual Studio for editing the project. Install [Visual Studio 2017 Update 3 or later](https://www.visualstudio.com/downloads) with the **ASP.NET and web development** workload. Do not forget to install the latest [TypeScript SDK for Visual Studio 2017](https://www.microsoft.com/en-us/download/details.aspx?id=55258).

Alternatively, you may use [Visual Studio Code](https://code.visualstudio.com) with [C# extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.csharp).

## Create New Project

Create an empty folder, such as `E:\VS\MyWebApp` then run these commands inside the folder:

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

For now, just notice that it imports `vue-project.ts` module from the same folder. Open it:

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

Vue.js has been setup to bootstrap from a root element with HTML `id="app"`, which exists in our new `_Layout.cshtml` file. **So far, you do not have to do anything**; simply observe and understand the process. **This is important**. Proceed only when you have understood everything written above.

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

