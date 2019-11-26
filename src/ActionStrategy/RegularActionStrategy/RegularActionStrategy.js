'use strict';

const Promise            = require("bluebird");
const ActionStrategy     = require("../ActionStrategy");
const Const              = require("../../Const");
const res                =  require("../../res");
const BottomMoveStrategy = require("../../MoveStrategy/BottomMoveStrategy/BottomMoveStrategy");
const Bag                = require("../../Bag");
const Field              = require("../../Field");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class RegularActionStrategy extends ActionStrategy {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(field, fieldView) {
        super(field, fieldView);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    action(fillStrategy, mn) {
        //console.log("RegularActionStrategy.action", field, fieldView, mn);
        return Promise.try(() => {
            const bag = this.findTiles(mn);
            const result = this.calcResult(bag);
            const mns = bag.toArray();
            //console.log("mns:", mns.length, mns);
            if (mns.length >= this.field.game.options.K) {
                cc.audioEngine.playEffect(res.soundBurn, false);
                this.field.burnTiles(mns);
                return this.fieldView.fadeOutTiles(mns).then(() => {
                    const moves = new BottomMoveStrategy().findMoves(this.field);
                    //console.log("moves:", moves);
                    this.field.applyMoves(moves);
                    return this.fieldView.makeMoves(moves);
                }).then(() => {
                    const emptyMNs = this.field.getEmptyTilesMNs();
                    //console.log("new tiles:", emptyMNs);
                    fillStrategy.refillField(emptyMNs, {useBomb: true});
                    fillStrategy.refillFieldView(emptyMNs);
                    return this.fieldView.fadeInTiles(emptyMNs);
                }).then(() => {
                    return result;
                });
            } else {
                cc.audioEngine.playEffect(res.soundWrong, false);
                return this.fieldView.flashTile(mn).then(() => {
                    return null;
                });
            }
        });
    }
}

module.exports = RegularActionStrategy;