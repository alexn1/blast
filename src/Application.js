"use strict";

const Promise   = require("bluebird");
const Const     = require("./Const");
const Helper    = require("./Helper");
const res       = require("./res");
const HomeScene = require("./HomeScene");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Application {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor() {
        cc.app = this;
        cc.res = res;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init() {
        //console.log("Application.init");
        console.log("cc.view.getCanvasSize(): "             + JSON.stringify(cc.view.getCanvasSize()));
        console.log("cc.view.getFrameSize(): "              + JSON.stringify(cc.view.getFrameSize()));
        console.log("cc.director.getWinSize(): "            + JSON.stringify(cc.director.getWinSize()));
        console.log("cc.director.getWinSizeInPixels(): "    + JSON.stringify(cc.director.getWinSizeInPixels()));
        console.log("cc.director.getContentScaleFactor(): " + cc.director.getContentScaleFactor());


        // If referenced loading.js, please remove it
        if (!cc.sys.isNative && document.getElementById("cocosLoading")) {
            document.body.removeChild(document.getElementById("cocosLoading"));
        }

        // Pass true to enable retina display, on Android disabled by default to improve performance
        cc.view.enableRetina(cc.sys.os === cc.sys.OS_IOS ? true : false);

        // Adjust viewport meta
        cc.view.adjustViewPort(true);

        // Uncomment the following line to set a fixed orientation for your game
        // cc.view.setOrientation(cc.ORIENTATION_PORTRAIT);

        // Setup the resolution policy and design resolution size
        this.setupResolutionPolicy();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    load() {
        console.log("Application.load");
        return new Promise(resolve => {
            cc.LoaderScene.preload(Helper.resToArray(res), resolve);      // //load resources
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    run() {
        //console.log("Application.run");
        console.log("cc.winSize: " + JSON.stringify(cc.winSize));
        //console.log("window.location:", window.location);
        //console.log("cc.sys:", cc.sys);
        var homeScene = new HomeScene();
        homeScene.init();
        cc.director.runScene(homeScene);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setupResolutionPolicy() {
        var width;
        var height;
        //if (cc.sys.isNative) {
        //    width  = Const.NATIVE_WIDTH;
        //    height = Const.NATIVE_HEIGHT;
        //} else {
            var gameCanvas = document.getElementById("gameCanvas");
            width  = gameCanvas.width  / gameCanvas.WEB_SCALE;
            height = gameCanvas.height / gameCanvas.WEB_SCALE;
            // The game will be resized when browser size change
            //cc.view.resizeWithBrowserSize(true);
        //}
        console.log("cc.winSize before:", JSON.stringify(cc.winSize));
        cc.view.setDesignResolutionSize(width, height, cc.sys.isNative ? cc.ResolutionPolicy.FIXED_WIDTH : cc.ResolutionPolicy.SHOW_ALL);
        //cc.view.setDesignResolutionSize(width, height, cc.sys.isNative ? cc.ResolutionPolicy.EXACT_FIT : cc.ResolutionPolicy.SHOW_ALL);
        cc.director.setContentScaleFactor(Const.SCALE_FACTOR);
        console.log("cc.winSize after:", JSON.stringify(cc.winSize));
    }

}

module.exports = Application;