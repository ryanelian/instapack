// this function can be invoked in Blazor using IJSRuntime:
// await JsRuntime.InvokeVoidAsync("instapack.hello", "Accelist");
// https://docs.microsoft.com/en-us/aspnet/core/blazor/javascript-interop?view=aspnetcore-3.1
export async function hello(name: string): Promise<void> {
    console.log(`Hello, ${name}!`);
}
