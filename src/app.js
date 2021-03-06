"use strict";

let onStartCalled = false;
cc.game.onStart = () => {
    if (onStartCalled) return; onStartCalled = true;
    console.log("cc.game.onStart");
    const Application = require("./Application");
    try {
        const app = new Application();
        app.init();
        const now = Date.now();

        app.load().then(() => {
            console.log(`app loaded: ${Date.now() - now}ms`);
            try {
                app.run();
            } catch (err) {
                console.error("app run error:", err);
            }
        });
    } catch (err) {        
        console.error("onStart error:", err);
    }
};
cc.game.run();