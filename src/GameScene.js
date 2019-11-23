"use strict";

const Promise             = require("bluebird");
const Const               = require("./Const");
const Helper              = require("./Helper");
const res                 = require("./res");

const SPACE = 72;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const GameScene = cc.Scene.extend({

    _className: "GameScene",
    scoreLabels    : null,
    counterLabel   : null,


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ctor(options) {
        this.options = options = options || {};
        this._super();
        this.scoreLabels = new Array(Const.C);
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init() {

        // background
        this.addChild(Helper.createBackground(Const.SCENE_BACKGROUND_COLOR));

        // score labels
        for (let c = 0; c < Const.C; c++) {
            const label = this.scoreLabels[c] = Helper.createLabelTTF(`${Const.COLOR_NAME[c]}: ${0}`, Helper.getFont(Const.TITLE_FONT_NAME));
            label.setAnchorPoint(0, 0.5);
            label.setPosition(5 + SPACE*c, 20);
            this.addChild(label);
        }

        counterLabel
        const counterLabel = this.counterLabel = Helper.createLabelTTF("counter: 0", Helper.getFont(Const.TITLE_FONT_NAME));
        counterLabel.setAnchorPoint(0, 0.5);
        counterLabel.setPosition(5, 50);
        this.addChild(counterLabel);


    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setScore(score) {
        for (let c in score) {
            this.scoreLabels[c].setString(`${Const.COLOR_NAME[c]}: ${score[c]}`);
        }
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setCounter(counter) {
        this.counterLabel.setString(`counter: ${counter}`);
    }

});

module.exports = GameScene;