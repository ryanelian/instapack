"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prettyJSON = require("prettyjson");
const gutil = require("gulp-util");
exports.PipeErrorHandler = function (error) {
    try {
        console.log(prettyJSON.render(error, {
            keysColor: 'red',
            dashColor: 'red',
        }));
    }
    catch (ex) {
        gutil.log(error);
    }
    this.emit('end');
};
