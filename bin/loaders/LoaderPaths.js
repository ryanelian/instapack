"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoaderPaths = {
    typescript: require.resolve('./CoreTypeScriptLoader'),
    template: require.resolve('./TemplateLoader'),
    babel: require.resolve('babel-loader'),
    vue: require.resolve('vue-loader'),
    vueStyle: require.resolve('vue-style-loader'),
    css: require.resolve('css-loader'),
    libGuard: require.resolve('./LibGuardLoader')
};
