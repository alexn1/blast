"use strict";

const Const       = require("./Const");
const Helper      = require("./Helper");
const Bag         = require("./Bag");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Field {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor() {
        this.matrix = Helper.createMatrix(Const.M, Const.N);
        //console.log("matrix:", this.matrix);
    }

    /*
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    fill() {
        console.log("this.matrix:", this.matrix);
        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                const colorIndex = Helper.randomInteger(0, Const.C - 1);
                this.setTile([m, n], this.createTile(colorIndex));
            }
        }
    }
    */

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setTile([m, n], tile) {
        if (this.isTileExists([m, n])) {
            throw new Error("setTile: tile place not empty");
        }
        this.matrix[m][n] = tile;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getTile([m, n]) {
        return this.matrix[m][n];
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    burnTiles(bag) {
        //console.log("burnTiles:", bag);
        bag.iterate(([m, n]) => this.matrix[m][n] = null);
        //console.log("matrix:", this.matrix);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static calcTop([m, n]) {
        console.log("Field.calcTop");
        const _m = m - 1;
        return _m >= 0 ? [_m, n] : null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static calcRight([m, n]) {
        const _n = n + 1;
        return _n < Const.N ? [m, _n] : null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static calcBottom([m, n]) {
        const _m = m + 1;
        return _m < Const.M ? [_m, n] : null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static calcLeft([m, n]) {
        const _n = n - 1;
        return _n >= 0 ? [m, _n] : null;
    }

    /*
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    createTile(colorIndex) {
        return new RegularTile(colorIndex);
    }
    */

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getColorIndex(mn) {
        //console.log("getColorIndex:", mn);
        if (mn === null) {
            throw new Error("getColorIndex: need nm but got null");
        }
        const [m, n] = mn;
        return this.matrix[m][n].colorIndex;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    isTileExists([m, n]) {
        return this.matrix[m][n] != null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    applyMoves(moves) {
        console.log("Field.applyMoves", moves);
        moves.forEach(({from: [m, n], to: [_m, _n]}) => {
            this.matrix[_m][_n] = this.matrix[m][n];
            this.matrix[m][n] = null;
        });
        console.log("matrix", this.matrix);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getEmptyTilesMNs() {
        const mns = [];
        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                if (!this.isTileExists([m,n])) {
                    /*
                    const colorIndex = Helper.randomInteger(0, Const.C - 1);
                    this.setTile([m, n], this.createTile(colorIndex));
                    */
                    mns.push([m,n]);
                }
            }
        }
        return mns;
    }

}

module.exports = Field;
