"use strict";

const Const  = require("./Const");
const Helper = require("./Helper");
const MoveToBottomStrategy = require("./MoveToBottomStrategy");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class FieldController {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(field, fieldView) {
        this.field     = field;
        this.fieldView = fieldView;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    startGame() {
        this.field.init();
        this.fillView();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    fillView() {
        for (let m = 0; m < Const.M; m++) {
            for (let n = 0; n < Const.N; n++) {
                const colorIndex = this.field.matrix[m][n];
                if (colorIndex !== null) {
                    const color = Const.TILE_COLOR[colorIndex];
                    const tile = this.fieldView.createTile(m, n, color);
                    Helper.onNodeClick(tile, this.onTileClick.bind(this));
                }
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onTileClick(touch, event) {
        //console.log("FieldView.onTileClick", event.getCurrentTarget());
        const target = event.getCurrentTarget();
        const mn = target._tag;
        const bag = this.field.findColorArea(mn);
        const len = bag.getLength();
        //console.log("bag:", len, bag);
        if (len >= Const.K) {
            this.field.burnTiles(bag);
            this.fieldView.fadeOutTiles(bag).then(() => {
                const moves = new MoveToBottomStrategy(this.field).findMoves();
                //console.log("moves:", moves);
                this.field.applyMoves(moves);
                this.fieldView.makeMoves(moves);

            });
        } else {
            this.fieldView.flashTile(mn);
        }
    }

}

module.exports = FieldController;