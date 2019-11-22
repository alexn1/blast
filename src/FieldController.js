"use strict";

const Promise = require("bluebird");
const Const   = require("./Const");
const Helper  = require("./Helper");
const res     = require("./res");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class FieldController {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(field, fieldView, fillStrategy) {
        this.field        = field;
        this.fieldView    = fieldView;
        this.fillStrategy = fillStrategy;
        this.busy         = false;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    startGame() {
        this.fillStrategy.fill(this.field);
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
            const tile = this.field.getTile(mn);
            console.log("tile:", tile);
            return tile.createActionStrategy().action(this.field, this.fieldView, this.fillStrategy, mn);
        }).catch(err => {
            console.error(err);
        }).finally(() => {
            this.busy = false;
        });
    }

}

module.exports = FieldController;