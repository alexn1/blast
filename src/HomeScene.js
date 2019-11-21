"use strict";

const Promise = require("bluebird");
const Const   = require("./Const");
const Helper  = require("./Helper");
const res     = require("./res");
const Field   = require("./Field");
const FieldView = require("./FieldView");



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const HomeScene = cc.Scene.extend({

    _className      : "HomeScene",
    fieldView       : null,

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ctor(options) {
        this.options = options = options || {};
        this._super();
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init() {

        // background
        this.addChild(Helper.createBackground(Const.SCENE_BACKGROUND_COLOR));

        // fieldView
        const fieldView = this.fieldView = new FieldView();
        const fieldViewNode = fieldView.createNode();
        fieldViewNode.setPosition(cc.winSize.width/2, cc.winSize.height/2);
        this.addChild(fieldViewNode);

        // field
        const f = new Field();
        f.init();

        // fill field
        fieldView.fillField(f.matrix);
    }

});

module.exports = HomeScene;