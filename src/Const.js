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


module.exports = Const;