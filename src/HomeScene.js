"use strict";

const Promise             = require("bluebird");
const Const               = require("./Const");
const Helper              = require("./Helper");
const res                 = require("./res");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const HomeScene = cc.Scene.extend({

    _className     : "HomeScene",
    onStartLevel   : null,

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ctor(options = {}) {
        this.options = options;
        this._super();
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init() {

        // background
        this.addChild(Helper.createBackground(Const.SCENE_BACKGROUND_COLOR));


        // title
        var title = Helper.createLabelTTF('blast', Helper.getFont(Const.TITLE_FONT_NAME), Const.SCENE_TITLE_FONT_SIZE);
        title.setPosition(Helper.toLeftTop(cc.visibleRect, cc.visibleRect.center.x, 30));
        this.addChild(title);

        // button1
        const button1 = new Helper.createButton({title: 'level 1'});
        button1.setPosition(cc.winSize.width/2, cc.winSize.height/2 + 100);
        button1.onClick = () => {
            if (this.onStartLevel) {
                this.onStartLevel(1);
            }
        };
        this.addChild(button1);

        // button2
        const button2 = new Helper.createButton({title: 'level 2'});
        button2.setPosition(cc.winSize.width/2, cc.winSize.height/2);
        button2.onClick = () => {
            if (this.onStartLevel) {
                this.onStartLevel(2);
            }
        };
        this.addChild(button2);

        // button3
        const button3 = new Helper.createButton({title: 'level 3'});
        button3.setPosition(cc.winSize.width/2, cc.winSize.height/2 - 100);
        button3.onClick = () => {
            if (this.onStartLevel) {
                this.onStartLevel(3);
            }
        };
        this.addChild(button3);




    },



});

module.exports = HomeScene;