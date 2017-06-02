"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plumber = require("gulp-plumber");
const gutil = require("gulp-util");
const prettyJSON = require("prettyjson");
function ErrorHandler() {
    return plumber({
        errorHandler: function (error) {
            try {
                console.log(prettyJSON.render(error));
            }
            catch (ex) {
                gutil.log(error);
            }
            this.emit('end');
        }
    });
}
exports.ErrorHandler = ErrorHandler;
;
