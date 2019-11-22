"use strict";

const Promise = require("bluebird");
const Const   = require("./Const");
const Helper  = require("./Helper");
const res     = require("./res");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class FieldController {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(field, fieldView, moveStrategy) {
        this.field        = field;
        this.fieldView    = fieldView;
        this.moveStrategy = moveStrategy;
        this.busy         = false;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    startGame() {
        this.field.fill();
        this.fillView();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    fillView() {
        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                const colorIndex = this.field.getColorIndex([m, n]);
                if (colorIndex !== null) {
                    this.createTile([m,n], colorIndex);
                }
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    createTile([m,n], colorIndex, opacity = 255) {
        const color = Const.TILE_COLOR[colorIndex];
        const tile = this.fieldView.createTile(m, n, color);
        tile.setOpacity(opacity);
        Helper.onNodeClick(tile, this.onTileClick.bind(this));
        return tile;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onTileClick(touch, event) {
        //console.log("FieldView.onTileClick", event.getCurrentTarget());
        if (this.busy) {
            console.warn("busy");
            return;
        }
        return Promise.try(() => {
            this.busy = true;
            const mn = event.getCurrentTarget()._tag;
            const bag = this.field.findColorArea(mn);
            const len = bag.getLength();
            //console.log("bag:", len, bag);
            if (len >= Const.K) {
                cc.audioEngine.playEffect(res.soundBurn);
                this.field.burnTiles(bag);
                return this.fieldView.fadeOutTiles(bag).then(() => {
                    const moves = this.moveStrategy.findMoves(this.field);
                    //console.log("moves:", moves);
                    this.field.applyMoves(moves);
                    return this.fieldView.makeMoves(moves).then(() => {
                        const mns = this.field.fillNewTiles();
                        console.log("new tiles:", mns);
                        mns.forEach(([m, n]) => this.createTile([m,n], this.field.getColorIndex([m, n]), 0));
                        return this.fieldView.fadeInTiles(mns);
                    });
                });
            } else {
                cc.audioEngine.playEffect(res.soundWrong);
                return this.fieldView.flashTile(mn);
            }
        }).finally(() => {
            this.busy = false;
        });
    }

}

module.exports = FieldController;