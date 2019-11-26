'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Const {}

// screen
//Const.NATIVE_WIDTH  = 360;
//Const.NATIVE_HEIGHT = 640;
Const.SCALE_FACTOR  =   2;

Const.SCENE_BACKGROUND_COLOR = cc.color(161, 161, 161);

Const.SCENE_MARGIN_H         = 15;
Const.SCENE_MARGIN_V         = 10;

Const.TITLE_FONT_NAME        = "AmericanCaptain";
Const.SCENE_TITLE_FONT_SIZE  = 30;

Const.TILE_ACTUAL_WIDTH  = 43;
Const.TILE_ACTUAL_HEIGHT = 48;

Const.TILE_COLOR = [
    cc.color.RED,
    cc.color.GREEN,
    cc.color(0, 177, 244),  // BLUE
    cc.color.ORANGE,
    cc.color.MAGENTA
];

Const.LEVEL_OPTIONS = {
    '1': {
        M: 7,   // rows
        N: 9,   // columns
        C: 5,   // colors
        K: 2,   // match K
        moves: 30,
        mission: {
            '0': 10,
            '1': 10,
            '2': 10
        }
    },
    '2': {
        M: 5,   // rows
        N: 5,   // columns
        C: 5,   // colors
        K: 2,   // match K
        moves: 40,
        mission: {
            '0': 15,
            '1': 15,
            '2': 15
        }
    },
    '3': {
        M: 10,   // rows
        N: 10,   // columns
        C: 5,    // colors
        K: 2,    // match K
        moves: 50,
        mission: {
            '0': 15,
            '1': 15,
            '2': 15
        }
    }
};


Const.COLOR_NAME = ["red", "green", "blue", "orange", "magenta"];

// button
Const.BUTTON_FONT_SIZE = 22;
Const.BUTTON_TEXT_COLOR = cc.color("#80704F");
Const.BUTTON_TEXT_DISABLE_COLOR = cc.color("#bfa979");
Const.BUTTON_WIDTH  = 100;
Const.BUTTON_HEIGHT = 40;
Const.BUTTON_SIZE   = {width: 200, height: 50};
Const.BUTTON_INTERVAL = 20;
Const.BUTTON_COLOR    = cc.color('#ECD592');


module.exports = Const;