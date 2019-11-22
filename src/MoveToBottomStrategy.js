"use strict";

const Const        = require("./Const");
const MoveStrategy = require("./MoveStrategy");

class MoveToBottomStrategy extends MoveStrategy{

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(field) {
        super(field);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    findMoves() {
        console.log("MoveToBottomStrategy.findMoves");
        const moves = [];
        for (let n = 0; n < Const.N; n++) {
            let column = new Array(Const.M);
            for (let m = 0; m < Const.M; m++) {
                column[m] = this.field.isTileExists([m, n]) ? m : null;
            }
            //console.log("original column:", JSON.stringify(column));
            column = column.filter(m => m !== null);
            //console.log("filtered column:", JSON.stringify(column));
            //console.log("new len:", column.length);
            const cnt = Const.M - column.length;
            //console.log("cnt:", cnt);
            for (let i = 0; i < cnt; i++) column.unshift(null);
            //console.log("unshifted column:", JSON.stringify(column));
            for (let m = Const.M-1; m >= 0; m--) {
                if (column[m] !== null && column[m] !== m) {
                    moves.push({
                        from: [column[m], n],
                        to  : [       m , n]
                    });
                }
            }
        }
        return moves;
    }

}

module.exports = MoveToBottomStrategy;