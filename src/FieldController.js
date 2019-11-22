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

        // events
        this.fieldView.onTileClick = this.onTileClick.bind(this);
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
                    this.fieldView.createTile([m, n], colorIndex);
                }
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onTileClick(mn) {
        //console.log("FieldView.onTileClick", mn);
        if (this.busy) {
            console.warn("busy");
            return;
        }
        return Promise.try(() => {
            this.busy = true;

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