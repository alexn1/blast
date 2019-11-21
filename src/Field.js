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
                this.matrix[m][n] = Helper.randomInteger(0, Const.C - 1);
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    findColorArea(m, n) {
        console.log("Field.findColorArea", m, n);

    }

}

module.exports = Field;