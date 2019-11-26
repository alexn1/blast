"use strict";

const Promise            = require("bluebird");
const ActionStrategy     = require("../ActionStrategy");
const Field              = require("../../Field");
const BottomMoveStrategy = require("../../MoveStrategy/BottomMoveStrategy/BottomMoveStrategy");
const res                = require("../../res");
const RegularTile        = require("../../Tile/RegularTile/RegularTile");
const Bag                = require("../../Bag");

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
            const bag = this.findTiles(mn);
            const result = this.calcResult(bag);
            const mns = bag.toArray();
            //console.log("mns:", mns.length, mns);
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
                fillStrategy.refillField(emptyMNs);
                fillStrategy.refillFieldView(emptyMNs);
                return this.fieldView.fadeInTiles(emptyMNs);
            }).then(() => {
                return result;
            });
        });
    }

}

module.exports = BombActionStrategy;