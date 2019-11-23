"use strict";

const Promise  = require("bluebird");
const Const    = require("./Const");
const Helper   = require("./Helper");
const res      = require("./res");

const SPACE = 72;

var GAME_OVER_MESSAGE_COLOR_WIN  = cc.color("#4dc144");
var GAME_OVER_MESSAGE_COLOR_DRAW = cc.color("#1658db");
var GAME_OVER_MESSAGE_COLOR_LOSE = cc.color("#e82d2d");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const GameScene = cc.Scene.extend({

    _className     : "GameScene",
    scoreLabels    : null,
    counterLabel   : null,
    missionLabels  : null,
    movesLabel     : null,

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

        // missionLabels
        for (let c = 0; c < Object.keys(this.game.mission).length; c++) {

            const label = this.missionLabels[c] = Helper.createLabelTTF(`${Const.COLOR_NAME[c]}: ${this.game.mission[c]}`, Helper.getFont(Const.TITLE_FONT_NAME));
            label.setAnchorPoint(0, 0.5);
            label.setPosition(5 + SPACE*c, cc.winSize.height - 130);
            this.addChild(label);
        }

        // counterLabel
        const movesLabel = this.movesLabel = Helper.createLabelTTF(`moves: ${this.game.moves}`, Helper.getFont(Const.TITLE_FONT_NAME));
        movesLabel.setAnchorPoint(0, 0.5);
        movesLabel.setPosition(5, cc.winSize.height - 100);
        this.addChild(movesLabel);


        /*
        setTimeout(() => {
            this.setGameOverMessage("GAME OVER", "draw");
        }, 500);
        */

        // missionLabel
        var missionLabel = Helper.createLabelTTF('mission', Helper.getFont(Const.TITLE_FONT_NAME), Const.SCENE_TITLE_FONT_SIZE);
        missionLabel.setPosition(Helper.toLeftTop(cc.visibleRect, cc.visibleRect.center.x, 80));
        this.addChild(missionLabel);


        // scoreLabel
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
    setMoves(moves) {
        this.movesLabel.setString(`moves: ${moves}`);
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setMission(mission) {
        for (let c in mission) {
            this.missionLabels[c].setString(`${Const.COLOR_NAME[c]}: ${mission[c]}`);
        }
    },


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setGameOverMessage(message, result) {
        console.log("GameScene.setGameOverMessage", message);
        var gameOverLabel = Helper.createLabelTTF(message.toUpperCase(), Helper.getFont(Const.TITLE_FONT_NAME), 50);
        gameOverLabel.setPosition(cc.winSize.width/2, cc.winSize.height/2);
        gameOverLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
        var box = gameOverLabel.getBoundingBox();

        // color
        var color = GAME_OVER_MESSAGE_COLOR_DRAW;
        if (result === "win") {
            color = GAME_OVER_MESSAGE_COLOR_WIN;
        } else if (result === "lose") {
            color = GAME_OVER_MESSAGE_COLOR_LOSE;
        }
        var gameOverMessageLayer = new cc.LayerColor(color, box.width + 10, box.height + 10);
        gameOverMessageLayer.setPosition(cc.winSize.width/2 - gameOverMessageLayer.width/2, cc.winSize.height/2 - gameOverMessageLayer.height/2);
        this.addChild(gameOverMessageLayer);
        this.addChild(gameOverLabel);
    }

});

module.exports = GameScene;