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
    findTiles(mn) {
        return this._findColorArea(mn);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    _findColorArea(mn) {
        //console.log("RegularActionStrategy.findColorArea", mn);
        const bag = new Bag();
        bag.put(mn);
        this._checkNearby(mn, bag);
        return bag.toArray();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    _checkNearby(mn, bag) {
        //console.log("RegularActionStrategy.checkNearby", mn, JSON.stringify(bag));
        const RegularTile = require("../../Tile/RegularTile/RegularTile");
        const tile = this.field.getTile(mn);

        const myColorIndex = tile.colorIndex;
        const topMN = Field.calcTop(mn);
        if (topMN) {
            const topTile = this.field.getTile(topMN);
            if (topTile instanceof RegularTile && topTile.colorIndex === myColorIndex && !bag.contains(topMN)) {
                bag.put(topMN);
                this._checkNearby(topMN, bag);
            }
        }
        const rightMN = Field.calcRight(mn);
        if (rightMN) {
            const rightTile = this.field.getTile(rightMN);
            if (rightTile instanceof RegularTile && rightTile.colorIndex === myColorIndex && !bag.contains(rightMN)) {
                bag.put(rightMN);
                this._checkNearby(rightMN, bag);
            }
        }
        const bottomMN = Field.calcBottom(mn);
        if (bottomMN) {
            const bottomTile = this.field.getTile(bottomMN);
            if (bottomTile instanceof RegularTile && bottomTile.colorIndex === myColorIndex && !bag.contains(bottomMN)) {
                bag.put(bottomMN);
                this._checkNearby(bottomMN, bag);
            }
        }
        const leftMN = Field.calcLeft(mn);
        if (leftMN) {
            const leftTile = this.field.getTile(leftMN);
            if (leftTile instanceof RegularTile && leftTile.colorIndex === myColorIndex && !bag.contains(leftMN)) {
                bag.put(leftMN);
                this._checkNearby(leftMN, bag);
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    action(fillStrategy, mn) {
        //console.log("RegularActionStrategy.action", field, fieldView, mn);
        return Promise.try(() => {
            const colorMNs = this._findColorArea(mn);
            //console.log("colorMNs:", colorMNs.length, colorMNs);
            if (colorMNs.length >= Const.K) {
                cc.audioEngine.playEffect(res.soundBurn);
                this.field.burnTiles(colorMNs);
                return this.fieldView.fadeOutTiles(colorMNs).then(() => {
                    const moves = new BottomMoveStrategy().findMoves(this.field);
                    //console.log("moves:", moves);
                    this.field.applyMoves(moves);
                    return this.fieldView.makeMoves(moves).then(() => {
                        const emptyMNs = this.field.getEmptyTilesMNs();
                        //console.log("new tiles:", emptyMNs);
                        fillStrategy.refillField(emptyMNs, {useBomb: true});
                        fillStrategy.refillFieldView(emptyMNs);
                        return this.fieldView.fadeInTiles(emptyMNs);
                    });
                });
            } else {
                cc.audioEngine.playEffect(res.soundWrong);
                return this.fieldView.flashTile(mn);
            }
        });
    }
}

module.exports = RegularActionStrategy;