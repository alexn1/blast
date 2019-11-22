"use strict";

const FillStrategy = require("../FillStrategy");
const Const        = require("../../Const");
const Helper       = require("../../Helper");
const RegularTile  = require("../../Tile/RegularTile/RegularTile");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class RegularFillStrategy extends FillStrategy {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    fill(field) {
        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                const colorIndex = Helper.randomInteger(0, Const.C - 1);
                field.setTile([m, n], new RegularTile(colorIndex));
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    refill(field, mns) {

    }
}

module.exports = RegularFillStrategy;