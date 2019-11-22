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
    createActionStrategy() {
        //console.log("RegularTile.createActionStrategy");
        return new RegularActionStrategy();
    }

}

module.exports = RegularTile;