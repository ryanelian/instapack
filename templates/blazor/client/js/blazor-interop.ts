import swal from 'sweetalert';

export async function hello(): Promise<void> {
    await swal({
        title: 'Hello World!',
        text: 'This message is brought to you by instapack + Blazor',
        icon: "success",
    });
}
