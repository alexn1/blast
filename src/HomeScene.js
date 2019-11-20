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


        // field
        const field = new cc.Scale9Sprite(res.field);
        field.setPosition(cc.winSize.width/2, cc.winSize.height/2);
        field.width = 200;
        field.height = 300;
        this.addChild(field);


        // block
        const block = new cc.Sprite(res.block);
        block.setPosition(cc.winSize.width/2, cc.winSize.height/2 - 100);
        block.setColor(cc.color.RED);
        this.addChild(block);

        // block
        const block2 = new cc.Sprite(res.block);
        block2.setPosition(cc.winSize.width/2, cc.winSize.height/2);
        block2.setColor(cc.color.BLUE);
        this.addChild(block2);

        // block
        const block3 = new cc.Sprite(res.block);
        block3.setPosition(cc.winSize.width/2, cc.winSize.height/2 + 100);
        block3.setColor(cc.color.GREEN);
        this.addChild(block3);
    }

});

module.exports = HomeScene;