"use strict";

const Bag = require("../Bag");

class ActionStrategy {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(field, fieldView) {
        this.field     = field;
        this.fieldView = fieldView;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    findTiles(mn) {
        //console.log("RegularActionStrategy._findTiles", mn);
        const bag = new Bag();
        bag.put(mn);
        const tile = this.field.getTile(mn);
        tile.findBurnTiles(this.field, mn, bag);
        return bag;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    calcResult(bag) {
        const result = {};
        bag.iterate(mn => {
            const tile = this.field.getTile(mn);
            if (tile.constructor.name === "RegularTile") {
                if (result[tile.colorIndex] === undefined) {
                    result[tile.colorIndex] = 0;
                }
                result[tile.colorIndex]++;
            }
        });
        return result;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    action(fillStrategy, mn) {

    }
}

module.exports = ActionStrategy;