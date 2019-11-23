"use strict";

const Promise             = require("bluebird");
const Const               = require("./Const");
const Helper              = require("./Helper");
const res                 = require("./res");
const Field               = require("./Field");
const FieldView           = require("./FieldView");
const FieldController     = require("./FieldController");
const RegularFillStrategy = require("./FillStrategy/RegularFillStrategy/RegularFillStrategy");
const Game                = require("./Game");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const GameScene = cc.Scene.extend({

    _className      : "GameScene",
    field           : null,
    fieldView       : null,
    fieldController : null,
    fillStrategy    : null,
    game            : null,

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ctor(options) {
        this.options = options = options || {};
        this._super();
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init() {

        // background
        this.addChild(Helper.createBackground(Const.SCENE_BACKGROUND_COLOR));

        // field
        const field = this.field = new Field();

        // fieldView
        const fieldView = this.fieldView = new FieldView();
        const fieldViewNode = fieldView.createNode();
        fieldViewNode.setPosition(cc.winSize.width/2, cc.winSize.height/2);
        this.addChild(fieldViewNode);

        // fillStrategy
        const fillStrategy = this.fillStrategy = new RegularFillStrategy(field, fieldView);

        // game
        const game = this.game = new Game();

        // fieldController
        const fieldController = this.fieldController = new FieldController(field, fieldView, fillStrategy);
        this.fieldController.onAction = this.onAction.bind(this);
        fieldController.fill();

        // title
        var title = Helper.createLabelTTF('Test', Helper.getFont(Const.TITLE_FONT_NAME), Const.SCENE_TITLE_FONT_SIZE);
        title.setPosition(Helper.toLeftTop(cc.visibleRect, cc.visibleRect.center.x, 30));
        this.addChild(title);

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    startGame() {

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onAction(result) {
        this.game.applyActionResult(result);
    }

});

module.exports = GameScene;