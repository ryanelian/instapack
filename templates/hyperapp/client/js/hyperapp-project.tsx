import { h, app } from 'hyperapp';
import { Hello } from './components/Hello';

interface IState {
    compiler: string;
    framework: string;
}

const state: IState = {
    compiler: 'instapack',
    framework: 'hyperapp'
};

const actions = {};

const view = (state: IState, actions) => (
    <Hello compiler={state.compiler} framework={state.framework} />
)

app(
    state,
    actions,
    view,
    document.getElementById('app')
);
