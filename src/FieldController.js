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
        this.fillStrategy.fillField();
        this.fillStrategy.fillFieldView();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onTileClick(mn) {
        //console.log("FieldView.onTileClick", mn);
        return Promise.try(() => {
            if (this.busy) {
                console.warn("busy");
                return null;
            }
            this.busy = true;
            const tile = this.field.getTile(mn);
            console.log("tile:", tile);
            return tile.createActionStrategy(this.field, this.fieldView).action(this.fillStrategy, mn).then(result => {
                console.log("result:", result);
            });
        }).finally(() => {
            this.busy = false;
        });
    }

}

module.exports = FieldController;