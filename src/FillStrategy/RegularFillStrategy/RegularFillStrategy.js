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
    fillField(field) {
        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                const colorIndex = Helper.randomInteger(0, Const.C - 1);
                field.setTile([m, n], new RegularTile(colorIndex));
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    fillFieldView(field, fieldView) {
        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                const tile = field.getTile([m, n]);
                if (tile instanceof RegularTile) {
                    fieldView.createTile([m, n], tile.colorIndex);
                } else if (tile instanceof BombTile) {
                    fieldView.createBombTile([m, n]);
                }
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    refillField(field, mns, options = {}) {
        let bombI = -1;
        if (options.useBomb && mns.length >= MIN_BURN_TILES_TO_GET_BOMB) {
            bombI = Helper.randomInteger(0, mns.length-1);
        }
        for (let i = 0; i < mns.length; i++) {
            const [m, n] = mns[i];
            if (bombI === i) {
                field.setTile([m, n], new BombTile());
            } else {
                const colorIndex = Helper.randomInteger(0, Const.C - 1);
                field.setTile([m, n], new RegularTile(colorIndex));
            }
        }

    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    refillFieldView(field, fieldView, emptyMNs) {
        emptyMNs.forEach(([m, n]) => {
            const tile = field.getTile([m, n]);
            if (tile instanceof RegularTile) {
                fieldView.createTile([m,n], tile.colorIndex, 0);
            } else if (tile instanceof BombTile) {
                fieldView.createBombTile([m, n]);
            }
        });
    }

}

module.exports = RegularFillStrategy;