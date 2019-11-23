"use strict";

const GameScene = require("./GameScene");
const Field               = require("./Field");
const FieldView           = require("./FieldView");
const FieldController     = require("./FieldController");
const RegularFillStrategy = require("./FillStrategy/RegularFillStrategy/RegularFillStrategy");
const Game                = require("./Game");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class GameController {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor() {

        // game
        this.game            = null;        // model
        this.gameScene       = null;        // view
        //this                              // controller

        // field
        this.field           = null;        // model
        this.fieldView       = null;        // view
        this.fieldController = null;        // controller

        // logic
        this.fillStrategy    = null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init() {

        // game
        const game = this.game = new Game();
        const gameScene = this.gameScene = new GameScene();
        gameScene.init();

        // field
        const field = this.field = new Field();

        // fieldView
        const fieldView = this.fieldView = new FieldView();
        const fieldViewNode = fieldView.createNode();
        fieldViewNode.setPosition(cc.winSize.width/2, cc.winSize.height/2);
        this.gameScene.addChild(fieldViewNode);

        // fillStrategy
        const fillStrategy = this.fillStrategy = new RegularFillStrategy(field, fieldView);

        // fieldController
        const fieldController = this.fieldController = new FieldController(field, fieldView, fillStrategy);
        this.fieldController.onAction = this.onAction.bind(this);
        fieldController.fill();

    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    startGame() {
        cc.director.runScene(this.gameScene);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onAction(result) {
        this.game.applyActionResult(result);
        this.gameScene.showScore(this.game.score);
    }
}

module.exports = GameController;