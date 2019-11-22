'use strict';

const Promise        = require("bluebird");
const ActionStrategy = require("../ActionStrategy");
const Const          = require("../../Const");
const res            =  require("../../res");
const BottomMoveStrategy = require("../../MoveStrategy/BottomMoveStrategy/BottomMoveStrategy");
const Bag                = require("../../Bag");
const Field              = require("../../Field");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class RegularActionStrategy extends ActionStrategy {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    findTiles(mn) {
        return this._findColorArea(mn);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    _findColorArea(field, mn) {
        console.log("RegularActionStrategy.findColorArea", mn, field.getColorIndex(mn));
        const bag = new Bag();
        bag.put(mn);
        this._checkNearby(field, mn, bag);
        return bag;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    _checkNearby(field, mn, bag) {
        console.log("RegularActionStrategy.checkNearby", mn, JSON.stringify(bag));
        const myColorIndex = field.getColorIndex(mn);
        console.log("myColorIndex:", myColorIndex);
        const top = Field.calcTop(mn);
        if (top && field.getColorIndex(top) === myColorIndex && !bag.contains(top)) {
            bag.put(top);
            this._checkNearby(field, top, bag);
        }
        const right = Field.calcRight(mn);
        if (right && field.getColorIndex(right) === myColorIndex && !bag.contains(right)) {
            bag.put(right);
            this._checkNearby(field, right, bag);
        }
        const bottom = Field.calcBottom(mn);
        if (bottom && field.getColorIndex(bottom) === myColorIndex && !bag.contains(bottom)) {
            bag.put(bottom);
            this._checkNearby(field, bottom, bag);
        }
        const left = Field.calcLeft(mn);
        if (left && field.getColorIndex(left) === myColorIndex && !bag.contains(left)) {
            bag.put(left);
            this._checkNearby(field, left, bag);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    action(field, fieldView, fillStrategy, mn) {
        console.log("RegularActionStrategy.action", field, fieldView, mn);
        return Promise.try(() => {
            const bag = this._findColorArea(field, mn);
            const len = bag.getLength();
            console.log("bag:", len, bag);
            if (len >= Const.K) {
                cc.audioEngine.playEffect(res.soundBurn);
                field.burnTiles(bag);
                return fieldView.fadeOutTiles(bag).then(() => {
                    const moves = new BottomMoveStrategy().findMoves(field);
                    console.log("moves:", moves);
                    field.applyMoves(moves);
                    return fieldView.makeMoves(moves).then(() => {
                        const mns = field.getEmptyTilesMNs();
                        fillStrategy.refillField(field, mns);
                        console.log("new tiles:", mns);
                        mns.forEach(([m, n]) => fieldView.createTile([m,n], field.getColorIndex([m, n]), 0));
                        return fieldView.fadeInTiles(mns);
                    });
                });
            } else {
                cc.audioEngine.playEffect(res.soundWrong);
                return fieldView.flashTile(mn);
            }
        });
    }
}

module.exports = RegularActionStrategy;