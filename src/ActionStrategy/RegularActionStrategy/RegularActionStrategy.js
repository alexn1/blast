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
    findTiles(mn) {
        return this._findColorArea(mn);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    _findColorArea(field, mn) {
        //console.log("RegularActionStrategy.findColorArea", mn);
        const bag = new Bag();
        bag.put(mn);
        this._checkNearby(field, mn, bag);
        return bag.toArray();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    _checkNearby(field, mn, bag) {
        //console.log("RegularActionStrategy.checkNearby", mn, JSON.stringify(bag));
        const RegularTile = require("../../Tile/RegularTile/RegularTile");
        const tile = field.getTile(mn);

        const myColorIndex = tile.colorIndex;
        const topMN = Field.calcTop(mn);
        if (topMN) {
            const topTile = field.getTile(topMN);
            if (topTile instanceof RegularTile && topTile.colorIndex === myColorIndex && !bag.contains(topMN)) {
                bag.put(topMN);
                this._checkNearby(field, topMN, bag);
            }
        }
        const rightMN = Field.calcRight(mn);
        if (rightMN) {
            const rightTile = field.getTile(rightMN);
            if (rightTile instanceof RegularTile && rightTile.colorIndex === myColorIndex && !bag.contains(rightMN)) {
                bag.put(rightMN);
                this._checkNearby(field, rightMN, bag);
            }
        }
        const bottomMN = Field.calcBottom(mn);
        if (bottomMN) {
            const bottomTile = field.getTile(bottomMN);
            if (bottomTile instanceof RegularTile && bottomTile.colorIndex === myColorIndex && !bag.contains(bottomMN)) {
                bag.put(bottomMN);
                this._checkNearby(field, bottomMN, bag);
            }
        }
        const leftMN = Field.calcLeft(mn);
        if (leftMN) {
            const leftTile = field.getTile(leftMN);
            if (leftTile instanceof RegularTile && leftTile.colorIndex === myColorIndex && !bag.contains(leftMN)) {
                bag.put(leftMN);
                this._checkNearby(field, leftMN, bag);
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    action(field, fieldView, fillStrategy, mn) {
        //console.log("RegularActionStrategy.action", field, fieldView, mn);
        const RegularTile = require("../../Tile/RegularTile/RegularTile");
        return Promise.try(() => {
            const colorMNs = this._findColorArea(field, mn);
            //console.log("colorMNs:", colorMNs.length, colorMNs);
            if (colorMNs.length >= Const.K) {
                cc.audioEngine.playEffect(res.soundBurn);
                field.burnTiles(colorMNs);
                return fieldView.fadeOutTiles(colorMNs).then(() => {
                    const moves = new BottomMoveStrategy().findMoves(field);
                    //console.log("moves:", moves);
                    field.applyMoves(moves);
                    return fieldView.makeMoves(moves).then(() => {
                        const emptyMNs = field.getEmptyTilesMNs();
                        //console.log("new tiles:", emptyMNs);
                        fillStrategy.refillField(field, emptyMNs, {useBomb: true});
                        fillStrategy.refillFieldView(field, fieldView, emptyMNs);
                        return fieldView.fadeInTiles(emptyMNs);
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