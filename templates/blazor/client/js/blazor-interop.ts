import swal from 'sweetalert';

// this function can be invoked in Blazor using IJSRuntime:
// await JsRuntime.InvokeVoidAsync("instapack.hello");
// https://docs.microsoft.com/en-us/aspnet/core/blazor/javascript-interop?view=aspnetcore-3.1
export async function hello(): Promise<void> {
    await swal({
        title: 'Hello World!',
        text: 'This message is brought to you by instapack + Blazor',
        icon: "success",
    });
}
