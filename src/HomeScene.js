"use strict";

const Promise = require("bluebird");
const Const   = require("./Const");
const Helper  = require("./Helper");
const res     = require("./res");
const Field   = require("./Field");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const HomeScene = cc.Scene.extend({

    _className      : "HomeScene",
    fieldView       : null,
    fieldWidth      : null,
    fieldHeight     : null,
    fieldPlaceWidth : null,
    fieldPlaceHeight: null,
    blockPlaceWidth : null,
    blockPlaceHeight: null,
    blockPlaceScale : null,

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ctor(options) {
        this.options = options = options || {};
        this._super();

        // calc
        const fieldWidth       = this.fieldWidth       = cc.winSize.width;
        const fieldPlaceWidth  = this.fieldPlaceWidth  = fieldWidth - 15*2;
        const blockPlaceWidth  = this.blockPlaceWidth  = fieldPlaceWidth / Const.N;
        const blockPlaceScale  = this.blockPlaceScale  = blockPlaceWidth / Const.BLOCK_ACTUAL_WIDTH;
        const blockPlaceHeight = this.blockPlaceHeight = Const.BLOCK_ACTUAL_HEIGHT * blockPlaceScale;
        const fieldHeight      = this.fieldHeight      = blockPlaceHeight * Const.M + 15*2;
        const fieldPlaceHeight = this.fieldPlaceHeight = fieldHeight - 15*2;
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init() {

        // background
        this.addChild(Helper.createBackground(Const.SCENE_BACKGROUND_COLOR));

        // fieldView
        const fieldView = this.fieldView = new cc.Scale9Sprite(res.field);
        fieldView.setPosition(cc.winSize.width/2, cc.winSize.height/2);
        fieldView.width  = this.fieldWidth;
        fieldView.height = this.fieldHeight;
        this.addChild(fieldView);



        const f = new Field();
        f.init();

        // fill field
        this.fillField(f.matrix);

    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    placeBlock(block, m, n) {
        if (m >= Const.M) {
            throw new Error(`m out of range: ${m} of ${Const.M}`);
        }
        if (n >= Const.N) {
            throw new Error(`n out of range: ${n} of ${Const.N}`);
        }
        const _m = Const.M - m  - 1;
        const _n =           n;
        const x = this.fieldView.x - this.fieldPlaceWidth /2 + _n * this.blockPlaceWidth  + this.blockPlaceWidth /2;
        const y = this.fieldView.y - this.fieldPlaceHeight/2 + _m * this.blockPlaceHeight + this.blockPlaceHeight/2;
        block.setPosition(x, y);
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onBlockClick(touch, event) {
        const target = event.getCurrentTarget();
        const tag = target._tag;
        console.log("HomeScene.onBlockClick", tag);
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    fillField(matrix) {
        const blockScale = this.blockPlaceScale * 0.95;

        /*
        const colorIndex = 0;
        const color = Const.BLOCK_COLOR[colorIndex];
        const m = 6;
        const n = 8;

        // block
        const block = new cc.Sprite(res.block);
        block.setColor(color);
        block.setScale(blockScale);
        block._tag = {m, n, colorIndex};
        this.placeBlock(block, m, n);
        Helper.onNodeClick(block, this.onBlockClick.bind(this));
        this.addChild(block);
        */

        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                const colorIndex = matrix[m][n];
                if (colorIndex !== null) {
                    const block = new cc.Sprite(res.block);
                    block.setColor(Const.BLOCK_COLOR[colorIndex]);
                    block.setScale(blockScale);
                    block._tag = {m, n, colorIndex};
                    this.placeBlock(block, m, n);
                    Helper.onNodeClick(block, this.onBlockClick.bind(this));
                    this.addChild(block);
                }
            }
        }
    }



});

module.exports = HomeScene;