"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plumber = require("gulp-plumber");
const gutil = require("gulp-util");
let ErrorHandler = () => {
    return plumber({
        errorHandler: function (error) {
            gutil.log(error);
            this.emit('end');
        }
    });
};
exports.ErrorHandler = ErrorHandler;
