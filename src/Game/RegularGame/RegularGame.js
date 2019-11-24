"use strict";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class RegularGame {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(options = {}) {
        this.options = options;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    isOver() {
        return false;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    applyActionResult(result) {
        return this.checkResult();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    checkResult() {
        return this.result;
    }

}

module.exports = RegularGame;