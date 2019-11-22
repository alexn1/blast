"use strict";

const Const  = require("./Const");
const Helper = require("./Helper");
const Bag    = require("./Bag");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Field {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor() {
        this.matrix = Helper.createMatrix(Const.M, Const.N);
        //console.log("matrix:", this.matrix);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init() {
        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                const colorIndex = Helper.randomInteger(0, Const.C - 1);
                this.matrix[m][n] = this.createTile(colorIndex);
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    createTile(colorIndex) {
        return colorIndex;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    findColorArea(mn) {
        //console.log("Field.findColorArea", mn, this.getColorIndex(mn));
        const bag = new Bag();
        bag.put(mn);
        this.checkNearby(mn, bag);
        return bag;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    burnTiles(bag) {
        //console.log("burnTiles:", bag);
        bag.iterate(([m, n]) => this.matrix[m][n] = null);
        //console.log("matrix:", this.matrix);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    checkNearby(mn, bag) {
        //console.log("Field.checkNearby", mn, JSON.stringify(bag));
        const myColorIndex = this.getColorIndex(mn);
        const top = Field.calcTop(mn);
        if (top && this.getColorIndex(top) === myColorIndex && !bag.contains(top)) {
            bag.put(top);
            this.checkNearby(top, bag);
        }
        const right = Field.calcRight(mn);
        if (right && this.getColorIndex(right) === myColorIndex && !bag.contains(right)) {
            bag.put(right);
            this.checkNearby(right, bag);
        }
        const bottom = Field.calcBottom(mn);
        if (bottom && this.getColorIndex(bottom) === myColorIndex && !bag.contains(bottom)) {
            bag.put(bottom);
            this.checkNearby(bottom, bag);
        }
        const left = Field.calcLeft(mn);
        if (left && this.getColorIndex(left) === myColorIndex && !bag.contains(left)) {
            bag.put(left);
            this.checkNearby(left, bag);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static calcTop([m, n]) {
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

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getColorIndex(mn) {
        //console.log("getColorIndex:", mn);
        if (mn === null) {
            throw new Error("getColorIndex: need nm but got null");
        }
        const [m, n] = mn;
        return this.matrix[m][n];
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    isTileExists(mn) {
        return this.getColorIndex(mn) !== null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    applyMoves(moves) {
        console.log("Field.applyMoves", moves);
        moves.forEach(({from: [m, n], to: [_m, _n]}) => {
            this.matrix[_m][_n] = this.matrix[m][n];
            this.matrix[m][n] = null;
        });
        //console.log("matrix", this.matrix);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    fillNewTiles() {
        const mns = [];
        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                if (!this.isTileExists([m,n])) {
                    const colorIndex = Helper.randomInteger(0, Const.C - 1);
                    this.matrix[m][n] = colorIndex;
                    mns.push([m,n]);
                }
            }
        }
        return mns;
    }

}

module.exports = Field;
