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

        // mission
        this.mission = {};
        for (let c in options.mission) {
            this.mission[c] = options.mission[c];
        }

        // counter
        this.counter = 0;

        this.over = false;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    applyActionResult(result) {
        //console.log("Game.applyActionResult:", result);
        this.counter++;
        for (let c in result) {
            this.score[c] += result[c];
            if (this.mission[c] !== undefined && this.mission[c] > 0) {
                this.mission[c] -= result[c];
                if (this.mission[c] < 0) {
                    this.mission[c] = 0;
                }
            }
        }
        console.log("game:", this);

        let sum = 0;

        for (let c of Object.keys(this.mission)) {
            sum += this.mission[c];
        }
        console.log("sum:", sum);
        return this.over = sum === 0;
    }

}

module.exports = Game;