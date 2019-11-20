"use strict";

const Promise = require("bluebird");
const Const   = require("./Const");
const Helper  = require("./Helper");
const res     = require("./res");


const N = 9;
const M = 7;
const C = 5;
const K = 2;

const BLOCK_ACTUAL_WIDTH  = 43;
const BLOCK_ACTUAL_HEIGHT = 48;

const BLOCK_COLOR = [
    cc.color.RED,
    cc.color.GREEN,
    cc.color(0, 177, 244),  // BLUE
    cc.color.ORANGE,
    cc.color.MAGENTA
];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const HomeScene = cc.Scene.extend({

    _className      : "HomeScene",
    field           : null,
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
        const blockPlaceWidth  = this.blockPlaceWidth  = fieldPlaceWidth / N;
        const blockPlaceScale  = this.blockPlaceScale  = blockPlaceWidth / BLOCK_ACTUAL_WIDTH;
        const blockPlaceHeight = this.blockPlaceHeight = BLOCK_ACTUAL_HEIGHT * blockPlaceScale;
        const fieldHeight      = this.fieldHeight      = blockPlaceHeight * M + 15*2;
        const fieldPlaceHeight = this.fieldPlaceHeight = fieldHeight - 15*2;
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init() {

        // background
        this.addChild(Helper.createBackground(Const.SCENE_BACKGROUND_COLOR));

        /*
        // title
        const title = Helper.createLabelTTF("Blast", Helper.getFont(Const.TITLE_FONT_NAME), Const.SCENE_TITLE_FONT_SIZE);
        title.setPosition(Helper.toLeftTop(cc.visibleRect, cc.visibleRect.center.x, 30));
        this.addChild(title);
        */

        // field
        const field = this.field = new cc.Scale9Sprite(res.field);
        field.setPosition(cc.winSize.width/2, cc.winSize.height/2);
        field.width  = this.fieldWidth;
        field.height = this.fieldHeight;
        this.addChild(field);

        // fill field
        this.fillField();
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    placeBlock(block, n, m) {
        const x = this.field.x - this.fieldPlaceWidth /2 + n * this.blockPlaceWidth  + this.blockPlaceWidth /2;
        const y = this.field.y - this.fieldPlaceHeight/2 + m * this.blockPlaceHeight + this.blockPlaceHeight/2;
        block.setPosition(x, y);
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onBlockClick(touch, event) {
        const target = event.getCurrentTarget();
        const tag = target._tag;
        console.log("HomeScene.onBlockClick", target._tag);
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    fillField() {
        const blockScale = this.blockPlaceScale * 0.95;
        for (let n = 0; n < N; n++) {
            for (let m = 0; m < M; m++) {
                const block = new cc.Sprite(res.block);
                Helper.onNodeClick(block, this.onBlockClick.bind(this));
                const colorIndex = Helper.randomInteger(0, C-1);
                const color = BLOCK_COLOR[colorIndex];
                block.setColor(color);
                block.setScale(blockScale);
                block._tag = {n, m, colorIndex};
                this.placeBlock(block, n, m);
                this.addChild(block);
            }
        }
    }



});

module.exports = HomeScene;