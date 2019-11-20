"use strict";

const Promise     = require("bluebird");
const browserify  = require("browserify");
const args        = require("yargs").argv;
const gulp        = require("gulp");
const source      = require("vinyl-source-stream");
const collapse    = require("bundle-collapser/plugin");
const fs          = require("fs-extra");
const copy        = Promise.promisify(fs.copy);

const babelConfig = require("./babelConfig");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function build() {
    return Promise.try(function () {
        return browserify({
            entries: [
                "src/app.js"
            ],
            debug: !args.release
        }).plugin(collapse).transform("babelify", babelConfig).bundle()
            .pipe(source("main.js"))
            .pipe(gulp.dest("./public"));
    }).then(function () { 
        return copy("src/res", "public/res");
    });
}

module.exports = build;