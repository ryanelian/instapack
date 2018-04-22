import m, { Component } from 'mithril';

interface HelloProps {
    compiler: string;
    framework: string;
}

export class Hello implements Component<HelloProps, undefined> {
    view(vnode: m.Vnode<HelloProps, undefined>) {
        return <h1>Hello from {vnode.attrs.compiler} and {vnode.attrs.framework}!</h1>
    }
}
