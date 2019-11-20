"use strict";

const Promise = require("bluebird");
const Const   = require("./Const");
const res     = require("./res");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Helper {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static resToArray(res) {
        var assets = [];
        for (var id in res) {
            assets.push(res[id]);
        }
        return assets;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static createBackground(color) {
        var background = new cc.Sprite(res.colorWhite);
        background.setAnchorPoint(0, 0);
        background.setColor(color);
        background.setScale(
            cc.winSize.width  / background.width,
            cc.winSize.height / background.height
        );
        return background;
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static getFont(name) {
        return name ? Helper.getFontByRes(res[name]) : null;
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static getFontByRes(fontRes) {
        if (fontRes) {
            if (cc.sys.isNative && cc.sys.os === cc.sys.OS_ANDROID) {
                return "res/fonts/" + fontRes.name + ".ttf";

            } else {
                return fontRes.name;
            }
        } else {
            return undefined;
        }
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static createLabelTTF(title, font, fontSize, dimensions) {
        fontSize = fontSize || 16;
        var scaleFactor = cc.director.getContentScaleFactor();
        var labelTTF = new cc.LabelTTF(title, font, fontSize * scaleFactor, dimensions);
        labelTTF.setScale(1 / scaleFactor);
        return labelTTF;
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static toLeftTop(node, x, y) {
        return cc.p(x, node.height - y);
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static randomInteger(min, max) {
        var rand = min + Math.random() * (max - min);
        return Math.round(rand);
    };

}

module.exports = Helper;