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


Const.M = 7;    // rows
Const.N = 9;    // columns
Const.C = 5;    // color
Const.K = 2;

Const.BLOCK_ACTUAL_WIDTH  = 43;
Const.BLOCK_ACTUAL_HEIGHT = 48;

Const.BLOCK_COLOR = [
    cc.color.RED,
    cc.color.GREEN,
    cc.color(0, 177, 244),  // BLUE
    cc.color.ORANGE,
    cc.color.MAGENTA
];


module.exports = Const;