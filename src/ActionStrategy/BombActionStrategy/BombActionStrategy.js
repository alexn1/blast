"use strict";

const Promise            = require("bluebird");
const ActionStrategy     = require("../ActionStrategy");
const Field              = require("../../Field");
const BottomMoveStrategy = require("../../MoveStrategy/BottomMoveStrategy/BottomMoveStrategy");
const res                = require("../../res");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class BombActionStrategy extends ActionStrategy {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    action(field, fieldView, fillStrategy, mn) {
        console.log("BombActionStrategy.action");
        return Promise.try(() => {
            const mns = [mn];
            const topMN    = Field.calcTop(mn);
            const rightMN  = Field.calcRight(mn);
            const bottomMN = Field.calcBottom(mn);
            const leftMN   = Field.calcLeft(mn);
            if (topMN) {
                mns.push(topMN);
            }
            if (rightMN) {
                mns.push(rightMN);
            }
            if (bottomMN) {
                mns.push(bottomMN);
            }
            if (leftMN) {
                mns.push(leftMN);
            }
            //console.log("mns:", mns);
            cc.audioEngine.playEffect(res.soundBurn);
            field.burnTiles(mns);
            return fieldView.fadeOutTiles(mns).then(() => {
                const moves = new BottomMoveStrategy().findMoves(field);
                //console.log("moves:", moves);
                field.applyMoves(moves);
                return fieldView.makeMoves(moves).then(() => {
                    const emptyMNs = field.getEmptyTilesMNs();
                    //console.log("new tiles:", emptyMNs);
                    fillStrategy.refillField(field, emptyMNs);
                    fillStrategy.refillFieldView(field, fieldView, emptyMNs);
                    return fieldView.fadeInTiles(emptyMNs);
                });
            });
        });
    }

}

module.exports = BombActionStrategy;