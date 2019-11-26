"use strict";

const Tile                  = require("../Tile");
const Const                 = require("../../Const");
const RegularActionStrategy = require("../../ActionStrategy/RegularActionStrategy/RegularActionStrategy");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class RegularTile extends Tile {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(colorIndex) {
        super();
        this.colorIndex = colorIndex;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    createActionStrategy(field, fieldView) {
        //console.log("RegularTile.createActionStrategy");
        return new RegularActionStrategy(field, fieldView);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    findBurnTiles(field, mn, bag) {
        for (let _mn of [
            field.calcTop(mn),
            field.calcRight(mn),
            field.calcBottom(mn),
            field.calcLeft(mn)
        ]) {
            if (_mn === null) continue;
            const _tile = field.getTile(_mn);
            if (_tile.constructor.name === "RegularTile" && _tile.colorIndex === this.colorIndex && !bag.contains(_mn)) {
                bag.put(_mn);
                this.findBurnTiles(field, _mn, bag);
            }
        }
    }

}

module.exports = RegularTile;