'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Const {}

// screen
//Const.NATIVE_WIDTH  = 360;
//Const.NATIVE_HEIGHT = 640;
Const.SCALE_FACTOR  =   2;

Const.SCENE_BACKGROUND_COLOR = cc.color(161, 161, 161);
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