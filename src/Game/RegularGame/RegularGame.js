"use strict";

const Game = require("../Game");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class RegularGame extends Game {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(options = {}) {
        super(options);

        // counter
        this.counter = 0;

        // score by color
        this.score = {};
        for (let c = 0; c < this.options.C; c++) {
            this.score[c] = 0;
        }

        // moves
        this.moves = options.moves;

        // mission
        this.mission = {};
        for (let c in options.mission) {
            this.mission[c] = options.mission[c];
        }


    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    isOver() {
        return this.status !== null;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    applyActionResult(result) {
        //console.log("Game.applyActionResult:", result);
        this.counter++;
        this.moves--;

        for (let c in result) {

            // score
            this.score[c] += result[c];

            // mission
            if (this.mission[c] !== undefined && this.mission[c] > 0) {
                this.mission[c] -= result[c];
                if (this.mission[c] < 0) {
                    this.mission[c] = 0;
                }
            }
        }
        //console.log("game:", this);
        return this.checkStatus();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    checkStatus() {
        // sum
        let sum = 0;
        for (let c of Object.keys(this.mission)) {
            sum += this.mission[c];
        }

        // check status
        if (sum === 0) {
            this.status = "win";
        } else if (this.moves === 0) {
            this.status = "lose";
        }
        return this.status;
    }


}

module.exports = RegularGame;