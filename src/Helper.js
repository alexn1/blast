"use strict";

const Promise           = require("bluebird");
const Const             = require("./Const");
const res               = require("./res");
const ParticleExplosion = require("./ParticleExplosion");

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
        //let rand = min - 0.5 + Math.random() * (max - min + 1);
        //return Math.round(rand);
        let rand = min + Math.random() * (max + 1 - min);
        return Math.floor(rand);
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
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static createButton(options) {
        options = options || {};
        const Scale9SpriteButton = require('./Scale9SpriteButton');
        let text = 'Button';
        if (typeof options.text === 'string') {
            text = options.text;
        } else if (typeof options.title === 'string') {
            text = options.title;
        }

        if (!options.file && !options.color) {
            options.color = Const.BUTTON_COLOR;
        }
        if (!options.fontColor) {
            options.fontColor = Const.BUTTON_TEXT_COLOR;
        }

        return new Scale9SpriteButton({
            normalFile: options.file     || res.colorWhite,
            color     : options.color,
            width     : options.width    || Const.BUTTON_WIDTH,
            height    : options.height   || Const.BUTTON_HEIGHT,
            text      : text,
            fontName  : options.fontName || Const.TITLE_FONT_NAME,
            fontSize  : options.fontSize || Const.BUTTON_FONT_SIZE,
            fontColor : options.fontColor,
            hitArea   : options.hitArea,
            visible   : options.visible,
            offsetY   : options.offsetY || -3
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static addTouchListener(options) {
        cc.eventManager.addListener({
            event         : cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: options.swallow !== undefined ? options.swallow : false,
            onTouchBegan  : options.onTouchBegan,
            onTouchMoved  : options.onTouchMoved,
            onTouchEnded  : options.onTouchEnded
        }, options.target);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static setScale9SpriteFile(scale9Sprite, file) {
        const width  = scale9Sprite.width;
        const height = scale9Sprite.height;
        scale9Sprite.initWithFile(file, cc.rect(0, 0, 0, 0), cc.rect(0, 0, 0, 0));
        scale9Sprite.width  = width;
        scale9Sprite.height = height;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static createBackButton() {
        const backButton = Helper.createButton({title: "back", width: 130, hitArea: 10});
        backButton.setPosition(Helper.toLeftTop(cc.winSize, 10 + 130/2, 10 + 15));
        backButton.onClick = () => {
            cc.director.popScene();
        };
        return backButton;
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static fromLeftTop(rect, x, y) {
        return cc.p(x, rect.height - y);
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static fromRightTop(parent, x, y) {
        return cc.p(parent.width - x, parent.height - y);
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static fromRightBottom(node, x, y) {
        return cc.p(node.width - x, y);
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static fromLeftBottom(node, x, y) {
        return cc.p(x, y);
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static createExplosion(time) {
        const emitter = new ParticleExplosion(time);
        emitter.texture = cc.textureCache.getTextureForKey(res.star);
        return emitter;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static showExplosion(parent, x, y, time) {
        return new Promise(resolve => {
            const emitter = Helper.createExplosion(time);
            emitter.setPosition(x, y);
            parent.addChild(emitter);
            setTimeout(() => {
                resolve(emitter);
            }, time * 1000);
        }).then(emitter => {
            parent.removeChild(emitter);
        });
    }



}

module.exports = Helper;
