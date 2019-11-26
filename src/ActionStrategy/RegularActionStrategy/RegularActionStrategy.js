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
    _findTiles(mn) {
        //console.log("RegularActionStrategy._findTiles", mn);
        const bag = new Bag();
        bag.put(mn);
        //this._checkNearby(mn, bag);
        const tile = this.field.getTile(mn);
        tile.findBurnTiles(this.field, mn, bag);

        return bag.toArray();
    }

    /*
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    _checkNearby(mn, bag) {
        //console.log("RegularActionStrategy._checkNearby", mn, JSON.stringify(bag));
        const tile = this.field.getTile(mn);
        const myColorIndex = tile.colorIndex;
        for (let _mn of [
            this.field.calcTop(mn),
            this.field.calcRight(mn),
            this.field.calcBottom(mn),
            this.field.calcLeft(mn)
        ]) {
            if (_mn === null) continue;
            const _tile = this.field.getTile(_mn);
            if (_tile.constructor.name ==="RegularTile" && _tile.colorIndex === myColorIndex && !bag.contains(_mn)) {
                bag.put(_mn);
                this._checkNearby(_mn, bag);
            }
        }
    }
    */

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    action(fillStrategy, mn) {
        //console.log("RegularActionStrategy.action", field, fieldView, mn);
        return Promise.try(() => {
            const mns = this._findTiles(mn);
            //console.log("mns:", mns.length, mns);
            if (mns.length >= this.field.game.options.K) {
                const result = {};
                const tile = this.field.getTile(mn);
                result[tile.colorIndex] = mns.length;
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