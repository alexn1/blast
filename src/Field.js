"use strict";

const Const  = require("./Const");
const Helper = require("./Helper");

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
        const bag = {};
        Field.putToBag(bag, mn);
        this.checkNearby(mn, bag);
        console.log("bug:", bag);
        return bag;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    checkNearby(tile, bag) {
        console.log("Field.checkNearby", tile, JSON.stringify(bag));
        const myColorIndex = this.getColorIndex(tile);
        const top = this.getTop(tile);
        if (top && this.getColorIndex(top) === myColorIndex && !Field.isInBag(bag, top)) {
            Field.putToBag(bag, top);
        }
        const right = this.getRight(tile);
        if (right && this.getColorIndex(right) === myColorIndex && !Field.isInBag(bag, right)) {
            Field.putToBag(bag, right);
        }
        const bottom = this.getBottom(tile);
        if (bottom && this.getColorIndex(bottom) === myColorIndex && !Field.isInBag(bag, bottom)) {
            Field.putToBag(bag, bottom);
        }
        const left = this.getLeft(tile);
        if (left && this.getColorIndex(left) === myColorIndex && !Field.isInBag(bag, left)) {
            Field.putToBag(bag, left);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static isInBag(bag, [m, n]) {
        return bag[m] && bag[m][n];
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static putToBag(bag, [m, n]) {
        if (!bag[m]) {
            bag[m] = {};
        }
        bag[m][n] = true;
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
