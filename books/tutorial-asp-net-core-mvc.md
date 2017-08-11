# instapack + ASP.NET Core MVC

For this tutorial, we will not be using Visual Studio 2017, but use the command line tool provided by .NET Core SDK to setup, build, and run the project.

## Setup

Install .NET Core SDK: https://www.microsoft.com/net/download/core

Install Node.js (recommended using the latest version 6 LTS): https://nodejs.org/en/download/

(Optional) Install Yarn for managing Node.js packages in place of npm: https://yarnpkg.com/en/docs/install

Install instapack: `yarn global add instapack` or `npm install -g instapack`

(Optional) Install Visual Studio Code for quick and easy code editing: https://code.visualstudio.com/

## Create Project

Create an empty folder, such as `E:\VS\MyWebApp` then run these commands inside the folder:

```cmd
dotnet new mvc
ipack new aspnet
```

Your folder structure should look like this:

```
├───client
│   ├───css
│   └───js
├───Controllers
├───node_modules
├───Views
│   ├───Home
│   └───Shared
└───wwwroot
    ├───css
    ├───images
    ├───js
    └───lib
```

## Cleaning Up

Because we are using NPM for managing our packages and `instapack` for bundling and minifying our project, we can delete some files and folders to reduce noise and clutter:

- /.bowerrc
- /bower.json
- /bundleconfig.json
- /wwwroot/lib/
- /wwwroot/js/
- /wwwroot/css/

> Bower is deprecated and should not be used anymore!

Additionally, I also like to delete these files and start with something fresh later:

- /Views/Home/Index.cshtml
- /Views/Shared/_Layout.cshtml
- /Views/Shared/_ValidationScriptsPartial.cshtml

> The default instapack `aspnet` template comes with [`aspnet-validation`](https://github.com/ryanelian/aspnet-validation) and [`bootstrap.native`](https://github.com/thednp/bootstrap.native) modules which removed the need for JQuery!

## Referencing Artefacts

Try running `instapack` / `ipack` in your command line. These files will appear:

- /wwwroot/js/bundle.js
- /wwwroot/css/site.css

We need to reference those files. Our `/Views/Shared/_Layout.cshtml` should look like this:

```html
<!DOCTYPE html>

<html>
<head>
    <meta name="viewport" content="width=device-width" />
    <title>@ViewBag.Title</title>

    <link rel="stylesheet" href="~/css/site.css" />
</head>
<body>
    <div class="container">
        @RenderBody()
    </div>

    <script src="~/js/bundle.js"></script>
</body>
</html>
```

In this arrangement, the style sheets will be loaded first, then the HTML body, to allow progressive page rendering ahead of the JavaScript code.

## Hello World

Let's make a `/Views/Home/Index.cshtml` file that looks like this:

```html
@{
    ViewBag.Title = "Index";
}

<h2>Index</h2>

<p id="hello"></p>
```

Let us create a very simple greeting. In `/client/js/index.ts`, add the following code:

```ts
document.getElementById('hello').innerHTML = 'Hello World';
```

As you can see, TypeScript behaves just like a normal JavaScript. Compile and run the program by running these commands:

```cmd
ipack
dotnet restore
dotnet build
dotnet run
```

You should be able to access the page via your web browser at `http://localhost:5000/`.

If done correctly, `Hello World` text should appear under the `Index` header text.

Read more about TypeScript: https://www.typescriptlang.org/docs/home.html

> `instapack` provides rapid development mode that automatically builds on-change by using debug and watch flag: `ipack -dw`

## Imports and NPM

We can add libraries into our project from NPM gallery and consume them using `instapack`.

Try adding `comma-number` into our project via the command line: `yarn add comma-number`

Then modify our code in `index.ts` to:

```ts
import * as cn from 'comma-number';

document.getElementById('hello').innerHTML = cn(1337);
```

If done correctly, the view should display `1,337`.

> By using TypeScript `import` syntax, we can scale the JavaScript application into multiple files and let `instapack` deal with the build. [Read more](https://www.typescriptlang.org/docs/handbook/modules.html).

> `require(...)` against normal JavaScript file is also supported but not recommended due to the lack of compile-time checks!

## StyleSheets

In `/client/css/site.scss`, add the following rule:

```css
#hello {
    color: red;
}
```

If done correctly, the text should turn red.

That's it. Basically it is still the very same CSS that you learn ~~and love~~, but much more powerful and convenient!

- SASS Basics: http://sass-lang.com/guide
- Learn SASS at Codecademy: https://www.codecademy.com/learn/learn-sass
- Learn SASS at Code School: https://www.codeschool.com/courses/assembling-sass

> `instapack` also performs browser compatibility fixes for vendor prefixes (like -moz-* or -webkit-* or -ms-*), for impressive compatibility with over 90% of the browsers in use worldwide!

## Icons

If you need vector icon font assets such as Bootstrap's Glyphicon, manually copy from package (`bootstrap-sass`) folder inside `node_modules` folder into the `wwwroot` folder.

Let's do an exercise, to add Font Awesome into the project, run this command from the project folder root:

`yarn add font-awesome`

Then navigate to `/node_modules/font-awesome/` folder then copy the `fonts` folder into the `/wwwroot` folder.

Now all we need to do is to add the CSS into our project. To do this, open `/client/css/site.scss` then add the following line:

```scss
// Resolves to /node_modules/font-awesome/scss/font-awesome.scss
@import 'font-awesome/scss/font-awesome';
```

Now you should be able to use Font Awesome icons in your views. Test by adding this snippet into your `/Views/Home/Index.cshtml`:

```html
<i class="fa fa-thumbs-up" aria-hidden="true"></i>
```

If done correctly, a thumbs-up icon should appear.

> Yes that's right, `instapack` automatically resolves `@import` from `node_modules` for your convenience!
