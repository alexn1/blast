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
        for (let _mn of [
            this.field.calcTop(mn),
            this.field.calcRight(mn),
            this.field.calcBottom(mn),
            this.field.calcLeft(mn)
        ]) {
            if (_mn === null) continue;
            const _tile = this.field.getTile(_mn);
            if (_tile instanceof RegularTile && _tile.colorIndex === myColorIndex && !bag.contains(_mn)) {
                bag.put(_mn);
                this._checkNearby(_mn, bag);
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    action(fillStrategy, mn) {
        //console.log("RegularActionStrategy.action", field, fieldView, mn);
        return Promise.try(() => {
            const tile = this.field.getTile(mn);
            const colorMNs = this._findColorArea(mn);
            //console.log("colorMNs:", colorMNs.length, colorMNs);
            const result = {};
            result[tile.colorIndex] = colorMNs.length;
            if (colorMNs.length >= Const.K) {
                cc.audioEngine.playEffect(res.soundBurn, false);
                this.field.burnTiles(colorMNs);
                return this.fieldView.fadeOutTiles(colorMNs).then(() => {
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