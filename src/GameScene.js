"use strict";

const Promise             = require("bluebird");
const Const               = require("./Const");
const Helper              = require("./Helper");
const res                 = require("./res");

const SPACE = 72;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const GameScene = cc.Scene.extend({

    _className     : "GameScene",
    scoreLabels    : null,
    counterLabel   : null,
    missionLabels  : null,


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ctor(options = {}) {
        this.options = options;
        this._super();
        this.game = options.game;
        this.scoreLabels = new Array(this.game.options.C);
        this.missionLabels = new Array(Object.keys(this.game.mission).length);
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init() {

        // background
        this.addChild(Helper.createBackground(Const.SCENE_BACKGROUND_COLOR));


        // backButton
        const backButton = Helper.createBackButton();
        backButton.onClick = this.onBackPressed.bind(this);

        this.addChild(backButton);

        // score labels
        for (let c = 0; c < this.game.options.C; c++) {
            const label = this.scoreLabels[c] = Helper.createLabelTTF(`${Const.COLOR_NAME[c]}: ${0}`, Helper.getFont(Const.TITLE_FONT_NAME));
            label.setAnchorPoint(0, 0.5);
            label.setPosition(5 + SPACE*c, 20);
            this.addChild(label);
        }

        // counterLabel
        const counterLabel = this.counterLabel = Helper.createLabelTTF("counter: 0", Helper.getFont(Const.TITLE_FONT_NAME));
        counterLabel.setAnchorPoint(0, 0.5);
        counterLabel.setPosition(5, 50);
        this.addChild(counterLabel);

        //
        for (let c = 0; c < Object.keys(this.game.mission).length; c++) {

            const label = this.missionLabels[c] = Helper.createLabelTTF(`${Const.COLOR_NAME[c]}: ${this.game.mission[c]}`, Helper.getFont(Const.TITLE_FONT_NAME));
            label.setAnchorPoint(0, 0.5);
            label.setPosition(5 + SPACE*c, cc.winSize.height - 130);
            this.addChild(label);
        }

        // missionLabel
        var missionLabel = Helper.createLabelTTF('mission', Helper.getFont(Const.TITLE_FONT_NAME), Const.SCENE_TITLE_FONT_SIZE);
        missionLabel.setPosition(Helper.toLeftTop(cc.visibleRect, cc.visibleRect.center.x, 80));
        this.addChild(missionLabel);


        // missionLabel
        var scoreLabel = Helper.createLabelTTF('score', Helper.getFont(Const.TITLE_FONT_NAME), Const.SCENE_TITLE_FONT_SIZE);
        scoreLabel.setPosition(Helper.fromLeftBottom(cc.visibleRect, cc.visibleRect.center.x, 100));
        this.addChild(scoreLabel);



    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onBackPressed() {
        console.log("onBackPressed");

        const HomeController      = require("./HomeController");

        // homeController
        const homeController = new HomeController();
        homeController.init();
        homeController.run();
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
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setMission(mission) {
        for (let c in mission) {
            this.missionLabels[c].setString(`${Const.COLOR_NAME[c]}: ${mission[c]}`);
        }
    }

});

module.exports = GameScene;