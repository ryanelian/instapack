'use strict';

let size = require('gulp-size');

let sizeOptions = {
    showFiles: true,
    showTotal: false
};

module.exports = function () {
    return size(sizeOptions);
};
