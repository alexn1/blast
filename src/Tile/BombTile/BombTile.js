"use strict";

const Tile               = require("../Tile");
const Const              = require("../../Const");
const BombActionStrategy = require("../../ActionStrategy/BombActionStrategy/BombActionStrategy");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class BombTile extends Tile {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    createActionStrategy(field, fieldView) {
        //console.log("BombTile.createActionStrategy");
        return new BombActionStrategy(field, fieldView);
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
            if (_tile.constructor.name === "BombTile") {
                if (!bag.contains(_mn)) {
                    bag.put(_mn);
                    _tile.findBurnTiles(field, _mn, bag);
                }
            } else {
                bag.put(_mn);
            }
        }
    }

}

module.exports = BombTile;