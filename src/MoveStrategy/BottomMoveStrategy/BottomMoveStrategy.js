"use strict";

const Const        = require("../../Const");
const MoveStrategy = require("../MoveStrategy");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class BottomMoveStrategy extends MoveStrategy {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    findMoves(field) {
        //console.log("BottomMoveStrategy.findMoves");
        const moves = [];
        for (let n = 0; n < field.game.options.N; n++) {
            let column = new Array(field.game.options.M);
            for (let m = 0; m < field.game.options.M; m++) {
                column[m] = field.isTileExists([m, n]) ? m : null;
            }
            //console.log("original column:", JSON.stringify(column));
            column = column.filter(m => m !== null);
            //console.log("filtered column:", JSON.stringify(column));
            //console.log("new len:", column.length);
            const cnt = field.game.options.M - column.length;
            //console.log("cnt:", cnt);
            for (let i = 0; i < cnt; i++) column.unshift(null);
            //console.log("unshifted column:", JSON.stringify(column));
            for (let m = field.game.options.M-1; m >= 0; m--) {
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

module.exports = BottomMoveStrategy;