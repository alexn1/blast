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

            const mns = this.findTiles(mn);

            const result = {};

/*            const mns = [mn];
            for (let _mn of [
                this.field.calcTop(mn),
                this.field.calcRight(mn),
                this.field.calcBottom(mn),
                this.field.calcLeft(mn)
            ]) {
                if (_mn === null) continue;
                mns.push(_mn);
                const _tile = this.field.getTile(_mn);
                if (_tile instanceof RegularTile) {
                    if (result[_tile.colorIndex] === undefined) {
                        result[_tile.colorIndex] = 0;
                    }
                    result[_tile.colorIndex]++;
                }
            }*/

            //console.log("mns:", mns);
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