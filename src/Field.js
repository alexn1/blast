"use strict";

const Const  = require("./Const");
const Helper = require("./Helper");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Field {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(game) {
        this.game   = game;
        this.matrix = Helper.createMatrix(game.options.M, game.options.N);
        //console.log("matrix:", this.matrix);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setTile([m, n], tile) {
        if (this.isTileExists([m, n])) {
            throw new Error("setTile: tile place not empty");
        }
        this.matrix[m][n] = tile;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getTile([m, n]) {
        return this.matrix[m][n];
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    burnTiles(mns) {
        //console.log("burnTiles:", mns);
        mns.forEach(([m, n]) => this.matrix[m][n] = null);
        //console.log("matrix:", this.matrix);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    calcTop([m, n]) {
        const _m = m - 1;
        return _m >= 0 ? [_m, n] : null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    calcRight([m, n]) {
        const _n = n + 1;
        return _n < this.game.options.N ? [m, _n] : null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    calcBottom([m, n]) {
        const _m = m + 1;
        return _m < this.game.options.M ? [_m, n] : null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    calcLeft([m, n]) {
        const _n = n - 1;
        return _n >= 0 ? [m, _n] : null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    isTileExists([m, n]) {
        return this.matrix[m][n] != null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    applyMoves(moves) {
        //console.log("Field.applyMoves", moves);
        moves.forEach(({from: [m, n], to: [_m, _n]}) => {
            this.matrix[_m][_n] = this.matrix[m][n];
            this.matrix[m][n] = null;
        });
        //console.log("matrix", this.matrix);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getEmptyTilesMNs() {
        const mns = [];
        for (let m = 0; m < this.game.options.M; m++) {
            for (let n = 0; n < this.game.options.N; n++) {
                if (!this.isTileExists([m,n])) {
                    mns.push([m,n]);
                }
            }
        }
        return mns;
    }

}

module.exports = Field;
