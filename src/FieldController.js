"use strict";

const Const  = require("./Const");
const Helper = require("./Helper");

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
                    const tile = this.fieldView.createTile(m, n, Const.TILE_COLOR[colorIndex]);
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
        console.log("bag:", len, bag);
        if (len >= Const.K) {
            this.field.burnTiles(bag);
            this.fieldView.fadeOutTiles(bag).then(() => {
                console.log("fadeOutTiles done");
                const tiles = this.field.findTilesToMove();
                console.log("tiles:", tiles);
                //tiles.forEach(mn => this.fieldView.setTileOpacity(mn, 100));
                const moves = [];
                tiles.forEach(from => {
                    const to = this.field.findNewPlace(from);
                    moves.push({from, to});
                });
                this.field.applyMoves(moves);
                this.fieldView.makeMoves(moves);
            });
        } else {
            this.fieldView.flashTile(mn);
        }
    }

}

module.exports = FieldController;