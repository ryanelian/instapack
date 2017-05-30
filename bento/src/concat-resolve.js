'use strict';

let resolve = require('resolve');

module.exports = function (concatList, projectFolder) {
    let resolver = [];
    let resolverLength = 0;
    let resolveOption = { basedir: projectFolder };

    for (let concatResult in concatList) {
        let resolverItems = [];

        let concatItems = concatList[concatResult];
        for (let i in concatItems) {
            let concatModule = concatItems[i];
            let concatModulePath = resolve.sync(concatModule, resolveOption);
            resolverItems.push(concatModulePath);
        }

        resolverLength++;
        resolver[concatResult + '.js'] = resolverItems;
    }
    return resolver;
};
