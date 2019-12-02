"use strict";

const Promise             = require("bluebird");
const Const               = require("./Const");
const Helper              = require("./Helper");
const res                 = require("./res");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const HomeScene = cc.Scene.extend({

    _className     : "HomeScene",
    onStartLevel   : null,

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ctor(options = {}) {
        this.options = options;
        this._super();
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init() {

        // background
        this.addChild(Helper.createBackground(Const.SCENE_BACKGROUND_COLOR));


        // title
        const title = Helper.createLabelTTF("blast", Helper.getFont(Const.TITLE_FONT_NAME), Const.SCENE_TITLE_FONT_SIZE);
        title.setPosition(Helper.toLeftTop(cc.visibleRect, cc.visibleRect.center.x, 30));
        this.addChild(title);

        // button1
        const button1 = new Helper.createButton({title: "level 1"});
        button1.setPosition(cc.winSize.width/2, cc.winSize.height/2 + 100);
        button1.onClick = () => {
            if (this.onStartLevel) {
                this.onStartLevel(1);
            }
        };
        this.addChild(button1);

        // button2
        const button2 = new Helper.createButton({title: "level 2"});
        button2.setPosition(cc.winSize.width/2, cc.winSize.height/2);
        button2.onClick = () => {
            if (this.onStartLevel) {
                this.onStartLevel(2);
            }
        };
        this.addChild(button2);

        // button3
        const button3 = new Helper.createButton({title: "level 3"});
        button3.setPosition(cc.winSize.width/2, cc.winSize.height/2 - 100);
        button3.onClick = () => {
            if (this.onStartLevel) {
                this.onStartLevel(3);
            }
        };
        this.addChild(button3);



        //const texture = cc.textureCache.getTextureForKey(res.bomb);
        //console.log("texture:", texture);
        //const _emitter = new cc.ParticleFlower();
        //_emitter.texture = texture;
        //_emitter.setPosition(150, 150);
        //this.addChild(_emitter);

        /*
        const star = new cc.Sprite(res.star);
        star.setPosition(20, 20);
        this.addChild(star);

        const color = new cc.Sprite(res.colorWhite);
        color.setPosition(40, 20);
        this.addChild(color);
        */



        // testButton
        const testButton = new Helper.createButton({title: "test"});
        testButton.setPosition(50, 50);
        testButton.onClick = () => {
            console.log("test");

            const texture = cc.textureCache.getTextureForKey(res.star);
            //const texture = cc.textureCache.getTextureForKey(res.colorWhite);
            console.log("texture:", texture);
            const emitter = new cc.ParticleExplosion();
            emitter.texture = texture;
            emitter.setPosition(150, 150);


            //emitter.initWithTotalParticles(700);


            /*
            const speed = 500;
            emitter.setSpeed(speed);
            emitter.setSpeedVar(speed * 0.5);
            emitter.setLife(0.25);
            emitter.setLifeVar(0.1);
            */




            this.addChild(emitter);


            /*
            if (_emitter.setShapeType)
                _emitter.setShapeType(cc.ParticleSystem.STAR_SHAPE);
                */




        };
        this.addChild(testButton);


    }



});

module.exports = HomeScene;