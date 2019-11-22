"use strict";

const Promise             = require("bluebird");
const Const               = require("./Const");
const Helper              = require("./Helper");
const res                 = require("./res");
const Field               = require("./Field");
const FieldView           = require("./FieldView");
const FieldController     = require("./FieldController");
const RegularFillStrategy = require("./FillStrategy/RegularFillStrategy/RegularFillStrategy");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const HomeScene = cc.Scene.extend({

    _className      : "HomeScene",
    field           : null,
    fieldView       : null,
    fieldController : null,

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

        // fieldController
        const fieldController = this.fieldController = new FieldController(field, fieldView, new RegularFillStrategy(field, fieldView));
        fieldController.startGame();
    }

});

module.exports = HomeScene;