"use strict";

const Promise            = require("bluebird");
const ActionStrategy     = require("../ActionStrategy");
const Field              = require("../../Field");
const BottomMoveStrategy = require("../../MoveStrategy/BottomMoveStrategy/BottomMoveStrategy");
const res                = require("../../res");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class BombActionStrategy extends ActionStrategy {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(field, fieldView) {
        super(field, fieldView);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    action(fillStrategy, mn) {
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
            this.field.burnTiles(mns);
            return this.fieldView.fadeOutTiles(mns).then(() => {
                const moves = new BottomMoveStrategy().findMoves(this.field);
                //console.log("moves:", moves);
                this.field.applyMoves(moves);
                return this.fieldView.makeMoves(moves).then(() => {
                    const emptyMNs = this.field.getEmptyTilesMNs();
                    //console.log("new tiles:", emptyMNs);
                    fillStrategy.refillField(emptyMNs);
                    fillStrategy.refillFieldView(emptyMNs);
                    return this.fieldView.fadeInTiles(emptyMNs);
                });
            });
        });
    }

}

module.exports = BombActionStrategy;