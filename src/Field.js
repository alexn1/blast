"use strict";

const Const  = require("./Const");
const Helper = require("./Helper");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Field {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor() {
        this.matrix = new Array(Const.M);
        for (let m = 0; m < Const.M; m++) {
            this.matrix[m] = new Array(Const.N);
            for (let n = 0; n < Const.N; n++) {
                this.matrix[m][n] = null;
            }
        }
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

        const bug = {};

    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    checkNearby(mn, bug) {
        const topMN = this.getTop(mn);
        if (topMN) {
            console.log("top color:", this.getColorIndex(topMN));
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
        return _n < Const.M ? [m, _n] : null;
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
