"use strict";

const Const   = require("./Const");
const res     = require("./res");
const Helper  = require("./Helper");
const Bag     = require("./Bag");

const MARGIN = 15;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class FieldView {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor() {
        this.node   = null;
        this.field  = null;
        this.matrix = Helper.createMatrix(Const.M, Const.N);

        // calc
        const fieldWidth       = this.fieldWidth       = cc.winSize.width;
        const fieldPlaceWidth  = this.fieldPlaceWidth  = fieldWidth - MARGIN*2;
        const tilePlaceWidth   = this.tilePlaceWidth   = fieldPlaceWidth / Const.N;
        const tilePlaceScale   = this.tilePlaceScale   = tilePlaceWidth / Const.TILE_ACTUAL_WIDTH;
        const tilePlaceHeight  = this.tilePlaceHeight  = Const.TILE_ACTUAL_HEIGHT * tilePlaceScale;
        const fieldHeight      = this.fieldHeight      = tilePlaceHeight * Const.M + MARGIN*2;
        const fieldPlaceHeight = this.fieldPlaceHeight = fieldHeight - MARGIN*2;
        const tileScale        = this.tileScale        = tilePlaceScale * 0.95;
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
         const color = Const.TILE_COLOR[colorIndex];
         const m = 0;
         const n = 0;

         // tile
         const block = new cc.Sprite(res.block);
         block.setColor(color);
         block.setScale(this.tileScale);
         block._tag = {m, n, colorIndex};
         this.placeTile(block, m, n);
         Helper.onNodeClick(block, this.onTileClick.bind(this));
         this.fieldView.addChild(block);
         */

        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                const colorIndex = field.matrix[m][n];
                if (colorIndex !== null) {
                    this.createTile(m, n, Const.TILE_COLOR[colorIndex]);
                }
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    createTile(m, n, color) {
        const tile = new cc.Sprite(res.tile);
        tile.setColor(color);
        tile.setScale(this.tileScale);
        tile._tag = {m, n};
        this.placeTile(tile, m, n);
        Helper.onNodeClick(tile, this.onTileClick.bind(this));
        this.node.addChild(this.matrix[m][n] = tile);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    placeTile(tile, m, n) {
        if (m >= Const.M) {
            throw new Error(`m out of range: ${m} of ${Const.M}`);
        }
        if (n >= Const.N) {
            throw new Error(`n out of range: ${n} of ${Const.N}`);
        }
        const _m = Const.M - m  - 1;
        const _n =           n;
        const x = _n * this.tilePlaceWidth  + this.tilePlaceWidth /2 + MARGIN;
        const y = _m * this.tilePlaceHeight + this.tilePlaceHeight/2 + MARGIN;
        tile.setPosition(x, y);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onTileClick(touch, event) {
        //console.log("FieldView.onTileClick", event.getCurrentTarget());
        const target = event.getCurrentTarget();
        const tag = target._tag;
        const bag = this.field.findColorArea([tag.m, tag.n]);
        const len = bag.getLength();
        console.log("bag:", len, bag);
        if (len >= Const.K) {
            bag.iterate(([m, n]) => {
                const tile = this.matrix[m][n];
                tile.setOpacity(100);
            });
        }
    }




}

module.exports = FieldView;