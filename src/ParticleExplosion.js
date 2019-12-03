"use strict";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const ParticleExplosion = cc.ParticleExplosion.extend({

    _explosionTime: null,

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ctor: function (explosionTime) {
        //console.log("ParticleExplosion.ctor", explosionTime);
        this._explosionTime = explosionTime;
        cc.ParticleSystem.prototype.ctor.call(this, 20);
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    initWithTotalParticles:function (numberOfParticles) {
        if (cc.ParticleExplosion.prototype.initWithTotalParticles.call(this, numberOfParticles)) {
            this.setLife(this._explosionTime);
            this.setLifeVar(0);
            return true;
        }
        return false;
    }


});

module.exports = ParticleExplosion;