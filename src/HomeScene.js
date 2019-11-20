"use strict";

var Promise = require("bluebird");
var Const   = require("./Const");
var Helper  = require("./Helper");
var res     = require("./res");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var HomeScene = cc.Scene.extend({

    _className: "HomeScene",

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ctor(options) {
        this.options = options = options || {};
        this._super();

        // background
        this.addChild(Helper.createBackground(Const.SCENE_BACKGROUND_COLOR));

        // title
        var title = Helper.createLabelTTF("Blast", Helper.getFont(Const.TITLE_FONT_NAME), Const.SCENE_TITLE_FONT_SIZE);
        title.setPosition(Helper.toLeftTop(cc.visibleRect, cc.visibleRect.center.x, 30));
        this.addChild(title);
    }

});

module.exports = HomeScene;