"use strict";

const FillStrategy = require("../FillStrategy");
const Const        = require("../../Const");
const Helper       = require("../../Helper");
const RegularTile  = require("../../Tile/RegularTile/RegularTile");
const BombTile     = require("../../Tile/BombTile/BombTile");

const MIN_BURN_TILES_TO_GET_BOMB = 4;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class RegularFillStrategy extends FillStrategy {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(field, fieldView) {
        super(field, fieldView);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    fillField() {
        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                const colorIndex = Helper.randomInteger(0, Const.C - 1);
                this.field.setTile([m, n], new RegularTile(colorIndex));
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    fillFieldView() {
        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                this._createTileView([m, n]);
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    _createTileView([m, n]) {
        const tile = this.field.getTile([m, n]);
        if (tile instanceof RegularTile) {
            this.fieldView.createTile([m, n], tile.colorIndex);
        } else if (tile instanceof BombTile) {
            this.fieldView.createBombTile([m, n]);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    refillField(mns, options = {}) {
        let bombI = -1;
        if (options.useBomb && mns.length >= MIN_BURN_TILES_TO_GET_BOMB) {
            bombI = Helper.randomInteger(0, mns.length-1);
        }
        for (let i = 0; i < mns.length; i++) {
            const [m, n] = mns[i];
            if (bombI === i) {
                this.field.setTile([m, n], new BombTile());
            } else {
                const colorIndex = Helper.randomInteger(0, Const.C - 1);
                this.field.setTile([m, n], new RegularTile(colorIndex));
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    refillFieldView(emptyMNs) {
        emptyMNs.forEach(([m, n]) => {
            this._createTileView([m, n]);
        });
    }

}

module.exports = RegularFillStrategy;