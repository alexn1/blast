"use strict";

const Const = require("./Const");
const res     = require("./res");
const Helper  = require("./Helper");

const MARGIN = 15;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class FieldView {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor() {
        this.node  = null;
        this.field = null;

        // calc
        const fieldWidth       = this.fieldWidth       = cc.winSize.width;
        const fieldPlaceWidth  = this.fieldPlaceWidth  = fieldWidth - MARGIN*2;
        const blockPlaceWidth  = this.blockPlaceWidth  = fieldPlaceWidth / Const.N;
        const blockPlaceScale  = this.blockPlaceScale  = blockPlaceWidth / Const.BLOCK_ACTUAL_WIDTH;
        const blockPlaceHeight = this.blockPlaceHeight = Const.BLOCK_ACTUAL_HEIGHT * blockPlaceScale;
        const fieldHeight      = this.fieldHeight      = blockPlaceHeight * Const.M + MARGIN*2;
        const fieldPlaceHeight = this.fieldPlaceHeight = fieldHeight - MARGIN*2;
        const blockScale       = this.blockScale       = blockPlaceScale * 0.95;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    createNode() {
        const node = this.node = new cc.Scale9Sprite(res.field);
        node.width  = this.fieldWidth;
        node.height = this.fieldHeight;
        return node;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setField(field) {
        this.field = field;

        /*
         const colorIndex = 0;
         const color = Const.BLOCK_COLOR[colorIndex];
         const m = 0;
         const n = 0;

         // block
         const block = new cc.Sprite(res.block);
         block.setColor(color);
         block.setScale(blockScale);
         block._tag = {m, n, colorIndex};
         this.placeBlock(block, m, n);
         Helper.onNodeClick(block, this.onBlockClick.bind(this));
         this.fieldView.addChild(block);
         */

        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                const colorIndex = field.matrix[m][n];
                if (colorIndex !== null) {
                    this.createBlock(m, n, Const.BLOCK_COLOR[colorIndex]);
                }
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    createBlock(m, n, color) {
        const block = new cc.Sprite(res.block);
        block.setColor(color);
        block.setScale(this.blockScale);
        block._tag = {m, n};
        this.placeBlock(block, m, n);
        Helper.onNodeClick(block, this.onBlockClick.bind(this));
        this.node.addChild(block);
    }


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
        const x = _n * this.blockPlaceWidth  + this.blockPlaceWidth /2 + MARGIN;
        const y = _m * this.blockPlaceHeight + this.blockPlaceHeight/2 + MARGIN;
        block.setPosition(x, y);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onBlockClick(touch, event) {
        //console.log("FieldView.onBlockClick", event.getCurrentTarget());
        const target = event.getCurrentTarget();
        const tag = target._tag;
        this.field.findColorArea([tag.m, tag.n]);
    }




}

module.exports = FieldView;