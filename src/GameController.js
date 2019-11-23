"use strict";

const Game                = require("./Game");
const GameScene           = require("./GameScene");
const Field               = require("./Field");
const FieldView           = require("./FieldView");
const FieldController     = require("./FieldController");
const RegularFillStrategy = require("./FillStrategy/RegularFillStrategy/RegularFillStrategy");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class GameController {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(gameOptions) {

        this.gameOptions = gameOptions;

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
        const game = this.game = new Game(this.gameOptions);
        const gameScene = this.gameScene = new GameScene({game});
        gameScene.init();

        // field
        const field = this.field = new Field(game);

        // fieldView
        const fieldView = this.fieldView = new FieldView(field);
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
    run() {
        cc.director.runScene(this.gameScene);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onAction(result) {
        const isGameOver = this.game.applyActionResult(result);
        this.gameScene.setScore(this.game.score);
        this.gameScene.setCounter(this.game.counter);
        this.gameScene.setMission(this.game.mission);

        if (isGameOver) {
            console.warn("GAME OVER!");
        }

    }
}

module.exports = GameController;