'use strict';

const Promise     = require('bluebird');
const Const       = require('./Const');
const Helper      = require('./Helper');
const res         = require('./res');
const Application = require('./Application');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const Scale9SpriteButton = cc.Scale9Sprite.extend({

    options   : null,
    label     : null,
    isDisabled: false,

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ctor(options) {
        this.options = options = options || {};
        this._super(options.normalFile);

        // color
        if (options.color) {
            this.setColor(options.color);
        }

        // width
        if (options.width) {
            this.width = options.width;
        }

        // height
        if (options.height) {
            this.height = options.height;
        }

        if (options.visible === false) {
            this.visible = false;
        }

        // text
        if (typeof options.text === 'string') {
            const fontName = options.fontName || Const.TITLE_FONT_NAME;
            const fontSize = options.fontSize || Const.BUTTON_FONT_SIZE;

            // label
            const label = this.label = Helper.createLabelTTF(options.text, Helper.getFont(fontName), fontSize);
            label.setPosition(
                this.width /2 + (this.options.offsetX || 0),
                this.height/2 + (this.options.offsetY || 0)
            );
            if (options.fontColor) {
                label.setColor(options.fontColor);
            }
            this.addChild(label);
        }

        this.setCascadeOpacityEnabled(true);

        // events
        Helper.addTouchListener({
            target      : this,
            swallow     : true,
            onTouchBegan: this.onTouchBegan.bind(this),
            onTouchEnded: this.onTouchEnded.bind(this)
        });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onTouchBegan(touch, event) {
        if (Helper.isNodeVisible(this) && !this.isDisabled && Helper.hitTest(touch, event, this.options.hitArea)) {
            //console.log('Scale9SpriteButton.onTouchBegan');
            this.setActiveStyle();
            return true;
        }
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setActiveStyle() {
        if (this.options.activeFile) {
            Helper.setScale9SpriteFile(this, this.options.activeFile);
        } else {
            if (this.options.color && this.options.fontColor) {
                this.setColor(this.options.fontColor);
                this.label.setColor(this.options.color);
            } else {
                this.setScale(1.1);
            }
        }
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setNormalStyle() {
        if (this.options.activeFile) {
            Helper.setScale9SpriteFile(this, this.options.normalFile);
        } else {
            if (this.options.color && this.options.fontColor) {
                this.setColor(this.options.color);
                this.label.setColor(this.options.fontColor);
            } else {
                this.setScale(1.0);
            }
        }
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    onTouchEnded(touch, event) {
        //console.log('Scale9SpriteButton.onTouchEnded');
        this.setNormalStyle();
        if (Helper.hitTest(touch, event, this.options.hitArea)) {
            //cc.app.playSound(res.soundTap);
            if (this.onClick) {
                //Promise.try(() => {
                    return this.onClick(this);
                //}).catch((err) => {
                //    return Application.handleClientError(err);
                //});
            }
        }
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setFontColor(color) {
        this.label.setColor(color);
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    disable() {
        this.isDisabled = true;
        if (this.label) {
            this.setFontColor(this.options.disableTextColor || Const.BUTTON_TEXT_DISABLE_COLOR);
        }
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    enable() {
        this.isDisabled = false;
        if (this.label) {
            const fontColor = this.options.fontColor ? this.options.fontColor : Const.WHITE;
            this.setFontColor(fontColor);
        }
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setText(text) {
        this.label.setString(text);
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setWidth(width) {
        this.width = width;
        this.label.setPosition(cc.p(this.width/2, this.height/2));
    }

});

module.exports = Scale9SpriteButton;