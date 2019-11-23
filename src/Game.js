"use strict";

const Const = require("./Const");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Game {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(options = {}) {
        this.options = options;

        // score by color
        this.score = {};
        for (let c = 0; c < this.options.C; c++) {
            this.score[c] = 0;
        }

        // counter
        this.counter = 0;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    applyActionResult(result) {
        //console.log("Game.applyActionResult:", result);
        this.counter++;
        for (let c in result) {
            this.score[c] += result[c];
        }
        console.log("score:", this.score);
    }

}

module.exports = Game;