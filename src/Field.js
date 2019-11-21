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
        //this.matrix[0][0] = 0;
        //this.matrix[1][1] = 1;
        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                const colorIndex = Helper.randomInteger(0, Const.C - 1);
                this.matrix[m][n] = colorIndex;
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    findColorArea(mn) {
        console.log("Field.findColorArea", mn);
        console.log("colorIndex:", this.getColorIndex(mn));
        const bag = new Bag();
        bag.put(mn);
        this.checkNearby(mn, bag);
        return bag;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    checkNearby(tile, bag) {
        console.log("Field.checkNearby", tile, JSON.stringify(bag));
        const myColorIndex = this.getColorIndex(tile);
        const top = this.getTop(tile);
        if (top && this.getColorIndex(top) === myColorIndex && !bag.contains(top)) {
            bag.put(top);
            this.checkNearby(top, bag);
        }
        const right = this.getRight(tile);
        if (right && this.getColorIndex(right) === myColorIndex && !bag.contains(right)) {
            bag.put(right);
            this.checkNearby(right, bag);
        }
        const bottom = this.getBottom(tile);
        if (bottom && this.getColorIndex(bottom) === myColorIndex && !bag.contains(bottom)) {
            bag.put(bottom);
            this.checkNearby(bottom, bag);
        }
        const left = this.getLeft(tile);
        if (left && this.getColorIndex(left) === myColorIndex && !bag.contains(left)) {
            bag.put(left);
            this.checkNearby(left, bag);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getTop([m, n]) {
        const _m = m - 1;
        return _m >= 0 ? [_m, n] : null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getRight([m, n]) {
        const _n = n + 1;
        return _n < Const.N ? [m, _n] : null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getBottom([m, n]) {
        const _m = m + 1;
        return _m < Const.M ? [_m, n] : null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getLeft([m, n]) {
        const _n = n - 1;
        return _n >= 0 ? [m, _n] : null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getColorIndex(mn) {
        //console.log("getColorIndex:", mn);
        if (mn === null) {
            throw new Error(`getColorIndex: need nm, got: ${mn}`);
        }
        const [m, n] = mn;
        return this.matrix[m][n];
    }

}

module.exports = Field;
