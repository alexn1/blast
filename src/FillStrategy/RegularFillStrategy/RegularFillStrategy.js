"use strict";

const FillStrategy = require("../FillStrategy");
const Const        = require("../../Const");
const Helper       = require("../../Helper");
const RegularTile  = require("../../Tile/RegularTile/RegularTile");

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
                if (tile && tile instanceof RegularTile) {
                    fieldView.createTile([m, n], tile.colorIndex);
                }
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    refillField(field, mns) {
        mns.forEach(([m, n]) => {
            const colorIndex = Helper.randomInteger(0, Const.C - 1);
            field.setTile([m, n], new RegularTile(colorIndex));
        });
    }

}

module.exports = RegularFillStrategy;