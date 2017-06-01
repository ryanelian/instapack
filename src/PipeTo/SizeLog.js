"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gsize = require("gulp-size");
let SizeLog = () => {
    return gsize({
        showFiles: true,
        showTotal: false
    });
};
exports.SizeLog = SizeLog;
