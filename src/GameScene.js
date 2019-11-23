"use strict";

const Promise             = require("bluebird");
const Const               = require("./Const");
const Helper              = require("./Helper");
const res                 = require("./res");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const GameScene = cc.Scene.extend({

    _className       : "GameScene",
    labels: null,


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ctor(options) {
        this.options = options = options || {};
        this._super();
        this.labels = new Array(Const.C);
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init() {

        // background
        this.addChild(Helper.createBackground(Const.SCENE_BACKGROUND_COLOR));

        // score labels
        const SPACE = 72;
        for (let c = 0; c < Const.C; c++) {
            const label = this.labels[c] = Helper.createLabelTTF(`${Const.COLOR_NAME[c]}: ${0}`, Helper.getFont(Const.TITLE_FONT_NAME));
            label.setAnchorPoint(0, 0.5);
            label.setPosition(5 + SPACE*c, 20);
            this.addChild(label);
        }

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    showScore(score) {
        for (let c in score) {
            this.labels[c].setString(`${Const.COLOR_NAME[c]}: ${score[c]}`);
        }
    }

});

module.exports = GameScene;