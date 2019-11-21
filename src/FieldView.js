"use strict";

const Const   = require("./Const");
const res     = require("./res");
const Helper  = require("./Helper");
const Bag     = require("./Bag");

const MARGIN = 15;
const FADE_OUT_TIME = 0.3;
const FLASH_TIME = 0.2;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class FieldView {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor() {
        this.node   = null;
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

        this.lastLocalZOrder = 0;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    createNode() {
        const node = this.node = new cc.Scale9Sprite(res.field);
        node.width  = this.fieldWidth;
        node.height = this.fieldHeight;
        return node;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    createTile(m, n, color) {
        const tile = new cc.Sprite(res.tile);
        tile.setColor(color);
        tile.setScale(this.tileScale);
        tile._tag = {m, n};
        this.placeTile(tile, m, n);
        this.node.addChild(this.matrix[m][n] = tile);
        return tile;
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
    fadeOutTiles(bag) {
        bag.iterate((mn) => {
            this.fadeOutTile(mn);
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    flashTile([m, n]) {
        const tile = this.matrix[m][n];
        this.bringToFront(tile);
        return Helper.runActions(tile, [
            cc.scaleTo(FLASH_TIME/2, this.tileScale + 0.15),
            cc.scaleTo(FLASH_TIME/2, this.tileScale)
        ]);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    fadeOutTile([m,n]) {
        const tile = this.matrix[m][n];

        Helper.runActions(tile, [
            cc.scaleTo(FADE_OUT_TIME, 0.5).easing(cc.easeCubicActionOut())
        ]);

        return Helper.runActions(tile, [
            cc.fadeOut(FADE_OUT_TIME).easing(cc.easeCubicActionOut())
        ]).then(function () {
            this.removeChild(tile);
            this.matrix[m][n] = null;
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    bringToFront(tile) {
        this.lastLocalZOrder++;
        tile.setLocalZOrder(this.lastLocalZOrder);
    }

}

module.exports = FieldView;