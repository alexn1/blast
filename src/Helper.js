"use strict";

const Promise = require("bluebird");
const Const   = require("./Const");
const res     = require("./res");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Helper {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static resToArray(res) {
        const assets = [];
        for (let id in res) {
            assets.push(res[id]);
        }
        return assets;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static createBackground(color) {
        const background = new cc.Sprite(res.colorWhite);
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
        const scaleFactor = cc.director.getContentScaleFactor();
        const labelTTF = new cc.LabelTTF(title, font, fontSize * scaleFactor, dimensions);
        labelTTF.setScale(1 / scaleFactor);
        return labelTTF;
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static toLeftTop(node, x, y) {
        return cc.p(x, node.height - y);
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static randomInteger(min, max) {
        const rand = min + Math.random() * (max - min);
        return Math.round(rand);
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static onNodeClick(node, callback, hitArea) {
        cc.eventManager.addListener({
            event         : cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan  : (touch, event) => {
                //console.log('Helper.onNodeClick:onTouchBegan');
                if (Helper.isNodeVisible(node) && Helper.hitTest(touch, event, hitArea)) {
                    return true;
                }
            },
            onTouchEnded  : callback
        }, node);
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static isNodeVisible(node) {
        if (node.parent) {
            return node.visible && Helper.isNodeVisible(node.parent);
        } else {
            return node.visible;
        }
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static hitTest(touch, event, hitArea) {
        const location = touch.getLocation();
        const target = event.getCurrentTarget();
        //console.log('target:', target);
        //console.log('touch:', touch);
        //console.log('event:', event);
        const locationInNode = target.convertToNodeSpace(location);
        const s = target.getContentSize();
        let rect;
        if (typeof hitArea === 'object' && hitArea !== null) {
            rect = cc.rect(0 - hitArea.left, 0 - hitArea.bottom, s.width + hitArea.left + hitArea.right, s.height + hitArea.top + hitArea.bottom);
        } else if (typeof hitArea === 'number') {
            rect = cc.rect(0 - hitArea, 0 - hitArea, s.width + hitArea * 2, s.height + hitArea * 2);
        } else {
            rect = cc.rect(0, 0, s.width, s.height);
        }
        //const rect = cc.rect(0, 0, s.width, s.height);
        return cc.rectContainsPoint(rect, locationInNode);
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static createMatrix(M, N) {
        const matrix = new Array(M);
        for (let m = 0; m < M; m++) {
            matrix[m] = new Array(N);
            for (let n = 0; n < N; n++) {
                matrix[m][n] = null;
            }
        }
        return matrix;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static runActions(node, actions) {
        return new Promise(resolve => {
            actions.push(cc.callFunc(resolve));
            node.runAction(cc.sequence(actions));
        });
    };

}

module.exports = Helper;