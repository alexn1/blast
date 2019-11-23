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
            const result = {};
            const mns = [mn];
            for (let _mn of [
                Field.calcTop(mn),
                Field.calcRight(mn),
                Field.calcBottom(mn),
                Field.calcLeft(mn)
            ]) {
                if (_mn) {
                    mns.push(_mn);
                }
            }

            //console.log("mns:", mns);
            cc.audioEngine.playEffect(res.soundBurn, false);
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