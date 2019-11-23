(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process,global,setImmediate){
/* @preserve
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013-2018 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
/**
 * bluebird build version 3.7.1
 * Features enabled: core, race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, using, timers, filter, any, each
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule");
var Queue = _dereq_("./queue");

function Async() {
    this._customScheduler = false;
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._haveDrainedQueues = false;
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule = schedule;
}

Async.prototype.setScheduler = function(fn) {
    var prev = this._schedule;
    this._schedule = fn;
    this._customScheduler = true;
    return prev;
};

Async.prototype.hasCustomScheduler = function() {
    return this._customScheduler;
};

Async.prototype.haveItemsQueued = function () {
    return this._isTickUsed || this._haveDrainedQueues;
};


Async.prototype.fatalError = function(e, isNode) {
    if (isNode) {
        process.stderr.write("Fatal " + (e instanceof Error ? e.stack : e) +
            "\n");
        process.exit(2);
    } else {
        this.throwLater(e);
    }
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
};

function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
}

Async.prototype.invokeLater = AsyncInvokeLater;
Async.prototype.invoke = AsyncInvoke;
Async.prototype.settlePromises = AsyncSettlePromises;


function _drainQueue(queue) {
    while (queue.length() > 0) {
        _drainQueueStep(queue);
    }
}

function _drainQueueStep(queue) {
    var fn = queue.shift();
    if (typeof fn !== "function") {
        fn._settlePromises();
    } else {
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
}

Async.prototype._drainQueues = function () {
    _drainQueue(this._normalQueue);
    this._reset();
    this._haveDrainedQueues = true;
    _drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = Async;
module.exports.firstLineError = firstLineError;

},{"./queue":26,"./schedule":29}],3:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise, debug) {
var calledBind = false;
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    if (((this._bitField & 50397184) === 0)) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    if (!calledBind) {
        calledBind = true;
        Promise.prototype._propagateFrom = debug.propagateFromFunction();
        Promise.prototype._boundValue = debug.boundValueFunction();
    }
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();
    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, undefined, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, undefined, ret, context);
        ret._setOnCancel(maybePromise);
    } else {
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 2097152;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~2097152);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 2097152) === 2097152;
};

Promise.bind = function (thisArg, value) {
    return Promise.resolve(value).bind(thisArg);
};
};

},{}],4:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise":22}],5:[function(_dereq_,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = _dereq_("./util");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

var getMethodCaller;
var getGetter;
if (!true) {
var makeMethodCaller = function (methodName) {
    return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
};

var makeGetter = function (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
};

var getCompiled = function(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
};

getMethodCaller = function(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
};

getGetter = function(name) {
    return getCompiled(name, makeGetter, getterCache);
};
}

function ensureMethod(obj, methodName) {
    var fn;
    if (obj != null) fn = obj[methodName];
    if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
            util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
    }
    return fn;
}

function caller(obj) {
    var methodName = this.pop();
    var fn = ensureMethod(obj, methodName);
    return fn.apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var args = [].slice.call(arguments, 1);;
    if (!true) {
        if (canEvaluate) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
                return this._then(
                    maybeCaller, undefined, undefined, args, undefined);
            }
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util":36}],6:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray, apiRejection, debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var async = Promise._async;

Promise.prototype["break"] = Promise.prototype.cancel = function() {
    if (!debug.cancellation()) return this._warn("cancellation is disabled");

    var promise = this;
    var child = promise;
    while (promise._isCancellable()) {
        if (!promise._cancelBy(child)) {
            if (child._isFollowing()) {
                child._followee().cancel();
            } else {
                child._cancelBranched();
            }
            break;
        }

        var parent = promise._cancellationParent;
        if (parent == null || !parent._isCancellable()) {
            if (promise._isFollowing()) {
                promise._followee().cancel();
            } else {
                promise._cancelBranched();
            }
            break;
        } else {
            if (promise._isFollowing()) promise._followee().cancel();
            promise._setWillBeCancelled();
            child = promise;
            promise = parent;
        }
    }
};

Promise.prototype._branchHasCancelled = function() {
    this._branchesRemainingToCancel--;
};

Promise.prototype._enoughBranchesHaveCancelled = function() {
    return this._branchesRemainingToCancel === undefined ||
           this._branchesRemainingToCancel <= 0;
};

Promise.prototype._cancelBy = function(canceller) {
    if (canceller === this) {
        this._branchesRemainingToCancel = 0;
        this._invokeOnCancel();
        return true;
    } else {
        this._branchHasCancelled();
        if (this._enoughBranchesHaveCancelled()) {
            this._invokeOnCancel();
            return true;
        }
    }
    return false;
};

Promise.prototype._cancelBranched = function() {
    if (this._enoughBranchesHaveCancelled()) {
        this._cancel();
    }
};

Promise.prototype._cancel = function() {
    if (!this._isCancellable()) return;
    this._setCancelled();
    async.invoke(this._cancelPromises, this, undefined);
};

Promise.prototype._cancelPromises = function() {
    if (this._length() > 0) this._settlePromises();
};

Promise.prototype._unsetOnCancel = function() {
    this._onCancelField = undefined;
};

Promise.prototype._isCancellable = function() {
    return this.isPending() && !this._isCancelled();
};

Promise.prototype.isCancellable = function() {
    return this.isPending() && !this.isCancelled();
};

Promise.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
    if (util.isArray(onCancelCallback)) {
        for (var i = 0; i < onCancelCallback.length; ++i) {
            this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
        }
    } else if (onCancelCallback !== undefined) {
        if (typeof onCancelCallback === "function") {
            if (!internalOnly) {
                var e = tryCatch(onCancelCallback).call(this._boundValue());
                if (e === errorObj) {
                    this._attachExtraTrace(e.e);
                    async.throwLater(e.e);
                }
            }
        } else {
            onCancelCallback._resultCancelled(this);
        }
    }
};

Promise.prototype._invokeOnCancel = function() {
    var onCancelCallback = this._onCancel();
    this._unsetOnCancel();
    async.invoke(this._doInvokeOnCancel, this, onCancelCallback);
};

Promise.prototype._invokeInternalOnCancel = function() {
    if (this._isCancellable()) {
        this._doInvokeOnCancel(this._onCancel(), true);
        this._unsetOnCancel();
    }
};

Promise.prototype._resultCancelled = function() {
    this.cancel();
};

};

},{"./util":36}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util");
var getKeys = _dereq_("./es5").keys;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function catchFilter(instances, cb, promise) {
    return function(e) {
        var boundTo = promise._boundValue();
        predicateLoop: for (var i = 0; i < instances.length; ++i) {
            var item = instances[i];

            if (item === Error ||
                (item != null && item.prototype instanceof Error)) {
                if (e instanceof item) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (typeof item === "function") {
                var matchesPredicate = tryCatch(item).call(boundTo, e);
                if (matchesPredicate === errorObj) {
                    return matchesPredicate;
                } else if (matchesPredicate) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (util.isObject(e)) {
                var keys = getKeys(item);
                for (var j = 0; j < keys.length; ++j) {
                    var key = keys[j];
                    if (item[key] != e[key]) {
                        continue predicateLoop;
                    }
                }
                return tryCatch(cb).call(boundTo, e);
            }
        }
        return NEXT_FILTER;
    };
}

return catchFilter;
};

},{"./es5":13,"./util":36}],8:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var longStackTraces = false;
var contextStack = [];

Promise.prototype._promiseCreated = function() {};
Promise.prototype._pushContext = function() {};
Promise.prototype._popContext = function() {return null;};
Promise._peekContext = Promise.prototype._peekContext = function() {};

function Context() {
    this._trace = new Context.CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (this._trace !== undefined) {
        this._trace._promiseCreated = null;
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (this._trace !== undefined) {
        var trace = contextStack.pop();
        var ret = trace._promiseCreated;
        trace._promiseCreated = null;
        return ret;
    }
    return null;
};

function createContext() {
    if (longStackTraces) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}
Context.CapturedTrace = null;
Context.create = createContext;
Context.deactivateLongStackTraces = function() {};
Context.activateLongStackTraces = function() {
    var Promise_pushContext = Promise.prototype._pushContext;
    var Promise_popContext = Promise.prototype._popContext;
    var Promise_PeekContext = Promise._peekContext;
    var Promise_peekContext = Promise.prototype._peekContext;
    var Promise_promiseCreated = Promise.prototype._promiseCreated;
    Context.deactivateLongStackTraces = function() {
        Promise.prototype._pushContext = Promise_pushContext;
        Promise.prototype._popContext = Promise_popContext;
        Promise._peekContext = Promise_PeekContext;
        Promise.prototype._peekContext = Promise_peekContext;
        Promise.prototype._promiseCreated = Promise_promiseCreated;
        longStackTraces = false;
    };
    longStackTraces = true;
    Promise.prototype._pushContext = Context.prototype._pushContext;
    Promise.prototype._popContext = Context.prototype._popContext;
    Promise._peekContext = Promise.prototype._peekContext = peekContext;
    Promise.prototype._promiseCreated = function() {
        var ctx = this._peekContext();
        if (ctx && ctx._promiseCreated == null) ctx._promiseCreated = this;
    };
};
return Context;
};

},{}],9:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, Context,
    enableAsyncHooks, disableAsyncHooks) {
var async = Promise._async;
var Warning = _dereq_("./errors").Warning;
var util = _dereq_("./util");
var es5 = _dereq_("./es5");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/;
var nodeFramePattern = /\((?:timers\.js):\d+:\d+\)/;
var parseLinePattern = /[\/<\(](.+?):(\d+):(\d+)\)?\s*$/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var printWarning;
var debugging = !!(util.env("BLUEBIRD_DEBUG") != 0 &&
                        (true ||
                         util.env("BLUEBIRD_DEBUG") ||
                         util.env("NODE_ENV") === "development"));

var warnings = !!(util.env("BLUEBIRD_WARNINGS") != 0 &&
    (debugging || util.env("BLUEBIRD_WARNINGS")));

var longStackTraces = !!(util.env("BLUEBIRD_LONG_STACK_TRACES") != 0 &&
    (debugging || util.env("BLUEBIRD_LONG_STACK_TRACES")));

var wForgottenReturn = util.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 &&
    (warnings || !!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));

var deferUnhandledRejectionCheck;
(function() {
    var promises = [];

    function unhandledRejectionCheck() {
        for (var i = 0; i < promises.length; ++i) {
            promises[i]._notifyUnhandledRejection();
        }
        unhandledRejectionClear();
    }

    function unhandledRejectionClear() {
        promises.length = 0;
    }

    if (typeof document === "object" && document.createElement) {
        deferUnhandledRejectionCheck = (function() {
            var iframeSetTimeout;

            function checkIframe() {
                if (document.body) {
                    var iframe = document.createElement("iframe");
                    document.body.appendChild(iframe);
                    if (iframe.contentWindow &&
                        iframe.contentWindow.setTimeout) {
                        iframeSetTimeout = iframe.contentWindow.setTimeout;
                    }
                    document.body.removeChild(iframe);
                }
            }
            checkIframe();
            return function(promise) {
                promises.push(promise);
                if (iframeSetTimeout) {
                    iframeSetTimeout(unhandledRejectionCheck, 1);
                } else {
                    checkIframe();
                }
            };
        })();
    } else {
        deferUnhandledRejectionCheck = function(promise) {
            promises.push(promise);
            setTimeout(unhandledRejectionCheck, 1);
        };
    }

    es5.defineProperty(Promise, "_unhandledRejectionCheck", {
        value: unhandledRejectionCheck
    });
    es5.defineProperty(Promise, "_unhandledRejectionClear", {
        value: unhandledRejectionClear
    });
})();

Promise.prototype.suppressUnhandledRejections = function() {
    var target = this._target();
    target._bitField = ((target._bitField & (~1048576)) |
                      524288);
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    if ((this._bitField & 524288) !== 0) return;
    this._setRejectionIsUnhandled();
    deferUnhandledRejectionCheck(this);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._setReturnedNonUndefined = function() {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._returnedNonUndefined = function() {
    return (this._bitField & 268435456) !== 0;
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._settledValue();
        this._setUnhandledRejectionIsNotified();
        fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 262144;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~262144);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 262144) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 1048576;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~1048576);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._warn = function(message, shouldUseOwnTrace, promise) {
    return warn(message, shouldUseOwnTrace, promise || this);
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    var context = Promise._getContext();
    possiblyUnhandledRejection = util.contextBind(context, fn);
};

Promise.onUnhandledRejectionHandled = function (fn) {
    var context = Promise._getContext();
    unhandledRejectionHandled = util.contextBind(context, fn);
};

var disableLongStackTraces = function() {};
Promise.longStackTraces = function () {
    if (async.haveItemsQueued() && !config.longStackTraces) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    if (!config.longStackTraces && longStackTracesIsSupported()) {
        var Promise_captureStackTrace = Promise.prototype._captureStackTrace;
        var Promise_attachExtraTrace = Promise.prototype._attachExtraTrace;
        var Promise_dereferenceTrace = Promise.prototype._dereferenceTrace;
        config.longStackTraces = true;
        disableLongStackTraces = function() {
            if (async.haveItemsQueued() && !config.longStackTraces) {
                throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
            }
            Promise.prototype._captureStackTrace = Promise_captureStackTrace;
            Promise.prototype._attachExtraTrace = Promise_attachExtraTrace;
            Promise.prototype._dereferenceTrace = Promise_dereferenceTrace;
            Context.deactivateLongStackTraces();
            config.longStackTraces = false;
        };
        Promise.prototype._captureStackTrace = longStackTracesCaptureStackTrace;
        Promise.prototype._attachExtraTrace = longStackTracesAttachExtraTrace;
        Promise.prototype._dereferenceTrace = longStackTracesDereferenceTrace;
        Context.activateLongStackTraces();
    }
};

Promise.hasLongStackTraces = function () {
    return config.longStackTraces && longStackTracesIsSupported();
};


var legacyHandlers = {
    unhandledrejection: {
        before: function() {
            var ret = util.global.onunhandledrejection;
            util.global.onunhandledrejection = null;
            return ret;
        },
        after: function(fn) {
            util.global.onunhandledrejection = fn;
        }
    },
    rejectionhandled: {
        before: function() {
            var ret = util.global.onrejectionhandled;
            util.global.onrejectionhandled = null;
            return ret;
        },
        after: function(fn) {
            util.global.onrejectionhandled = fn;
        }
    }
};

var fireDomEvent = (function() {
    var dispatch = function(legacy, e) {
        if (legacy) {
            var fn;
            try {
                fn = legacy.before();
                return !util.global.dispatchEvent(e);
            } finally {
                legacy.after(fn);
            }
        } else {
            return !util.global.dispatchEvent(e);
        }
    };
    try {
        if (typeof CustomEvent === "function") {
            var event = new CustomEvent("CustomEvent");
            util.global.dispatchEvent(event);
            return function(name, event) {
                name = name.toLowerCase();
                var eventData = {
                    detail: event,
                    cancelable: true
                };
                var domEvent = new CustomEvent(name, eventData);
                es5.defineProperty(
                    domEvent, "promise", {value: event.promise});
                es5.defineProperty(
                    domEvent, "reason", {value: event.reason});

                return dispatch(legacyHandlers[name], domEvent);
            };
        } else if (typeof Event === "function") {
            var event = new Event("CustomEvent");
            util.global.dispatchEvent(event);
            return function(name, event) {
                name = name.toLowerCase();
                var domEvent = new Event(name, {
                    cancelable: true
                });
                domEvent.detail = event;
                es5.defineProperty(domEvent, "promise", {value: event.promise});
                es5.defineProperty(domEvent, "reason", {value: event.reason});
                return dispatch(legacyHandlers[name], domEvent);
            };
        } else {
            var event = document.createEvent("CustomEvent");
            event.initCustomEvent("testingtheevent", false, true, {});
            util.global.dispatchEvent(event);
            return function(name, event) {
                name = name.toLowerCase();
                var domEvent = document.createEvent("CustomEvent");
                domEvent.initCustomEvent(name, false, true,
                    event);
                return dispatch(legacyHandlers[name], domEvent);
            };
        }
    } catch (e) {}
    return function() {
        return false;
    };
})();

var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function() {
            return process.emit.apply(process, arguments);
        };
    } else {
        if (!util.global) {
            return function() {
                return false;
            };
        }
        return function(name) {
            var methodName = "on" + name.toLowerCase();
            var method = util.global[methodName];
            if (!method) return false;
            method.apply(util.global, [].slice.call(arguments, 1));
            return true;
        };
    }
})();

function generatePromiseLifecycleEventObject(name, promise) {
    return {promise: promise};
}

var eventToObjectGenerator = {
    promiseCreated: generatePromiseLifecycleEventObject,
    promiseFulfilled: generatePromiseLifecycleEventObject,
    promiseRejected: generatePromiseLifecycleEventObject,
    promiseResolved: generatePromiseLifecycleEventObject,
    promiseCancelled: generatePromiseLifecycleEventObject,
    promiseChained: function(name, promise, child) {
        return {promise: promise, child: child};
    },
    warning: function(name, warning) {
        return {warning: warning};
    },
    unhandledRejection: function (name, reason, promise) {
        return {reason: reason, promise: promise};
    },
    rejectionHandled: generatePromiseLifecycleEventObject
};

var activeFireEvent = function (name) {
    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent.apply(null, arguments);
    } catch (e) {
        async.throwLater(e);
        globalEventFired = true;
    }

    var domEventFired = false;
    try {
        domEventFired = fireDomEvent(name,
                    eventToObjectGenerator[name].apply(null, arguments));
    } catch (e) {
        async.throwLater(e);
        domEventFired = true;
    }

    return domEventFired || globalEventFired;
};

Promise.config = function(opts) {
    opts = Object(opts);
    if ("longStackTraces" in opts) {
        if (opts.longStackTraces) {
            Promise.longStackTraces();
        } else if (!opts.longStackTraces && Promise.hasLongStackTraces()) {
            disableLongStackTraces();
        }
    }
    if ("warnings" in opts) {
        var warningsOption = opts.warnings;
        config.warnings = !!warningsOption;
        wForgottenReturn = config.warnings;

        if (util.isObject(warningsOption)) {
            if ("wForgottenReturn" in warningsOption) {
                wForgottenReturn = !!warningsOption.wForgottenReturn;
            }
        }
    }
    if ("cancellation" in opts && opts.cancellation && !config.cancellation) {
        if (async.haveItemsQueued()) {
            throw new Error(
                "cannot enable cancellation after promises are in use");
        }
        Promise.prototype._clearCancellationData =
            cancellationClearCancellationData;
        Promise.prototype._propagateFrom = cancellationPropagateFrom;
        Promise.prototype._onCancel = cancellationOnCancel;
        Promise.prototype._setOnCancel = cancellationSetOnCancel;
        Promise.prototype._attachCancellationCallback =
            cancellationAttachCancellationCallback;
        Promise.prototype._execute = cancellationExecute;
        propagateFromFunction = cancellationPropagateFrom;
        config.cancellation = true;
    }
    if ("monitoring" in opts) {
        if (opts.monitoring && !config.monitoring) {
            config.monitoring = true;
            Promise.prototype._fireEvent = activeFireEvent;
        } else if (!opts.monitoring && config.monitoring) {
            config.monitoring = false;
            Promise.prototype._fireEvent = defaultFireEvent;
        }
    }
    if ("asyncHooks" in opts && util.nodeSupportsAsyncResource) {
        var prev = config.asyncHooks;
        var cur = !!opts.asyncHooks;
        if (prev !== cur) {
            config.asyncHooks = cur;
            if (cur) {
                enableAsyncHooks();
            } else {
                disableAsyncHooks();
            }
        }
    }
    return Promise;
};

function defaultFireEvent() { return false; }

Promise.prototype._fireEvent = defaultFireEvent;
Promise.prototype._execute = function(executor, resolve, reject) {
    try {
        executor(resolve, reject);
    } catch (e) {
        return e;
    }
};
Promise.prototype._onCancel = function () {};
Promise.prototype._setOnCancel = function (handler) { ; };
Promise.prototype._attachCancellationCallback = function(onCancel) {
    ;
};
Promise.prototype._captureStackTrace = function () {};
Promise.prototype._attachExtraTrace = function () {};
Promise.prototype._dereferenceTrace = function () {};
Promise.prototype._clearCancellationData = function() {};
Promise.prototype._propagateFrom = function (parent, flags) {
    ;
    ;
};

function cancellationExecute(executor, resolve, reject) {
    var promise = this;
    try {
        executor(resolve, reject, function(onCancel) {
            if (typeof onCancel !== "function") {
                throw new TypeError("onCancel must be a function, got: " +
                                    util.toString(onCancel));
            }
            promise._attachCancellationCallback(onCancel);
        });
    } catch (e) {
        return e;
    }
}

function cancellationAttachCancellationCallback(onCancel) {
    if (!this._isCancellable()) return this;

    var previousOnCancel = this._onCancel();
    if (previousOnCancel !== undefined) {
        if (util.isArray(previousOnCancel)) {
            previousOnCancel.push(onCancel);
        } else {
            this._setOnCancel([previousOnCancel, onCancel]);
        }
    } else {
        this._setOnCancel(onCancel);
    }
}

function cancellationOnCancel() {
    return this._onCancelField;
}

function cancellationSetOnCancel(onCancel) {
    this._onCancelField = onCancel;
}

function cancellationClearCancellationData() {
    this._cancellationParent = undefined;
    this._onCancelField = undefined;
}

function cancellationPropagateFrom(parent, flags) {
    if ((flags & 1) !== 0) {
        this._cancellationParent = parent;
        var branchesRemainingToCancel = parent._branchesRemainingToCancel;
        if (branchesRemainingToCancel === undefined) {
            branchesRemainingToCancel = 0;
        }
        parent._branchesRemainingToCancel = branchesRemainingToCancel + 1;
    }
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}

function bindingPropagateFrom(parent, flags) {
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}
var propagateFromFunction = bindingPropagateFrom;

function boundValueFunction() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
}

function longStackTracesCaptureStackTrace() {
    this._trace = new CapturedTrace(this._peekContext());
}

function longStackTracesAttachExtraTrace(error, ignoreSelf) {
    if (canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
}

function longStackTracesDereferenceTrace() {
    this._trace = undefined;
}

function checkForgottenReturns(returnValue, promiseCreated, name, promise,
                               parent) {
    if (returnValue === undefined && promiseCreated !== null &&
        wForgottenReturn) {
        if (parent !== undefined && parent._returnedNonUndefined()) return;
        if ((promise._bitField & 65535) === 0) return;

        if (name) name = name + " ";
        var handlerLine = "";
        var creatorLine = "";
        if (promiseCreated._trace) {
            var traceLines = promiseCreated._trace.stack.split("\n");
            var stack = cleanStack(traceLines);
            for (var i = stack.length - 1; i >= 0; --i) {
                var line = stack[i];
                if (!nodeFramePattern.test(line)) {
                    var lineMatches = line.match(parseLinePattern);
                    if (lineMatches) {
                        handlerLine  = "at " + lineMatches[1] +
                            ":" + lineMatches[2] + ":" + lineMatches[3] + " ";
                    }
                    break;
                }
            }

            if (stack.length > 0) {
                var firstUserLine = stack[0];
                for (var i = 0; i < traceLines.length; ++i) {

                    if (traceLines[i] === firstUserLine) {
                        if (i > 0) {
                            creatorLine = "\n" + traceLines[i - 1];
                        }
                        break;
                    }
                }

            }
        }
        var msg = "a promise was created in a " + name +
            "handler " + handlerLine + "but was not returned from it, " +
            "see http://goo.gl/rRqMUw" +
            creatorLine;
        promise._warn(msg, true, promiseCreated);
    }
}

function deprecated(name, replacement) {
    var message = name +
        " is deprecated and will be removed in a future version.";
    if (replacement) message += " Use " + replacement + " instead.";
    return warn(message);
}

function warn(message, shouldUseOwnTrace, promise) {
    if (!config.warnings) return;
    var warning = new Warning(message);
    var ctx;
    if (shouldUseOwnTrace) {
        promise._attachExtraTrace(warning);
    } else if (config.longStackTraces && (ctx = Promise._peekContext())) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }

    if (!activeFireEvent("warning", warning)) {
        formatAndLogError(warning, "", true);
    }
}

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = "    (No stack trace)" === line ||
            stackFramePattern.test(line);
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0 && error.name != "SyntaxError") {
        stack = stack.slice(i);
    }
    return stack;
}

function parseStackAndMessage(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: error.name == "SyntaxError" ? stack : cleanStack(stack)
    };
}

function formatAndLogError(error, title, isSoft) {
    if (typeof console !== "undefined") {
        var message;
        if (util.isObject(error)) {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof printWarning === "function") {
            printWarning(message, isSoft);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
}

function fireRejectionEvent(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    if (name === "unhandledRejection") {
        if (!activeFireEvent(name, reason, promise) && !localEventFired) {
            formatAndLogError(reason, "Unhandled rejection ");
        }
    } else {
        activeFireEvent(name, promise);
    }
}

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj && typeof obj.toString === "function"
            ? obj.toString() : util.toString(obj);
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

function longStackTracesIsSupported() {
    return typeof captureStackTrace === "function";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}

function setBounds(firstLineError, lastLineError) {
    if (!longStackTracesIsSupported()) return;
    var firstStackLines = (firstLineError.stack || "").split("\n");
    var lastStackLines = (lastLineError.stack || "").split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
}

function CapturedTrace(parent) {
    this._parent = parent;
    this._promisesCreated = 0;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);
Context.CapturedTrace = CapturedTrace;

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit += 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit += 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit -= 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit += 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit -= 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    printWarning = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        printWarning = function(message, isSoft) {
            var color = isSoft ? "\u001b[33m" : "\u001b[31m";
            console.warn(color + message + "\u001b[0m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        printWarning = function(message, isSoft) {
            console.warn("%c" + message,
                        isSoft ? "color: darkorange" : "color: red");
        };
    }
}

var config = {
    warnings: warnings,
    longStackTraces: false,
    cancellation: false,
    monitoring: false,
    asyncHooks: false
};

if (longStackTraces) Promise.longStackTraces();

return {
    asyncHooks: function() {
        return config.asyncHooks;
    },
    longStackTraces: function() {
        return config.longStackTraces;
    },
    warnings: function() {
        return config.warnings;
    },
    cancellation: function() {
        return config.cancellation;
    },
    monitoring: function() {
        return config.monitoring;
    },
    propagateFromFunction: function() {
        return propagateFromFunction;
    },
    boundValueFunction: function() {
        return boundValueFunction;
    },
    checkForgottenReturns: checkForgottenReturns,
    setBounds: setBounds,
    warn: warn,
    deprecated: deprecated,
    CapturedTrace: CapturedTrace,
    fireDomEvent: fireDomEvent,
    fireGlobalEvent: fireGlobalEvent
};
};

},{"./errors":12,"./es5":13,"./util":36}],10:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function returner() {
    return this.value;
}
function thrower() {
    throw this.reason;
}

Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (value instanceof Promise) value.suppressUnhandledRejections();
    return this._then(
        returner, undefined, undefined, {value: value}, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    return this._then(
        thrower, undefined, undefined, {reason: reason}, undefined);
};

Promise.prototype.catchThrow = function (reason) {
    if (arguments.length <= 1) {
        return this._then(
            undefined, thrower, undefined, {reason: reason}, undefined);
    } else {
        var _reason = arguments[1];
        var handler = function() {throw _reason;};
        return this.caught(reason, handler);
    }
};

Promise.prototype.catchReturn = function (value) {
    if (arguments.length <= 1) {
        if (value instanceof Promise) value.suppressUnhandledRejections();
        return this._then(
            undefined, returner, undefined, {value: value}, undefined);
    } else {
        var _value = arguments[1];
        if (_value instanceof Promise) _value.suppressUnhandledRejections();
        var handler = function() {return _value;};
        return this.caught(value, handler);
    }
};
};

},{}],11:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;
var PromiseAll = Promise.all;

function promiseAllThis() {
    return PromiseAll(this);
}

function PromiseMapSeries(promises, fn) {
    return PromiseReduce(promises, fn, INTERNAL, INTERNAL);
}

Promise.prototype.each = function (fn) {
    return PromiseReduce(this, fn, INTERNAL, 0)
              ._then(promiseAllThis, undefined, undefined, this, undefined);
};

Promise.prototype.mapSeries = function (fn) {
    return PromiseReduce(this, fn, INTERNAL, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseReduce(promises, fn, INTERNAL, 0)
              ._then(promiseAllThis, undefined, undefined, promises, undefined);
};

Promise.mapSeries = PromiseMapSeries;
};


},{}],12:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5");
var Objectfreeze = es5.freeze;
var util = _dereq_("./util");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    es5.defineProperty(Error, "__BluebirdErrorTypes__", {
        value: errorTypes,
        writable: false,
        enumerable: false,
        configurable: false
    });
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5":13,"./util":36}],13:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],14:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],15:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, tryConvertToPromise, NEXT_FILTER) {
var util = _dereq_("./util");
var CancellationError = Promise.CancellationError;
var errorObj = util.errorObj;
var catchFilter = _dereq_("./catch_filter")(NEXT_FILTER);

function PassThroughHandlerContext(promise, type, handler) {
    this.promise = promise;
    this.type = type;
    this.handler = handler;
    this.called = false;
    this.cancelPromise = null;
}

PassThroughHandlerContext.prototype.isFinallyHandler = function() {
    return this.type === 0;
};

function FinallyHandlerCancelReaction(finallyHandler) {
    this.finallyHandler = finallyHandler;
}

FinallyHandlerCancelReaction.prototype._resultCancelled = function() {
    checkCancel(this.finallyHandler);
};

function checkCancel(ctx, reason) {
    if (ctx.cancelPromise != null) {
        if (arguments.length > 1) {
            ctx.cancelPromise._reject(reason);
        } else {
            ctx.cancelPromise._cancel();
        }
        ctx.cancelPromise = null;
        return true;
    }
    return false;
}

function succeed() {
    return finallyHandler.call(this, this.promise._target()._settledValue());
}
function fail(reason) {
    if (checkCancel(this, reason)) return;
    errorObj.e = reason;
    return errorObj;
}
function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    if (!this.called) {
        this.called = true;
        var ret = this.isFinallyHandler()
            ? handler.call(promise._boundValue())
            : handler.call(promise._boundValue(), reasonOrValue);
        if (ret === NEXT_FILTER) {
            return ret;
        } else if (ret !== undefined) {
            promise._setReturnedNonUndefined();
            var maybePromise = tryConvertToPromise(ret, promise);
            if (maybePromise instanceof Promise) {
                if (this.cancelPromise != null) {
                    if (maybePromise._isCancelled()) {
                        var reason =
                            new CancellationError("late cancellation observer");
                        promise._attachExtraTrace(reason);
                        errorObj.e = reason;
                        return errorObj;
                    } else if (maybePromise.isPending()) {
                        maybePromise._attachCancellationCallback(
                            new FinallyHandlerCancelReaction(this));
                    }
                }
                return maybePromise._then(
                    succeed, fail, undefined, this, undefined);
            }
        }
    }

    if (promise.isRejected()) {
        checkCancel(this);
        errorObj.e = reasonOrValue;
        return errorObj;
    } else {
        checkCancel(this);
        return reasonOrValue;
    }
}

Promise.prototype._passThrough = function(handler, type, success, fail) {
    if (typeof handler !== "function") return this.then();
    return this._then(success,
                      fail,
                      undefined,
                      new PassThroughHandlerContext(this, type, handler),
                      undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThrough(handler,
                             0,
                             finallyHandler,
                             finallyHandler);
};


Promise.prototype.tap = function (handler) {
    return this._passThrough(handler, 1, finallyHandler);
};

Promise.prototype.tapCatch = function (handlerOrPredicate) {
    var len = arguments.length;
    if(len === 1) {
        return this._passThrough(handlerOrPredicate,
                                 1,
                                 undefined,
                                 finallyHandler);
    } else {
         var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
                catchInstances[j++] = item;
            } else {
                return Promise.reject(new TypeError(
                    "tapCatch statement predicate: "
                    + "expecting an object but got " + util.classString(item)
                ));
            }
        }
        catchInstances.length = j;
        var handler = arguments[i];
        return this._passThrough(catchFilter(catchInstances, handler, this),
                                 1,
                                 undefined,
                                 finallyHandler);
    }

};

return PassThroughHandlerContext;
};

},{"./catch_filter":7,"./util":36}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise,
                          Proxyable,
                          debug) {
var errors = _dereq_("./errors");
var TypeError = errors.TypeError;
var util = _dereq_("./util");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    if (debug.cancellation()) {
        var internal = new Promise(INTERNAL);
        var _finallyPromise = this._finallyPromise = new Promise(INTERNAL);
        this._promise = internal.lastly(function() {
            return _finallyPromise;
        });
        internal._captureStackTrace();
        internal._setOnCancel(this);
    } else {
        var promise = this._promise = new Promise(INTERNAL);
        promise._captureStackTrace();
    }
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
    this._yieldedPromise = null;
    this._cancellationPhase = false;
}
util.inherits(PromiseSpawn, Proxyable);

PromiseSpawn.prototype._isResolved = function() {
    return this._promise === null;
};

PromiseSpawn.prototype._cleanup = function() {
    this._promise = this._generator = null;
    if (debug.cancellation() && this._finallyPromise !== null) {
        this._finallyPromise._fulfill();
        this._finallyPromise = null;
    }
};

PromiseSpawn.prototype._promiseCancelled = function() {
    if (this._isResolved()) return;
    var implementsReturn = typeof this._generator["return"] !== "undefined";

    var result;
    if (!implementsReturn) {
        var reason = new Promise.CancellationError(
            "generator .return() sentinel");
        Promise.coroutine.returnSentinel = reason;
        this._promise._attachExtraTrace(reason);
        this._promise._pushContext();
        result = tryCatch(this._generator["throw"]).call(this._generator,
                                                         reason);
        this._promise._popContext();
    } else {
        this._promise._pushContext();
        result = tryCatch(this._generator["return"]).call(this._generator,
                                                          undefined);
        this._promise._popContext();
    }
    this._cancellationPhase = true;
    this._yieldedPromise = null;
    this._continue(result);
};

PromiseSpawn.prototype._promiseFulfilled = function(value) {
    this._yieldedPromise = null;
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._promiseRejected = function(reason) {
    this._yieldedPromise = null;
    this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._resultCancelled = function() {
    if (this._yieldedPromise instanceof Promise) {
        var promise = this._yieldedPromise;
        this._yieldedPromise = null;
        promise.cancel();
    }
};

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._promiseFulfilled(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    var promise = this._promise;
    if (result === errorObj) {
        this._cleanup();
        if (this._cancellationPhase) {
            return promise.cancel();
        } else {
            return promise._rejectCallback(result.e, false);
        }
    }

    var value = result.value;
    if (result.done === true) {
        this._cleanup();
        if (this._cancellationPhase) {
            return promise.cancel();
        } else {
            return promise._resolveCallback(value);
        }
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._promiseRejected(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a\u000a".replace("%s", String(value)) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise = maybePromise._target();
        var bitField = maybePromise._bitField;
        ;
        if (((bitField & 50397184) === 0)) {
            this._yieldedPromise = maybePromise;
            maybePromise._proxy(this, null);
        } else if (((bitField & 33554432) !== 0)) {
            Promise._async.invoke(
                this._promiseFulfilled, this, maybePromise._value()
            );
        } else if (((bitField & 16777216) !== 0)) {
            Promise._async.invoke(
                this._promiseRejected, this, maybePromise._reason()
            );
        } else {
            this._promiseCancelled();
        }
    }
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        var ret = spawn.promise();
        spawn._generator = generator;
        spawn._promiseFulfilled(undefined);
        return ret;
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    debug.deprecated("Promise.spawn()", "Promise.coroutine()");
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors":12,"./util":36}],17:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL, async) {
var util = _dereq_("./util");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!true) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var promiseSetter = function(i) {
        return new Function("promise", "holder", "                           \n\
            'use strict';                                                    \n\
            holder.pIndex = promise;                                         \n\
            ".replace(/Index/g, i));
    };

    var generateHolderClass = function(total) {
        var props = new Array(total);
        for (var i = 0; i < props.length; ++i) {
            props[i] = "this.p" + (i+1);
        }
        var assignment = props.join(" = ") + " = null;";
        var cancellationCode= "var promise;\n" + props.map(function(prop) {
            return "                                                         \n\
                promise = " + prop + ";                                      \n\
                if (promise instanceof Promise) {                            \n\
                    promise.cancel();                                        \n\
                }                                                            \n\
            ";
        }).join("\n");
        var passedArguments = props.join(", ");
        var name = "Holder$" + total;


        var code = "return function(tryCatch, errorObj, Promise, async) {    \n\
            'use strict';                                                    \n\
            function [TheName](fn) {                                         \n\
                [TheProperties]                                              \n\
                this.fn = fn;                                                \n\
                this.asyncNeeded = true;                                     \n\
                this.now = 0;                                                \n\
            }                                                                \n\
                                                                             \n\
            [TheName].prototype._callFunction = function(promise) {          \n\
                promise._pushContext();                                      \n\
                var ret = tryCatch(this.fn)([ThePassedArguments]);           \n\
                promise._popContext();                                       \n\
                if (ret === errorObj) {                                      \n\
                    promise._rejectCallback(ret.e, false);                   \n\
                } else {                                                     \n\
                    promise._resolveCallback(ret);                           \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype.checkFulfillment = function(promise) {       \n\
                var now = ++this.now;                                        \n\
                if (now === [TheTotal]) {                                    \n\
                    if (this.asyncNeeded) {                                  \n\
                        async.invoke(this._callFunction, this, promise);     \n\
                    } else {                                                 \n\
                        this._callFunction(promise);                         \n\
                    }                                                        \n\
                                                                             \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype._resultCancelled = function() {              \n\
                [CancellationCode]                                           \n\
            };                                                               \n\
                                                                             \n\
            return [TheName];                                                \n\
        }(tryCatch, errorObj, Promise, async);                               \n\
        ";

        code = code.replace(/\[TheName\]/g, name)
            .replace(/\[TheTotal\]/g, total)
            .replace(/\[ThePassedArguments\]/g, passedArguments)
            .replace(/\[TheProperties\]/g, assignment)
            .replace(/\[CancellationCode\]/g, cancellationCode);

        return new Function("tryCatch", "errorObj", "Promise", "async", code)
                           (tryCatch, errorObj, Promise, async);
    };

    var holderClasses = [];
    var thenCallbacks = [];
    var promiseSetters = [];

    for (var i = 0; i < 8; ++i) {
        holderClasses.push(generateHolderClass(i + 1));
        thenCallbacks.push(thenCallback(i + 1));
        promiseSetters.push(promiseSetter(i + 1));
    }

    reject = function (reason) {
        this._reject(reason);
    };
}}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!true) {
            if (last <= 8 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var HolderClass = holderClasses[last - 1];
                var holder = new HolderClass(fn);
                var callbacks = thenCallbacks;

                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        var bitField = maybePromise._bitField;
                        ;
                        if (((bitField & 50397184) === 0)) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                            promiseSetters[i](maybePromise, holder);
                            holder.asyncNeeded = false;
                        } else if (((bitField & 33554432) !== 0)) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else if (((bitField & 16777216) !== 0)) {
                            ret._reject(maybePromise._reason());
                        } else {
                            ret._cancel();
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }

                if (!ret._isFateSealed()) {
                    if (holder.asyncNeeded) {
                        var context = Promise._getContext();
                        holder.fn = util.contextBind(context, holder.fn);
                    }
                    ret._setAsyncGuaranteed();
                    ret._setOnCancel(holder);
                }
                return ret;
            }
        }
    }
    var args = [].slice.call(arguments);;
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util":36}],18:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL,
                          debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var async = Promise._async;

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    var context = Promise._getContext();
    this._callback = util.contextBind(context, fn);
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = [];
    async.invoke(this._asyncInit, this, undefined);
    if (util.isArray(promises)) {
        for (var i = 0; i < promises.length; ++i) {
            var maybePromise = promises[i];
            if (maybePromise instanceof Promise) {
                maybePromise.suppressUnhandledRejections();
            }
        }
    }
}
util.inherits(MappingPromiseArray, PromiseArray);

MappingPromiseArray.prototype._asyncInit = function() {
    this._init$(undefined, -2);
};

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;

    if (index < 0) {
        index = (index * -1) - 1;
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return true;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return false;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var promise = this._promise;
        var callback = this._callback;
        var receiver = promise._boundValue();
        promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        var promiseCreated = promise._popContext();
        debug.checkForgottenReturns(
            ret,
            promiseCreated,
            preservedValues !== null ? "Promise.filter" : "Promise.map",
            promise
        );
        if (ret === errorObj) {
            this._reject(ret.e);
            return true;
        }

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            var bitField = maybePromise._bitField;
            ;
            if (((bitField & 50397184) === 0)) {
                if (limit >= 1) this._inFlight++;
                values[index] = maybePromise;
                maybePromise._proxy(this, (index + 1) * -1);
                return false;
            } else if (((bitField & 33554432) !== 0)) {
                ret = maybePromise._value();
            } else if (((bitField & 16777216) !== 0)) {
                this._reject(maybePromise._reason());
                return true;
            } else {
                this._cancel();
                return true;
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }
        return true;
    }
    return false;
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }

    var limit = 0;
    if (options !== undefined) {
        if (typeof options === "object" && options !== null) {
            if (typeof options.concurrency !== "number") {
                return Promise.reject(
                    new TypeError("'concurrency' must be a number but it is " +
                                    util.classString(options.concurrency)));
            }
            limit = options.concurrency;
        } else {
            return Promise.reject(new TypeError(
                            "options argument must be an object but it is " +
                             util.classString(options)));
        }
    }
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter).promise();
}

Promise.prototype.map = function (fn, options) {
    return map(this, fn, options, null);
};

Promise.map = function (promises, fn, options, _filter) {
    return map(promises, fn, options, _filter);
};


};

},{"./util":36}],19:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection, debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("expecting a function but got " + util.classString(fn));
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        var promiseCreated = ret._popContext();
        debug.checkForgottenReturns(
            value, promiseCreated, "Promise.method", ret);
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value;
    if (arguments.length > 1) {
        debug.deprecated("calling Promise.try with more than 1 argument");
        var arg = arguments[1];
        var ctx = arguments[2];
        value = util.isArray(arg) ? tryCatch(fn).apply(ctx, arg)
                                  : tryCatch(fn).call(ctx, arg);
    } else {
        value = tryCatch(fn)();
    }
    var promiseCreated = ret._popContext();
    debug.checkForgottenReturns(
        value, promiseCreated, "Promise.try", ret);
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util":36}],20:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors");
var OperationalError = errors.OperationalError;
var es5 = _dereq_("./es5");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise, multiArgs) {
    return function(err, value) {
        if (promise === null) return;
        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (!multiArgs) {
            promise._fulfill(value);
        } else {
            var args = [].slice.call(arguments, 1);;
            promise._fulfill(args);
        }
        promise = null;
    };
}

module.exports = nodebackForPromise;

},{"./errors":12,"./es5":13,"./util":36}],21:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var util = _dereq_("./util");
var async = Promise._async;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret =
        tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundValue();
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var newReason = new Error(reason + "");
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.asCallback = Promise.prototype.nodeify = function (nodeback,
                                                                     options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./util":36}],22:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var reflectHandler = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};
function Proxyable() {}
var UNDEFINED_BINDING = {};
var util = _dereq_("./util");
util.setReflectHandler(reflectHandler);

var getDomain = function() {
    var domain = process.domain;
    if (domain === undefined) {
        return null;
    }
    return domain;
};
var getContextDefault = function() {
    return null;
};
var getContextDomain = function() {
    return {
        domain: getDomain(),
        async: null
    };
};
var AsyncResource = util.isNode && util.nodeSupportsAsyncResource ?
    _dereq_("async_hooks").AsyncResource : null;
var getContextAsyncHooks = function() {
    return {
        domain: getDomain(),
        async: new AsyncResource("Bluebird::Promise")
    };
};
var getContext = util.isNode ? getContextDomain : getContextDefault;
util.notEnumerableProp(Promise, "_getContext", getContext);
var enableAsyncHooks = function() {
    getContext = getContextAsyncHooks;
    util.notEnumerableProp(Promise, "_getContext", getContextAsyncHooks);
};
var disableAsyncHooks = function() {
    getContext = getContextDomain;
    util.notEnumerableProp(Promise, "_getContext", getContextDomain);
};

var es5 = _dereq_("./es5");
var Async = _dereq_("./async");
var async = new Async();
es5.defineProperty(Promise, "_async", {value: async});
var errors = _dereq_("./errors");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
var CancellationError = Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {};
var tryConvertToPromise = _dereq_("./thenables")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array")(Promise, INTERNAL,
                               tryConvertToPromise, apiRejection, Proxyable);
var Context = _dereq_("./context")(Promise);
 /*jshint unused:false*/
var createContext = Context.create;

var debug = _dereq_("./debuggability")(Promise, Context,
    enableAsyncHooks, disableAsyncHooks);
var CapturedTrace = debug.CapturedTrace;
var PassThroughHandlerContext =
    _dereq_("./finally")(Promise, tryConvertToPromise, NEXT_FILTER);
var catchFilter = _dereq_("./catch_filter")(NEXT_FILTER);
var nodebackForPromise = _dereq_("./nodeback");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function check(self, executor) {
    if (self == null || self.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    if (typeof executor !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(executor));
    }

}

function Promise(executor) {
    if (executor !== INTERNAL) {
        check(this, executor);
    }
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._resolveFromExecutor(executor);
    this._promiseCreated();
    this._fireEvent("promiseCreated", this);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
                catchInstances[j++] = item;
            } else {
                return apiRejection("Catch statement predicate: " +
                    "expecting an object but got " + util.classString(item));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];

        if (typeof fn !== "function") {
            throw new TypeError("The last argument to .catch() " +
                "must be a function, got " + util.toString(fn));
        }
        return this.then(undefined, catchFilter(catchInstances, fn, this));
    }
    return this.then(undefined, fn);
};

Promise.prototype.reflect = function () {
    return this._then(reflectHandler,
        reflectHandler, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject) {
    if (debug.warnings() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, undefined, undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject) {
    var promise =
        this._then(didFulfill, didReject, undefined, undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    return this.all()._then(fn, undefined, undefined, APPLY, undefined);
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    if (arguments.length > 0) {
        this._warn(".all() was passed arguments but it does not take any");
    }
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.getNewLibraryCopy = module.exports;

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = Promise.fromCallback = function(fn) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    var multiArgs = arguments.length > 1 ? !!Object(arguments[1]).multiArgs
                                         : false;
    var result = tryCatch(fn)(nodebackForPromise(ret, multiArgs));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true);
    }
    if (!ret._isFateSealed()) ret._setAsyncGuaranteed();
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._setFulfilled();
        ret._rejectionHandler0 = obj;
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    return async.setScheduler(fn);
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    _,    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var promise = haveInternalData ? internalData : new Promise(INTERNAL);
    var target = this._target();
    var bitField = target._bitField;

    if (!haveInternalData) {
        promise._propagateFrom(this, 3);
        promise._captureStackTrace();
        if (receiver === undefined &&
            ((this._bitField & 2097152) !== 0)) {
            if (!((bitField & 50397184) === 0)) {
                receiver = this._boundValue();
            } else {
                receiver = target === this ? undefined : this._boundTo;
            }
        }
        this._fireEvent("promiseChained", this, promise);
    }

    var context = getContext();
    if (!((bitField & 50397184) === 0)) {
        var handler, value, settler = target._settlePromiseCtx;
        if (((bitField & 33554432) !== 0)) {
            value = target._rejectionHandler0;
            handler = didFulfill;
        } else if (((bitField & 16777216) !== 0)) {
            value = target._fulfillmentHandler0;
            handler = didReject;
            target._unsetRejectionIsUnhandled();
        } else {
            settler = target._settlePromiseLateCancellationObserver;
            value = new CancellationError("late cancellation observer");
            target._attachExtraTrace(value);
            handler = didReject;
        }

        async.invoke(settler, target, {
            handler: util.contextBind(context, handler),
            promise: promise,
            receiver: receiver,
            value: value
        });
    } else {
        target._addCallbacks(didFulfill, didReject, promise,
                receiver, context);
    }

    return promise;
};

Promise.prototype._length = function () {
    return this._bitField & 65535;
};

Promise.prototype._isFateSealed = function () {
    return (this._bitField & 117506048) !== 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 67108864) === 67108864;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -65536) |
        (len & 65535);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 33554432;
    this._fireEvent("promiseFulfilled", this);
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 16777216;
    this._fireEvent("promiseRejected", this);
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 67108864;
    this._fireEvent("promiseResolved", this);
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._unsetCancelled = function() {
    this._bitField = this._bitField & (~65536);
};

Promise.prototype._setCancelled = function() {
    this._bitField = this._bitField | 65536;
    this._fireEvent("promiseCancelled", this);
};

Promise.prototype._setWillBeCancelled = function() {
    this._bitField = this._bitField | 8388608;
};

Promise.prototype._setAsyncGuaranteed = function() {
    if (async.hasCustomScheduler()) return;
    var bitField = this._bitField;
    this._bitField = bitField |
        (((bitField & 536870912) >> 2) ^
        134217728);
};

Promise.prototype._setNoAsyncGuarantee = function() {
    this._bitField = (this._bitField | 536870912) &
        (~134217728);
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0 ? this._receiver0 : this[
            index * 4 - 4 + 3];
    if (ret === UNDEFINED_BINDING) {
        return undefined;
    } else if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return this[
            index * 4 - 4 + 2];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 1];
};

Promise.prototype._boundValue = function() {};

Promise.prototype._migrateCallback0 = function (follower) {
    var bitField = follower._bitField;
    var fulfill = follower._fulfillmentHandler0;
    var reject = follower._rejectionHandler0;
    var promise = follower._promise0;
    var receiver = follower._receiverAt(0);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._migrateCallbackAt = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    promise,
    receiver,
    context
) {
    var index = this._length();

    if (index >= 65535 - 4) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        this._receiver0 = receiver;
        if (typeof fulfill === "function") {
            this._fulfillmentHandler0 = util.contextBind(context, fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 = util.contextBind(context, reject);
        }
    } else {
        var base = index * 4 - 4;
        this[base + 2] = promise;
        this[base + 3] = receiver;
        if (typeof fulfill === "function") {
            this[base + 0] =
                util.contextBind(context, fulfill);
        }
        if (typeof reject === "function") {
            this[base + 1] =
                util.contextBind(context, reject);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._proxy = function (proxyable, arg) {
    this._addCallbacks(undefined, undefined, arg, proxyable, null);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (((this._bitField & 117506048) !== 0)) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    if (shouldBind) this._propagateFrom(maybePromise, 2);


    var promise = maybePromise._target();

    if (promise === this) {
        this._reject(makeSelfResolutionError());
        return;
    }

    var bitField = promise._bitField;
    if (((bitField & 50397184) === 0)) {
        var len = this._length();
        if (len > 0) promise._migrateCallback0(this);
        for (var i = 1; i < len; ++i) {
            promise._migrateCallbackAt(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(maybePromise);
    } else if (((bitField & 33554432) !== 0)) {
        this._fulfill(promise._value());
    } else if (((bitField & 16777216) !== 0)) {
        this._reject(promise._reason());
    } else {
        var reason = new CancellationError("late cancellation observer");
        promise._attachExtraTrace(reason);
        this._reject(reason);
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, ignoreNonErrorWarnings) {
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    if (!hasStack && !ignoreNonErrorWarnings && debug.warnings()) {
        var message = "a promise was rejected with a non-error: " +
            util.classString(reason);
        this._warn(message, true);
    }
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason);
};

Promise.prototype._resolveFromExecutor = function (executor) {
    if (executor === INTERNAL) return;
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = this._execute(executor, function(value) {
        promise._resolveCallback(value);
    }, function (reason) {
        promise._rejectCallback(reason, synchronous);
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined) {
        promise._rejectCallback(r, true);
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    var bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY) {
        if (!value || typeof value.length !== "number") {
            x = errorObj;
            x.e = new TypeError("cannot .spread() a non-array: " +
                                    util.classString(value));
        } else {
            x = tryCatch(handler).apply(this._boundValue(), value);
        }
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    var promiseCreated = promise._popContext();
    bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;

    if (x === NEXT_FILTER) {
        promise._reject(value);
    } else if (x === errorObj) {
        promise._rejectCallback(x.e, false);
    } else {
        debug.checkForgottenReturns(x, promiseCreated, "",  promise, this);
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._settlePromise = function(promise, handler, receiver, value) {
    var isPromise = promise instanceof Promise;
    var bitField = this._bitField;
    var asyncGuaranteed = ((bitField & 134217728) !== 0);
    if (((bitField & 65536) !== 0)) {
        if (isPromise) promise._invokeInternalOnCancel();

        if (receiver instanceof PassThroughHandlerContext &&
            receiver.isFinallyHandler()) {
            receiver.cancelPromise = promise;
            if (tryCatch(handler).call(receiver, value) === errorObj) {
                promise._reject(errorObj.e);
            }
        } else if (handler === reflectHandler) {
            promise._fulfill(reflectHandler.call(receiver));
        } else if (receiver instanceof Proxyable) {
            receiver._promiseCancelled(promise);
        } else if (isPromise || promise instanceof PromiseArray) {
            promise._cancel();
        } else {
            receiver.cancel();
        }
    } else if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            if (asyncGuaranteed) promise._setAsyncGuaranteed();
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof Proxyable) {
        if (!receiver._isResolved()) {
            if (((bitField & 33554432) !== 0)) {
                receiver._promiseFulfilled(value, promise);
            } else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (asyncGuaranteed) promise._setAsyncGuaranteed();
        if (((bitField & 33554432) !== 0)) {
            promise._fulfill(value);
        } else {
            promise._reject(value);
        }
    }
};

Promise.prototype._settlePromiseLateCancellationObserver = function(ctx) {
    var handler = ctx.handler;
    var promise = ctx.promise;
    var receiver = ctx.receiver;
    var value = ctx.value;
    if (typeof handler === "function") {
        if (!(promise instanceof Promise)) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (promise instanceof Promise) {
        promise._reject(value);
    }
};

Promise.prototype._settlePromiseCtx = function(ctx) {
    this._settlePromise(ctx.promise, ctx.handler, ctx.receiver, ctx.value);
};

Promise.prototype._settlePromise0 = function(handler, value, bitField) {
    var promise = this._promise0;
    var receiver = this._receiverAt(0);
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settlePromise(promise, handler, receiver, value);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    var base = index * 4 - 4;
    this[base + 2] =
    this[base + 3] =
    this[base + 0] =
    this[base + 1] = undefined;
};

Promise.prototype._fulfill = function (value) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._reject(err);
    }
    this._setFulfilled();
    this._rejectionHandler0 = value;

    if ((bitField & 65535) > 0) {
        if (((bitField & 134217728) !== 0)) {
            this._settlePromises();
        } else {
            async.settlePromises(this);
        }
        this._dereferenceTrace();
    }
};

Promise.prototype._reject = function (reason) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    this._setRejected();
    this._fulfillmentHandler0 = reason;

    if (this._isFinal()) {
        return async.fatalError(reason, util.isNode);
    }

    if ((bitField & 65535) > 0) {
        async.settlePromises(this);
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._fulfillPromises = function (len, value) {
    for (var i = 1; i < len; i++) {
        var handler = this._fulfillmentHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, value);
    }
};

Promise.prototype._rejectPromises = function (len, reason) {
    for (var i = 1; i < len; i++) {
        var handler = this._rejectionHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, reason);
    }
};

Promise.prototype._settlePromises = function () {
    var bitField = this._bitField;
    var len = (bitField & 65535);

    if (len > 0) {
        if (((bitField & 16842752) !== 0)) {
            var reason = this._fulfillmentHandler0;
            this._settlePromise0(this._rejectionHandler0, reason, bitField);
            this._rejectPromises(len, reason);
        } else {
            var value = this._rejectionHandler0;
            this._settlePromise0(this._fulfillmentHandler0, value, bitField);
            this._fulfillPromises(len, value);
        }
        this._setLength(0);
    }
    this._clearCancellationData();
};

Promise.prototype._settledValue = function() {
    var bitField = this._bitField;
    if (((bitField & 33554432) !== 0)) {
        return this._rejectionHandler0;
    } else if (((bitField & 16777216) !== 0)) {
        return this._fulfillmentHandler0;
    }
};

if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
    es5.defineProperty(Promise.prototype, Symbol.toStringTag, {
        get: function () {
            return "Object";
        }
    });
}

function deferResolve(v) {this.promise._resolveCallback(v);}
function deferReject(v) {this.promise._rejectCallback(v, false);}

Promise.defer = Promise.pending = function() {
    debug.deprecated("Promise.defer", "new Promise");
    var promise = new Promise(INTERNAL);
    return {
        promise: promise,
        resolve: deferResolve,
        reject: deferReject
    };
};

util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

_dereq_("./method")(Promise, INTERNAL, tryConvertToPromise, apiRejection,
    debug);
_dereq_("./bind")(Promise, INTERNAL, tryConvertToPromise, debug);
_dereq_("./cancel")(Promise, PromiseArray, apiRejection, debug);
_dereq_("./direct_resolve")(Promise);
_dereq_("./synchronous_inspection")(Promise);
_dereq_("./join")(
    Promise, PromiseArray, tryConvertToPromise, INTERNAL, async);
Promise.Promise = Promise;
Promise.version = "3.7.1";
_dereq_('./call_get.js')(Promise);
_dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug);
_dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
_dereq_('./nodeify.js')(Promise);
_dereq_('./promisify.js')(Promise, INTERNAL);
_dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
_dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
_dereq_('./settle.js')(Promise, PromiseArray, debug);
_dereq_('./some.js')(Promise, PromiseArray, apiRejection);
_dereq_('./timers.js')(Promise, INTERNAL, debug);
_dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug);
_dereq_('./any.js')(Promise);
_dereq_('./each.js')(Promise, INTERNAL);
_dereq_('./filter.js')(Promise, INTERNAL);
                                                         
    util.toFastProperties(Promise);                                          
    util.toFastProperties(Promise.prototype);                                
    function fillTypes(value) {                                              
        var p = new Promise(INTERNAL);                                       
        p._fulfillmentHandler0 = value;                                      
        p._rejectionHandler0 = value;                                        
        p._promise0 = value;                                                 
        p._receiver0 = value;                                                
    }                                                                        
    // Complete slack tracking, opt out of field-type tracking and           
    // stabilize map                                                         
    fillTypes({a: 1});                                                       
    fillTypes({b: 2});                                                       
    fillTypes({c: 3});                                                       
    fillTypes(1);                                                            
    fillTypes(function(){});                                                 
    fillTypes(undefined);                                                    
    fillTypes(false);                                                        
    fillTypes(new Promise(INTERNAL));                                        
    debug.setBounds(Async.firstLineError, util.lastLineError);               
    return Promise;                                                          

};

},{"./any.js":1,"./async":2,"./bind":3,"./call_get.js":5,"./cancel":6,"./catch_filter":7,"./context":8,"./debuggability":9,"./direct_resolve":10,"./each.js":11,"./errors":12,"./es5":13,"./filter.js":14,"./finally":15,"./generators.js":16,"./join":17,"./map.js":18,"./method":19,"./nodeback":20,"./nodeify.js":21,"./promise_array":23,"./promisify.js":24,"./props.js":25,"./race.js":27,"./reduce.js":28,"./settle.js":30,"./some.js":31,"./synchronous_inspection":32,"./thenables":33,"./timers.js":34,"./using.js":35,"./util":36,"async_hooks":undefined}],23:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection, Proxyable) {
var util = _dereq_("./util");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    case -6: return new Map();
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    if (values instanceof Promise) {
        promise._propagateFrom(values, 3);
        values.suppressUnhandledRejections();
    }
    promise._setOnCancel(this);
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
util.inherits(PromiseArray, Proxyable);

PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        var bitField = values._bitField;
        ;
        this._values = values;

        if (((bitField & 50397184) === 0)) {
            this._promise._setAsyncGuaranteed();
            return values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
        } else if (((bitField & 33554432) !== 0)) {
            values = values._value();
        } else if (((bitField & 16777216) !== 0)) {
            return this._reject(values._reason());
        } else {
            return this._cancel();
        }
    }
    values = util.asArray(values);
    if (values === null) {
        var err = apiRejection(
            "expecting an array or an iterable object but got " + util.classString(values)).reason();
        this._promise._rejectCallback(err, false);
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    this._iterate(values);
};

PromiseArray.prototype._iterate = function(values) {
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var result = this._promise;
    var isResolved = false;
    var bitField = null;
    for (var i = 0; i < len; ++i) {
        var maybePromise = tryConvertToPromise(values[i], result);

        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            bitField = maybePromise._bitField;
        } else {
            bitField = null;
        }

        if (isResolved) {
            if (bitField !== null) {
                maybePromise.suppressUnhandledRejections();
            }
        } else if (bitField !== null) {
            if (((bitField & 50397184) === 0)) {
                maybePromise._proxy(this, i);
                this._values[i] = maybePromise;
            } else if (((bitField & 33554432) !== 0)) {
                isResolved = this._promiseFulfilled(maybePromise._value(), i);
            } else if (((bitField & 16777216) !== 0)) {
                isResolved = this._promiseRejected(maybePromise._reason(), i);
            } else {
                isResolved = this._promiseCancelled(i);
            }
        } else {
            isResolved = this._promiseFulfilled(maybePromise, i);
        }
    }
    if (!isResolved) result._setAsyncGuaranteed();
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype._cancel = function() {
    if (this._isResolved() || !this._promise._isCancellable()) return;
    this._values = null;
    this._promise._cancel();
};

PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false);
};

PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

PromiseArray.prototype._promiseCancelled = function() {
    this._cancel();
    return true;
};

PromiseArray.prototype._promiseRejected = function (reason) {
    this._totalResolved++;
    this._reject(reason);
    return true;
};

PromiseArray.prototype._resultCancelled = function() {
    if (this._isResolved()) return;
    var values = this._values;
    this._cancel();
    if (values instanceof Promise) {
        values.cancel();
    } else {
        for (var i = 0; i < values.length; ++i) {
            if (values[i] instanceof Promise) {
                values[i].cancel();
            }
        }
    }
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util":36}],24:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = _dereq_("./util");
var nodebackForPromise = _dereq_("./nodeback");
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = _dereq_("./errors").TypeError;
var defaultSuffix = "Async";
var defaultPromisified = {__isPromisified__: true};
var noCopyProps = [
    "arity",    "length",
    "name",
    "arguments",
    "caller",
    "callee",
    "prototype",
    "__isPromisified__"
];
var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");

var defaultFilter = function(name) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
};

function propsFilter(key) {
    return !noCopyPropsPattern.test(key);
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/MqrFmX\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

var escapeIdentRegex = function(str) {
    return str.replace(/([$])/, "\\$");
};

var makeNodePromisifiedEval;
if (!true) {
var switchCaseArgumentOrder = function(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 3);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
        ret.push(i);
    }
    return ret;
};

var argumentSequence = function(argumentCount) {
    return util.filledRange(argumentCount, "_arg", "");
};

var parameterDeclaration = function(parameterCount) {
    return util.filledRange(
        Math.max(parameterCount, 3), "_arg", "");
};

var parameterCount = function(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
};

makeNodePromisifiedEval =
function(callback, receiver, originalName, fn, _, multiArgs) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (shouldProxyThis) {
            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
        } else {
            ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for (var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
                                ? "ret = callback.apply(this, args);\n"
                                : "ret = callback.apply(receiver, args);\n"));
        return ret;
    }

    var getFunctionCode = typeof callback === "string"
                                ? ("this != null ? this['"+callback+"'] : fn")
                                : "fn";
    var body = "'use strict';                                                \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise, " + multiArgs + ");   \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
    ".replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
        .replace("[GetFunctionCode]", getFunctionCode);
    body = body.replace("Parameters", parameterDeclaration(newParameterCount));
    return new Function("Promise",
                        "fn",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "tryCatch",
                        "errorObj",
                        "notEnumerableProp",
                        "INTERNAL",
                        body)(
                    Promise,
                    fn,
                    receiver,
                    withAppended,
                    maybeWrapAsError,
                    nodebackForPromise,
                    util.tryCatch,
                    util.errorObj,
                    util.notEnumerableProp,
                    INTERNAL);
};
}

function makeNodePromisifiedClosure(callback, receiver, _, fn, __, multiArgs) {
    var defaultThis = (function() {return this;})();
    var method = callback;
    if (typeof method === "string") {
        callback = fn;
    }
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
            ? this[method] : callback;
        var fn = nodebackForPromise(promise, multiArgs);
        try {
            cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        if (!promise._isFateSealed()) promise._setAsyncGuaranteed();
        return promise;
    }
    util.notEnumerableProp(promisified, "__isPromisified__", true);
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier, multiArgs) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        if (promisifier === makeNodePromisified) {
            obj[promisifiedKey] =
                makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
        } else {
            var promisified = promisifier(fn, function() {
                return makeNodePromisified(key, THIS, key,
                                           fn, suffix, multiArgs);
            });
            util.notEnumerableProp(promisified, "__isPromisified__", true);
            obj[promisifiedKey] = promisified;
        }
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver, multiArgs) {
    return makeNodePromisified(callback, receiver, undefined,
                                callback, null, multiArgs);
}

Promise.promisify = function (fn, options) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    if (isPromisified(fn)) {
        return fn;
    }
    options = Object(options);
    var receiver = options.context === undefined ? THIS : options.context;
    var multiArgs = !!options.multiArgs;
    var ret = promisify(fn, receiver, multiArgs);
    util.copyDescriptors(fn, ret, propsFilter);
    return ret;
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    options = Object(options);
    var multiArgs = !!options.multiArgs;
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }

    var keys = util.inheritedDataKeys(target);
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier,
                multiArgs);
            promisifyAll(value, suffix, filter, promisifier, multiArgs);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier, multiArgs);
};
};


},{"./errors":12,"./nodeback":20,"./util":36}],25:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util");
var isObject = util.isObject;
var es5 = _dereq_("./es5");
var Es6Map;
if (typeof Map === "function") Es6Map = Map;

var mapToEntries = (function() {
    var index = 0;
    var size = 0;

    function extractEntry(value, key) {
        this[index] = value;
        this[index + size] = key;
        index++;
    }

    return function mapToEntries(map) {
        size = map.size;
        index = 0;
        var ret = new Array(map.size * 2);
        map.forEach(extractEntry, ret);
        return ret;
    };
})();

var entriesToMap = function(entries) {
    var ret = new Es6Map();
    var length = entries.length / 2 | 0;
    for (var i = 0; i < length; ++i) {
        var key = entries[length + i];
        var value = entries[i];
        ret.set(key, value);
    }
    return ret;
};

function PropertiesPromiseArray(obj) {
    var isMap = false;
    var entries;
    if (Es6Map !== undefined && obj instanceof Es6Map) {
        entries = mapToEntries(obj);
        isMap = true;
    } else {
        var keys = es5.keys(obj);
        var len = keys.length;
        entries = new Array(len * 2);
        for (var i = 0; i < len; ++i) {
            var key = keys[i];
            entries[i] = obj[key];
            entries[i + len] = key;
        }
    }
    this.constructor$(entries);
    this._isMap = isMap;
    this._init$(undefined, isMap ? -6 : -3);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val;
        if (this._isMap) {
            val = entriesToMap(this._values);
        } else {
            val = {};
            var keyOffset = this.length();
            for (var i = 0, len = this.length(); i < len; ++i) {
                val[this._values[i + keyOffset]] = this._values[i];
            }
        }
        this._resolve(val);
        return true;
    }
    return false;
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 2);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5":13,"./util":36}],26:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],27:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util");

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else {
        promises = util.asArray(promises);
        if (promises === null)
            return apiRejection("expecting an array or an iterable object but got " + util.classString(promises));
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 3);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util":36}],28:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL,
                          debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;

function ReductionPromiseArray(promises, fn, initialValue, _each) {
    this.constructor$(promises);
    var context = Promise._getContext();
    this._fn = util.contextBind(context, fn);
    if (initialValue !== undefined) {
        initialValue = Promise.resolve(initialValue);
        initialValue._attachCancellationCallback(this);
    }
    this._initialValue = initialValue;
    this._currentCancellable = null;
    if(_each === INTERNAL) {
        this._eachValues = Array(this._length);
    } else if (_each === 0) {
        this._eachValues = null;
    } else {
        this._eachValues = undefined;
    }
    this._promise._captureStackTrace();
    this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._gotAccum = function(accum) {
    if (this._eachValues !== undefined &&
        this._eachValues !== null &&
        accum !== INTERNAL) {
        this._eachValues.push(accum);
    }
};

ReductionPromiseArray.prototype._eachComplete = function(value) {
    if (this._eachValues !== null) {
        this._eachValues.push(value);
    }
    return this._eachValues;
};

ReductionPromiseArray.prototype._init = function() {};

ReductionPromiseArray.prototype._resolveEmptyArray = function() {
    this._resolve(this._eachValues !== undefined ? this._eachValues
                                                 : this._initialValue);
};

ReductionPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

ReductionPromiseArray.prototype._resolve = function(value) {
    this._promise._resolveCallback(value);
    this._values = null;
};

ReductionPromiseArray.prototype._resultCancelled = function(sender) {
    if (sender === this._initialValue) return this._cancel();
    if (this._isResolved()) return;
    this._resultCancelled$();
    if (this._currentCancellable instanceof Promise) {
        this._currentCancellable.cancel();
    }
    if (this._initialValue instanceof Promise) {
        this._initialValue.cancel();
    }
};

ReductionPromiseArray.prototype._iterate = function (values) {
    this._values = values;
    var value;
    var i;
    var length = values.length;
    if (this._initialValue !== undefined) {
        value = this._initialValue;
        i = 0;
    } else {
        value = Promise.resolve(values[0]);
        i = 1;
    }

    this._currentCancellable = value;

    for (var j = i; j < length; ++j) {
        var maybePromise = values[j];
        if (maybePromise instanceof Promise) {
            maybePromise.suppressUnhandledRejections();
        }
    }

    if (!value.isRejected()) {
        for (; i < length; ++i) {
            var ctx = {
                accum: null,
                value: values[i],
                index: i,
                length: length,
                array: this
            };

            value = value._then(gotAccum, undefined, undefined, ctx, undefined);

            if ((i & 127) === 0) {
                value._setNoAsyncGuarantee();
            }
        }
    }

    if (this._eachValues !== undefined) {
        value = value
            ._then(this._eachComplete, undefined, undefined, this, undefined);
    }
    value._then(completed, completed, undefined, value, this);
};

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};

function completed(valueOrReason, array) {
    if (this.isFulfilled()) {
        array._resolve(valueOrReason);
    } else {
        array._reject(valueOrReason);
    }
}

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

function gotAccum(accum) {
    this.accum = accum;
    this.array._gotAccum(accum);
    var value = tryConvertToPromise(this.value, this.array._promise);
    if (value instanceof Promise) {
        this.array._currentCancellable = value;
        return value._then(gotValue, undefined, undefined, this, undefined);
    } else {
        return gotValue.call(this, value);
    }
}

function gotValue(value) {
    var array = this.array;
    var promise = array._promise;
    var fn = tryCatch(array._fn);
    promise._pushContext();
    var ret;
    if (array._eachValues !== undefined) {
        ret = fn.call(promise._boundValue(), value, this.index, this.length);
    } else {
        ret = fn.call(promise._boundValue(),
                              this.accum, value, this.index, this.length);
    }
    if (ret instanceof Promise) {
        array._currentCancellable = ret;
    }
    var promiseCreated = promise._popContext();
    debug.checkForgottenReturns(
        ret,
        promiseCreated,
        array._eachValues !== undefined ? "Promise.each" : "Promise.reduce",
        promise
    );
    return ret;
}
};

},{"./util":36}],29:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util");
var schedule;
var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var NativePromise = util.getNativePromise();
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if (typeof NativePromise === "function" &&
           typeof NativePromise.resolve === "function") {
    var nativePromise = NativePromise.resolve();
    schedule = function(fn) {
        nativePromise.then(fn);
    };
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            (window.navigator.standalone || window.cordova)) &&
          ("classList" in document.documentElement)) {
    schedule = (function() {
        var div = document.createElement("div");
        var opts = {attributes: true};
        var toggleScheduled = false;
        var div2 = document.createElement("div");
        var o2 = new MutationObserver(function() {
            div.classList.toggle("foo");
            toggleScheduled = false;
        });
        o2.observe(div2, opts);

        var scheduleToggle = function() {
            if (toggleScheduled) return;
            toggleScheduled = true;
            div2.classList.toggle("foo");
        };

        return function schedule(fn) {
            var o = new MutationObserver(function() {
                o.disconnect();
                fn();
            });
            o.observe(div, opts);
            scheduleToggle();
        };
    })();
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;

},{"./util":36}],30:[function(_dereq_,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray, debug) {
var PromiseInspection = Promise.PromiseInspection;
var util = _dereq_("./util");

function SettledPromiseArray(values) {
    this.constructor$(values);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 33554432;
    ret._settledValueField = value;
    return this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 16777216;
    ret._settledValueField = reason;
    return this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    debug.deprecated(".settle()", ".reflect()");
    return new SettledPromiseArray(promises).promise();
};

Promise.allSettled = function (promises) {
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return Promise.settle(this);
};
};

},{"./util":36}],31:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = _dereq_("./util");
var RangeError = _dereq_("./errors").RangeError;
var AggregateError = _dereq_("./errors").AggregateError;
var isArray = util.isArray;
var CANCELLATION = {};


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
        return true;
    }
    return false;

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    return this._checkOutcome();
};

SomePromiseArray.prototype._promiseCancelled = function () {
    if (this._values instanceof Promise || this._values == null) {
        return this._cancel();
    }
    this._addRejected(CANCELLATION);
    return this._checkOutcome();
};

SomePromiseArray.prototype._checkOutcome = function() {
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            if (this._values[i] !== CANCELLATION) {
                e.push(this._values[i]);
            }
        }
        if (e.length > 0) {
            this._reject(e);
        } else {
            this._cancel();
        }
        return true;
    }
    return false;
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors":12,"./util":36}],32:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValueField = promise._isFateSealed()
            ? promise._settledValue() : undefined;
    }
    else {
        this._bitField = 0;
        this._settledValueField = undefined;
    }
}

PromiseInspection.prototype._settledValue = function() {
    return this._settledValueField;
};

var value = PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var reason = PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var isFulfilled = PromiseInspection.prototype.isFulfilled = function() {
    return (this._bitField & 33554432) !== 0;
};

var isRejected = PromiseInspection.prototype.isRejected = function () {
    return (this._bitField & 16777216) !== 0;
};

var isPending = PromiseInspection.prototype.isPending = function () {
    return (this._bitField & 50397184) === 0;
};

var isResolved = PromiseInspection.prototype.isResolved = function () {
    return (this._bitField & 50331648) !== 0;
};

PromiseInspection.prototype.isCancelled = function() {
    return (this._bitField & 8454144) !== 0;
};

Promise.prototype.__isCancelled = function() {
    return (this._bitField & 65536) === 65536;
};

Promise.prototype._isCancelled = function() {
    return this._target().__isCancelled();
};

Promise.prototype.isCancelled = function() {
    return (this._target()._bitField & 8454144) !== 0;
};

Promise.prototype.isPending = function() {
    return isPending.call(this._target());
};

Promise.prototype.isRejected = function() {
    return isRejected.call(this._target());
};

Promise.prototype.isFulfilled = function() {
    return isFulfilled.call(this._target());
};

Promise.prototype.isResolved = function() {
    return isResolved.call(this._target());
};

Promise.prototype.value = function() {
    return value.call(this._target());
};

Promise.prototype.reason = function() {
    var target = this._target();
    target._unsetRejectionIsUnhandled();
    return reason.call(target);
};

Promise.prototype._value = function() {
    return this._settledValue();
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue();
};

Promise.PromiseInspection = PromiseInspection;
};

},{}],33:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) return obj;
        var then = getThen(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            if (isAnyBluebirdPromise(obj)) {
                var ret = new Promise(INTERNAL);
                obj._then(
                    ret._fulfill,
                    ret._reject,
                    undefined,
                    ret,
                    null
                );
                return ret;
            }
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function doGetThen(obj) {
    return obj.then;
}

function getThen(obj) {
    try {
        return doGetThen(obj);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    try {
        return hasProp.call(obj, "_promise0");
    } catch (e) {
        return false;
    }
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x, resolve, reject);
    synchronous = false;

    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolve(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
    }

    function reject(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util":36}],34:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, debug) {
var util = _dereq_("./util");
var TimeoutError = Promise.TimeoutError;

function HandleWrapper(handle)  {
    this.handle = handle;
}

HandleWrapper.prototype._resultCancelled = function() {
    clearTimeout(this.handle);
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (ms, value) {
    var ret;
    var handle;
    if (value !== undefined) {
        ret = Promise.resolve(value)
                ._then(afterValue, null, null, ms, undefined);
        if (debug.cancellation() && value instanceof Promise) {
            ret._setOnCancel(value);
        }
    } else {
        ret = new Promise(INTERNAL);
        handle = setTimeout(function() { ret._fulfill(); }, +ms);
        if (debug.cancellation()) {
            ret._setOnCancel(new HandleWrapper(handle));
        }
        ret._captureStackTrace();
    }
    ret._setAsyncGuaranteed();
    return ret;
};

Promise.prototype.delay = function (ms) {
    return delay(ms, this);
};

var afterTimeout = function (promise, message, parent) {
    var err;
    if (typeof message !== "string") {
        if (message instanceof Error) {
            err = message;
        } else {
            err = new TimeoutError("operation timed out");
        }
    } else {
        err = new TimeoutError(message);
    }
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._reject(err);

    if (parent != null) {
        parent.cancel();
    }
};

function successClear(value) {
    clearTimeout(this.handle);
    return value;
}

function failureClear(reason) {
    clearTimeout(this.handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret, parent;

    var handleWrapper = new HandleWrapper(setTimeout(function timeoutTimeout() {
        if (ret.isPending()) {
            afterTimeout(ret, message, parent);
        }
    }, ms));

    if (debug.cancellation()) {
        parent = this.then();
        ret = parent._then(successClear, failureClear,
                            undefined, handleWrapper, undefined);
        ret._setOnCancel(handleWrapper);
    } else {
        ret = this._then(successClear, failureClear,
                            undefined, handleWrapper, undefined);
    }

    return ret;
};

};

},{"./util":36}],35:[function(_dereq_,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext, INTERNAL, debug) {
    var util = _dereq_("./util");
    var TypeError = _dereq_("./errors").TypeError;
    var inherits = _dereq_("./util").inherits;
    var errorObj = util.errorObj;
    var tryCatch = util.tryCatch;
    var NULL = {};

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = new Promise(INTERNAL);
        function iterator() {
            if (i >= len) return ret._fulfill();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret;
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return NULL;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== NULL
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    function ResourceList(length) {
        this.length = length;
        this.promise = null;
        this[length-1] = null;
    }

    ResourceList.prototype._resultCancelled = function() {
        var len = this.length;
        for (var i = 0; i < len; ++i) {
            var item = this[i];
            if (item instanceof Promise) {
                item.cancel();
            }
        }
    };

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") {
            return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var input;
        var spreadArgs = true;
        if (len === 2 && Array.isArray(arguments[0])) {
            input = arguments[0];
            len = input.length;
            spreadArgs = false;
        } else {
            input = arguments;
            len--;
        }
        var resources = new ResourceList(len);
        for (var i = 0; i < len; ++i) {
            var resource = input[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var reflectedResources = new Array(resources.length);
        for (var i = 0; i < reflectedResources.length; ++i) {
            reflectedResources[i] = Promise.resolve(resources[i]).reflect();
        }

        var resultPromise = Promise.all(reflectedResources)
            .then(function(inspections) {
                for (var i = 0; i < inspections.length; ++i) {
                    var inspection = inspections[i];
                    if (inspection.isRejected()) {
                        errorObj.e = inspection.error();
                        return errorObj;
                    } else if (!inspection.isFulfilled()) {
                        resultPromise.cancel();
                        return;
                    }
                    inspections[i] = inspection.value();
                }
                promise._pushContext();

                fn = tryCatch(fn);
                var ret = spreadArgs
                    ? fn.apply(undefined, inspections) : fn(inspections);
                var promiseCreated = promise._popContext();
                debug.checkForgottenReturns(
                    ret, promiseCreated, "Promise.using", promise);
                return ret;
            });

        var promise = resultPromise.lastly(function() {
            var inspection = new Promise.PromiseInspection(resultPromise);
            return dispose(resources, inspection);
        });
        resources.promise = promise;
        promise._setOnCancel(resources);
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 131072;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 131072) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~131072);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors":12,"./util":36}],36:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5");
var canEvaluate = typeof navigator == "undefined";

var errorObj = {e: {}};
var tryCatchTarget;
var globalObject = typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window :
    typeof global !== "undefined" ? global :
    this !== undefined ? this : null;

function tryCatcher() {
    try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return typeof value === "function" ||
           typeof value === "object" && value !== null;
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);

        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
    ];

    var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
            if (excludedPrototypes[i] === val) {
                return true;
            }
        }
        return false;
    };

    if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && !isExcludedProto(obj)) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
            if (isExcludedProto(obj)) return [];
            var ret = [];

            /*jshint forin:false */
            enumeration: for (var key in obj) {
                if (hasProp.call(obj, key)) {
                    ret.push(key);
                } else {
                    for (var i = 0; i < excludedPrototypes.length; ++i) {
                        if (hasProp.call(excludedPrototypes[i], key)) {
                            continue enumeration;
                        }
                    }
                    ret.push(key);
                }
            }
            return ret;
        };
    }

})();

var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);

            var hasMethods = es5.isES5 && keys.length > 1;
            var hasMethodsOtherThanConstructor = keys.length > 0 &&
                !(keys.length === 1 && keys[0] === "constructor");
            var hasThisAssignmentAndStaticMethods =
                thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

            if (hasMethods || hasMethodsOtherThanConstructor ||
                hasThisAssignmentAndStaticMethods) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function FakeConstructor() {}
    FakeConstructor.prototype = obj;
    var receiver = new FakeConstructor();
    function ic() {
        return typeof receiver.foo;
    }
    ic();
    ic();
    return obj;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function isError(obj) {
    return obj instanceof Error ||
        (obj !== null &&
           typeof obj === "object" &&
           typeof obj.message === "string" &&
           typeof obj.name === "string");
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return isError(obj) && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            try {
                es5.defineProperty(to, key, es5.getDescriptor(from, key));
            } catch (ignore) {}
        }
    }
}

var asArray = function(v) {
    if (es5.isArray(v)) {
        return v;
    }
    return null;
};

if (typeof Symbol !== "undefined" && Symbol.iterator) {
    var ArrayFrom = typeof Array.from === "function" ? function(v) {
        return Array.from(v);
    } : function(v) {
        var ret = [];
        var it = v[Symbol.iterator]();
        var itResult;
        while (!((itResult = it.next()).done)) {
            ret.push(itResult.value);
        }
        return ret;
    };

    asArray = function(v) {
        if (es5.isArray(v)) {
            return v;
        } else if (v != null && typeof v[Symbol.iterator] === "function") {
            return ArrayFrom(v);
        }
        return null;
    };
}

var isNode = typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]";

var hasEnvVariables = typeof process !== "undefined" &&
    typeof process.env !== "undefined";

function env(key) {
    return hasEnvVariables ? process.env[key] : undefined;
}

function getNativePromise() {
    if (typeof Promise === "function") {
        try {
            var promise = new Promise(function(){});
            if (classString(promise) === "[object Promise]") {
                return Promise;
            }
        } catch (e) {}
    }
}

var reflectHandler;
function contextBind(ctx, cb) {
    if (ctx === null ||
        typeof cb !== "function" ||
        cb === reflectHandler) {
        return cb;
    }

    if (ctx.domain !== null) {
        cb = ctx.domain.bind(cb);
    }

    var async = ctx.async;
    if (async !== null) {
        var old = cb;
        cb = function() {
            var args = (new Array(2)).concat([].slice.call(arguments));;
            args[0] = old;
            args[1] = this;
            return async.runInAsyncScope.apply(async, args);
        };
    }
    return cb;
}

var ret = {
    setReflectHandler: function(fn) {
        reflectHandler = fn;
    },
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    asArray: asArray,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    isError: isError,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    isNode: isNode,
    hasEnvVariables: hasEnvVariables,
    env: env,
    global: globalObject,
    getNativePromise: getNativePromise,
    contextBind: contextBind
};
ret.isRecentNode = ret.isNode && (function() {
    var version;
    if (process.versions && process.versions.node) {
        version = process.versions.node.split(".").map(Number);
    } else if (process.version) {
        version = process.version.split(".").map(Number);
    }
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
})();
ret.nodeSupportsAsyncResource = ret.isNode && (function() {
    var supportsAsync = false;
    try {
        var res = _dereq_("async_hooks").AsyncResource;
        supportsAsync = typeof res.prototype.runInAsyncScope === "function";
    } catch (e) {
        supportsAsync = false;
    }
    return supportsAsync;
})();

if (ret.isNode) ret.toFastProperties(process);

try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5":13,"async_hooks":undefined}]},{},[4])(4)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
}).call(this,require(2),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require(3).setImmediate)

},{"2":2,"3":3}],2:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require(2).nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require(3).setImmediate,require(3).clearImmediate)

},{"2":2,"3":3}],4:[function(require,module,exports){
"use strict";

var ActionStrategy =
/*#__PURE__*/
function () {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function ActionStrategy(field, fieldView) {
    this.field = field;
    this.fieldView = fieldView;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = ActionStrategy.prototype;

  _proto.action = function action(fillStrategy, mn) {};

  return ActionStrategy;
}();

module.exports = ActionStrategy;

},{}],5:[function(require,module,exports){
"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var Promise = require(1);

var ActionStrategy = require(4);

var Field = require(10);

var BottomMoveStrategy = require(21);

var res = require(28);

var RegularTile = require(25); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var BombActionStrategy =
/*#__PURE__*/
function (_ActionStrategy) {
  _inheritsLoose(BombActionStrategy, _ActionStrategy);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function BombActionStrategy(field, fieldView) {
    return _ActionStrategy.call(this, field, fieldView) || this;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = BombActionStrategy.prototype;

  _proto.action = function action(fillStrategy, mn) {
    var _this = this;

    console.log("BombActionStrategy.action");
    return Promise.try(function () {
      var result = {};
      var mns = [mn];

      for (var _mn of [_this.field.calcTop(mn), _this.field.calcRight(mn), _this.field.calcBottom(mn), _this.field.calcLeft(mn)]) {
        if (_mn === null) continue;
        mns.push(_mn);

        var _tile = _this.field.getTile(_mn);

        if (_tile instanceof RegularTile) {
          if (result[_tile.colorIndex] === undefined) {
            result[_tile.colorIndex] = 0;
          }

          result[_tile.colorIndex]++;
        }
      } //console.log("mns:", mns);


      cc.audioEngine.playEffect(res.soundBurn, false);

      _this.field.burnTiles(mns);

      return _this.fieldView.fadeOutTiles(mns).then(function () {
        var moves = new BottomMoveStrategy().findMoves(_this.field); //console.log("moves:", moves);

        _this.field.applyMoves(moves);

        return _this.fieldView.makeMoves(moves).then(function () {
          var emptyMNs = _this.field.getEmptyTilesMNs(); //console.log("new tiles:", emptyMNs);


          fillStrategy.refillField(emptyMNs);
          fillStrategy.refillFieldView(emptyMNs);
          return _this.fieldView.fadeInTiles(emptyMNs);
        });
      }).then(function () {
        return result;
      });
    });
  };

  return BombActionStrategy;
}(ActionStrategy);

module.exports = BombActionStrategy;

},{"1":1,"10":10,"21":21,"25":25,"28":28,"4":4}],6:[function(require,module,exports){
'use strict';

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var Promise = require(1);

var ActionStrategy = require(4);

var Const = require(9);

var res = require(28);

var BottomMoveStrategy = require(21);

var Bag = require(8);

var Field = require(10); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var RegularActionStrategy =
/*#__PURE__*/
function (_ActionStrategy) {
  _inheritsLoose(RegularActionStrategy, _ActionStrategy);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function RegularActionStrategy(field, fieldView) {
    return _ActionStrategy.call(this, field, fieldView) || this;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = RegularActionStrategy.prototype;

  _proto.findTiles = function findTiles(mn) {
    return this._findColorArea(mn);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto._findColorArea = function _findColorArea(mn) {
    //console.log("RegularActionStrategy.findColorArea", mn);
    var bag = new Bag();
    bag.put(mn);

    this._checkNearby(mn, bag);

    return bag.toArray();
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto._checkNearby = function _checkNearby(mn, bag) {
    //console.log("RegularActionStrategy.checkNearby", mn, JSON.stringify(bag));
    var RegularTile = require(25);

    var tile = this.field.getTile(mn);
    var myColorIndex = tile.colorIndex;

    for (var _mn of [this.field.calcTop(mn), this.field.calcRight(mn), this.field.calcBottom(mn), this.field.calcLeft(mn)]) {
      if (_mn === null) continue;

      var _tile = this.field.getTile(_mn);

      if (_tile instanceof RegularTile && _tile.colorIndex === myColorIndex && !bag.contains(_mn)) {
        bag.put(_mn);

        this._checkNearby(_mn, bag);
      }
    }
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.action = function action(fillStrategy, mn) {
    var _this = this;

    //console.log("RegularActionStrategy.action", field, fieldView, mn);
    return Promise.try(function () {
      var tile = _this.field.getTile(mn);

      var colorMNs = _this._findColorArea(mn); //console.log("colorMNs:", colorMNs.length, colorMNs);


      var result = {};
      result[tile.colorIndex] = colorMNs.length;

      if (colorMNs.length >= _this.field.game.options.K) {
        cc.audioEngine.playEffect(res.soundBurn, false);

        _this.field.burnTiles(colorMNs);

        return _this.fieldView.fadeOutTiles(colorMNs).then(function () {
          var moves = new BottomMoveStrategy().findMoves(_this.field); //console.log("moves:", moves);

          _this.field.applyMoves(moves);

          return _this.fieldView.makeMoves(moves);
        }).then(function () {
          var emptyMNs = _this.field.getEmptyTilesMNs(); //console.log("new tiles:", emptyMNs);


          fillStrategy.refillField(emptyMNs, {
            useBomb: true
          });
          fillStrategy.refillFieldView(emptyMNs);
          return _this.fieldView.fadeInTiles(emptyMNs);
        }).then(function () {
          return result;
        });
      } else {
        cc.audioEngine.playEffect(res.soundWrong, false);
        return _this.fieldView.flashTile(mn).then(function () {
          return null;
        });
      }
    });
  };

  return RegularActionStrategy;
}(ActionStrategy);

module.exports = RegularActionStrategy;

},{"1":1,"10":10,"21":21,"25":25,"28":28,"4":4,"8":8,"9":9}],7:[function(require,module,exports){
"use strict";

var Promise = require(1);

var Const = require(9);

var Helper = require(18);

var res = require(28);

var HomeController = require(19); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var Application =
/*#__PURE__*/
function () {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function Application() {
    cc.app = this;
    cc.res = res;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = Application.prototype;

  _proto.init = function init() {
    //console.log("Application.init");
    console.log("cc.view.getCanvasSize(): " + JSON.stringify(cc.view.getCanvasSize()));
    console.log("cc.view.getFrameSize(): " + JSON.stringify(cc.view.getFrameSize()));
    console.log("cc.director.getWinSize(): " + JSON.stringify(cc.director.getWinSize()));
    console.log("cc.director.getWinSizeInPixels(): " + JSON.stringify(cc.director.getWinSizeInPixels()));
    console.log("cc.director.getContentScaleFactor(): " + cc.director.getContentScaleFactor()); // If referenced loading.js, please remove it

    if (!cc.sys.isNative && document.getElementById("cocosLoading")) {
      document.body.removeChild(document.getElementById("cocosLoading"));
    } // Pass true to enable retina display, on Android disabled by default to improve performance


    cc.view.enableRetina(cc.sys.os === cc.sys.OS_IOS ? true : false); // Adjust viewport meta

    cc.view.adjustViewPort(true); // Uncomment the following line to set a fixed orientation for your game
    // cc.view.setOrientation(cc.ORIENTATION_PORTRAIT);
    // Setup the resolution policy and design resolution size

    this.setupResolutionPolicy();
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.load = function load() {
    console.log("Application.load");
    return new Promise(function (resolve) {
      cc.LoaderScene.preload(Helper.resToArray(res), resolve); // //load resources
    });
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.run = function run() {
    //console.log("Application.run");
    //console.log("window.location:", window.location);
    //console.log("cc.sys:", cc.sys);
    // homeController
    var homeController = new HomeController();
    homeController.init();
    homeController.run();
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.setupResolutionPolicy = function setupResolutionPolicy() {
    var width;
    var height; //if (cc.sys.isNative) {
    //    width  = Const.NATIVE_WIDTH;
    //    height = Const.NATIVE_HEIGHT;
    //} else {

    var gameCanvas = document.getElementById("gameCanvas");
    width = gameCanvas.width / gameCanvas.WEB_SCALE;
    height = gameCanvas.height / gameCanvas.WEB_SCALE; // The game will be resized when browser size change
    //cc.view.resizeWithBrowserSize(true);
    //}

    console.log("cc.winSize before:", JSON.stringify(cc.winSize));
    cc.view.setDesignResolutionSize(width, height, cc.sys.isNative ? cc.ResolutionPolicy.FIXED_WIDTH : cc.ResolutionPolicy.SHOW_ALL); //cc.view.setDesignResolutionSize(width, height, cc.sys.isNative ? cc.ResolutionPolicy.EXACT_FIT : cc.ResolutionPolicy.SHOW_ALL);

    cc.director.setContentScaleFactor(Const.SCALE_FACTOR);
    console.log("cc.winSize after:", JSON.stringify(cc.winSize));
  };

  return Application;
}();

module.exports = Application;

},{"1":1,"18":18,"19":19,"28":28,"9":9}],8:[function(require,module,exports){
"use strict"; ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Bag =
/*#__PURE__*/
function () {
  function Bag() {}

  var _proto = Bag.prototype;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  _proto.contains = function contains(_ref) {
    var m = _ref[0],
        n = _ref[1];
    return this[m] !== undefined && this[m][n] !== undefined;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.put = function put(_ref2, value) {
    var m = _ref2[0],
        n = _ref2[1];

    if (value === void 0) {
      value = true;
    }

    if (!this[m]) {
      this[m] = {};
    }

    this[m][n] = value;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.iterate = function iterate(fn) {
    for (var m in this) {
      for (var n in this[m]) {
        fn([parseInt(m), parseInt(n)]);
      }
    }
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.getLength = function getLength() {
    var l = 0;

    for (var m in this) {
      for (var n in this[m]) {
        l++;
      }
    }

    return l;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.toArray = function toArray() {
    var arr = [];

    for (var m in this) {
      for (var n in this[m]) {
        arr.push([parseInt(m), parseInt(n)]);
      }
    }

    return arr;
  };

  return Bag;
}();

module.exports = Bag;

},{}],9:[function(require,module,exports){
'use strict'; ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Const = function Const() {}; // screen
//Const.NATIVE_WIDTH  = 360;
//Const.NATIVE_HEIGHT = 640;


Const.SCALE_FACTOR = 2;
Const.SCENE_BACKGROUND_COLOR = cc.color(161, 161, 161);
Const.SCENE_MARGIN_H = 15;
Const.SCENE_MARGIN_V = 10;
Const.TITLE_FONT_NAME = "AmericanCaptain";
Const.SCENE_TITLE_FONT_SIZE = 30;
Const.TILE_ACTUAL_WIDTH = 43;
Const.TILE_ACTUAL_HEIGHT = 48;
Const.TILE_COLOR = [cc.color.RED, cc.color.GREEN, cc.color(0, 177, 244), // BLUE
cc.color.ORANGE, cc.color.MAGENTA];
Const.LEVEL_OPTIONS = {
  '1': {
    M: 7,
    // rows
    N: 9,
    // columns
    C: 5,
    // colors
    K: 2,
    // match K
    moves: 30,
    mission: {
      '0': 10,
      '1': 10,
      '2': 10
    }
  },
  '2': {
    M: 5,
    // rows
    N: 5,
    // columns
    C: 5,
    // colors
    K: 2,
    // match K
    moves: 30,
    mission: {
      '0': 10,
      '1': 10,
      '2': 10
    }
  },
  '3': {
    M: 10,
    // rows
    N: 10,
    // columns
    C: 5,
    // colors
    K: 2,
    // match K
    moves: 30,
    mission: {
      '0': 10,
      '1': 10,
      '2': 10
    }
  }
};
Const.COLOR_NAME = ["red", "green", "blue", "orange", "magenta"]; // button

Const.BUTTON_FONT_SIZE = 22;
Const.BUTTON_TEXT_COLOR = cc.color("#80704F");
Const.BUTTON_TEXT_DISABLE_COLOR = cc.color("#bfa979");
Const.BUTTON_WIDTH = 100;
Const.BUTTON_HEIGHT = 40;
Const.BUTTON_SIZE = {
  width: 200,
  height: 50
};
Const.BUTTON_INTERVAL = 20;
Const.BUTTON_COLOR = cc.color('#ECD592');
module.exports = Const;

},{}],10:[function(require,module,exports){
"use strict";

var Const = require(9);

var Helper = require(18); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var Field =
/*#__PURE__*/
function () {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function Field(game) {
    this.game = game;
    this.matrix = Helper.createMatrix(game.options.M, game.options.N); //console.log("matrix:", this.matrix);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = Field.prototype;

  _proto.setTile = function setTile(_ref, tile) {
    var m = _ref[0],
        n = _ref[1];

    if (this.isTileExists([m, n])) {
      throw new Error("setTile: tile place not empty");
    }

    this.matrix[m][n] = tile;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.getTile = function getTile(_ref2) {
    var m = _ref2[0],
        n = _ref2[1];
    return this.matrix[m][n];
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.burnTiles = function burnTiles(mns) {
    var _this = this;

    //console.log("burnTiles:", mns);
    mns.forEach(function (_ref3) {
      var m = _ref3[0],
          n = _ref3[1];
      return _this.matrix[m][n] = null;
    }); //console.log("matrix:", this.matrix);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.calcTop = function calcTop(_ref4) {
    var m = _ref4[0],
        n = _ref4[1];

    var _m = m - 1;

    return _m >= 0 ? [_m, n] : null;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.calcRight = function calcRight(_ref5) {
    var m = _ref5[0],
        n = _ref5[1];

    var _n = n + 1;

    return _n < this.game.options.N ? [m, _n] : null;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.calcBottom = function calcBottom(_ref6) {
    var m = _ref6[0],
        n = _ref6[1];

    var _m = m + 1;

    return _m < this.game.options.M ? [_m, n] : null;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.calcLeft = function calcLeft(_ref7) {
    var m = _ref7[0],
        n = _ref7[1];

    var _n = n - 1;

    return _n >= 0 ? [m, _n] : null;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.isTileExists = function isTileExists(_ref8) {
    var m = _ref8[0],
        n = _ref8[1];
    return this.matrix[m][n] != null;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.applyMoves = function applyMoves(moves) {
    var _this2 = this;

    //console.log("Field.applyMoves", moves);
    moves.forEach(function (_ref9) {
      var _ref9$from = _ref9.from,
          m = _ref9$from[0],
          n = _ref9$from[1],
          _ref9$to = _ref9.to,
          _m = _ref9$to[0],
          _n = _ref9$to[1];
      _this2.matrix[_m][_n] = _this2.matrix[m][n];
      _this2.matrix[m][n] = null;
    }); //console.log("matrix", this.matrix);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.getEmptyTilesMNs = function getEmptyTilesMNs() {
    var mns = [];

    for (var m = 0; m < this.game.options.M; m++) {
      for (var n = 0; n < this.game.options.N; n++) {
        if (!this.isTileExists([m, n])) {
          mns.push([m, n]);
        }
      }
    }

    return mns;
  };

  return Field;
}();

module.exports = Field;

},{"18":18,"9":9}],11:[function(require,module,exports){
"use strict";

var Promise = require(1);

var Const = require(9);

var Helper = require(18);

var res = require(28); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var FieldController =
/*#__PURE__*/
function () {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function FieldController(field, fieldView, fillStrategy) {
    this.field = field;
    this.fieldView = fieldView;
    this.fillStrategy = fillStrategy;
    this.busy = false; // events

    this.onAction = null; // subscriptions

    this.fieldView.onTileClick = this.onTileClick.bind(this);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = FieldController.prototype;

  _proto.fill = function fill() {
    this.fillStrategy.fillField();
    this.fillStrategy.fillFieldView();
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.onTileClick = function onTileClick(mn) {
    var _this = this;

    //console.log("FieldView.onTileClick", mn);
    return Promise.try(function () {
      if (_this.field.game.isOver()) {
        return;
      }

      if (_this.busy) {
        console.warn("busy");
        return null;
      }

      _this.busy = true;

      var tile = _this.field.getTile(mn);

      console.log("tile:", tile);
      return tile.createActionStrategy(_this.field, _this.fieldView).action(_this.fillStrategy, mn).then(function (result) {
        if (_this.onAction && result) {
          return _this.onAction(result);
        }
      });
    }).finally(function () {
      _this.busy = false;
    });
  };

  return FieldController;
}();

module.exports = FieldController;

},{"1":1,"18":18,"28":28,"9":9}],12:[function(require,module,exports){
"use strict";

var Promise = require(1);

var Const = require(9);

var res = require(28);

var Helper = require(18);

var MARGIN = 15;
var FADE_TIME = 0.3;
var FLASH_TIME = 0.2;
var MOVE_TIME = 0.2; ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var FieldView =
/*#__PURE__*/
function () {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function FieldView(field) {
    this.field = field;
    this.node = null;
    this.onTileClick = null;
    this.M = field.game.options.M;
    this.N = field.game.options.N; // matrix

    this.matrix = Helper.createMatrix(this.M, this.N); // calc

    var fieldWidth = this.fieldWidth = cc.winSize.width;
    var fieldPlaceWidth = this.fieldPlaceWidth = fieldWidth - MARGIN * 2;
    var tilePlaceWidth = this.tilePlaceWidth = fieldPlaceWidth / this.N;
    var tilePlaceScale = this.tilePlaceScale = tilePlaceWidth / Const.TILE_ACTUAL_WIDTH;
    var tilePlaceHeight = this.tilePlaceHeight = Const.TILE_ACTUAL_HEIGHT * tilePlaceScale;
    var fieldHeight = this.fieldHeight = tilePlaceHeight * this.M + MARGIN * 2;
    var fieldPlaceHeight = this.fieldPlaceHeight = fieldHeight - MARGIN * 2;
    var tileScale = this.tileScale = tilePlaceScale * 0.95;
    this.lastLocalZOrder = 0;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = FieldView.prototype;

  _proto.createNode = function createNode() {
    var node = this.node = new cc.Scale9Sprite(res.field);
    node.width = this.fieldWidth;
    node.height = this.fieldHeight;
    return node;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.createTile = function createTile(_ref, colorIndex, opacity) {
    var m = _ref[0],
        n = _ref[1];

    if (opacity === void 0) {
      opacity = 255;
    }

    var color = Const.TILE_COLOR[colorIndex];
    var tile = new cc.Sprite(res.tile);
    tile.setColor(color);
    tile.setScale(this.tileScale);
    tile.setOpacity(opacity);
    tile._tag = [m, n];
    this.placeTile(tile, [m, n]);
    this.node.addChild(this.matrix[m][n] = tile);
    Helper.onNodeClick(tile, this._onTileClick.bind(this));
    return tile;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.createBombTile = function createBombTile(_ref2, opacity) {
    var m = _ref2[0],
        n = _ref2[1];

    if (opacity === void 0) {
      opacity = 255;
    }

    var tile = new cc.Sprite(res.bomb);
    tile.setScale(this.tileScale);
    tile.setOpacity(opacity);
    tile._tag = [m, n];
    this.placeTile(tile, [m, n]);
    this.node.addChild(this.matrix[m][n] = tile);
    Helper.onNodeClick(tile, this._onTileClick.bind(this));
    return tile;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.placeTile = function placeTile(tile, mn) {
    var _this$calcTilePositio = this.calcTilePosition(mn),
        x = _this$calcTilePositio[0],
        y = _this$calcTilePositio[1];

    tile.setPosition(x, y);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.calcTilePosition = function calcTilePosition(_ref3) {
    var m = _ref3[0],
        n = _ref3[1];

    if (m >= this.M) {
      throw new Error(`m out of range: ${m} of ${this.M}`);
    }

    if (n >= this.N) {
      throw new Error(`n out of range: ${n} of ${this.N}`);
    }

    var _m = this.M - m - 1;

    var _n = n;
    var x = _n * this.tilePlaceWidth + this.tilePlaceWidth / 2 + MARGIN;
    var y = _m * this.tilePlaceHeight + this.tilePlaceHeight / 2 + MARGIN;
    return [x, y];
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.flashTile = function flashTile(_ref4) {
    var m = _ref4[0],
        n = _ref4[1];
    var tile = this.matrix[m][n];
    this.bringToFront(tile);
    return Helper.runActions(tile, [cc.scaleTo(FLASH_TIME / 2, this.tileScale + 0.15), cc.scaleTo(FLASH_TIME / 2, this.tileScale)]);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.fadeOutTiles = function fadeOutTiles(mns) {
    var _this = this;

    var promises = [];
    mns.forEach(function (mn) {
      return promises.push(_this.fadeOutTile(mn));
    });
    return Promise.all(promises);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.fadeOutTile = function fadeOutTile(_ref5) {
    var _this2 = this;

    var m = _ref5[0],
        n = _ref5[1];
    //console.log("FieldView.fadeOutTile", m, n);
    var tile = this.matrix[m][n];
    Helper.runActions(tile, [cc.scaleTo(FADE_TIME, 0.6).easing(cc.easeCubicActionOut())]);
    return Helper.runActions(tile, [cc.fadeOut(FADE_TIME).easing(cc.easeCubicActionOut())]).then(function () {
      _this2.node.removeChild(tile);

      _this2.matrix[m][n] = null;
    });
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.fadeInTiles = function fadeInTiles(tiles) {
    var _this3 = this;

    var promises = [];
    tiles.forEach(function (mn) {
      return promises.push(_this3.fadeInTile(mn));
    });
    return Promise.all(promises);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.fadeInTile = function fadeInTile(_ref6) {
    var m = _ref6[0],
        n = _ref6[1];
    var tile = this.matrix[m][n];
    return Helper.runActions(tile, [cc.fadeTo(FADE_TIME, 255).easing(cc.easeCubicActionOut())]);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.bringToFront = function bringToFront(tile) {
    this.lastLocalZOrder++;
    tile.setLocalZOrder(this.lastLocalZOrder);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.setTileOpacity = function setTileOpacity(_ref7, opacity) {
    var m = _ref7[0],
        n = _ref7[1];
    var tile = this.matrix[m][n];
    tile.setOpacity(opacity);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.makeMoves = function makeMoves(moves) {
    var _this4 = this;

    //console.log("FieldView.makeMoves:", moves);
    var promises = [];
    moves.forEach(function (move) {
      return promises.push(_this4.makeMove(move));
    });
    return Promise.all(promises);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.makeMove = function makeMove(_ref8) {
    var _ref8$from = _ref8.from,
        m = _ref8$from[0],
        n = _ref8$from[1],
        _ref8$to = _ref8.to,
        _m = _ref8$to[0],
        _n = _ref8$to[1];

    if (this.matrix[_m][_n] !== null) {
      throw new Error("makeMove: cannot move tile to not empty place");
    }

    var tile = this.matrix[_m][_n] = this.matrix[m][n];
    tile._tag = [_m, _n];
    this.matrix[m][n] = null;

    var _this$calcTilePositio2 = this.calcTilePosition([_m, _n]),
        x = _this$calcTilePositio2[0],
        y = _this$calcTilePositio2[1];

    return Helper.runActions(tile, [cc.moveTo(MOVE_TIME, cc.p(x, y)).easing(cc.easeCubicActionOut())]);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto._onTileClick = function _onTileClick(touch, event) {
    var _this5 = this;

    console.log("FieldView.onTileClick");
    return Promise.try(function () {
      if (_this5.onTileClick) {
        var mn = event.getCurrentTarget()._tag;

        return _this5.onTileClick(mn);
      }
    }).catch(function (err) {
      console.error(err);
    });
  };

  return FieldView;
}();

module.exports = FieldView;

},{"1":1,"18":18,"28":28,"9":9}],13:[function(require,module,exports){
"use strict"; ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var FillStrategy =
/*#__PURE__*/
function () {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function FillStrategy(field, fieldView) {
    this.field = field;
    this.fieldView = fieldView;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = FillStrategy.prototype;

  _proto.fillField = function fillField() {} ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.fillFieldView = function fillFieldView() {} ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.refillField = function refillField(mns, options) {
    if (options === void 0) {
      options = {};
    }
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.refillFieldView = function refillFieldView(emptyMNs) {};

  return FillStrategy;
}();

module.exports = FillStrategy;

},{}],14:[function(require,module,exports){
"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var FillStrategy = require(13);

var Const = require(9);

var Helper = require(18);

var RegularTile = require(25);

var BombTile = require(24);

var MIN_BURN_TILES_TO_GET_BOMB = 4; ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var RegularFillStrategy =
/*#__PURE__*/
function (_FillStrategy) {
  _inheritsLoose(RegularFillStrategy, _FillStrategy);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function RegularFillStrategy(field, fieldView) {
    return _FillStrategy.call(this, field, fieldView) || this;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = RegularFillStrategy.prototype;

  _proto.fillField = function fillField() {
    for (var m = 0; m < this.field.game.options.M; m++) {
      for (var n = 0; n < this.field.game.options.N; n++) {
        var colorIndex = Helper.randomInteger(0, this.field.game.options.C - 1);
        this.field.setTile([m, n], new RegularTile(colorIndex));
      }
    }
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.fillFieldView = function fillFieldView() {
    for (var m = 0; m < this.field.game.options.M; m++) {
      for (var n = 0; n < this.field.game.options.N; n++) {
        this._createTileView([m, n]);
      }
    }
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto._createTileView = function _createTileView(_ref, opacity) {
    var m = _ref[0],
        n = _ref[1];

    if (opacity === void 0) {
      opacity = 255;
    }

    var tile = this.field.getTile([m, n]);

    if (tile instanceof RegularTile) {
      this.fieldView.createTile([m, n], tile.colorIndex, opacity);
    } else if (tile instanceof BombTile) {
      this.fieldView.createBombTile([m, n], opacity);
    }
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.refillField = function refillField(mns, options) {
    if (options === void 0) {
      options = {};
    }

    var bombI = -1;

    if (options.useBomb && mns.length >= MIN_BURN_TILES_TO_GET_BOMB) {
      bombI = Helper.randomInteger(0, mns.length - 1);
    }

    for (var i = 0; i < mns.length; i++) {
      var _mns$i = mns[i],
          m = _mns$i[0],
          n = _mns$i[1];

      if (bombI === i) {
        this.field.setTile([m, n], new BombTile());
      } else {
        var colorIndex = Helper.randomInteger(0, this.field.game.options.C - 1);
        this.field.setTile([m, n], new RegularTile(colorIndex));
      }
    }
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.refillFieldView = function refillFieldView(emptyMNs) {
    var _this = this;

    emptyMNs.forEach(function (_ref2) {
      var m = _ref2[0],
          n = _ref2[1];

      _this._createTileView([m, n], 0);
    });
  };

  return RegularFillStrategy;
}(FillStrategy);

module.exports = RegularFillStrategy;

},{"13":13,"18":18,"24":24,"25":25,"9":9}],15:[function(require,module,exports){
"use strict";

var Const = require(9); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var Game =
/*#__PURE__*/
function () {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function Game(options) {
    if (options === void 0) {
      options = {};
    }

    this.options = options; // score by color

    this.score = {};

    for (var c = 0; c < this.options.C; c++) {
      this.score[c] = 0;
    } // mission


    this.mission = {};

    for (var _c in options.mission) {
      this.mission[_c] = options.mission[_c];
    } // counter


    this.counter = 0;
    this.moves = options.moves;
    this.result = null;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = Game.prototype;

  _proto.isOver = function isOver() {
    return this.result !== null;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.applyActionResult = function applyActionResult(result) {
    //console.log("Game.applyActionResult:", result);
    this.counter++;

    if (this.moves > 0) {
      this.moves--;
    }

    for (var c in result) {
      this.score[c] += result[c];

      if (this.mission[c] !== undefined && this.mission[c] > 0) {
        this.mission[c] -= result[c];

        if (this.mission[c] < 0) {
          this.mission[c] = 0;
        }
      }
    } //console.log("game:", this);
    // sum


    var sum = 0;

    for (var _c2 of Object.keys(this.mission)) {
      sum += this.mission[_c2];
    } // check result


    if (sum === 0) {
      this.result = "win";
    } else if (this.moves === 0) {
      this.result = "lose";
    }

    return this.result;
  };

  return Game;
}();

module.exports = Game;

},{"9":9}],16:[function(require,module,exports){
"use strict";

var Game = require(15);

var GameScene = require(17);

var Field = require(10);

var FieldView = require(12);

var FieldController = require(11);

var RegularFillStrategy = require(14); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var GameController =
/*#__PURE__*/
function () {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function GameController(gameOptions) {
    this.gameOptions = gameOptions; // game

    this.game = null; // model

    this.gameScene = null; // view
    //this                              // controller
    // field

    this.field = null; // model

    this.fieldView = null; // view

    this.fieldController = null; // controller
    // logic

    this.fillStrategy = null;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = GameController.prototype;

  _proto.init = function init() {
    // game
    var game = this.game = new Game(this.gameOptions);
    var gameScene = this.gameScene = new GameScene({
      game: game
    });
    gameScene.init(); // field

    var field = this.field = new Field(game); // fieldView

    var fieldView = this.fieldView = new FieldView(field);
    var fieldViewNode = fieldView.createNode();
    fieldViewNode.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
    this.gameScene.addChild(fieldViewNode); // fillStrategy

    var fillStrategy = this.fillStrategy = new RegularFillStrategy(field, fieldView); // fieldController

    var fieldController = this.fieldController = new FieldController(field, fieldView, fillStrategy);
    this.fieldController.onAction = this.onAction.bind(this);
    fieldController.fill();
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.run = function run() {
    cc.director.runScene(this.gameScene);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.onAction = function onAction(result) {
    var gameResult = this.game.applyActionResult(result);
    this.gameScene.setScore(this.game.score);
    this.gameScene.setCounter(this.game.counter);
    this.gameScene.setMission(this.game.mission);
    this.gameScene.setMoves(this.game.moves);

    if (gameResult === "win") {
      this.gameScene.setGameOverMessage("you win", "win");
    } else if (gameResult === "lose") {
      this.gameScene.setGameOverMessage("you lose", "lose");
    }
  };

  return GameController;
}();

module.exports = GameController;

},{"10":10,"11":11,"12":12,"14":14,"15":15,"17":17}],17:[function(require,module,exports){
"use strict";

var Promise = require(1);

var Const = require(9);

var Helper = require(18);

var res = require(28);

var SPACE = 72;
var GAME_OVER_MESSAGE_COLOR_WIN = cc.color("#4dc144");
var GAME_OVER_MESSAGE_COLOR_DRAW = cc.color("#1658db");
var GAME_OVER_MESSAGE_COLOR_LOSE = cc.color("#e82d2d"); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var GameScene = cc.Scene.extend({
  _className: "GameScene",
  scoreLabels: null,
  counterLabel: null,
  missionLabels: null,
  movesLabel: null,
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ctor: function (options) {
    if (options === void 0) {
      options = {};
    }

    this.options = options;

    this._super();

    this.game = options.game;
    this.scoreLabels = new Array(this.game.options.C);
    this.missionLabels = new Array(Object.keys(this.game.mission).length);
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  init: function () {
    // background
    this.addChild(Helper.createBackground(Const.SCENE_BACKGROUND_COLOR)); // backButton

    var backButton = Helper.createBackButton();
    backButton.onClick = this.onBackPressed.bind(this);
    this.addChild(backButton); // score labels

    for (var c = 0; c < this.game.options.C; c++) {
      var label = this.scoreLabels[c] = Helper.createLabelTTF(`${Const.COLOR_NAME[c]}: ${0}`, Helper.getFont(Const.TITLE_FONT_NAME));
      label.setAnchorPoint(0, 0.5);
      label.setPosition(5 + SPACE * c, 20);
      this.addChild(label);
    } // counterLabel


    var counterLabel = this.counterLabel = Helper.createLabelTTF("counter: 0", Helper.getFont(Const.TITLE_FONT_NAME));
    counterLabel.setAnchorPoint(0, 0.5);
    counterLabel.setPosition(5, 50);
    this.addChild(counterLabel); // missionLabels

    for (var _c = 0; _c < Object.keys(this.game.mission).length; _c++) {
      var _label = this.missionLabels[_c] = Helper.createLabelTTF(`${Const.COLOR_NAME[_c]}: ${this.game.mission[_c]}`, Helper.getFont(Const.TITLE_FONT_NAME));

      _label.setAnchorPoint(0, 0.5);

      _label.setPosition(5 + SPACE * _c, cc.winSize.height - 130);

      this.addChild(_label);
    } // counterLabel


    var movesLabel = this.movesLabel = Helper.createLabelTTF(`moves: ${this.game.moves}`, Helper.getFont(Const.TITLE_FONT_NAME));
    movesLabel.setAnchorPoint(0, 0.5);
    movesLabel.setPosition(5, cc.winSize.height - 100);
    this.addChild(movesLabel);
    /*
    setTimeout(() => {
        this.setGameOverMessage("GAME OVER", "draw");
    }, 500);
    */
    // missionLabel

    var missionLabel = Helper.createLabelTTF('mission', Helper.getFont(Const.TITLE_FONT_NAME), Const.SCENE_TITLE_FONT_SIZE);
    missionLabel.setPosition(Helper.toLeftTop(cc.visibleRect, cc.visibleRect.center.x, 80));
    this.addChild(missionLabel); // scoreLabel

    var scoreLabel = Helper.createLabelTTF('score', Helper.getFont(Const.TITLE_FONT_NAME), Const.SCENE_TITLE_FONT_SIZE);
    scoreLabel.setPosition(Helper.fromLeftBottom(cc.visibleRect, cc.visibleRect.center.x, 100));
    this.addChild(scoreLabel);
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  onBackPressed: function () {
    console.log("onBackPressed");

    var HomeController = require(19); // homeController


    var homeController = new HomeController();
    homeController.init();
    homeController.run();
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  setScore: function (score) {
    for (var c in score) {
      this.scoreLabels[c].setString(`${Const.COLOR_NAME[c]}: ${score[c]}`);
    }
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  setCounter: function (counter) {
    this.counterLabel.setString(`counter: ${counter}`);
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  setMoves: function (moves) {
    this.movesLabel.setString(`moves: ${moves}`);
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  setMission: function (mission) {
    for (var c in mission) {
      this.missionLabels[c].setString(`${Const.COLOR_NAME[c]}: ${mission[c]}`);
    }
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  setGameOverMessage: function (message, result) {
    console.log("GameScene.setGameOverMessage", message);
    var gameOverLabel = Helper.createLabelTTF(message.toUpperCase(), Helper.getFont(Const.TITLE_FONT_NAME), 50);
    gameOverLabel.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
    gameOverLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
    var box = gameOverLabel.getBoundingBox(); // color

    var color = GAME_OVER_MESSAGE_COLOR_DRAW;

    if (result === "win") {
      color = GAME_OVER_MESSAGE_COLOR_WIN;
    } else if (result === "lose") {
      color = GAME_OVER_MESSAGE_COLOR_LOSE;
    }

    var gameOverMessageLayer = new cc.LayerColor(color, box.width + 10, box.height + 10);
    gameOverMessageLayer.setPosition(cc.winSize.width / 2 - gameOverMessageLayer.width / 2, cc.winSize.height / 2 - gameOverMessageLayer.height / 2);
    this.addChild(gameOverMessageLayer);
    this.addChild(gameOverLabel);
  }
});
module.exports = GameScene;

},{"1":1,"18":18,"19":19,"28":28,"9":9}],18:[function(require,module,exports){
"use strict";

var Promise = require(1);

var Const = require(9);

var res = require(28); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var Helper =
/*#__PURE__*/
function () {
  function Helper() {}

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.resToArray = function resToArray(res) {
    var assets = [];

    for (var id in res) {
      assets.push(res[id]);
    }

    return assets;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  Helper.createBackground = function createBackground(color) {
    var background = new cc.Sprite(res.colorWhite);
    background.setAnchorPoint(0, 0);
    background.setColor(color);
    background.setScale(cc.winSize.width / background.width, cc.winSize.height / background.height);
    return background;
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.getFont = function getFont(name) {
    return name ? Helper.getFontByRes(res[name]) : null;
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.getFontByRes = function getFontByRes(fontRes) {
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
  Helper.createLabelTTF = function createLabelTTF(title, font, fontSize, dimensions) {
    fontSize = fontSize || 16;
    var scaleFactor = cc.director.getContentScaleFactor();
    var labelTTF = new cc.LabelTTF(title, font, fontSize * scaleFactor, dimensions);
    labelTTF.setScale(1 / scaleFactor);
    return labelTTF;
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.toLeftTop = function toLeftTop(node, x, y) {
    return cc.p(x, node.height - y);
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.randomInteger = function randomInteger(min, max) {
    //let rand = min - 0.5 + Math.random() * (max - min + 1);
    //return Math.round(rand);
    var rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.onNodeClick = function onNodeClick(node, callback, hitArea) {
    cc.eventManager.addListener({
      event: cc.EventListener.TOUCH_ONE_BY_ONE,
      swallowTouches: true,
      onTouchBegan: function (touch, event) {
        //console.log('Helper.onNodeClick:onTouchBegan');
        if (Helper.isNodeVisible(node) && Helper.hitTest(touch, event, hitArea)) {
          return true;
        }
      },
      onTouchEnded: callback
    }, node);
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.isNodeVisible = function isNodeVisible(node) {
    if (node.parent) {
      return node.visible && Helper.isNodeVisible(node.parent);
    } else {
      return node.visible;
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.hitTest = function hitTest(touch, event, hitArea) {
    var location = touch.getLocation();
    var target = event.getCurrentTarget(); //console.log('target:', target);
    //console.log('touch:', touch);
    //console.log('event:', event);

    var locationInNode = target.convertToNodeSpace(location);
    var s = target.getContentSize();
    var rect;

    if (typeof hitArea === 'object' && hitArea !== null) {
      rect = cc.rect(0 - hitArea.left, 0 - hitArea.bottom, s.width + hitArea.left + hitArea.right, s.height + hitArea.top + hitArea.bottom);
    } else if (typeof hitArea === 'number') {
      rect = cc.rect(0 - hitArea, 0 - hitArea, s.width + hitArea * 2, s.height + hitArea * 2);
    } else {
      rect = cc.rect(0, 0, s.width, s.height);
    } //const rect = cc.rect(0, 0, s.width, s.height);


    return cc.rectContainsPoint(rect, locationInNode);
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.createMatrix = function createMatrix(M, N) {
    var matrix = new Array(M);

    for (var m = 0; m < M; m++) {
      matrix[m] = new Array(N);

      for (var n = 0; n < N; n++) {
        matrix[m][n] = null;
      }
    }

    return matrix;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  Helper.runActions = function runActions(node, actions) {
    return new Promise(function (resolve) {
      actions.push(cc.callFunc(resolve));
      node.runAction(cc.sequence(actions));
    });
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  Helper.createButton = function createButton(options) {
    options = options || {};

    var Scale9SpriteButton = require(23);

    var text = 'Button';

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
      normalFile: options.file || res.colorWhite,
      color: options.color,
      width: options.width || Const.BUTTON_WIDTH,
      height: options.height || Const.BUTTON_HEIGHT,
      text: text,
      fontName: options.fontName || Const.TITLE_FONT_NAME,
      fontSize: options.fontSize || Const.BUTTON_FONT_SIZE,
      fontColor: options.fontColor,
      hitArea: options.hitArea,
      visible: options.visible,
      offsetY: options.offsetY || -3
    });
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  Helper.addTouchListener = function addTouchListener(options) {
    cc.eventManager.addListener({
      event: cc.EventListener.TOUCH_ONE_BY_ONE,
      swallowTouches: options.swallow !== undefined ? options.swallow : false,
      onTouchBegan: options.onTouchBegan,
      onTouchMoved: options.onTouchMoved,
      onTouchEnded: options.onTouchEnded
    }, options.target);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  Helper.setScale9SpriteFile = function setScale9SpriteFile(scale9Sprite, file) {
    var width = scale9Sprite.width;
    var height = scale9Sprite.height;
    scale9Sprite.initWithFile(file, cc.rect(0, 0, 0, 0), cc.rect(0, 0, 0, 0));
    scale9Sprite.width = width;
    scale9Sprite.height = height;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  Helper.createBackButton = function createBackButton() {
    var backButton = Helper.createButton({
      title: "back",
      width: 130,
      hitArea: 10
    });
    backButton.setPosition(Helper.toLeftTop(cc.winSize, 10 + 130 / 2, 10 + 15));

    backButton.onClick = function () {
      cc.director.popScene();
    };

    return backButton;
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.fromLeftTop = function fromLeftTop(rect, x, y) {
    return cc.p(x, rect.height - y);
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.fromRightTop = function fromRightTop(parent, x, y) {
    return cc.p(parent.width - x, parent.height - y);
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.fromRightBottom = function fromRightBottom(node, x, y) {
    return cc.p(node.width - x, y);
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Helper.fromLeftBottom = function fromLeftBottom(node, x, y) {
    return cc.p(x, y);
  };

  return Helper;
}();

module.exports = Helper;

},{"1":1,"23":23,"28":28,"9":9}],19:[function(require,module,exports){
"use strict";

var Const = require(9);

var HomeScene = require(20);

var GameController = require(16); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var HomeController =
/*#__PURE__*/
function () {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function HomeController() {
    this.homeScene = new HomeScene();
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = HomeController.prototype;

  _proto.init = function init() {
    this.homeScene.init();
    this.homeScene.onStartLevel = this.onStartLevel.bind(this);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.run = function run() {
    cc.director.runScene(this.homeScene);
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ;

  _proto.onStartLevel = function onStartLevel(level) {
    console.log("HomeController.onStartLevel", level);
    var gameController = new GameController(Const.LEVEL_OPTIONS[level]);
    gameController.init();
    gameController.run();
  };

  return HomeController;
}();

module.exports = HomeController;

},{"16":16,"20":20,"9":9}],20:[function(require,module,exports){
"use strict";

var Promise = require(1);

var Const = require(9);

var Helper = require(18);

var res = require(28); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var HomeScene = cc.Scene.extend({
  _className: "HomeScene",
  onStartLevel: null,
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ctor: function (options) {
    if (options === void 0) {
      options = {};
    }

    this.options = options;

    this._super();
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  init: function () {
    var _this = this;

    // background
    this.addChild(Helper.createBackground(Const.SCENE_BACKGROUND_COLOR)); // title

    var title = Helper.createLabelTTF('blast', Helper.getFont(Const.TITLE_FONT_NAME), Const.SCENE_TITLE_FONT_SIZE);
    title.setPosition(Helper.toLeftTop(cc.visibleRect, cc.visibleRect.center.x, 30));
    this.addChild(title); // button1

    var button1 = new Helper.createButton({
      title: 'level 1'
    });
    button1.setPosition(cc.winSize.width / 2, cc.winSize.height / 2 + 100);

    button1.onClick = function () {
      if (_this.onStartLevel) {
        _this.onStartLevel(1);
      }
    };

    this.addChild(button1); // button2

    var button2 = new Helper.createButton({
      title: 'level 2'
    });
    button2.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);

    button2.onClick = function () {
      if (_this.onStartLevel) {
        _this.onStartLevel(2);
      }
    };

    this.addChild(button2); // button3

    var button3 = new Helper.createButton({
      title: 'level 3'
    });
    button3.setPosition(cc.winSize.width / 2, cc.winSize.height / 2 - 100);

    button3.onClick = function () {
      if (_this.onStartLevel) {
        _this.onStartLevel(3);
      }
    };

    this.addChild(button3);
  }
});
module.exports = HomeScene;

},{"1":1,"18":18,"28":28,"9":9}],21:[function(require,module,exports){
"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var Const = require(9);

var MoveStrategy = require(22); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var BottomMoveStrategy =
/*#__PURE__*/
function (_MoveStrategy) {
  _inheritsLoose(BottomMoveStrategy, _MoveStrategy);

  function BottomMoveStrategy() {
    return _MoveStrategy.apply(this, arguments) || this;
  }

  var _proto = BottomMoveStrategy.prototype;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  _proto.findMoves = function findMoves(field) {
    //console.log("BottomMoveStrategy.findMoves");
    var moves = [];

    for (var n = 0; n < field.game.options.N; n++) {
      var column = new Array(field.game.options.M);

      for (var m = 0; m < field.game.options.M; m++) {
        column[m] = field.isTileExists([m, n]) ? m : null;
      } //console.log("original column:", JSON.stringify(column));


      column = column.filter(function (m) {
        return m !== null;
      }); //console.log("filtered column:", JSON.stringify(column));
      //console.log("new len:", column.length);

      var cnt = field.game.options.M - column.length; //console.log("cnt:", cnt);

      for (var i = 0; i < cnt; i++) {
        column.unshift(null);
      } //console.log("unshifted column:", JSON.stringify(column));


      for (var _m = field.game.options.M - 1; _m >= 0; _m--) {
        if (column[_m] !== null && column[_m] !== _m) {
          moves.push({
            from: [column[_m], n],
            to: [_m, n]
          });
        }
      }
    }

    return moves;
  };

  return BottomMoveStrategy;
}(MoveStrategy);

module.exports = BottomMoveStrategy;

},{"22":22,"9":9}],22:[function(require,module,exports){
"use strict"; ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var MoveStrategy =
/*#__PURE__*/
function () {
  function MoveStrategy() {}

  var _proto = MoveStrategy.prototype;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  _proto.findMoves = function findMoves(field) {};

  return MoveStrategy;
}();

module.exports = MoveStrategy;

},{}],23:[function(require,module,exports){
'use strict';

var Promise = require(1);

var Const = require(9);

var Helper = require(18);

var res = require(28);

var Application = require(7); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var Scale9SpriteButton = cc.Scale9Sprite.extend({
  options: null,
  label: null,
  isDisabled: false,
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ctor: function (options) {
    this.options = options = options || {};

    this._super(options.normalFile); // color


    if (options.color) {
      this.setColor(options.color);
    } // width


    if (options.width) {
      this.width = options.width;
    } // height


    if (options.height) {
      this.height = options.height;
    }

    if (options.visible === false) {
      this.visible = false;
    } // text


    if (typeof options.text === 'string') {
      var fontName = options.fontName || Const.TITLE_FONT_NAME;
      var fontSize = options.fontSize || Const.BUTTON_FONT_SIZE; // label

      var label = this.label = Helper.createLabelTTF(options.text, Helper.getFont(fontName), fontSize);
      label.setPosition(this.width / 2 + (this.options.offsetX || 0), this.height / 2 + (this.options.offsetY || 0));

      if (options.fontColor) {
        label.setColor(options.fontColor);
      }

      this.addChild(label);
    }

    this.setCascadeOpacityEnabled(true); // events

    Helper.addTouchListener({
      target: this,
      swallow: true,
      onTouchBegan: this.onTouchBegan.bind(this),
      onTouchEnded: this.onTouchEnded.bind(this)
    });
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  onTouchBegan: function (touch, event) {
    if (Helper.isNodeVisible(this) && !this.isDisabled && Helper.hitTest(touch, event, this.options.hitArea)) {
      //console.log('Scale9SpriteButton.onTouchBegan');
      this.setActiveStyle();
      return true;
    }
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  setActiveStyle: function () {
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
  setNormalStyle: function () {
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
  onTouchEnded: function (touch, event) {
    var _this = this;

    //console.log('Scale9SpriteButton.onTouchEnded');
    this.setNormalStyle();

    if (Helper.hitTest(touch, event, this.options.hitArea)) {
      //cc.app.playSound(res.soundTap);
      if (this.onClick) {
        Promise.try(function () {
          return _this.onClick(_this);
        })
        /*.catch((err) => {
          return Application.handleClientError(err);
        })*/
        ;
      }
    }
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  setFontColor: function (color) {
    this.label.setColor(color);
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  disable: function () {
    this.isDisabled = true;

    if (this.label) {
      this.setFontColor(this.options.disableTextColor || Const.BUTTON_TEXT_DISABLE_COLOR);
    }
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  enable: function () {
    this.isDisabled = false;

    if (this.label) {
      var fontColor = this.options.fontColor ? this.options.fontColor : Const.WHITE;
      this.setFontColor(fontColor);
    }
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  setText: function (text) {
    this.label.setString(text);
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  setWidth: function (width) {
    this.width = width;
    this.label.setPosition(cc.p(this.width / 2, this.height / 2));
  }
});
module.exports = Scale9SpriteButton;

},{"1":1,"18":18,"28":28,"7":7,"9":9}],24:[function(require,module,exports){
"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var Tile = require(26);

var Const = require(9);

var BombActionStrategy = require(5); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var BombTile =
/*#__PURE__*/
function (_Tile) {
  _inheritsLoose(BombTile, _Tile);

  function BombTile() {
    return _Tile.apply(this, arguments) || this;
  }

  var _proto = BombTile.prototype;

  /*
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  constructor() {
      super();
  }
  */
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  _proto.createActionStrategy = function createActionStrategy(field, fieldView) {
    //console.log("BombTile.createActionStrategy");
    return new BombActionStrategy(field, fieldView);
  };

  return BombTile;
}(Tile);

module.exports = BombTile;

},{"26":26,"5":5,"9":9}],25:[function(require,module,exports){
"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var Tile = require(26);

var Const = require(9);

var RegularActionStrategy = require(6); ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var RegularTile =
/*#__PURE__*/
function (_Tile) {
  _inheritsLoose(RegularTile, _Tile);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function RegularTile(colorIndex) {
    var _this;

    _this = _Tile.call(this) || this;
    _this.colorIndex = colorIndex;
    return _this;
  } ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  var _proto = RegularTile.prototype;

  _proto.createActionStrategy = function createActionStrategy(field, fieldView) {
    //console.log("RegularTile.createActionStrategy");
    return new RegularActionStrategy(field, fieldView);
  };

  return RegularTile;
}(Tile);

module.exports = RegularTile;

},{"26":26,"6":6,"9":9}],26:[function(require,module,exports){
"use strict"; ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Tile =
/*#__PURE__*/
function () {
  function Tile() {}

  var _proto = Tile.prototype;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  _proto.createActionStrategy = function createActionStrategy(field, fieldView) {};

  return Tile;
}();

module.exports = Tile;

},{}],27:[function(require,module,exports){
"use strict";

var onStartCalled = false;

cc.game.onStart = function () {
  if (onStartCalled) return;
  onStartCalled = true;
  console.log("cc.game.onStart");

  var Application = require(7);

  try {
    var app = new Application();
    app.init();
    var now = Date.now();
    app.load().then(function () {
      console.log(`app loaded: ${Date.now() - now}ms`);

      try {
        app.run();
      } catch (err) {
        console.error("app run error:", err);
      }
    });
  } catch (err) {
    console.error("onStart error:", err);
  }
};

cc.game.run();

},{"7":7}],28:[function(require,module,exports){
"use strict";

module.exports = {
  // color
  colorWhite: "res/color/white.png",
  // block
  tile: "res/tile.png",
  field: "res/field.png",
  bomb: "res/bomb.png",
  back: "res/back.png",
  // sound
  soundBurn: 'res/sound/burn.mp3',
  soundWrong: 'res/sound/wrong.mp3',
  // font
  AmericanCaptain: {
    type: "font",
    name: "AmericanCaptain",
    srcs: ["res/fonts/AmericanCaptain.ttf"]
  } // title

};

},{}]},{},[27])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmx1ZWJpcmQvanMvYnJvd3Nlci9ibHVlYmlyZC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsInNyYy9BY3Rpb25TdHJhdGVneS9BY3Rpb25TdHJhdGVneS5qcyIsInNyYy9BY3Rpb25TdHJhdGVneS9Cb21iQWN0aW9uU3RyYXRlZ3kvQm9tYkFjdGlvblN0cmF0ZWd5LmpzIiwic3JjL0FjdGlvblN0cmF0ZWd5L1JlZ3VsYXJBY3Rpb25TdHJhdGVneS9SZWd1bGFyQWN0aW9uU3RyYXRlZ3kuanMiLCJzcmMvQXBwbGljYXRpb24uanMiLCJzcmMvQmFnLmpzIiwic3JjL0NvbnN0LmpzIiwic3JjL0ZpZWxkLmpzIiwic3JjL0ZpZWxkQ29udHJvbGxlci5qcyIsInNyYy9GaWVsZFZpZXcuanMiLCJzcmMvRmlsbFN0cmF0ZWd5L0ZpbGxTdHJhdGVneS5qcyIsInNyYy9GaWxsU3RyYXRlZ3kvUmVndWxhckZpbGxTdHJhdGVneS9SZWd1bGFyRmlsbFN0cmF0ZWd5LmpzIiwic3JjL0dhbWUuanMiLCJzcmMvR2FtZUNvbnRyb2xsZXIuanMiLCJzcmMvR2FtZVNjZW5lLmpzIiwic3JjL0hlbHBlci5qcyIsInNyYy9Ib21lQ29udHJvbGxlci5qcyIsInNyYy9Ib21lU2NlbmUuanMiLCJzcmMvTW92ZVN0cmF0ZWd5L0JvdHRvbU1vdmVTdHJhdGVneS9Cb3R0b21Nb3ZlU3RyYXRlZ3kuanMiLCJzcmMvTW92ZVN0cmF0ZWd5L01vdmVTdHJhdGVneS5qcyIsInNyYy9TY2FsZTlTcHJpdGVCdXR0b24uanMiLCJzcmMvVGlsZS9Cb21iVGlsZS9Cb21iVGlsZS5qcyIsInNyYy9UaWxlL1JlZ3VsYXJUaWxlL1JlZ3VsYXJUaWxlLmpzIiwic3JjL1RpbGUvVGlsZS5qcyIsInNyYy9hcHAuanMiLCJzcmMvcmVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QTVDOztBQUNBLFVBQUk7QUFDQSxRQUFBLEdBQUcsQ0FBQyxHQUFKO0FBQ0gsT0FGRCxDQUVFLE9BQU8sR0FBUCxFQUFZO0FBQ1YsUUFBQSxPQUFPLENBQUMsS0FBUixDQUFjLGdCQUFkLEVBQWdDLEdBQWhDO0FBQ0g7QUFDSixLQVBEO0FBUUgsR0FiRCxDQWFFLE9BQU8sR0FBUCxFQUFZO0FBQ1YsSUFBQSxPQUFPLENBQUMsS0FBUixDQUFjLGdCQUFkLEVBQWdDLEdBQWhDO0FBQ0g7QUFDSixDQXBCRDs7QUFxQkEsRUFBRSxDQUFDLElBQUgsQ0FBUSxHQUFSOzs7QUN4QkE7O0FBRUEsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFFYjtBQUNBLEVBQUEsVUFBVSxFQUFFLHFCQUhDO0FBS2I7QUFDQSxFQUFBLElBQUksRUFBRyxjQU5NO0FBT2IsRUFBQSxLQUFLLEVBQUUsZUFQTTtBQVFiLEVBQUEsSUFBSSxFQUFHLGNBUk07QUFTYixFQUFBLElBQUksRUFBRyxjQVRNO0FBV2I7QUFDQSxFQUFBLFNBQVMsRUFBRyxvQkFaQztBQWFiLEVBQUEsVUFBVSxFQUFFLHFCQWJDO0FBZWI7QUFDQSxFQUFBLGVBQWUsRUFBSTtBQUFDLElBQUEsSUFBSSxFQUFFLE1BQVA7QUFBZSxJQUFBLElBQUksRUFBRSxpQkFBckI7QUFBMEMsSUFBQSxJQUFJLEVBQUUsQ0FBQywrQkFBRDtBQUFoRCxHQWhCTixDQWdCOEY7O0FBaEI5RixDQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qIEBwcmVzZXJ2ZVxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE4IFBldGthIEFudG9ub3ZcbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqIFxuICovXG4vKipcbiAqIGJsdWViaXJkIGJ1aWxkIHZlcnNpb24gMy43LjFcbiAqIEZlYXR1cmVzIGVuYWJsZWQ6IGNvcmUsIHJhY2UsIGNhbGxfZ2V0LCBnZW5lcmF0b3JzLCBtYXAsIG5vZGVpZnksIHByb21pc2lmeSwgcHJvcHMsIHJlZHVjZSwgc2V0dGxlLCBzb21lLCB1c2luZywgdGltZXJzLCBmaWx0ZXIsIGFueSwgZWFjaFxuKi9cbiFmdW5jdGlvbihlKXtpZihcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIG1vZHVsZSltb2R1bGUuZXhwb3J0cz1lKCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQpZGVmaW5lKFtdLGUpO2Vsc2V7dmFyIGY7XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz9mPXdpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2Y9Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmJiYoZj1zZWxmKSxmLlByb21pc2U9ZSgpfX0oZnVuY3Rpb24oKXt2YXIgZGVmaW5lLG1vZHVsZSxleHBvcnRzO3JldHVybiAoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIF9kZXJlcV89PVwiZnVuY3Rpb25cIiYmX2RlcmVxXztpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgX2RlcmVxXz09XCJmdW5jdGlvblwiJiZfZGVyZXFfO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSkge1xudmFyIFNvbWVQcm9taXNlQXJyYXkgPSBQcm9taXNlLl9Tb21lUHJvbWlzZUFycmF5O1xuZnVuY3Rpb24gYW55KHByb21pc2VzKSB7XG4gICAgdmFyIHJldCA9IG5ldyBTb21lUHJvbWlzZUFycmF5KHByb21pc2VzKTtcbiAgICB2YXIgcHJvbWlzZSA9IHJldC5wcm9taXNlKCk7XG4gICAgcmV0LnNldEhvd01hbnkoMSk7XG4gICAgcmV0LnNldFVud3JhcCgpO1xuICAgIHJldC5pbml0KCk7XG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5cblByb21pc2UuYW55ID0gZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIGFueShwcm9taXNlcyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5hbnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFueSh0aGlzKTtcbn07XG5cbn07XG5cbn0se31dLDI6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgZmlyc3RMaW5lRXJyb3I7XG50cnkge3Rocm93IG5ldyBFcnJvcigpOyB9IGNhdGNoIChlKSB7Zmlyc3RMaW5lRXJyb3IgPSBlO31cbnZhciBzY2hlZHVsZSA9IF9kZXJlcV8oXCIuL3NjaGVkdWxlXCIpO1xudmFyIFF1ZXVlID0gX2RlcmVxXyhcIi4vcXVldWVcIik7XG5cbmZ1bmN0aW9uIEFzeW5jKCkge1xuICAgIHRoaXMuX2N1c3RvbVNjaGVkdWxlciA9IGZhbHNlO1xuICAgIHRoaXMuX2lzVGlja1VzZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9sYXRlUXVldWUgPSBuZXcgUXVldWUoMTYpO1xuICAgIHRoaXMuX25vcm1hbFF1ZXVlID0gbmV3IFF1ZXVlKDE2KTtcbiAgICB0aGlzLl9oYXZlRHJhaW5lZFF1ZXVlcyA9IGZhbHNlO1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLmRyYWluUXVldWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLl9kcmFpblF1ZXVlcygpO1xuICAgIH07XG4gICAgdGhpcy5fc2NoZWR1bGUgPSBzY2hlZHVsZTtcbn1cblxuQXN5bmMucHJvdG90eXBlLnNldFNjaGVkdWxlciA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIHByZXYgPSB0aGlzLl9zY2hlZHVsZTtcbiAgICB0aGlzLl9zY2hlZHVsZSA9IGZuO1xuICAgIHRoaXMuX2N1c3RvbVNjaGVkdWxlciA9IHRydWU7XG4gICAgcmV0dXJuIHByZXY7XG59O1xuXG5Bc3luYy5wcm90b3R5cGUuaGFzQ3VzdG9tU2NoZWR1bGVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2N1c3RvbVNjaGVkdWxlcjtcbn07XG5cbkFzeW5jLnByb3RvdHlwZS5oYXZlSXRlbXNRdWV1ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzVGlja1VzZWQgfHwgdGhpcy5faGF2ZURyYWluZWRRdWV1ZXM7XG59O1xuXG5cbkFzeW5jLnByb3RvdHlwZS5mYXRhbEVycm9yID0gZnVuY3Rpb24oZSwgaXNOb2RlKSB7XG4gICAgaWYgKGlzTm9kZSkge1xuICAgICAgICBwcm9jZXNzLnN0ZGVyci53cml0ZShcIkZhdGFsIFwiICsgKGUgaW5zdGFuY2VvZiBFcnJvciA/IGUuc3RhY2sgOiBlKSArXG4gICAgICAgICAgICBcIlxcblwiKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudGhyb3dMYXRlcihlKTtcbiAgICB9XG59O1xuXG5Bc3luYy5wcm90b3R5cGUudGhyb3dMYXRlciA9IGZ1bmN0aW9uKGZuLCBhcmcpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBhcmcgPSBmbjtcbiAgICAgICAgZm4gPSBmdW5jdGlvbiAoKSB7IHRocm93IGFyZzsgfTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmbihhcmcpO1xuICAgICAgICB9LCAwKTtcbiAgICB9IGVsc2UgdHJ5IHtcbiAgICAgICAgdGhpcy5fc2NoZWR1bGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmbihhcmcpO1xuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGFzeW5jIHNjaGVkdWxlciBhdmFpbGFibGVcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9NcXJGbVhcXHUwMDBhXCIpO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIEFzeW5jSW52b2tlTGF0ZXIoZm4sIHJlY2VpdmVyLCBhcmcpIHtcbiAgICB0aGlzLl9sYXRlUXVldWUucHVzaChmbiwgcmVjZWl2ZXIsIGFyZyk7XG4gICAgdGhpcy5fcXVldWVUaWNrKCk7XG59XG5cbmZ1bmN0aW9uIEFzeW5jSW52b2tlKGZuLCByZWNlaXZlciwgYXJnKSB7XG4gICAgdGhpcy5fbm9ybWFsUXVldWUucHVzaChmbiwgcmVjZWl2ZXIsIGFyZyk7XG4gICAgdGhpcy5fcXVldWVUaWNrKCk7XG59XG5cbmZ1bmN0aW9uIEFzeW5jU2V0dGxlUHJvbWlzZXMocHJvbWlzZSkge1xuICAgIHRoaXMuX25vcm1hbFF1ZXVlLl9wdXNoT25lKHByb21pc2UpO1xuICAgIHRoaXMuX3F1ZXVlVGljaygpO1xufVxuXG5Bc3luYy5wcm90b3R5cGUuaW52b2tlTGF0ZXIgPSBBc3luY0ludm9rZUxhdGVyO1xuQXN5bmMucHJvdG90eXBlLmludm9rZSA9IEFzeW5jSW52b2tlO1xuQXN5bmMucHJvdG90eXBlLnNldHRsZVByb21pc2VzID0gQXN5bmNTZXR0bGVQcm9taXNlcztcblxuXG5mdW5jdGlvbiBfZHJhaW5RdWV1ZShxdWV1ZSkge1xuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGgoKSA+IDApIHtcbiAgICAgICAgX2RyYWluUXVldWVTdGVwKHF1ZXVlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9kcmFpblF1ZXVlU3RlcChxdWV1ZSkge1xuICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGZuLl9zZXR0bGVQcm9taXNlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciByZWNlaXZlciA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgIHZhciBhcmcgPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICBmbi5jYWxsKHJlY2VpdmVyLCBhcmcpO1xuICAgIH1cbn1cblxuQXN5bmMucHJvdG90eXBlLl9kcmFpblF1ZXVlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBfZHJhaW5RdWV1ZSh0aGlzLl9ub3JtYWxRdWV1ZSk7XG4gICAgdGhpcy5fcmVzZXQoKTtcbiAgICB0aGlzLl9oYXZlRHJhaW5lZFF1ZXVlcyA9IHRydWU7XG4gICAgX2RyYWluUXVldWUodGhpcy5fbGF0ZVF1ZXVlKTtcbn07XG5cbkFzeW5jLnByb3RvdHlwZS5fcXVldWVUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5faXNUaWNrVXNlZCkge1xuICAgICAgICB0aGlzLl9pc1RpY2tVc2VkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fc2NoZWR1bGUodGhpcy5kcmFpblF1ZXVlcyk7XG4gICAgfVxufTtcblxuQXN5bmMucHJvdG90eXBlLl9yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9pc1RpY2tVc2VkID0gZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFzeW5jO1xubW9kdWxlLmV4cG9ydHMuZmlyc3RMaW5lRXJyb3IgPSBmaXJzdExpbmVFcnJvcjtcblxufSx7XCIuL3F1ZXVlXCI6MjYsXCIuL3NjaGVkdWxlXCI6Mjl9XSwzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCwgdHJ5Q29udmVydFRvUHJvbWlzZSwgZGVidWcpIHtcbnZhciBjYWxsZWRCaW5kID0gZmFsc2U7XG52YXIgcmVqZWN0VGhpcyA9IGZ1bmN0aW9uKF8sIGUpIHtcbiAgICB0aGlzLl9yZWplY3QoZSk7XG59O1xuXG52YXIgdGFyZ2V0UmVqZWN0ZWQgPSBmdW5jdGlvbihlLCBjb250ZXh0KSB7XG4gICAgY29udGV4dC5wcm9taXNlUmVqZWN0aW9uUXVldWVkID0gdHJ1ZTtcbiAgICBjb250ZXh0LmJpbmRpbmdQcm9taXNlLl90aGVuKHJlamVjdFRoaXMsIHJlamVjdFRoaXMsIG51bGwsIHRoaXMsIGUpO1xufTtcblxudmFyIGJpbmRpbmdSZXNvbHZlZCA9IGZ1bmN0aW9uKHRoaXNBcmcsIGNvbnRleHQpIHtcbiAgICBpZiAoKCh0aGlzLl9iaXRGaWVsZCAmIDUwMzk3MTg0KSA9PT0gMCkpIHtcbiAgICAgICAgdGhpcy5fcmVzb2x2ZUNhbGxiYWNrKGNvbnRleHQudGFyZ2V0KTtcbiAgICB9XG59O1xuXG52YXIgYmluZGluZ1JlamVjdGVkID0gZnVuY3Rpb24oZSwgY29udGV4dCkge1xuICAgIGlmICghY29udGV4dC5wcm9taXNlUmVqZWN0aW9uUXVldWVkKSB0aGlzLl9yZWplY3QoZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKHRoaXNBcmcpIHtcbiAgICBpZiAoIWNhbGxlZEJpbmQpIHtcbiAgICAgICAgY2FsbGVkQmluZCA9IHRydWU7XG4gICAgICAgIFByb21pc2UucHJvdG90eXBlLl9wcm9wYWdhdGVGcm9tID0gZGVidWcucHJvcGFnYXRlRnJvbUZ1bmN0aW9uKCk7XG4gICAgICAgIFByb21pc2UucHJvdG90eXBlLl9ib3VuZFZhbHVlID0gZGVidWcuYm91bmRWYWx1ZUZ1bmN0aW9uKCk7XG4gICAgfVxuICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHRoaXNBcmcpO1xuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgcmV0Ll9wcm9wYWdhdGVGcm9tKHRoaXMsIDEpO1xuICAgIHZhciB0YXJnZXQgPSB0aGlzLl90YXJnZXQoKTtcbiAgICByZXQuX3NldEJvdW5kVG8obWF5YmVQcm9taXNlKTtcbiAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICB2YXIgY29udGV4dCA9IHtcbiAgICAgICAgICAgIHByb21pc2VSZWplY3Rpb25RdWV1ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcHJvbWlzZTogcmV0LFxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXG4gICAgICAgICAgICBiaW5kaW5nUHJvbWlzZTogbWF5YmVQcm9taXNlXG4gICAgICAgIH07XG4gICAgICAgIHRhcmdldC5fdGhlbihJTlRFUk5BTCwgdGFyZ2V0UmVqZWN0ZWQsIHVuZGVmaW5lZCwgcmV0LCBjb250ZXh0KTtcbiAgICAgICAgbWF5YmVQcm9taXNlLl90aGVuKFxuICAgICAgICAgICAgYmluZGluZ1Jlc29sdmVkLCBiaW5kaW5nUmVqZWN0ZWQsIHVuZGVmaW5lZCwgcmV0LCBjb250ZXh0KTtcbiAgICAgICAgcmV0Ll9zZXRPbkNhbmNlbChtYXliZVByb21pc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldC5fcmVzb2x2ZUNhbGxiYWNrKHRhcmdldCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0Qm91bmRUbyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICBpZiAob2JqICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDIwOTcxNTI7XG4gICAgICAgIHRoaXMuX2JvdW5kVG8gPSBvYmo7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCAmICh+MjA5NzE1Mik7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2lzQm91bmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDIwOTcxNTIpID09PSAyMDk3MTUyO1xufTtcblxuUHJvbWlzZS5iaW5kID0gZnVuY3Rpb24gKHRoaXNBcmcsIHZhbHVlKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh2YWx1ZSkuYmluZCh0aGlzQXJnKTtcbn07XG59O1xuXG59LHt9XSw0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xudmFyIG9sZDtcbmlmICh0eXBlb2YgUHJvbWlzZSAhPT0gXCJ1bmRlZmluZWRcIikgb2xkID0gUHJvbWlzZTtcbmZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG4gICAgdHJ5IHsgaWYgKFByb21pc2UgPT09IGJsdWViaXJkKSBQcm9taXNlID0gb2xkOyB9XG4gICAgY2F0Y2ggKGUpIHt9XG4gICAgcmV0dXJuIGJsdWViaXJkO1xufVxudmFyIGJsdWViaXJkID0gX2RlcmVxXyhcIi4vcHJvbWlzZVwiKSgpO1xuYmx1ZWJpcmQubm9Db25mbGljdCA9IG5vQ29uZmxpY3Q7XG5tb2R1bGUuZXhwb3J0cyA9IGJsdWViaXJkO1xuXG59LHtcIi4vcHJvbWlzZVwiOjIyfV0sNTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBjciA9IE9iamVjdC5jcmVhdGU7XG5pZiAoY3IpIHtcbiAgICB2YXIgY2FsbGVyQ2FjaGUgPSBjcihudWxsKTtcbiAgICB2YXIgZ2V0dGVyQ2FjaGUgPSBjcihudWxsKTtcbiAgICBjYWxsZXJDYWNoZVtcIiBzaXplXCJdID0gZ2V0dGVyQ2FjaGVbXCIgc2l6ZVwiXSA9IDA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSkge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsXCIpO1xudmFyIGNhbkV2YWx1YXRlID0gdXRpbC5jYW5FdmFsdWF0ZTtcbnZhciBpc0lkZW50aWZpZXIgPSB1dGlsLmlzSWRlbnRpZmllcjtcblxudmFyIGdldE1ldGhvZENhbGxlcjtcbnZhciBnZXRHZXR0ZXI7XG5pZiAoIXRydWUpIHtcbnZhciBtYWtlTWV0aG9kQ2FsbGVyID0gZnVuY3Rpb24gKG1ldGhvZE5hbWUpIHtcbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKFwiZW5zdXJlTWV0aG9kXCIsIFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciBsZW4gPSB0aGlzLmxlbmd0aDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIGVuc3VyZU1ldGhvZChvYmosICdtZXRob2ROYW1lJyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHN3aXRjaChsZW4pIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBvYmoubWV0aG9kTmFtZSh0aGlzWzBdKTsgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBjYXNlIDI6IHJldHVybiBvYmoubWV0aG9kTmFtZSh0aGlzWzBdLCB0aGlzWzFdKTsgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBjYXNlIDM6IHJldHVybiBvYmoubWV0aG9kTmFtZSh0aGlzWzBdLCB0aGlzWzFdLCB0aGlzWzJdKTsgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBjYXNlIDA6IHJldHVybiBvYmoubWV0aG9kTmFtZSgpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iai5tZXRob2ROYW1lLmFwcGx5KG9iaiwgdGhpcyk7ICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgfTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgXCIucmVwbGFjZSgvbWV0aG9kTmFtZS9nLCBtZXRob2ROYW1lKSkoZW5zdXJlTWV0aG9kKTtcbn07XG5cbnZhciBtYWtlR2V0dGVyID0gZnVuY3Rpb24gKHByb3BlcnR5TmFtZSkge1xuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oXCJvYmpcIiwgXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAndXNlIHN0cmljdCc7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICByZXR1cm4gb2JqLnByb3BlcnR5TmFtZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICBcIi5yZXBsYWNlKFwicHJvcGVydHlOYW1lXCIsIHByb3BlcnR5TmFtZSkpO1xufTtcblxudmFyIGdldENvbXBpbGVkID0gZnVuY3Rpb24obmFtZSwgY29tcGlsZXIsIGNhY2hlKSB7XG4gICAgdmFyIHJldCA9IGNhY2hlW25hbWVdO1xuICAgIGlmICh0eXBlb2YgcmV0ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgaWYgKCFpc0lkZW50aWZpZXIobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldCA9IGNvbXBpbGVyKG5hbWUpO1xuICAgICAgICBjYWNoZVtuYW1lXSA9IHJldDtcbiAgICAgICAgY2FjaGVbXCIgc2l6ZVwiXSsrO1xuICAgICAgICBpZiAoY2FjaGVbXCIgc2l6ZVwiXSA+IDUxMikge1xuICAgICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhjYWNoZSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgKytpKSBkZWxldGUgY2FjaGVba2V5c1tpXV07XG4gICAgICAgICAgICBjYWNoZVtcIiBzaXplXCJdID0ga2V5cy5sZW5ndGggLSAyNTY7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cbmdldE1ldGhvZENhbGxlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gZ2V0Q29tcGlsZWQobmFtZSwgbWFrZU1ldGhvZENhbGxlciwgY2FsbGVyQ2FjaGUpO1xufTtcblxuZ2V0R2V0dGVyID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiBnZXRDb21waWxlZChuYW1lLCBtYWtlR2V0dGVyLCBnZXR0ZXJDYWNoZSk7XG59O1xufVxuXG5mdW5jdGlvbiBlbnN1cmVNZXRob2Qob2JqLCBtZXRob2ROYW1lKSB7XG4gICAgdmFyIGZuO1xuICAgIGlmIChvYmogIT0gbnVsbCkgZm4gPSBvYmpbbWV0aG9kTmFtZV07XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gXCJPYmplY3QgXCIgKyB1dGlsLmNsYXNzU3RyaW5nKG9iaikgKyBcIiBoYXMgbm8gbWV0aG9kICdcIiArXG4gICAgICAgICAgICB1dGlsLnRvU3RyaW5nKG1ldGhvZE5hbWUpICsgXCInXCI7XG4gICAgICAgIHRocm93IG5ldyBQcm9taXNlLlR5cGVFcnJvcihtZXNzYWdlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZuO1xufVxuXG5mdW5jdGlvbiBjYWxsZXIob2JqKSB7XG4gICAgdmFyIG1ldGhvZE5hbWUgPSB0aGlzLnBvcCgpO1xuICAgIHZhciBmbiA9IGVuc3VyZU1ldGhvZChvYmosIG1ldGhvZE5hbWUpO1xuICAgIHJldHVybiBmbi5hcHBseShvYmosIHRoaXMpO1xufVxuUHJvbWlzZS5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uIChtZXRob2ROYW1lKSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7O1xuICAgIGlmICghdHJ1ZSkge1xuICAgICAgICBpZiAoY2FuRXZhbHVhdGUpIHtcbiAgICAgICAgICAgIHZhciBtYXliZUNhbGxlciA9IGdldE1ldGhvZENhbGxlcihtZXRob2ROYW1lKTtcbiAgICAgICAgICAgIGlmIChtYXliZUNhbGxlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl90aGVuKFxuICAgICAgICAgICAgICAgICAgICBtYXliZUNhbGxlciwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGFyZ3MsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXJncy5wdXNoKG1ldGhvZE5hbWUpO1xuICAgIHJldHVybiB0aGlzLl90aGVuKGNhbGxlciwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGFyZ3MsIHVuZGVmaW5lZCk7XG59O1xuXG5mdW5jdGlvbiBuYW1lZEdldHRlcihvYmopIHtcbiAgICByZXR1cm4gb2JqW3RoaXNdO1xufVxuZnVuY3Rpb24gaW5kZXhlZEdldHRlcihvYmopIHtcbiAgICB2YXIgaW5kZXggPSArdGhpcztcbiAgICBpZiAoaW5kZXggPCAwKSBpbmRleCA9IE1hdGgubWF4KDAsIGluZGV4ICsgb2JqLmxlbmd0aCk7XG4gICAgcmV0dXJuIG9ialtpbmRleF07XG59XG5Qcm9taXNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAocHJvcGVydHlOYW1lKSB7XG4gICAgdmFyIGlzSW5kZXggPSAodHlwZW9mIHByb3BlcnR5TmFtZSA9PT0gXCJudW1iZXJcIik7XG4gICAgdmFyIGdldHRlcjtcbiAgICBpZiAoIWlzSW5kZXgpIHtcbiAgICAgICAgaWYgKGNhbkV2YWx1YXRlKSB7XG4gICAgICAgICAgICB2YXIgbWF5YmVHZXR0ZXIgPSBnZXRHZXR0ZXIocHJvcGVydHlOYW1lKTtcbiAgICAgICAgICAgIGdldHRlciA9IG1heWJlR2V0dGVyICE9PSBudWxsID8gbWF5YmVHZXR0ZXIgOiBuYW1lZEdldHRlcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdldHRlciA9IG5hbWVkR2V0dGVyO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0dGVyID0gaW5kZXhlZEdldHRlcjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3RoZW4oZ2V0dGVyLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgcHJvcGVydHlOYW1lLCB1bmRlZmluZWQpO1xufTtcbn07XG5cbn0se1wiLi91dGlsXCI6MzZ9XSw2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBQcm9taXNlQXJyYXksIGFwaVJlamVjdGlvbiwgZGVidWcpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnZhciB0cnlDYXRjaCA9IHV0aWwudHJ5Q2F0Y2g7XG52YXIgZXJyb3JPYmogPSB1dGlsLmVycm9yT2JqO1xudmFyIGFzeW5jID0gUHJvbWlzZS5fYXN5bmM7XG5cblByb21pc2UucHJvdG90eXBlW1wiYnJlYWtcIl0gPSBQcm9taXNlLnByb3RvdHlwZS5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIWRlYnVnLmNhbmNlbGxhdGlvbigpKSByZXR1cm4gdGhpcy5fd2FybihcImNhbmNlbGxhdGlvbiBpcyBkaXNhYmxlZFwiKTtcblxuICAgIHZhciBwcm9taXNlID0gdGhpcztcbiAgICB2YXIgY2hpbGQgPSBwcm9taXNlO1xuICAgIHdoaWxlIChwcm9taXNlLl9pc0NhbmNlbGxhYmxlKCkpIHtcbiAgICAgICAgaWYgKCFwcm9taXNlLl9jYW5jZWxCeShjaGlsZCkpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZC5faXNGb2xsb3dpbmcoKSkge1xuICAgICAgICAgICAgICAgIGNoaWxkLl9mb2xsb3dlZSgpLmNhbmNlbCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjaGlsZC5fY2FuY2VsQnJhbmNoZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBhcmVudCA9IHByb21pc2UuX2NhbmNlbGxhdGlvblBhcmVudDtcbiAgICAgICAgaWYgKHBhcmVudCA9PSBudWxsIHx8ICFwYXJlbnQuX2lzQ2FuY2VsbGFibGUoKSkge1xuICAgICAgICAgICAgaWYgKHByb21pc2UuX2lzRm9sbG93aW5nKCkpIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlLl9mb2xsb3dlZSgpLmNhbmNlbCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlLl9jYW5jZWxCcmFuY2hlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAocHJvbWlzZS5faXNGb2xsb3dpbmcoKSkgcHJvbWlzZS5fZm9sbG93ZWUoKS5jYW5jZWwoKTtcbiAgICAgICAgICAgIHByb21pc2UuX3NldFdpbGxCZUNhbmNlbGxlZCgpO1xuICAgICAgICAgICAgY2hpbGQgPSBwcm9taXNlO1xuICAgICAgICAgICAgcHJvbWlzZSA9IHBhcmVudDtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9icmFuY2hIYXNDYW5jZWxsZWQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9icmFuY2hlc1JlbWFpbmluZ1RvQ2FuY2VsLS07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fZW5vdWdoQnJhbmNoZXNIYXZlQ2FuY2VsbGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JyYW5jaGVzUmVtYWluaW5nVG9DYW5jZWwgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgICB0aGlzLl9icmFuY2hlc1JlbWFpbmluZ1RvQ2FuY2VsIDw9IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fY2FuY2VsQnkgPSBmdW5jdGlvbihjYW5jZWxsZXIpIHtcbiAgICBpZiAoY2FuY2VsbGVyID09PSB0aGlzKSB7XG4gICAgICAgIHRoaXMuX2JyYW5jaGVzUmVtYWluaW5nVG9DYW5jZWwgPSAwO1xuICAgICAgICB0aGlzLl9pbnZva2VPbkNhbmNlbCgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9icmFuY2hIYXNDYW5jZWxsZWQoKTtcbiAgICAgICAgaWYgKHRoaXMuX2Vub3VnaEJyYW5jaGVzSGF2ZUNhbmNlbGxlZCgpKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnZva2VPbkNhbmNlbCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2NhbmNlbEJyYW5jaGVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2Vub3VnaEJyYW5jaGVzSGF2ZUNhbmNlbGxlZCgpKSB7XG4gICAgICAgIHRoaXMuX2NhbmNlbCgpO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuX2lzQ2FuY2VsbGFibGUoKSkgcmV0dXJuO1xuICAgIHRoaXMuX3NldENhbmNlbGxlZCgpO1xuICAgIGFzeW5jLmludm9rZSh0aGlzLl9jYW5jZWxQcm9taXNlcywgdGhpcywgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9jYW5jZWxQcm9taXNlcyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9sZW5ndGgoKSA+IDApIHRoaXMuX3NldHRsZVByb21pc2VzKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdW5zZXRPbkNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX29uQ2FuY2VsRmllbGQgPSB1bmRlZmluZWQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNDYW5jZWxsYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmlzUGVuZGluZygpICYmICF0aGlzLl9pc0NhbmNlbGxlZCgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuaXNDYW5jZWxsYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmlzUGVuZGluZygpICYmICF0aGlzLmlzQ2FuY2VsbGVkKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fZG9JbnZva2VPbkNhbmNlbCA9IGZ1bmN0aW9uKG9uQ2FuY2VsQ2FsbGJhY2ssIGludGVybmFsT25seSkge1xuICAgIGlmICh1dGlsLmlzQXJyYXkob25DYW5jZWxDYWxsYmFjaykpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvbkNhbmNlbENhbGxiYWNrLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB0aGlzLl9kb0ludm9rZU9uQ2FuY2VsKG9uQ2FuY2VsQ2FsbGJhY2tbaV0sIGludGVybmFsT25seSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9uQ2FuY2VsQ2FsbGJhY2sgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIG9uQ2FuY2VsQ2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgaWYgKCFpbnRlcm5hbE9ubHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IHRyeUNhdGNoKG9uQ2FuY2VsQ2FsbGJhY2spLmNhbGwodGhpcy5fYm91bmRWYWx1ZSgpKTtcbiAgICAgICAgICAgICAgICBpZiAoZSA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXR0YWNoRXh0cmFUcmFjZShlLmUpO1xuICAgICAgICAgICAgICAgICAgICBhc3luYy50aHJvd0xhdGVyKGUuZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb25DYW5jZWxDYWxsYmFjay5fcmVzdWx0Q2FuY2VsbGVkKHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2ludm9rZU9uQ2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9uQ2FuY2VsQ2FsbGJhY2sgPSB0aGlzLl9vbkNhbmNlbCgpO1xuICAgIHRoaXMuX3Vuc2V0T25DYW5jZWwoKTtcbiAgICBhc3luYy5pbnZva2UodGhpcy5fZG9JbnZva2VPbkNhbmNlbCwgdGhpcywgb25DYW5jZWxDYWxsYmFjayk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faW52b2tlSW50ZXJuYWxPbkNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9pc0NhbmNlbGxhYmxlKCkpIHtcbiAgICAgICAgdGhpcy5fZG9JbnZva2VPbkNhbmNlbCh0aGlzLl9vbkNhbmNlbCgpLCB0cnVlKTtcbiAgICAgICAgdGhpcy5fdW5zZXRPbkNhbmNlbCgpO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZXN1bHRDYW5jZWxsZWQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNhbmNlbCgpO1xufTtcblxufTtcblxufSx7XCIuL3V0aWxcIjozNn1dLDc6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKE5FWFRfRklMVEVSKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWxcIik7XG52YXIgZ2V0S2V5cyA9IF9kZXJlcV8oXCIuL2VzNVwiKS5rZXlzO1xudmFyIHRyeUNhdGNoID0gdXRpbC50cnlDYXRjaDtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG5cbmZ1bmN0aW9uIGNhdGNoRmlsdGVyKGluc3RhbmNlcywgY2IsIHByb21pc2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgYm91bmRUbyA9IHByb21pc2UuX2JvdW5kVmFsdWUoKTtcbiAgICAgICAgcHJlZGljYXRlTG9vcDogZm9yICh2YXIgaSA9IDA7IGkgPCBpbnN0YW5jZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gaW5zdGFuY2VzW2ldO1xuXG4gICAgICAgICAgICBpZiAoaXRlbSA9PT0gRXJyb3IgfHxcbiAgICAgICAgICAgICAgICAoaXRlbSAhPSBudWxsICYmIGl0ZW0ucHJvdG90eXBlIGluc3RhbmNlb2YgRXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnlDYXRjaChjYikuY2FsbChib3VuZFRvLCBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpdGVtID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2hlc1ByZWRpY2F0ZSA9IHRyeUNhdGNoKGl0ZW0pLmNhbGwoYm91bmRUbywgZSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoZXNQcmVkaWNhdGUgPT09IGVycm9yT2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaGVzUHJlZGljYXRlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2hlc1ByZWRpY2F0ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ5Q2F0Y2goY2IpLmNhbGwoYm91bmRUbywgZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh1dGlsLmlzT2JqZWN0KGUpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleXMgPSBnZXRLZXlzKGl0ZW0pO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwga2V5cy5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0ga2V5c1tqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW1ba2V5XSAhPSBlW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIHByZWRpY2F0ZUxvb3A7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyeUNhdGNoKGNiKS5jYWxsKGJvdW5kVG8sIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBORVhUX0ZJTFRFUjtcbiAgICB9O1xufVxuXG5yZXR1cm4gY2F0Y2hGaWx0ZXI7XG59O1xuXG59LHtcIi4vZXM1XCI6MTMsXCIuL3V0aWxcIjozNn1dLDg6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UpIHtcbnZhciBsb25nU3RhY2tUcmFjZXMgPSBmYWxzZTtcbnZhciBjb250ZXh0U3RhY2sgPSBbXTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3Byb21pc2VDcmVhdGVkID0gZnVuY3Rpb24oKSB7fTtcblByb21pc2UucHJvdG90eXBlLl9wdXNoQ29udGV4dCA9IGZ1bmN0aW9uKCkge307XG5Qcm9taXNlLnByb3RvdHlwZS5fcG9wQ29udGV4dCA9IGZ1bmN0aW9uKCkge3JldHVybiBudWxsO307XG5Qcm9taXNlLl9wZWVrQ29udGV4dCA9IFByb21pc2UucHJvdG90eXBlLl9wZWVrQ29udGV4dCA9IGZ1bmN0aW9uKCkge307XG5cbmZ1bmN0aW9uIENvbnRleHQoKSB7XG4gICAgdGhpcy5fdHJhY2UgPSBuZXcgQ29udGV4dC5DYXB0dXJlZFRyYWNlKHBlZWtDb250ZXh0KCkpO1xufVxuQ29udGV4dC5wcm90b3R5cGUuX3B1c2hDb250ZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl90cmFjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuX3RyYWNlLl9wcm9taXNlQ3JlYXRlZCA9IG51bGw7XG4gICAgICAgIGNvbnRleHRTdGFjay5wdXNoKHRoaXMuX3RyYWNlKTtcbiAgICB9XG59O1xuXG5Db250ZXh0LnByb3RvdHlwZS5fcG9wQ29udGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fdHJhY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgdHJhY2UgPSBjb250ZXh0U3RhY2sucG9wKCk7XG4gICAgICAgIHZhciByZXQgPSB0cmFjZS5fcHJvbWlzZUNyZWF0ZWQ7XG4gICAgICAgIHRyYWNlLl9wcm9taXNlQ3JlYXRlZCA9IG51bGw7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufTtcblxuZnVuY3Rpb24gY3JlYXRlQ29udGV4dCgpIHtcbiAgICBpZiAobG9uZ1N0YWNrVHJhY2VzKSByZXR1cm4gbmV3IENvbnRleHQoKTtcbn1cblxuZnVuY3Rpb24gcGVla0NvbnRleHQoKSB7XG4gICAgdmFyIGxhc3RJbmRleCA9IGNvbnRleHRTdGFjay5sZW5ndGggLSAxO1xuICAgIGlmIChsYXN0SW5kZXggPj0gMCkge1xuICAgICAgICByZXR1cm4gY29udGV4dFN0YWNrW2xhc3RJbmRleF07XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5Db250ZXh0LkNhcHR1cmVkVHJhY2UgPSBudWxsO1xuQ29udGV4dC5jcmVhdGUgPSBjcmVhdGVDb250ZXh0O1xuQ29udGV4dC5kZWFjdGl2YXRlTG9uZ1N0YWNrVHJhY2VzID0gZnVuY3Rpb24oKSB7fTtcbkNvbnRleHQuYWN0aXZhdGVMb25nU3RhY2tUcmFjZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgUHJvbWlzZV9wdXNoQ29udGV4dCA9IFByb21pc2UucHJvdG90eXBlLl9wdXNoQ29udGV4dDtcbiAgICB2YXIgUHJvbWlzZV9wb3BDb250ZXh0ID0gUHJvbWlzZS5wcm90b3R5cGUuX3BvcENvbnRleHQ7XG4gICAgdmFyIFByb21pc2VfUGVla0NvbnRleHQgPSBQcm9taXNlLl9wZWVrQ29udGV4dDtcbiAgICB2YXIgUHJvbWlzZV9wZWVrQ29udGV4dCA9IFByb21pc2UucHJvdG90eXBlLl9wZWVrQ29udGV4dDtcbiAgICB2YXIgUHJvbWlzZV9wcm9taXNlQ3JlYXRlZCA9IFByb21pc2UucHJvdG90eXBlLl9wcm9taXNlQ3JlYXRlZDtcbiAgICBDb250ZXh0LmRlYWN0aXZhdGVMb25nU3RhY2tUcmFjZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgUHJvbWlzZS5wcm90b3R5cGUuX3B1c2hDb250ZXh0ID0gUHJvbWlzZV9wdXNoQ29udGV4dDtcbiAgICAgICAgUHJvbWlzZS5wcm90b3R5cGUuX3BvcENvbnRleHQgPSBQcm9taXNlX3BvcENvbnRleHQ7XG4gICAgICAgIFByb21pc2UuX3BlZWtDb250ZXh0ID0gUHJvbWlzZV9QZWVrQ29udGV4dDtcbiAgICAgICAgUHJvbWlzZS5wcm90b3R5cGUuX3BlZWtDb250ZXh0ID0gUHJvbWlzZV9wZWVrQ29udGV4dDtcbiAgICAgICAgUHJvbWlzZS5wcm90b3R5cGUuX3Byb21pc2VDcmVhdGVkID0gUHJvbWlzZV9wcm9taXNlQ3JlYXRlZDtcbiAgICAgICAgbG9uZ1N0YWNrVHJhY2VzID0gZmFsc2U7XG4gICAgfTtcbiAgICBsb25nU3RhY2tUcmFjZXMgPSB0cnVlO1xuICAgIFByb21pc2UucHJvdG90eXBlLl9wdXNoQ29udGV4dCA9IENvbnRleHQucHJvdG90eXBlLl9wdXNoQ29udGV4dDtcbiAgICBQcm9taXNlLnByb3RvdHlwZS5fcG9wQ29udGV4dCA9IENvbnRleHQucHJvdG90eXBlLl9wb3BDb250ZXh0O1xuICAgIFByb21pc2UuX3BlZWtDb250ZXh0ID0gUHJvbWlzZS5wcm90b3R5cGUuX3BlZWtDb250ZXh0ID0gcGVla0NvbnRleHQ7XG4gICAgUHJvbWlzZS5wcm90b3R5cGUuX3Byb21pc2VDcmVhdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjdHggPSB0aGlzLl9wZWVrQ29udGV4dCgpO1xuICAgICAgICBpZiAoY3R4ICYmIGN0eC5fcHJvbWlzZUNyZWF0ZWQgPT0gbnVsbCkgY3R4Ll9wcm9taXNlQ3JlYXRlZCA9IHRoaXM7XG4gICAgfTtcbn07XG5yZXR1cm4gQ29udGV4dDtcbn07XG5cbn0se31dLDk6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIENvbnRleHQsXG4gICAgZW5hYmxlQXN5bmNIb29rcywgZGlzYWJsZUFzeW5jSG9va3MpIHtcbnZhciBhc3luYyA9IFByb21pc2UuX2FzeW5jO1xudmFyIFdhcm5pbmcgPSBfZGVyZXFfKFwiLi9lcnJvcnNcIikuV2FybmluZztcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnZhciBlczUgPSBfZGVyZXFfKFwiLi9lczVcIik7XG52YXIgY2FuQXR0YWNoVHJhY2UgPSB1dGlsLmNhbkF0dGFjaFRyYWNlO1xudmFyIHVuaGFuZGxlZFJlamVjdGlvbkhhbmRsZWQ7XG52YXIgcG9zc2libHlVbmhhbmRsZWRSZWplY3Rpb247XG52YXIgYmx1ZWJpcmRGcmFtZVBhdHRlcm4gPVxuICAgIC9bXFxcXFxcL11ibHVlYmlyZFtcXFxcXFwvXWpzW1xcXFxcXC9dKHJlbGVhc2V8ZGVidWd8aW5zdHJ1bWVudGVkKS87XG52YXIgbm9kZUZyYW1lUGF0dGVybiA9IC9cXCgoPzp0aW1lcnNcXC5qcyk6XFxkKzpcXGQrXFwpLztcbnZhciBwYXJzZUxpbmVQYXR0ZXJuID0gL1tcXC88XFwoXSguKz8pOihcXGQrKTooXFxkKylcXCk/XFxzKiQvO1xudmFyIHN0YWNrRnJhbWVQYXR0ZXJuID0gbnVsbDtcbnZhciBmb3JtYXRTdGFjayA9IG51bGw7XG52YXIgaW5kZW50U3RhY2tGcmFtZXMgPSBmYWxzZTtcbnZhciBwcmludFdhcm5pbmc7XG52YXIgZGVidWdnaW5nID0gISEodXRpbC5lbnYoXCJCTFVFQklSRF9ERUJVR1wiKSAhPSAwICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAodHJ1ZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgIHV0aWwuZW52KFwiQkxVRUJJUkRfREVCVUdcIikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICB1dGlsLmVudihcIk5PREVfRU5WXCIpID09PSBcImRldmVsb3BtZW50XCIpKTtcblxudmFyIHdhcm5pbmdzID0gISEodXRpbC5lbnYoXCJCTFVFQklSRF9XQVJOSU5HU1wiKSAhPSAwICYmXG4gICAgKGRlYnVnZ2luZyB8fCB1dGlsLmVudihcIkJMVUVCSVJEX1dBUk5JTkdTXCIpKSk7XG5cbnZhciBsb25nU3RhY2tUcmFjZXMgPSAhISh1dGlsLmVudihcIkJMVUVCSVJEX0xPTkdfU1RBQ0tfVFJBQ0VTXCIpICE9IDAgJiZcbiAgICAoZGVidWdnaW5nIHx8IHV0aWwuZW52KFwiQkxVRUJJUkRfTE9OR19TVEFDS19UUkFDRVNcIikpKTtcblxudmFyIHdGb3Jnb3R0ZW5SZXR1cm4gPSB1dGlsLmVudihcIkJMVUVCSVJEX1dfRk9SR09UVEVOX1JFVFVSTlwiKSAhPSAwICYmXG4gICAgKHdhcm5pbmdzIHx8ICEhdXRpbC5lbnYoXCJCTFVFQklSRF9XX0ZPUkdPVFRFTl9SRVRVUk5cIikpO1xuXG52YXIgZGVmZXJVbmhhbmRsZWRSZWplY3Rpb25DaGVjaztcbihmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJvbWlzZXMgPSBbXTtcblxuICAgIGZ1bmN0aW9uIHVuaGFuZGxlZFJlamVjdGlvbkNoZWNrKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb21pc2VzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBwcm9taXNlc1tpXS5fbm90aWZ5VW5oYW5kbGVkUmVqZWN0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgdW5oYW5kbGVkUmVqZWN0aW9uQ2xlYXIoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmhhbmRsZWRSZWplY3Rpb25DbGVhcigpIHtcbiAgICAgICAgcHJvbWlzZXMubGVuZ3RoID0gMDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSBcIm9iamVjdFwiICYmIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQpIHtcbiAgICAgICAgZGVmZXJVbmhhbmRsZWRSZWplY3Rpb25DaGVjayA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBpZnJhbWVTZXRUaW1lb3V0O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBjaGVja0lmcmFtZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaWZyYW1lLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmcmFtZS5jb250ZW50V2luZG93LnNldFRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmcmFtZVNldFRpbWVvdXQgPSBpZnJhbWUuY29udGVudFdpbmRvdy5zZXRUaW1lb3V0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaGVja0lmcmFtZSgpO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UpO1xuICAgICAgICAgICAgICAgIGlmIChpZnJhbWVTZXRUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmcmFtZVNldFRpbWVvdXQodW5oYW5kbGVkUmVqZWN0aW9uQ2hlY2ssIDEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNoZWNrSWZyYW1lKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBkZWZlclVuaGFuZGxlZFJlamVjdGlvbkNoZWNrID0gZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChwcm9taXNlKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQodW5oYW5kbGVkUmVqZWN0aW9uQ2hlY2ssIDEpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGVzNS5kZWZpbmVQcm9wZXJ0eShQcm9taXNlLCBcIl91bmhhbmRsZWRSZWplY3Rpb25DaGVja1wiLCB7XG4gICAgICAgIHZhbHVlOiB1bmhhbmRsZWRSZWplY3Rpb25DaGVja1xuICAgIH0pO1xuICAgIGVzNS5kZWZpbmVQcm9wZXJ0eShQcm9taXNlLCBcIl91bmhhbmRsZWRSZWplY3Rpb25DbGVhclwiLCB7XG4gICAgICAgIHZhbHVlOiB1bmhhbmRsZWRSZWplY3Rpb25DbGVhclxuICAgIH0pO1xufSkoKTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc3VwcHJlc3NVbmhhbmRsZWRSZWplY3Rpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRhcmdldCA9IHRoaXMuX3RhcmdldCgpO1xuICAgIHRhcmdldC5fYml0RmllbGQgPSAoKHRhcmdldC5fYml0RmllbGQgJiAofjEwNDg1NzYpKSB8XG4gICAgICAgICAgICAgICAgICAgICAgNTI0Mjg4KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9lbnN1cmVQb3NzaWJsZVJlamVjdGlvbkhhbmRsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCh0aGlzLl9iaXRGaWVsZCAmIDUyNDI4OCkgIT09IDApIHJldHVybjtcbiAgICB0aGlzLl9zZXRSZWplY3Rpb25Jc1VuaGFuZGxlZCgpO1xuICAgIGRlZmVyVW5oYW5kbGVkUmVqZWN0aW9uQ2hlY2sodGhpcyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fbm90aWZ5VW5oYW5kbGVkUmVqZWN0aW9uSXNIYW5kbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIGZpcmVSZWplY3Rpb25FdmVudChcInJlamVjdGlvbkhhbmRsZWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmhhbmRsZWRSZWplY3Rpb25IYW5kbGVkLCB1bmRlZmluZWQsIHRoaXMpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldFJldHVybmVkTm9uVW5kZWZpbmVkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDI2ODQzNTQ1Njtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZXR1cm5lZE5vblVuZGVmaW5lZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiAyNjg0MzU0NTYpICE9PSAwO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX25vdGlmeVVuaGFuZGxlZFJlamVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5faXNSZWplY3Rpb25VbmhhbmRsZWQoKSkge1xuICAgICAgICB2YXIgcmVhc29uID0gdGhpcy5fc2V0dGxlZFZhbHVlKCk7XG4gICAgICAgIHRoaXMuX3NldFVuaGFuZGxlZFJlamVjdGlvbklzTm90aWZpZWQoKTtcbiAgICAgICAgZmlyZVJlamVjdGlvbkV2ZW50KFwidW5oYW5kbGVkUmVqZWN0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3NpYmx5VW5oYW5kbGVkUmVqZWN0aW9uLCByZWFzb24sIHRoaXMpO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXRVbmhhbmRsZWRSZWplY3Rpb25Jc05vdGlmaWVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAyNjIxNDQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdW5zZXRVbmhhbmRsZWRSZWplY3Rpb25Jc05vdGlmaWVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgJiAofjI2MjE0NCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNVbmhhbmRsZWRSZWplY3Rpb25Ob3RpZmllZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgMjYyMTQ0KSA+IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0UmVqZWN0aW9uSXNVbmhhbmRsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDEwNDg1NzY7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdW5zZXRSZWplY3Rpb25Jc1VuaGFuZGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkICYgKH4xMDQ4NTc2KTtcbiAgICBpZiAodGhpcy5faXNVbmhhbmRsZWRSZWplY3Rpb25Ob3RpZmllZCgpKSB7XG4gICAgICAgIHRoaXMuX3Vuc2V0VW5oYW5kbGVkUmVqZWN0aW9uSXNOb3RpZmllZCgpO1xuICAgICAgICB0aGlzLl9ub3RpZnlVbmhhbmRsZWRSZWplY3Rpb25Jc0hhbmRsZWQoKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNSZWplY3Rpb25VbmhhbmRsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDEwNDg1NzYpID4gMDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl93YXJuID0gZnVuY3Rpb24obWVzc2FnZSwgc2hvdWxkVXNlT3duVHJhY2UsIHByb21pc2UpIHtcbiAgICByZXR1cm4gd2FybihtZXNzYWdlLCBzaG91bGRVc2VPd25UcmFjZSwgcHJvbWlzZSB8fCB0aGlzKTtcbn07XG5cblByb21pc2Uub25Qb3NzaWJseVVuaGFuZGxlZFJlamVjdGlvbiA9IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciBjb250ZXh0ID0gUHJvbWlzZS5fZ2V0Q29udGV4dCgpO1xuICAgIHBvc3NpYmx5VW5oYW5kbGVkUmVqZWN0aW9uID0gdXRpbC5jb250ZXh0QmluZChjb250ZXh0LCBmbik7XG59O1xuXG5Qcm9taXNlLm9uVW5oYW5kbGVkUmVqZWN0aW9uSGFuZGxlZCA9IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciBjb250ZXh0ID0gUHJvbWlzZS5fZ2V0Q29udGV4dCgpO1xuICAgIHVuaGFuZGxlZFJlamVjdGlvbkhhbmRsZWQgPSB1dGlsLmNvbnRleHRCaW5kKGNvbnRleHQsIGZuKTtcbn07XG5cbnZhciBkaXNhYmxlTG9uZ1N0YWNrVHJhY2VzID0gZnVuY3Rpb24oKSB7fTtcblByb21pc2UubG9uZ1N0YWNrVHJhY2VzID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChhc3luYy5oYXZlSXRlbXNRdWV1ZWQoKSAmJiAhY29uZmlnLmxvbmdTdGFja1RyYWNlcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYW5ub3QgZW5hYmxlIGxvbmcgc3RhY2sgdHJhY2VzIGFmdGVyIHByb21pc2VzIGhhdmUgYmVlbiBjcmVhdGVkXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvTXFyRm1YXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgaWYgKCFjb25maWcubG9uZ1N0YWNrVHJhY2VzICYmIGxvbmdTdGFja1RyYWNlc0lzU3VwcG9ydGVkKCkpIHtcbiAgICAgICAgdmFyIFByb21pc2VfY2FwdHVyZVN0YWNrVHJhY2UgPSBQcm9taXNlLnByb3RvdHlwZS5fY2FwdHVyZVN0YWNrVHJhY2U7XG4gICAgICAgIHZhciBQcm9taXNlX2F0dGFjaEV4dHJhVHJhY2UgPSBQcm9taXNlLnByb3RvdHlwZS5fYXR0YWNoRXh0cmFUcmFjZTtcbiAgICAgICAgdmFyIFByb21pc2VfZGVyZWZlcmVuY2VUcmFjZSA9IFByb21pc2UucHJvdG90eXBlLl9kZXJlZmVyZW5jZVRyYWNlO1xuICAgICAgICBjb25maWcubG9uZ1N0YWNrVHJhY2VzID0gdHJ1ZTtcbiAgICAgICAgZGlzYWJsZUxvbmdTdGFja1RyYWNlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGFzeW5jLmhhdmVJdGVtc1F1ZXVlZCgpICYmICFjb25maWcubG9uZ1N0YWNrVHJhY2VzKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2Fubm90IGVuYWJsZSBsb25nIHN0YWNrIHRyYWNlcyBhZnRlciBwcm9taXNlcyBoYXZlIGJlZW4gY3JlYXRlZFxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL01xckZtWFxcdTAwMGFcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBQcm9taXNlLnByb3RvdHlwZS5fY2FwdHVyZVN0YWNrVHJhY2UgPSBQcm9taXNlX2NhcHR1cmVTdGFja1RyYWNlO1xuICAgICAgICAgICAgUHJvbWlzZS5wcm90b3R5cGUuX2F0dGFjaEV4dHJhVHJhY2UgPSBQcm9taXNlX2F0dGFjaEV4dHJhVHJhY2U7XG4gICAgICAgICAgICBQcm9taXNlLnByb3RvdHlwZS5fZGVyZWZlcmVuY2VUcmFjZSA9IFByb21pc2VfZGVyZWZlcmVuY2VUcmFjZTtcbiAgICAgICAgICAgIENvbnRleHQuZGVhY3RpdmF0ZUxvbmdTdGFja1RyYWNlcygpO1xuICAgICAgICAgICAgY29uZmlnLmxvbmdTdGFja1RyYWNlcyA9IGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICBQcm9taXNlLnByb3RvdHlwZS5fY2FwdHVyZVN0YWNrVHJhY2UgPSBsb25nU3RhY2tUcmFjZXNDYXB0dXJlU3RhY2tUcmFjZTtcbiAgICAgICAgUHJvbWlzZS5wcm90b3R5cGUuX2F0dGFjaEV4dHJhVHJhY2UgPSBsb25nU3RhY2tUcmFjZXNBdHRhY2hFeHRyYVRyYWNlO1xuICAgICAgICBQcm9taXNlLnByb3RvdHlwZS5fZGVyZWZlcmVuY2VUcmFjZSA9IGxvbmdTdGFja1RyYWNlc0RlcmVmZXJlbmNlVHJhY2U7XG4gICAgICAgIENvbnRleHQuYWN0aXZhdGVMb25nU3RhY2tUcmFjZXMoKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLmhhc0xvbmdTdGFja1RyYWNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY29uZmlnLmxvbmdTdGFja1RyYWNlcyAmJiBsb25nU3RhY2tUcmFjZXNJc1N1cHBvcnRlZCgpO1xufTtcblxuXG52YXIgbGVnYWN5SGFuZGxlcnMgPSB7XG4gICAgdW5oYW5kbGVkcmVqZWN0aW9uOiB7XG4gICAgICAgIGJlZm9yZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcmV0ID0gdXRpbC5nbG9iYWwub251bmhhbmRsZWRyZWplY3Rpb247XG4gICAgICAgICAgICB1dGlsLmdsb2JhbC5vbnVuaGFuZGxlZHJlamVjdGlvbiA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBhZnRlcjogZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgIHV0aWwuZ2xvYmFsLm9udW5oYW5kbGVkcmVqZWN0aW9uID0gZm47XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlamVjdGlvbmhhbmRsZWQ6IHtcbiAgICAgICAgYmVmb3JlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciByZXQgPSB1dGlsLmdsb2JhbC5vbnJlamVjdGlvbmhhbmRsZWQ7XG4gICAgICAgICAgICB1dGlsLmdsb2JhbC5vbnJlamVjdGlvbmhhbmRsZWQgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgYWZ0ZXI6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICB1dGlsLmdsb2JhbC5vbnJlamVjdGlvbmhhbmRsZWQgPSBmbjtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbnZhciBmaXJlRG9tRXZlbnQgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRpc3BhdGNoID0gZnVuY3Rpb24obGVnYWN5LCBlKSB7XG4gICAgICAgIGlmIChsZWdhY3kpIHtcbiAgICAgICAgICAgIHZhciBmbjtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm4gPSBsZWdhY3kuYmVmb3JlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICF1dGlsLmdsb2JhbC5kaXNwYXRjaEV2ZW50KGUpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBsZWdhY3kuYWZ0ZXIoZm4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICF1dGlsLmdsb2JhbC5kaXNwYXRjaEV2ZW50KGUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIEN1c3RvbUV2ZW50ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuICAgICAgICAgICAgdXRpbC5nbG9iYWwuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24obmFtZSwgZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHZhciBldmVudERhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogZXZlbnQsXG4gICAgICAgICAgICAgICAgICAgIGNhbmNlbGFibGU6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBkb21FdmVudCA9IG5ldyBDdXN0b21FdmVudChuYW1lLCBldmVudERhdGEpO1xuICAgICAgICAgICAgICAgIGVzNS5kZWZpbmVQcm9wZXJ0eShcbiAgICAgICAgICAgICAgICAgICAgZG9tRXZlbnQsIFwicHJvbWlzZVwiLCB7dmFsdWU6IGV2ZW50LnByb21pc2V9KTtcbiAgICAgICAgICAgICAgICBlczUuZGVmaW5lUHJvcGVydHkoXG4gICAgICAgICAgICAgICAgICAgIGRvbUV2ZW50LCBcInJlYXNvblwiLCB7dmFsdWU6IGV2ZW50LnJlYXNvbn0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpc3BhdGNoKGxlZ2FjeUhhbmRsZXJzW25hbWVdLCBkb21FdmVudCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBFdmVudCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB2YXIgZXZlbnQgPSBuZXcgRXZlbnQoXCJDdXN0b21FdmVudFwiKTtcbiAgICAgICAgICAgIHV0aWwuZ2xvYmFsLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG5hbWUsIGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgZG9tRXZlbnQgPSBuZXcgRXZlbnQobmFtZSwge1xuICAgICAgICAgICAgICAgICAgICBjYW5jZWxhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZG9tRXZlbnQuZGV0YWlsID0gZXZlbnQ7XG4gICAgICAgICAgICAgICAgZXM1LmRlZmluZVByb3BlcnR5KGRvbUV2ZW50LCBcInByb21pc2VcIiwge3ZhbHVlOiBldmVudC5wcm9taXNlfSk7XG4gICAgICAgICAgICAgICAgZXM1LmRlZmluZVByb3BlcnR5KGRvbUV2ZW50LCBcInJlYXNvblwiLCB7dmFsdWU6IGV2ZW50LnJlYXNvbn0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBkaXNwYXRjaChsZWdhY3lIYW5kbGVyc1tuYW1lXSwgZG9tRXZlbnQpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiQ3VzdG9tRXZlbnRcIik7XG4gICAgICAgICAgICBldmVudC5pbml0Q3VzdG9tRXZlbnQoXCJ0ZXN0aW5ndGhlZXZlbnRcIiwgZmFsc2UsIHRydWUsIHt9KTtcbiAgICAgICAgICAgIHV0aWwuZ2xvYmFsLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG5hbWUsIGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgZG9tRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuICAgICAgICAgICAgICAgIGRvbUV2ZW50LmluaXRDdXN0b21FdmVudChuYW1lLCBmYWxzZSwgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBkaXNwYXRjaChsZWdhY3lIYW5kbGVyc1tuYW1lXSwgZG9tRXZlbnQpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbn0pKCk7XG5cbnZhciBmaXJlR2xvYmFsRXZlbnQgPSAoZnVuY3Rpb24oKSB7XG4gICAgaWYgKHV0aWwuaXNOb2RlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLmVtaXQuYXBwbHkocHJvY2VzcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIXV0aWwuZ2xvYmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgdmFyIG1ldGhvZE5hbWUgPSBcIm9uXCIgKyBuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB2YXIgbWV0aG9kID0gdXRpbC5nbG9iYWxbbWV0aG9kTmFtZV07XG4gICAgICAgICAgICBpZiAoIW1ldGhvZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgbWV0aG9kLmFwcGx5KHV0aWwuZ2xvYmFsLCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTtcblxuZnVuY3Rpb24gZ2VuZXJhdGVQcm9taXNlTGlmZWN5Y2xlRXZlbnRPYmplY3QobmFtZSwgcHJvbWlzZSkge1xuICAgIHJldHVybiB7cHJvbWlzZTogcHJvbWlzZX07XG59XG5cbnZhciBldmVudFRvT2JqZWN0R2VuZXJhdG9yID0ge1xuICAgIHByb21pc2VDcmVhdGVkOiBnZW5lcmF0ZVByb21pc2VMaWZlY3ljbGVFdmVudE9iamVjdCxcbiAgICBwcm9taXNlRnVsZmlsbGVkOiBnZW5lcmF0ZVByb21pc2VMaWZlY3ljbGVFdmVudE9iamVjdCxcbiAgICBwcm9taXNlUmVqZWN0ZWQ6IGdlbmVyYXRlUHJvbWlzZUxpZmVjeWNsZUV2ZW50T2JqZWN0LFxuICAgIHByb21pc2VSZXNvbHZlZDogZ2VuZXJhdGVQcm9taXNlTGlmZWN5Y2xlRXZlbnRPYmplY3QsXG4gICAgcHJvbWlzZUNhbmNlbGxlZDogZ2VuZXJhdGVQcm9taXNlTGlmZWN5Y2xlRXZlbnRPYmplY3QsXG4gICAgcHJvbWlzZUNoYWluZWQ6IGZ1bmN0aW9uKG5hbWUsIHByb21pc2UsIGNoaWxkKSB7XG4gICAgICAgIHJldHVybiB7cHJvbWlzZTogcHJvbWlzZSwgY2hpbGQ6IGNoaWxkfTtcbiAgICB9LFxuICAgIHdhcm5pbmc6IGZ1bmN0aW9uKG5hbWUsIHdhcm5pbmcpIHtcbiAgICAgICAgcmV0dXJuIHt3YXJuaW5nOiB3YXJuaW5nfTtcbiAgICB9LFxuICAgIHVuaGFuZGxlZFJlamVjdGlvbjogZnVuY3Rpb24gKG5hbWUsIHJlYXNvbiwgcHJvbWlzZSkge1xuICAgICAgICByZXR1cm4ge3JlYXNvbjogcmVhc29uLCBwcm9taXNlOiBwcm9taXNlfTtcbiAgICB9LFxuICAgIHJlamVjdGlvbkhhbmRsZWQ6IGdlbmVyYXRlUHJvbWlzZUxpZmVjeWNsZUV2ZW50T2JqZWN0XG59O1xuXG52YXIgYWN0aXZlRmlyZUV2ZW50ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgZ2xvYmFsRXZlbnRGaXJlZCA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICAgIGdsb2JhbEV2ZW50RmlyZWQgPSBmaXJlR2xvYmFsRXZlbnQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGFzeW5jLnRocm93TGF0ZXIoZSk7XG4gICAgICAgIGdsb2JhbEV2ZW50RmlyZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHZhciBkb21FdmVudEZpcmVkID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgICAgZG9tRXZlbnRGaXJlZCA9IGZpcmVEb21FdmVudChuYW1lLFxuICAgICAgICAgICAgICAgICAgICBldmVudFRvT2JqZWN0R2VuZXJhdG9yW25hbWVdLmFwcGx5KG51bGwsIGFyZ3VtZW50cykpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgYXN5bmMudGhyb3dMYXRlcihlKTtcbiAgICAgICAgZG9tRXZlbnRGaXJlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRvbUV2ZW50RmlyZWQgfHwgZ2xvYmFsRXZlbnRGaXJlZDtcbn07XG5cblByb21pc2UuY29uZmlnID0gZnVuY3Rpb24ob3B0cykge1xuICAgIG9wdHMgPSBPYmplY3Qob3B0cyk7XG4gICAgaWYgKFwibG9uZ1N0YWNrVHJhY2VzXCIgaW4gb3B0cykge1xuICAgICAgICBpZiAob3B0cy5sb25nU3RhY2tUcmFjZXMpIHtcbiAgICAgICAgICAgIFByb21pc2UubG9uZ1N0YWNrVHJhY2VzKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoIW9wdHMubG9uZ1N0YWNrVHJhY2VzICYmIFByb21pc2UuaGFzTG9uZ1N0YWNrVHJhY2VzKCkpIHtcbiAgICAgICAgICAgIGRpc2FibGVMb25nU3RhY2tUcmFjZXMoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoXCJ3YXJuaW5nc1wiIGluIG9wdHMpIHtcbiAgICAgICAgdmFyIHdhcm5pbmdzT3B0aW9uID0gb3B0cy53YXJuaW5ncztcbiAgICAgICAgY29uZmlnLndhcm5pbmdzID0gISF3YXJuaW5nc09wdGlvbjtcbiAgICAgICAgd0ZvcmdvdHRlblJldHVybiA9IGNvbmZpZy53YXJuaW5ncztcblxuICAgICAgICBpZiAodXRpbC5pc09iamVjdCh3YXJuaW5nc09wdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChcIndGb3Jnb3R0ZW5SZXR1cm5cIiBpbiB3YXJuaW5nc09wdGlvbikge1xuICAgICAgICAgICAgICAgIHdGb3Jnb3R0ZW5SZXR1cm4gPSAhIXdhcm5pbmdzT3B0aW9uLndGb3Jnb3R0ZW5SZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKFwiY2FuY2VsbGF0aW9uXCIgaW4gb3B0cyAmJiBvcHRzLmNhbmNlbGxhdGlvbiAmJiAhY29uZmlnLmNhbmNlbGxhdGlvbikge1xuICAgICAgICBpZiAoYXN5bmMuaGF2ZUl0ZW1zUXVldWVkKCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcImNhbm5vdCBlbmFibGUgY2FuY2VsbGF0aW9uIGFmdGVyIHByb21pc2VzIGFyZSBpbiB1c2VcIik7XG4gICAgICAgIH1cbiAgICAgICAgUHJvbWlzZS5wcm90b3R5cGUuX2NsZWFyQ2FuY2VsbGF0aW9uRGF0YSA9XG4gICAgICAgICAgICBjYW5jZWxsYXRpb25DbGVhckNhbmNlbGxhdGlvbkRhdGE7XG4gICAgICAgIFByb21pc2UucHJvdG90eXBlLl9wcm9wYWdhdGVGcm9tID0gY2FuY2VsbGF0aW9uUHJvcGFnYXRlRnJvbTtcbiAgICAgICAgUHJvbWlzZS5wcm90b3R5cGUuX29uQ2FuY2VsID0gY2FuY2VsbGF0aW9uT25DYW5jZWw7XG4gICAgICAgIFByb21pc2UucHJvdG90eXBlLl9zZXRPbkNhbmNlbCA9IGNhbmNlbGxhdGlvblNldE9uQ2FuY2VsO1xuICAgICAgICBQcm9taXNlLnByb3RvdHlwZS5fYXR0YWNoQ2FuY2VsbGF0aW9uQ2FsbGJhY2sgPVxuICAgICAgICAgICAgY2FuY2VsbGF0aW9uQXR0YWNoQ2FuY2VsbGF0aW9uQ2FsbGJhY2s7XG4gICAgICAgIFByb21pc2UucHJvdG90eXBlLl9leGVjdXRlID0gY2FuY2VsbGF0aW9uRXhlY3V0ZTtcbiAgICAgICAgcHJvcGFnYXRlRnJvbUZ1bmN0aW9uID0gY2FuY2VsbGF0aW9uUHJvcGFnYXRlRnJvbTtcbiAgICAgICAgY29uZmlnLmNhbmNlbGxhdGlvbiA9IHRydWU7XG4gICAgfVxuICAgIGlmIChcIm1vbml0b3JpbmdcIiBpbiBvcHRzKSB7XG4gICAgICAgIGlmIChvcHRzLm1vbml0b3JpbmcgJiYgIWNvbmZpZy5tb25pdG9yaW5nKSB7XG4gICAgICAgICAgICBjb25maWcubW9uaXRvcmluZyA9IHRydWU7XG4gICAgICAgICAgICBQcm9taXNlLnByb3RvdHlwZS5fZmlyZUV2ZW50ID0gYWN0aXZlRmlyZUV2ZW50O1xuICAgICAgICB9IGVsc2UgaWYgKCFvcHRzLm1vbml0b3JpbmcgJiYgY29uZmlnLm1vbml0b3JpbmcpIHtcbiAgICAgICAgICAgIGNvbmZpZy5tb25pdG9yaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBQcm9taXNlLnByb3RvdHlwZS5fZmlyZUV2ZW50ID0gZGVmYXVsdEZpcmVFdmVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoXCJhc3luY0hvb2tzXCIgaW4gb3B0cyAmJiB1dGlsLm5vZGVTdXBwb3J0c0FzeW5jUmVzb3VyY2UpIHtcbiAgICAgICAgdmFyIHByZXYgPSBjb25maWcuYXN5bmNIb29rcztcbiAgICAgICAgdmFyIGN1ciA9ICEhb3B0cy5hc3luY0hvb2tzO1xuICAgICAgICBpZiAocHJldiAhPT0gY3VyKSB7XG4gICAgICAgICAgICBjb25maWcuYXN5bmNIb29rcyA9IGN1cjtcbiAgICAgICAgICAgIGlmIChjdXIpIHtcbiAgICAgICAgICAgICAgICBlbmFibGVBc3luY0hvb2tzKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpc2FibGVBc3luY0hvb2tzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2U7XG59O1xuXG5mdW5jdGlvbiBkZWZhdWx0RmlyZUV2ZW50KCkgeyByZXR1cm4gZmFsc2U7IH1cblxuUHJvbWlzZS5wcm90b3R5cGUuX2ZpcmVFdmVudCA9IGRlZmF1bHRGaXJlRXZlbnQ7XG5Qcm9taXNlLnByb3RvdHlwZS5fZXhlY3V0ZSA9IGZ1bmN0aW9uKGV4ZWN1dG9yLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgICBleGVjdXRvcihyZXNvbHZlLCByZWplY3QpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGU7XG4gICAgfVxufTtcblByb21pc2UucHJvdG90eXBlLl9vbkNhbmNlbCA9IGZ1bmN0aW9uICgpIHt9O1xuUHJvbWlzZS5wcm90b3R5cGUuX3NldE9uQ2FuY2VsID0gZnVuY3Rpb24gKGhhbmRsZXIpIHsgOyB9O1xuUHJvbWlzZS5wcm90b3R5cGUuX2F0dGFjaENhbmNlbGxhdGlvbkNhbGxiYWNrID0gZnVuY3Rpb24ob25DYW5jZWwpIHtcbiAgICA7XG59O1xuUHJvbWlzZS5wcm90b3R5cGUuX2NhcHR1cmVTdGFja1RyYWNlID0gZnVuY3Rpb24gKCkge307XG5Qcm9taXNlLnByb3RvdHlwZS5fYXR0YWNoRXh0cmFUcmFjZSA9IGZ1bmN0aW9uICgpIHt9O1xuUHJvbWlzZS5wcm90b3R5cGUuX2RlcmVmZXJlbmNlVHJhY2UgPSBmdW5jdGlvbiAoKSB7fTtcblByb21pc2UucHJvdG90eXBlLl9jbGVhckNhbmNlbGxhdGlvbkRhdGEgPSBmdW5jdGlvbigpIHt9O1xuUHJvbWlzZS5wcm90b3R5cGUuX3Byb3BhZ2F0ZUZyb20gPSBmdW5jdGlvbiAocGFyZW50LCBmbGFncykge1xuICAgIDtcbiAgICA7XG59O1xuXG5mdW5jdGlvbiBjYW5jZWxsYXRpb25FeGVjdXRlKGV4ZWN1dG9yLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgdHJ5IHtcbiAgICAgICAgZXhlY3V0b3IocmVzb2x2ZSwgcmVqZWN0LCBmdW5jdGlvbihvbkNhbmNlbCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvbkNhbmNlbCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIm9uQ2FuY2VsIG11c3QgYmUgYSBmdW5jdGlvbiwgZ290OiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dGlsLnRvU3RyaW5nKG9uQ2FuY2VsKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcm9taXNlLl9hdHRhY2hDYW5jZWxsYXRpb25DYWxsYmFjayhvbkNhbmNlbCk7XG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjYW5jZWxsYXRpb25BdHRhY2hDYW5jZWxsYXRpb25DYWxsYmFjayhvbkNhbmNlbCkge1xuICAgIGlmICghdGhpcy5faXNDYW5jZWxsYWJsZSgpKSByZXR1cm4gdGhpcztcblxuICAgIHZhciBwcmV2aW91c09uQ2FuY2VsID0gdGhpcy5fb25DYW5jZWwoKTtcbiAgICBpZiAocHJldmlvdXNPbkNhbmNlbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh1dGlsLmlzQXJyYXkocHJldmlvdXNPbkNhbmNlbCkpIHtcbiAgICAgICAgICAgIHByZXZpb3VzT25DYW5jZWwucHVzaChvbkNhbmNlbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRPbkNhbmNlbChbcHJldmlvdXNPbkNhbmNlbCwgb25DYW5jZWxdKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3NldE9uQ2FuY2VsKG9uQ2FuY2VsKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNhbmNlbGxhdGlvbk9uQ2FuY2VsKCkge1xuICAgIHJldHVybiB0aGlzLl9vbkNhbmNlbEZpZWxkO1xufVxuXG5mdW5jdGlvbiBjYW5jZWxsYXRpb25TZXRPbkNhbmNlbChvbkNhbmNlbCkge1xuICAgIHRoaXMuX29uQ2FuY2VsRmllbGQgPSBvbkNhbmNlbDtcbn1cblxuZnVuY3Rpb24gY2FuY2VsbGF0aW9uQ2xlYXJDYW5jZWxsYXRpb25EYXRhKCkge1xuICAgIHRoaXMuX2NhbmNlbGxhdGlvblBhcmVudCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9vbkNhbmNlbEZpZWxkID0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBjYW5jZWxsYXRpb25Qcm9wYWdhdGVGcm9tKHBhcmVudCwgZmxhZ3MpIHtcbiAgICBpZiAoKGZsYWdzICYgMSkgIT09IDApIHtcbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uUGFyZW50ID0gcGFyZW50O1xuICAgICAgICB2YXIgYnJhbmNoZXNSZW1haW5pbmdUb0NhbmNlbCA9IHBhcmVudC5fYnJhbmNoZXNSZW1haW5pbmdUb0NhbmNlbDtcbiAgICAgICAgaWYgKGJyYW5jaGVzUmVtYWluaW5nVG9DYW5jZWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYnJhbmNoZXNSZW1haW5pbmdUb0NhbmNlbCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcGFyZW50Ll9icmFuY2hlc1JlbWFpbmluZ1RvQ2FuY2VsID0gYnJhbmNoZXNSZW1haW5pbmdUb0NhbmNlbCArIDE7XG4gICAgfVxuICAgIGlmICgoZmxhZ3MgJiAyKSAhPT0gMCAmJiBwYXJlbnQuX2lzQm91bmQoKSkge1xuICAgICAgICB0aGlzLl9zZXRCb3VuZFRvKHBhcmVudC5fYm91bmRUbyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBiaW5kaW5nUHJvcGFnYXRlRnJvbShwYXJlbnQsIGZsYWdzKSB7XG4gICAgaWYgKChmbGFncyAmIDIpICE9PSAwICYmIHBhcmVudC5faXNCb3VuZCgpKSB7XG4gICAgICAgIHRoaXMuX3NldEJvdW5kVG8ocGFyZW50Ll9ib3VuZFRvKTtcbiAgICB9XG59XG52YXIgcHJvcGFnYXRlRnJvbUZ1bmN0aW9uID0gYmluZGluZ1Byb3BhZ2F0ZUZyb207XG5cbmZ1bmN0aW9uIGJvdW5kVmFsdWVGdW5jdGlvbigpIHtcbiAgICB2YXIgcmV0ID0gdGhpcy5fYm91bmRUbztcbiAgICBpZiAocmV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHJldCBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgIGlmIChyZXQuaXNGdWxmaWxsZWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXQudmFsdWUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBsb25nU3RhY2tUcmFjZXNDYXB0dXJlU3RhY2tUcmFjZSgpIHtcbiAgICB0aGlzLl90cmFjZSA9IG5ldyBDYXB0dXJlZFRyYWNlKHRoaXMuX3BlZWtDb250ZXh0KCkpO1xufVxuXG5mdW5jdGlvbiBsb25nU3RhY2tUcmFjZXNBdHRhY2hFeHRyYVRyYWNlKGVycm9yLCBpZ25vcmVTZWxmKSB7XG4gICAgaWYgKGNhbkF0dGFjaFRyYWNlKGVycm9yKSkge1xuICAgICAgICB2YXIgdHJhY2UgPSB0aGlzLl90cmFjZTtcbiAgICAgICAgaWYgKHRyYWNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChpZ25vcmVTZWxmKSB0cmFjZSA9IHRyYWNlLl9wYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyYWNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRyYWNlLmF0dGFjaEV4dHJhVHJhY2UoZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKCFlcnJvci5fX3N0YWNrQ2xlYW5lZF9fKSB7XG4gICAgICAgICAgICB2YXIgcGFyc2VkID0gcGFyc2VTdGFja0FuZE1lc3NhZ2UoZXJyb3IpO1xuICAgICAgICAgICAgdXRpbC5ub3RFbnVtZXJhYmxlUHJvcChlcnJvciwgXCJzdGFja1wiLFxuICAgICAgICAgICAgICAgIHBhcnNlZC5tZXNzYWdlICsgXCJcXG5cIiArIHBhcnNlZC5zdGFjay5qb2luKFwiXFxuXCIpKTtcbiAgICAgICAgICAgIHV0aWwubm90RW51bWVyYWJsZVByb3AoZXJyb3IsIFwiX19zdGFja0NsZWFuZWRfX1wiLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9uZ1N0YWNrVHJhY2VzRGVyZWZlcmVuY2VUcmFjZSgpIHtcbiAgICB0aGlzLl90cmFjZSA9IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gY2hlY2tGb3Jnb3R0ZW5SZXR1cm5zKHJldHVyblZhbHVlLCBwcm9taXNlQ3JlYXRlZCwgbmFtZSwgcHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQpIHtcbiAgICBpZiAocmV0dXJuVmFsdWUgPT09IHVuZGVmaW5lZCAmJiBwcm9taXNlQ3JlYXRlZCAhPT0gbnVsbCAmJlxuICAgICAgICB3Rm9yZ290dGVuUmV0dXJuKSB7XG4gICAgICAgIGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCAmJiBwYXJlbnQuX3JldHVybmVkTm9uVW5kZWZpbmVkKCkpIHJldHVybjtcbiAgICAgICAgaWYgKChwcm9taXNlLl9iaXRGaWVsZCAmIDY1NTM1KSA9PT0gMCkgcmV0dXJuO1xuXG4gICAgICAgIGlmIChuYW1lKSBuYW1lID0gbmFtZSArIFwiIFwiO1xuICAgICAgICB2YXIgaGFuZGxlckxpbmUgPSBcIlwiO1xuICAgICAgICB2YXIgY3JlYXRvckxpbmUgPSBcIlwiO1xuICAgICAgICBpZiAocHJvbWlzZUNyZWF0ZWQuX3RyYWNlKSB7XG4gICAgICAgICAgICB2YXIgdHJhY2VMaW5lcyA9IHByb21pc2VDcmVhdGVkLl90cmFjZS5zdGFjay5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgICAgIHZhciBzdGFjayA9IGNsZWFuU3RhY2sodHJhY2VMaW5lcyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gc3RhY2subGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGluZSA9IHN0YWNrW2ldO1xuICAgICAgICAgICAgICAgIGlmICghbm9kZUZyYW1lUGF0dGVybi50ZXN0KGxpbmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5lTWF0Y2hlcyA9IGxpbmUubWF0Y2gocGFyc2VMaW5lUGF0dGVybik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5lTWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlckxpbmUgID0gXCJhdCBcIiArIGxpbmVNYXRjaGVzWzFdICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjpcIiArIGxpbmVNYXRjaGVzWzJdICsgXCI6XCIgKyBsaW5lTWF0Y2hlc1szXSArIFwiIFwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3RVc2VyTGluZSA9IHN0YWNrWzBdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJhY2VMaW5lcy5sZW5ndGg7ICsraSkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFjZUxpbmVzW2ldID09PSBmaXJzdFVzZXJMaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdG9yTGluZSA9IFwiXFxuXCIgKyB0cmFjZUxpbmVzW2kgLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1zZyA9IFwiYSBwcm9taXNlIHdhcyBjcmVhdGVkIGluIGEgXCIgKyBuYW1lICtcbiAgICAgICAgICAgIFwiaGFuZGxlciBcIiArIGhhbmRsZXJMaW5lICsgXCJidXQgd2FzIG5vdCByZXR1cm5lZCBmcm9tIGl0LCBcIiArXG4gICAgICAgICAgICBcInNlZSBodHRwOi8vZ29vLmdsL3JScU1Vd1wiICtcbiAgICAgICAgICAgIGNyZWF0b3JMaW5lO1xuICAgICAgICBwcm9taXNlLl93YXJuKG1zZywgdHJ1ZSwgcHJvbWlzZUNyZWF0ZWQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVwcmVjYXRlZChuYW1lLCByZXBsYWNlbWVudCkge1xuICAgIHZhciBtZXNzYWdlID0gbmFtZSArXG4gICAgICAgIFwiIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiBhIGZ1dHVyZSB2ZXJzaW9uLlwiO1xuICAgIGlmIChyZXBsYWNlbWVudCkgbWVzc2FnZSArPSBcIiBVc2UgXCIgKyByZXBsYWNlbWVudCArIFwiIGluc3RlYWQuXCI7XG4gICAgcmV0dXJuIHdhcm4obWVzc2FnZSk7XG59XG5cbmZ1bmN0aW9uIHdhcm4obWVzc2FnZSwgc2hvdWxkVXNlT3duVHJhY2UsIHByb21pc2UpIHtcbiAgICBpZiAoIWNvbmZpZy53YXJuaW5ncykgcmV0dXJuO1xuICAgIHZhciB3YXJuaW5nID0gbmV3IFdhcm5pbmcobWVzc2FnZSk7XG4gICAgdmFyIGN0eDtcbiAgICBpZiAoc2hvdWxkVXNlT3duVHJhY2UpIHtcbiAgICAgICAgcHJvbWlzZS5fYXR0YWNoRXh0cmFUcmFjZSh3YXJuaW5nKTtcbiAgICB9IGVsc2UgaWYgKGNvbmZpZy5sb25nU3RhY2tUcmFjZXMgJiYgKGN0eCA9IFByb21pc2UuX3BlZWtDb250ZXh0KCkpKSB7XG4gICAgICAgIGN0eC5hdHRhY2hFeHRyYVRyYWNlKHdhcm5pbmcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBwYXJzZWQgPSBwYXJzZVN0YWNrQW5kTWVzc2FnZSh3YXJuaW5nKTtcbiAgICAgICAgd2FybmluZy5zdGFjayA9IHBhcnNlZC5tZXNzYWdlICsgXCJcXG5cIiArIHBhcnNlZC5zdGFjay5qb2luKFwiXFxuXCIpO1xuICAgIH1cblxuICAgIGlmICghYWN0aXZlRmlyZUV2ZW50KFwid2FybmluZ1wiLCB3YXJuaW5nKSkge1xuICAgICAgICBmb3JtYXRBbmRMb2dFcnJvcih3YXJuaW5nLCBcIlwiLCB0cnVlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlY29uc3RydWN0U3RhY2sobWVzc2FnZSwgc3RhY2tzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFja3MubGVuZ3RoIC0gMTsgKytpKSB7XG4gICAgICAgIHN0YWNrc1tpXS5wdXNoKFwiRnJvbSBwcmV2aW91cyBldmVudDpcIik7XG4gICAgICAgIHN0YWNrc1tpXSA9IHN0YWNrc1tpXS5qb2luKFwiXFxuXCIpO1xuICAgIH1cbiAgICBpZiAoaSA8IHN0YWNrcy5sZW5ndGgpIHtcbiAgICAgICAgc3RhY2tzW2ldID0gc3RhY2tzW2ldLmpvaW4oXCJcXG5cIik7XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlICsgXCJcXG5cIiArIHN0YWNrcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVEdXBsaWNhdGVPckVtcHR5SnVtcHMoc3RhY2tzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFja3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKHN0YWNrc1tpXS5sZW5ndGggPT09IDAgfHxcbiAgICAgICAgICAgICgoaSArIDEgPCBzdGFja3MubGVuZ3RoKSAmJiBzdGFja3NbaV1bMF0gPT09IHN0YWNrc1tpKzFdWzBdKSkge1xuICAgICAgICAgICAgc3RhY2tzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGktLTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlQ29tbW9uUm9vdHMoc3RhY2tzKSB7XG4gICAgdmFyIGN1cnJlbnQgPSBzdGFja3NbMF07XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBzdGFja3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHByZXYgPSBzdGFja3NbaV07XG4gICAgICAgIHZhciBjdXJyZW50TGFzdEluZGV4ID0gY3VycmVudC5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgY3VycmVudExhc3RMaW5lID0gY3VycmVudFtjdXJyZW50TGFzdEluZGV4XTtcbiAgICAgICAgdmFyIGNvbW1vblJvb3RNZWV0UG9pbnQgPSAtMTtcblxuICAgICAgICBmb3IgKHZhciBqID0gcHJldi5sZW5ndGggLSAxOyBqID49IDA7IC0taikge1xuICAgICAgICAgICAgaWYgKHByZXZbal0gPT09IGN1cnJlbnRMYXN0TGluZSkge1xuICAgICAgICAgICAgICAgIGNvbW1vblJvb3RNZWV0UG9pbnQgPSBqO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IGNvbW1vblJvb3RNZWV0UG9pbnQ7IGogPj0gMDsgLS1qKSB7XG4gICAgICAgICAgICB2YXIgbGluZSA9IHByZXZbal07XG4gICAgICAgICAgICBpZiAoY3VycmVudFtjdXJyZW50TGFzdEluZGV4XSA9PT0gbGluZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnQucG9wKCk7XG4gICAgICAgICAgICAgICAgY3VycmVudExhc3RJbmRleC0tO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50ID0gcHJldjtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFuU3RhY2soc3RhY2spIHtcbiAgICB2YXIgcmV0ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgbGluZSA9IHN0YWNrW2ldO1xuICAgICAgICB2YXIgaXNUcmFjZUxpbmUgPSBcIiAgICAoTm8gc3RhY2sgdHJhY2UpXCIgPT09IGxpbmUgfHxcbiAgICAgICAgICAgIHN0YWNrRnJhbWVQYXR0ZXJuLnRlc3QobGluZSk7XG4gICAgICAgIHZhciBpc0ludGVybmFsRnJhbWUgPSBpc1RyYWNlTGluZSAmJiBzaG91bGRJZ25vcmUobGluZSk7XG4gICAgICAgIGlmIChpc1RyYWNlTGluZSAmJiAhaXNJbnRlcm5hbEZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoaW5kZW50U3RhY2tGcmFtZXMgJiYgbGluZS5jaGFyQXQoMCkgIT09IFwiIFwiKSB7XG4gICAgICAgICAgICAgICAgbGluZSA9IFwiICAgIFwiICsgbGluZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldC5wdXNoKGxpbmUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIHN0YWNrRnJhbWVzQXNBcnJheShlcnJvcikge1xuICAgIHZhciBzdGFjayA9IGVycm9yLnN0YWNrLnJlcGxhY2UoL1xccyskL2csIFwiXCIpLnNwbGl0KFwiXFxuXCIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBzdGFja1tpXTtcbiAgICAgICAgaWYgKFwiICAgIChObyBzdGFjayB0cmFjZSlcIiA9PT0gbGluZSB8fCBzdGFja0ZyYW1lUGF0dGVybi50ZXN0KGxpbmUpKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaSA+IDAgJiYgZXJyb3IubmFtZSAhPSBcIlN5bnRheEVycm9yXCIpIHtcbiAgICAgICAgc3RhY2sgPSBzdGFjay5zbGljZShpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YWNrO1xufVxuXG5mdW5jdGlvbiBwYXJzZVN0YWNrQW5kTWVzc2FnZShlcnJvcikge1xuICAgIHZhciBzdGFjayA9IGVycm9yLnN0YWNrO1xuICAgIHZhciBtZXNzYWdlID0gZXJyb3IudG9TdHJpbmcoKTtcbiAgICBzdGFjayA9IHR5cGVvZiBzdGFjayA9PT0gXCJzdHJpbmdcIiAmJiBzdGFjay5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBzdGFja0ZyYW1lc0FzQXJyYXkoZXJyb3IpIDogW1wiICAgIChObyBzdGFjayB0cmFjZSlcIl07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc3RhY2s6IGVycm9yLm5hbWUgPT0gXCJTeW50YXhFcnJvclwiID8gc3RhY2sgOiBjbGVhblN0YWNrKHN0YWNrKVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEFuZExvZ0Vycm9yKGVycm9yLCB0aXRsZSwgaXNTb2Z0KSB7XG4gICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHZhciBtZXNzYWdlO1xuICAgICAgICBpZiAodXRpbC5pc09iamVjdChlcnJvcikpIHtcbiAgICAgICAgICAgIHZhciBzdGFjayA9IGVycm9yLnN0YWNrO1xuICAgICAgICAgICAgbWVzc2FnZSA9IHRpdGxlICsgZm9ybWF0U3RhY2soc3RhY2ssIGVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSB0aXRsZSArIFN0cmluZyhlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBwcmludFdhcm5pbmcgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcHJpbnRXYXJuaW5nKG1lc3NhZ2UsIGlzU29mdCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNvbnNvbGUubG9nID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAgICAgICAgIHR5cGVvZiBjb25zb2xlLmxvZyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZpcmVSZWplY3Rpb25FdmVudChuYW1lLCBsb2NhbEhhbmRsZXIsIHJlYXNvbiwgcHJvbWlzZSkge1xuICAgIHZhciBsb2NhbEV2ZW50RmlyZWQgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGxvY2FsSGFuZGxlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBsb2NhbEV2ZW50RmlyZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwicmVqZWN0aW9uSGFuZGxlZFwiKSB7XG4gICAgICAgICAgICAgICAgbG9jYWxIYW5kbGVyKHByb21pc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsb2NhbEhhbmRsZXIocmVhc29uLCBwcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgYXN5bmMudGhyb3dMYXRlcihlKTtcbiAgICB9XG5cbiAgICBpZiAobmFtZSA9PT0gXCJ1bmhhbmRsZWRSZWplY3Rpb25cIikge1xuICAgICAgICBpZiAoIWFjdGl2ZUZpcmVFdmVudChuYW1lLCByZWFzb24sIHByb21pc2UpICYmICFsb2NhbEV2ZW50RmlyZWQpIHtcbiAgICAgICAgICAgIGZvcm1hdEFuZExvZ0Vycm9yKHJlYXNvbiwgXCJVbmhhbmRsZWQgcmVqZWN0aW9uIFwiKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdGl2ZUZpcmVFdmVudChuYW1lLCBwcm9taXNlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZvcm1hdE5vbkVycm9yKG9iaikge1xuICAgIHZhciBzdHI7XG4gICAgaWYgKHR5cGVvZiBvYmogPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBzdHIgPSBcIltmdW5jdGlvbiBcIiArXG4gICAgICAgICAgICAob2JqLm5hbWUgfHwgXCJhbm9ueW1vdXNcIikgK1xuICAgICAgICAgICAgXCJdXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gb2JqICYmIHR5cGVvZiBvYmoudG9TdHJpbmcgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgICAgPyBvYmoudG9TdHJpbmcoKSA6IHV0aWwudG9TdHJpbmcob2JqKTtcbiAgICAgICAgdmFyIHJ1c2VsZXNzVG9TdHJpbmcgPSAvXFxbb2JqZWN0IFthLXpBLVowLTkkX10rXFxdLztcbiAgICAgICAgaWYgKHJ1c2VsZXNzVG9TdHJpbmcudGVzdChzdHIpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBuZXdTdHIgPSBKU09OLnN0cmluZ2lmeShvYmopO1xuICAgICAgICAgICAgICAgIHN0ciA9IG5ld1N0cjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoKGUpIHtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzdHIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBzdHIgPSBcIihlbXB0eSBhcnJheSlcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gKFwiKDxcIiArIHNuaXAoc3RyKSArIFwiPiwgbm8gc3RhY2sgdHJhY2UpXCIpO1xufVxuXG5mdW5jdGlvbiBzbmlwKHN0cikge1xuICAgIHZhciBtYXhDaGFycyA9IDQxO1xuICAgIGlmIChzdHIubGVuZ3RoIDwgbWF4Q2hhcnMpIHtcbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgcmV0dXJuIHN0ci5zdWJzdHIoMCwgbWF4Q2hhcnMgLSAzKSArIFwiLi4uXCI7XG59XG5cbmZ1bmN0aW9uIGxvbmdTdGFja1RyYWNlc0lzU3VwcG9ydGVkKCkge1xuICAgIHJldHVybiB0eXBlb2YgY2FwdHVyZVN0YWNrVHJhY2UgPT09IFwiZnVuY3Rpb25cIjtcbn1cblxudmFyIHNob3VsZElnbm9yZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZmFsc2U7IH07XG52YXIgcGFyc2VMaW5lSW5mb1JlZ2V4ID0gL1tcXC88XFwoXShbXjpcXC9dKyk6KFxcZCspOig/OlxcZCspXFwpP1xccyokLztcbmZ1bmN0aW9uIHBhcnNlTGluZUluZm8obGluZSkge1xuICAgIHZhciBtYXRjaGVzID0gbGluZS5tYXRjaChwYXJzZUxpbmVJbmZvUmVnZXgpO1xuICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWxlTmFtZTogbWF0Y2hlc1sxXSxcbiAgICAgICAgICAgIGxpbmU6IHBhcnNlSW50KG1hdGNoZXNbMl0sIDEwKVxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0Qm91bmRzKGZpcnN0TGluZUVycm9yLCBsYXN0TGluZUVycm9yKSB7XG4gICAgaWYgKCFsb25nU3RhY2tUcmFjZXNJc1N1cHBvcnRlZCgpKSByZXR1cm47XG4gICAgdmFyIGZpcnN0U3RhY2tMaW5lcyA9IChmaXJzdExpbmVFcnJvci5zdGFjayB8fCBcIlwiKS5zcGxpdChcIlxcblwiKTtcbiAgICB2YXIgbGFzdFN0YWNrTGluZXMgPSAobGFzdExpbmVFcnJvci5zdGFjayB8fCBcIlwiKS5zcGxpdChcIlxcblwiKTtcbiAgICB2YXIgZmlyc3RJbmRleCA9IC0xO1xuICAgIHZhciBsYXN0SW5kZXggPSAtMTtcbiAgICB2YXIgZmlyc3RGaWxlTmFtZTtcbiAgICB2YXIgbGFzdEZpbGVOYW1lO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlyc3RTdGFja0xpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBwYXJzZUxpbmVJbmZvKGZpcnN0U3RhY2tMaW5lc1tpXSk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGZpcnN0RmlsZU5hbWUgPSByZXN1bHQuZmlsZU5hbWU7XG4gICAgICAgICAgICBmaXJzdEluZGV4ID0gcmVzdWx0LmxpbmU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhc3RTdGFja0xpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBwYXJzZUxpbmVJbmZvKGxhc3RTdGFja0xpbmVzW2ldKTtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgbGFzdEZpbGVOYW1lID0gcmVzdWx0LmZpbGVOYW1lO1xuICAgICAgICAgICAgbGFzdEluZGV4ID0gcmVzdWx0LmxpbmU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoZmlyc3RJbmRleCA8IDAgfHwgbGFzdEluZGV4IDwgMCB8fCAhZmlyc3RGaWxlTmFtZSB8fCAhbGFzdEZpbGVOYW1lIHx8XG4gICAgICAgIGZpcnN0RmlsZU5hbWUgIT09IGxhc3RGaWxlTmFtZSB8fCBmaXJzdEluZGV4ID49IGxhc3RJbmRleCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2hvdWxkSWdub3JlID0gZnVuY3Rpb24obGluZSkge1xuICAgICAgICBpZiAoYmx1ZWJpcmRGcmFtZVBhdHRlcm4udGVzdChsaW5lKSkgcmV0dXJuIHRydWU7XG4gICAgICAgIHZhciBpbmZvID0gcGFyc2VMaW5lSW5mbyhsaW5lKTtcbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmZpbGVOYW1lID09PSBmaXJzdEZpbGVOYW1lICYmXG4gICAgICAgICAgICAgICAgKGZpcnN0SW5kZXggPD0gaW5mby5saW5lICYmIGluZm8ubGluZSA8PSBsYXN0SW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIENhcHR1cmVkVHJhY2UocGFyZW50KSB7XG4gICAgdGhpcy5fcGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuX3Byb21pc2VzQ3JlYXRlZCA9IDA7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMuX2xlbmd0aCA9IDEgKyAocGFyZW50ID09PSB1bmRlZmluZWQgPyAwIDogcGFyZW50Ll9sZW5ndGgpO1xuICAgIGNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIENhcHR1cmVkVHJhY2UpO1xuICAgIGlmIChsZW5ndGggPiAzMikgdGhpcy51bmN5Y2xlKCk7XG59XG51dGlsLmluaGVyaXRzKENhcHR1cmVkVHJhY2UsIEVycm9yKTtcbkNvbnRleHQuQ2FwdHVyZWRUcmFjZSA9IENhcHR1cmVkVHJhY2U7XG5cbkNhcHR1cmVkVHJhY2UucHJvdG90eXBlLnVuY3ljbGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5fbGVuZ3RoO1xuICAgIGlmIChsZW5ndGggPCAyKSByZXR1cm47XG4gICAgdmFyIG5vZGVzID0gW107XG4gICAgdmFyIHN0YWNrVG9JbmRleCA9IHt9O1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIG5vZGUgPSB0aGlzOyBub2RlICE9PSB1bmRlZmluZWQ7ICsraSkge1xuICAgICAgICBub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICBub2RlID0gbm9kZS5fcGFyZW50O1xuICAgIH1cbiAgICBsZW5ndGggPSB0aGlzLl9sZW5ndGggPSBpO1xuICAgIGZvciAodmFyIGkgPSBsZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICB2YXIgc3RhY2sgPSBub2Rlc1tpXS5zdGFjaztcbiAgICAgICAgaWYgKHN0YWNrVG9JbmRleFtzdGFja10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc3RhY2tUb0luZGV4W3N0YWNrXSA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgY3VycmVudFN0YWNrID0gbm9kZXNbaV0uc3RhY2s7XG4gICAgICAgIHZhciBpbmRleCA9IHN0YWNrVG9JbmRleFtjdXJyZW50U3RhY2tdO1xuICAgICAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCAmJiBpbmRleCAhPT0gaSkge1xuICAgICAgICAgICAgaWYgKGluZGV4ID4gMCkge1xuICAgICAgICAgICAgICAgIG5vZGVzW2luZGV4IC0gMV0uX3BhcmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBub2Rlc1tpbmRleCAtIDFdLl9sZW5ndGggPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZXNbaV0uX3BhcmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIG5vZGVzW2ldLl9sZW5ndGggPSAxO1xuICAgICAgICAgICAgdmFyIGN5Y2xlRWRnZU5vZGUgPSBpID4gMCA/IG5vZGVzW2kgLSAxXSA6IHRoaXM7XG5cbiAgICAgICAgICAgIGlmIChpbmRleCA8IGxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICBjeWNsZUVkZ2VOb2RlLl9wYXJlbnQgPSBub2Rlc1tpbmRleCArIDFdO1xuICAgICAgICAgICAgICAgIGN5Y2xlRWRnZU5vZGUuX3BhcmVudC51bmN5Y2xlKCk7XG4gICAgICAgICAgICAgICAgY3ljbGVFZGdlTm9kZS5fbGVuZ3RoID1cbiAgICAgICAgICAgICAgICAgICAgY3ljbGVFZGdlTm9kZS5fcGFyZW50Ll9sZW5ndGggKyAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjeWNsZUVkZ2VOb2RlLl9wYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgY3ljbGVFZGdlTm9kZS5fbGVuZ3RoID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjdXJyZW50Q2hpbGRMZW5ndGggPSBjeWNsZUVkZ2VOb2RlLl9sZW5ndGggKyAxO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IGkgLSAyOyBqID49IDA7IC0taikge1xuICAgICAgICAgICAgICAgIG5vZGVzW2pdLl9sZW5ndGggPSBjdXJyZW50Q2hpbGRMZW5ndGg7XG4gICAgICAgICAgICAgICAgY3VycmVudENoaWxkTGVuZ3RoKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5DYXB0dXJlZFRyYWNlLnByb3RvdHlwZS5hdHRhY2hFeHRyYVRyYWNlID0gZnVuY3Rpb24oZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IuX19zdGFja0NsZWFuZWRfXykgcmV0dXJuO1xuICAgIHRoaXMudW5jeWNsZSgpO1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZVN0YWNrQW5kTWVzc2FnZShlcnJvcik7XG4gICAgdmFyIG1lc3NhZ2UgPSBwYXJzZWQubWVzc2FnZTtcbiAgICB2YXIgc3RhY2tzID0gW3BhcnNlZC5zdGFja107XG5cbiAgICB2YXIgdHJhY2UgPSB0aGlzO1xuICAgIHdoaWxlICh0cmFjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHN0YWNrcy5wdXNoKGNsZWFuU3RhY2sodHJhY2Uuc3RhY2suc3BsaXQoXCJcXG5cIikpKTtcbiAgICAgICAgdHJhY2UgPSB0cmFjZS5fcGFyZW50O1xuICAgIH1cbiAgICByZW1vdmVDb21tb25Sb290cyhzdGFja3MpO1xuICAgIHJlbW92ZUR1cGxpY2F0ZU9yRW1wdHlKdW1wcyhzdGFja3MpO1xuICAgIHV0aWwubm90RW51bWVyYWJsZVByb3AoZXJyb3IsIFwic3RhY2tcIiwgcmVjb25zdHJ1Y3RTdGFjayhtZXNzYWdlLCBzdGFja3MpKTtcbiAgICB1dGlsLm5vdEVudW1lcmFibGVQcm9wKGVycm9yLCBcIl9fc3RhY2tDbGVhbmVkX19cIiwgdHJ1ZSk7XG59O1xuXG52YXIgY2FwdHVyZVN0YWNrVHJhY2UgPSAoZnVuY3Rpb24gc3RhY2tEZXRlY3Rpb24oKSB7XG4gICAgdmFyIHY4c3RhY2tGcmFtZVBhdHRlcm4gPSAvXlxccyphdFxccyovO1xuICAgIHZhciB2OHN0YWNrRm9ybWF0dGVyID0gZnVuY3Rpb24oc3RhY2ssIGVycm9yKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc3RhY2sgPT09IFwic3RyaW5nXCIpIHJldHVybiBzdGFjaztcblxuICAgICAgICBpZiAoZXJyb3IubmFtZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvci50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb3JtYXROb25FcnJvcihlcnJvcik7XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID09PSBcIm51bWJlclwiICYmXG4gICAgICAgIHR5cGVvZiBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIEVycm9yLnN0YWNrVHJhY2VMaW1pdCArPSA2O1xuICAgICAgICBzdGFja0ZyYW1lUGF0dGVybiA9IHY4c3RhY2tGcmFtZVBhdHRlcm47XG4gICAgICAgIGZvcm1hdFN0YWNrID0gdjhzdGFja0Zvcm1hdHRlcjtcbiAgICAgICAgdmFyIGNhcHR1cmVTdGFja1RyYWNlID0gRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2U7XG5cbiAgICAgICAgc2hvdWxkSWdub3JlID0gZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuIGJsdWViaXJkRnJhbWVQYXR0ZXJuLnRlc3QobGluZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihyZWNlaXZlciwgaWdub3JlVW50aWwpIHtcbiAgICAgICAgICAgIEVycm9yLnN0YWNrVHJhY2VMaW1pdCArPSA2O1xuICAgICAgICAgICAgY2FwdHVyZVN0YWNrVHJhY2UocmVjZWl2ZXIsIGlnbm9yZVVudGlsKTtcbiAgICAgICAgICAgIEVycm9yLnN0YWNrVHJhY2VMaW1pdCAtPSA2O1xuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG5cbiAgICBpZiAodHlwZW9mIGVyci5zdGFjayA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgICBlcnIuc3RhY2suc3BsaXQoXCJcXG5cIilbMF0uaW5kZXhPZihcInN0YWNrRGV0ZWN0aW9uQFwiKSA+PSAwKSB7XG4gICAgICAgIHN0YWNrRnJhbWVQYXR0ZXJuID0gL0AvO1xuICAgICAgICBmb3JtYXRTdGFjayA9IHY4c3RhY2tGb3JtYXR0ZXI7XG4gICAgICAgIGluZGVudFN0YWNrRnJhbWVzID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGNhcHR1cmVTdGFja1RyYWNlKG8pIHtcbiAgICAgICAgICAgIG8uc3RhY2sgPSBuZXcgRXJyb3IoKS5zdGFjaztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgaGFzU3RhY2tBZnRlclRocm93O1xuICAgIHRyeSB7IHRocm93IG5ldyBFcnJvcigpOyB9XG4gICAgY2F0Y2goZSkge1xuICAgICAgICBoYXNTdGFja0FmdGVyVGhyb3cgPSAoXCJzdGFja1wiIGluIGUpO1xuICAgIH1cbiAgICBpZiAoIShcInN0YWNrXCIgaW4gZXJyKSAmJiBoYXNTdGFja0FmdGVyVGhyb3cgJiZcbiAgICAgICAgdHlwZW9mIEVycm9yLnN0YWNrVHJhY2VMaW1pdCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICBzdGFja0ZyYW1lUGF0dGVybiA9IHY4c3RhY2tGcmFtZVBhdHRlcm47XG4gICAgICAgIGZvcm1hdFN0YWNrID0gdjhzdGFja0Zvcm1hdHRlcjtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGNhcHR1cmVTdGFja1RyYWNlKG8pIHtcbiAgICAgICAgICAgIEVycm9yLnN0YWNrVHJhY2VMaW1pdCArPSA2O1xuICAgICAgICAgICAgdHJ5IHsgdGhyb3cgbmV3IEVycm9yKCk7IH1cbiAgICAgICAgICAgIGNhdGNoKGUpIHsgby5zdGFjayA9IGUuc3RhY2s7IH1cbiAgICAgICAgICAgIEVycm9yLnN0YWNrVHJhY2VMaW1pdCAtPSA2O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZvcm1hdFN0YWNrID0gZnVuY3Rpb24oc3RhY2ssIGVycm9yKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc3RhY2sgPT09IFwic3RyaW5nXCIpIHJldHVybiBzdGFjaztcblxuICAgICAgICBpZiAoKHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiB8fFxuICAgICAgICAgICAgdHlwZW9mIGVycm9yID09PSBcImZ1bmN0aW9uXCIpICYmXG4gICAgICAgICAgICBlcnJvci5uYW1lICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIGVycm9yLm1lc3NhZ2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZvcm1hdE5vbkVycm9yKGVycm9yKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIG51bGw7XG5cbn0pKFtdKTtcblxuaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBjb25zb2xlLndhcm4gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBwcmludFdhcm5pbmcgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gICAgfTtcbiAgICBpZiAodXRpbC5pc05vZGUgJiYgcHJvY2Vzcy5zdGRlcnIuaXNUVFkpIHtcbiAgICAgICAgcHJpbnRXYXJuaW5nID0gZnVuY3Rpb24obWVzc2FnZSwgaXNTb2Z0KSB7XG4gICAgICAgICAgICB2YXIgY29sb3IgPSBpc1NvZnQgPyBcIlxcdTAwMWJbMzNtXCIgOiBcIlxcdTAwMWJbMzFtXCI7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oY29sb3IgKyBtZXNzYWdlICsgXCJcXHUwMDFiWzBtXFxuXCIpO1xuICAgICAgICB9O1xuICAgIH0gZWxzZSBpZiAoIXV0aWwuaXNOb2RlICYmIHR5cGVvZiAobmV3IEVycm9yKCkuc3RhY2spID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHByaW50V2FybmluZyA9IGZ1bmN0aW9uKG1lc3NhZ2UsIGlzU29mdCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiJWNcIiArIG1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc1NvZnQgPyBcImNvbG9yOiBkYXJrb3JhbmdlXCIgOiBcImNvbG9yOiByZWRcIik7XG4gICAgICAgIH07XG4gICAgfVxufVxuXG52YXIgY29uZmlnID0ge1xuICAgIHdhcm5pbmdzOiB3YXJuaW5ncyxcbiAgICBsb25nU3RhY2tUcmFjZXM6IGZhbHNlLFxuICAgIGNhbmNlbGxhdGlvbjogZmFsc2UsXG4gICAgbW9uaXRvcmluZzogZmFsc2UsXG4gICAgYXN5bmNIb29rczogZmFsc2Vcbn07XG5cbmlmIChsb25nU3RhY2tUcmFjZXMpIFByb21pc2UubG9uZ1N0YWNrVHJhY2VzKCk7XG5cbnJldHVybiB7XG4gICAgYXN5bmNIb29rczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBjb25maWcuYXN5bmNIb29rcztcbiAgICB9LFxuICAgIGxvbmdTdGFja1RyYWNlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBjb25maWcubG9uZ1N0YWNrVHJhY2VzO1xuICAgIH0sXG4gICAgd2FybmluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLndhcm5pbmdzO1xuICAgIH0sXG4gICAgY2FuY2VsbGF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5jYW5jZWxsYXRpb247XG4gICAgfSxcbiAgICBtb25pdG9yaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5tb25pdG9yaW5nO1xuICAgIH0sXG4gICAgcHJvcGFnYXRlRnJvbUZ1bmN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHByb3BhZ2F0ZUZyb21GdW5jdGlvbjtcbiAgICB9LFxuICAgIGJvdW5kVmFsdWVGdW5jdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBib3VuZFZhbHVlRnVuY3Rpb247XG4gICAgfSxcbiAgICBjaGVja0ZvcmdvdHRlblJldHVybnM6IGNoZWNrRm9yZ290dGVuUmV0dXJucyxcbiAgICBzZXRCb3VuZHM6IHNldEJvdW5kcyxcbiAgICB3YXJuOiB3YXJuLFxuICAgIGRlcHJlY2F0ZWQ6IGRlcHJlY2F0ZWQsXG4gICAgQ2FwdHVyZWRUcmFjZTogQ2FwdHVyZWRUcmFjZSxcbiAgICBmaXJlRG9tRXZlbnQ6IGZpcmVEb21FdmVudCxcbiAgICBmaXJlR2xvYmFsRXZlbnQ6IGZpcmVHbG9iYWxFdmVudFxufTtcbn07XG5cbn0se1wiLi9lcnJvcnNcIjoxMixcIi4vZXM1XCI6MTMsXCIuL3V0aWxcIjozNn1dLDEwOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlKSB7XG5mdW5jdGlvbiByZXR1cm5lcigpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZTtcbn1cbmZ1bmN0aW9uIHRocm93ZXIoKSB7XG4gICAgdGhyb3cgdGhpcy5yZWFzb247XG59XG5cblByb21pc2UucHJvdG90eXBlW1wicmV0dXJuXCJdID1cblByb21pc2UucHJvdG90eXBlLnRoZW5SZXR1cm4gPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB2YWx1ZS5zdXBwcmVzc1VuaGFuZGxlZFJlamVjdGlvbnMoKTtcbiAgICByZXR1cm4gdGhpcy5fdGhlbihcbiAgICAgICAgcmV0dXJuZXIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB7dmFsdWU6IHZhbHVlfSwgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlW1widGhyb3dcIl0gPVxuUHJvbWlzZS5wcm90b3R5cGUudGhlblRocm93ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHJldHVybiB0aGlzLl90aGVuKFxuICAgICAgICB0aHJvd2VyLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwge3JlYXNvbjogcmVhc29ufSwgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmNhdGNoVGhyb3cgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPD0gMSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdGhlbihcbiAgICAgICAgICAgIHVuZGVmaW5lZCwgdGhyb3dlciwgdW5kZWZpbmVkLCB7cmVhc29uOiByZWFzb259LCB1bmRlZmluZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBfcmVhc29uID0gYXJndW1lbnRzWzFdO1xuICAgICAgICB2YXIgaGFuZGxlciA9IGZ1bmN0aW9uKCkge3Rocm93IF9yZWFzb247fTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2F1Z2h0KHJlYXNvbiwgaGFuZGxlcik7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuY2F0Y2hSZXR1cm4gPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHZhbHVlLnN1cHByZXNzVW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuICAgICAgICByZXR1cm4gdGhpcy5fdGhlbihcbiAgICAgICAgICAgIHVuZGVmaW5lZCwgcmV0dXJuZXIsIHVuZGVmaW5lZCwge3ZhbHVlOiB2YWx1ZX0sIHVuZGVmaW5lZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIF92YWx1ZSA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgaWYgKF92YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIF92YWx1ZS5zdXBwcmVzc1VuaGFuZGxlZFJlamVjdGlvbnMoKTtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSBmdW5jdGlvbigpIHtyZXR1cm4gX3ZhbHVlO307XG4gICAgICAgIHJldHVybiB0aGlzLmNhdWdodCh2YWx1ZSwgaGFuZGxlcik7XG4gICAgfVxufTtcbn07XG5cbn0se31dLDExOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCkge1xudmFyIFByb21pc2VSZWR1Y2UgPSBQcm9taXNlLnJlZHVjZTtcbnZhciBQcm9taXNlQWxsID0gUHJvbWlzZS5hbGw7XG5cbmZ1bmN0aW9uIHByb21pc2VBbGxUaGlzKCkge1xuICAgIHJldHVybiBQcm9taXNlQWxsKHRoaXMpO1xufVxuXG5mdW5jdGlvbiBQcm9taXNlTWFwU2VyaWVzKHByb21pc2VzLCBmbikge1xuICAgIHJldHVybiBQcm9taXNlUmVkdWNlKHByb21pc2VzLCBmbiwgSU5URVJOQUwsIElOVEVSTkFMKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuZWFjaCA9IGZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBQcm9taXNlUmVkdWNlKHRoaXMsIGZuLCBJTlRFUk5BTCwgMClcbiAgICAgICAgICAgICAgLl90aGVuKHByb21pc2VBbGxUaGlzLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdGhpcywgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm1hcFNlcmllcyA9IGZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBQcm9taXNlUmVkdWNlKHRoaXMsIGZuLCBJTlRFUk5BTCwgSU5URVJOQUwpO1xufTtcblxuUHJvbWlzZS5lYWNoID0gZnVuY3Rpb24gKHByb21pc2VzLCBmbikge1xuICAgIHJldHVybiBQcm9taXNlUmVkdWNlKHByb21pc2VzLCBmbiwgSU5URVJOQUwsIDApXG4gICAgICAgICAgICAgIC5fdGhlbihwcm9taXNlQWxsVGhpcywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHByb21pc2VzLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5tYXBTZXJpZXMgPSBQcm9taXNlTWFwU2VyaWVzO1xufTtcblxuXG59LHt9XSwxMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBlczUgPSBfZGVyZXFfKFwiLi9lczVcIik7XG52YXIgT2JqZWN0ZnJlZXplID0gZXM1LmZyZWV6ZTtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnZhciBpbmhlcml0cyA9IHV0aWwuaW5oZXJpdHM7XG52YXIgbm90RW51bWVyYWJsZVByb3AgPSB1dGlsLm5vdEVudW1lcmFibGVQcm9wO1xuXG5mdW5jdGlvbiBzdWJFcnJvcihuYW1lUHJvcGVydHksIGRlZmF1bHRNZXNzYWdlKSB7XG4gICAgZnVuY3Rpb24gU3ViRXJyb3IobWVzc2FnZSkge1xuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU3ViRXJyb3IpKSByZXR1cm4gbmV3IFN1YkVycm9yKG1lc3NhZ2UpO1xuICAgICAgICBub3RFbnVtZXJhYmxlUHJvcCh0aGlzLCBcIm1lc3NhZ2VcIixcbiAgICAgICAgICAgIHR5cGVvZiBtZXNzYWdlID09PSBcInN0cmluZ1wiID8gbWVzc2FnZSA6IGRlZmF1bHRNZXNzYWdlKTtcbiAgICAgICAgbm90RW51bWVyYWJsZVByb3AodGhpcywgXCJuYW1lXCIsIG5hbWVQcm9wZXJ0eSk7XG4gICAgICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFcnJvci5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaGVyaXRzKFN1YkVycm9yLCBFcnJvcik7XG4gICAgcmV0dXJuIFN1YkVycm9yO1xufVxuXG52YXIgX1R5cGVFcnJvciwgX1JhbmdlRXJyb3I7XG52YXIgV2FybmluZyA9IHN1YkVycm9yKFwiV2FybmluZ1wiLCBcIndhcm5pbmdcIik7XG52YXIgQ2FuY2VsbGF0aW9uRXJyb3IgPSBzdWJFcnJvcihcIkNhbmNlbGxhdGlvbkVycm9yXCIsIFwiY2FuY2VsbGF0aW9uIGVycm9yXCIpO1xudmFyIFRpbWVvdXRFcnJvciA9IHN1YkVycm9yKFwiVGltZW91dEVycm9yXCIsIFwidGltZW91dCBlcnJvclwiKTtcbnZhciBBZ2dyZWdhdGVFcnJvciA9IHN1YkVycm9yKFwiQWdncmVnYXRlRXJyb3JcIiwgXCJhZ2dyZWdhdGUgZXJyb3JcIik7XG50cnkge1xuICAgIF9UeXBlRXJyb3IgPSBUeXBlRXJyb3I7XG4gICAgX1JhbmdlRXJyb3IgPSBSYW5nZUVycm9yO1xufSBjYXRjaChlKSB7XG4gICAgX1R5cGVFcnJvciA9IHN1YkVycm9yKFwiVHlwZUVycm9yXCIsIFwidHlwZSBlcnJvclwiKTtcbiAgICBfUmFuZ2VFcnJvciA9IHN1YkVycm9yKFwiUmFuZ2VFcnJvclwiLCBcInJhbmdlIGVycm9yXCIpO1xufVxuXG52YXIgbWV0aG9kcyA9IChcImpvaW4gcG9wIHB1c2ggc2hpZnQgdW5zaGlmdCBzbGljZSBmaWx0ZXIgZm9yRWFjaCBzb21lIFwiICtcbiAgICBcImV2ZXJ5IG1hcCBpbmRleE9mIGxhc3RJbmRleE9mIHJlZHVjZSByZWR1Y2VSaWdodCBzb3J0IHJldmVyc2VcIikuc3BsaXQoXCIgXCIpO1xuXG5mb3IgKHZhciBpID0gMDsgaSA8IG1ldGhvZHMubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAodHlwZW9mIEFycmF5LnByb3RvdHlwZVttZXRob2RzW2ldXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIEFnZ3JlZ2F0ZUVycm9yLnByb3RvdHlwZVttZXRob2RzW2ldXSA9IEFycmF5LnByb3RvdHlwZVttZXRob2RzW2ldXTtcbiAgICB9XG59XG5cbmVzNS5kZWZpbmVQcm9wZXJ0eShBZ2dyZWdhdGVFcnJvci5wcm90b3R5cGUsIFwibGVuZ3RoXCIsIHtcbiAgICB2YWx1ZTogMCxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IHRydWVcbn0pO1xuQWdncmVnYXRlRXJyb3IucHJvdG90eXBlW1wiaXNPcGVyYXRpb25hbFwiXSA9IHRydWU7XG52YXIgbGV2ZWwgPSAwO1xuQWdncmVnYXRlRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGluZGVudCA9IEFycmF5KGxldmVsICogNCArIDEpLmpvaW4oXCIgXCIpO1xuICAgIHZhciByZXQgPSBcIlxcblwiICsgaW5kZW50ICsgXCJBZ2dyZWdhdGVFcnJvciBvZjpcIiArIFwiXFxuXCI7XG4gICAgbGV2ZWwrKztcbiAgICBpbmRlbnQgPSBBcnJheShsZXZlbCAqIDQgKyAxKS5qb2luKFwiIFwiKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHN0ciA9IHRoaXNbaV0gPT09IHRoaXMgPyBcIltDaXJjdWxhciBBZ2dyZWdhdGVFcnJvcl1cIiA6IHRoaXNbaV0gKyBcIlwiO1xuICAgICAgICB2YXIgbGluZXMgPSBzdHIuc3BsaXQoXCJcXG5cIik7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGluZXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgIGxpbmVzW2pdID0gaW5kZW50ICsgbGluZXNbal07XG4gICAgICAgIH1cbiAgICAgICAgc3RyID0gbGluZXMuam9pbihcIlxcblwiKTtcbiAgICAgICAgcmV0ICs9IHN0ciArIFwiXFxuXCI7XG4gICAgfVxuICAgIGxldmVsLS07XG4gICAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIE9wZXJhdGlvbmFsRXJyb3IobWVzc2FnZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBPcGVyYXRpb25hbEVycm9yKSlcbiAgICAgICAgcmV0dXJuIG5ldyBPcGVyYXRpb25hbEVycm9yKG1lc3NhZ2UpO1xuICAgIG5vdEVudW1lcmFibGVQcm9wKHRoaXMsIFwibmFtZVwiLCBcIk9wZXJhdGlvbmFsRXJyb3JcIik7XG4gICAgbm90RW51bWVyYWJsZVByb3AodGhpcywgXCJtZXNzYWdlXCIsIG1lc3NhZ2UpO1xuICAgIHRoaXMuY2F1c2UgPSBtZXNzYWdlO1xuICAgIHRoaXNbXCJpc09wZXJhdGlvbmFsXCJdID0gdHJ1ZTtcblxuICAgIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgbm90RW51bWVyYWJsZVByb3AodGhpcywgXCJtZXNzYWdlXCIsIG1lc3NhZ2UubWVzc2FnZSk7XG4gICAgICAgIG5vdEVudW1lcmFibGVQcm9wKHRoaXMsIFwic3RhY2tcIiwgbWVzc2FnZS5zdGFjayk7XG4gICAgfSBlbHNlIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgICB9XG5cbn1cbmluaGVyaXRzKE9wZXJhdGlvbmFsRXJyb3IsIEVycm9yKTtcblxudmFyIGVycm9yVHlwZXMgPSBFcnJvcltcIl9fQmx1ZWJpcmRFcnJvclR5cGVzX19cIl07XG5pZiAoIWVycm9yVHlwZXMpIHtcbiAgICBlcnJvclR5cGVzID0gT2JqZWN0ZnJlZXplKHtcbiAgICAgICAgQ2FuY2VsbGF0aW9uRXJyb3I6IENhbmNlbGxhdGlvbkVycm9yLFxuICAgICAgICBUaW1lb3V0RXJyb3I6IFRpbWVvdXRFcnJvcixcbiAgICAgICAgT3BlcmF0aW9uYWxFcnJvcjogT3BlcmF0aW9uYWxFcnJvcixcbiAgICAgICAgUmVqZWN0aW9uRXJyb3I6IE9wZXJhdGlvbmFsRXJyb3IsXG4gICAgICAgIEFnZ3JlZ2F0ZUVycm9yOiBBZ2dyZWdhdGVFcnJvclxuICAgIH0pO1xuICAgIGVzNS5kZWZpbmVQcm9wZXJ0eShFcnJvciwgXCJfX0JsdWViaXJkRXJyb3JUeXBlc19fXCIsIHtcbiAgICAgICAgdmFsdWU6IGVycm9yVHlwZXMsXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2VcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgRXJyb3I6IEVycm9yLFxuICAgIFR5cGVFcnJvcjogX1R5cGVFcnJvcixcbiAgICBSYW5nZUVycm9yOiBfUmFuZ2VFcnJvcixcbiAgICBDYW5jZWxsYXRpb25FcnJvcjogZXJyb3JUeXBlcy5DYW5jZWxsYXRpb25FcnJvcixcbiAgICBPcGVyYXRpb25hbEVycm9yOiBlcnJvclR5cGVzLk9wZXJhdGlvbmFsRXJyb3IsXG4gICAgVGltZW91dEVycm9yOiBlcnJvclR5cGVzLlRpbWVvdXRFcnJvcixcbiAgICBBZ2dyZWdhdGVFcnJvcjogZXJyb3JUeXBlcy5BZ2dyZWdhdGVFcnJvcixcbiAgICBXYXJuaW5nOiBXYXJuaW5nXG59O1xuXG59LHtcIi4vZXM1XCI6MTMsXCIuL3V0aWxcIjozNn1dLDEzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbnZhciBpc0VTNSA9IChmdW5jdGlvbigpe1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHJldHVybiB0aGlzID09PSB1bmRlZmluZWQ7XG59KSgpO1xuXG5pZiAoaXNFUzUpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgZnJlZXplOiBPYmplY3QuZnJlZXplLFxuICAgICAgICBkZWZpbmVQcm9wZXJ0eTogT2JqZWN0LmRlZmluZVByb3BlcnR5LFxuICAgICAgICBnZXREZXNjcmlwdG9yOiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICAgICAgICBrZXlzOiBPYmplY3Qua2V5cyxcbiAgICAgICAgbmFtZXM6IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzLFxuICAgICAgICBnZXRQcm90b3R5cGVPZjogT2JqZWN0LmdldFByb3RvdHlwZU9mLFxuICAgICAgICBpc0FycmF5OiBBcnJheS5pc0FycmF5LFxuICAgICAgICBpc0VTNTogaXNFUzUsXG4gICAgICAgIHByb3BlcnR5SXNXcml0YWJsZTogZnVuY3Rpb24ob2JqLCBwcm9wKSB7XG4gICAgICAgICAgICB2YXIgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBwcm9wKTtcbiAgICAgICAgICAgIHJldHVybiAhISghZGVzY3JpcHRvciB8fCBkZXNjcmlwdG9yLndyaXRhYmxlIHx8IGRlc2NyaXB0b3Iuc2V0KTtcbiAgICAgICAgfVxuICAgIH07XG59IGVsc2Uge1xuICAgIHZhciBoYXMgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcbiAgICB2YXIgc3RyID0ge30udG9TdHJpbmc7XG4gICAgdmFyIHByb3RvID0ge30uY29uc3RydWN0b3IucHJvdG90eXBlO1xuXG4gICAgdmFyIE9iamVjdEtleXMgPSBmdW5jdGlvbiAobykge1xuICAgICAgICB2YXIgcmV0ID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvKSB7XG4gICAgICAgICAgICBpZiAoaGFzLmNhbGwobywga2V5KSkge1xuICAgICAgICAgICAgICAgIHJldC5wdXNoKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuXG4gICAgdmFyIE9iamVjdEdldERlc2NyaXB0b3IgPSBmdW5jdGlvbihvLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIHt2YWx1ZTogb1trZXldfTtcbiAgICB9O1xuXG4gICAgdmFyIE9iamVjdERlZmluZVByb3BlcnR5ID0gZnVuY3Rpb24gKG8sIGtleSwgZGVzYykge1xuICAgICAgICBvW2tleV0gPSBkZXNjLnZhbHVlO1xuICAgICAgICByZXR1cm4gbztcbiAgICB9O1xuXG4gICAgdmFyIE9iamVjdEZyZWV6ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9O1xuXG4gICAgdmFyIE9iamVjdEdldFByb3RvdHlwZU9mID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdChvYmopLmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHByb3RvO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBBcnJheUlzQXJyYXkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyLmNhbGwob2JqKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgaXNBcnJheTogQXJyYXlJc0FycmF5LFxuICAgICAgICBrZXlzOiBPYmplY3RLZXlzLFxuICAgICAgICBuYW1lczogT2JqZWN0S2V5cyxcbiAgICAgICAgZGVmaW5lUHJvcGVydHk6IE9iamVjdERlZmluZVByb3BlcnR5LFxuICAgICAgICBnZXREZXNjcmlwdG9yOiBPYmplY3RHZXREZXNjcmlwdG9yLFxuICAgICAgICBmcmVlemU6IE9iamVjdEZyZWV6ZSxcbiAgICAgICAgZ2V0UHJvdG90eXBlT2Y6IE9iamVjdEdldFByb3RvdHlwZU9mLFxuICAgICAgICBpc0VTNTogaXNFUzUsXG4gICAgICAgIHByb3BlcnR5SXNXcml0YWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbn0se31dLDE0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCkge1xudmFyIFByb21pc2VNYXAgPSBQcm9taXNlLm1hcDtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gKGZuLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIFByb21pc2VNYXAodGhpcywgZm4sIG9wdGlvbnMsIElOVEVSTkFMKTtcbn07XG5cblByb21pc2UuZmlsdGVyID0gZnVuY3Rpb24gKHByb21pc2VzLCBmbiwgb3B0aW9ucykge1xuICAgIHJldHVybiBQcm9taXNlTWFwKHByb21pc2VzLCBmbiwgb3B0aW9ucywgSU5URVJOQUwpO1xufTtcbn07XG5cbn0se31dLDE1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBORVhUX0ZJTFRFUikge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsXCIpO1xudmFyIENhbmNlbGxhdGlvbkVycm9yID0gUHJvbWlzZS5DYW5jZWxsYXRpb25FcnJvcjtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG52YXIgY2F0Y2hGaWx0ZXIgPSBfZGVyZXFfKFwiLi9jYXRjaF9maWx0ZXJcIikoTkVYVF9GSUxURVIpO1xuXG5mdW5jdGlvbiBQYXNzVGhyb3VnaEhhbmRsZXJDb250ZXh0KHByb21pc2UsIHR5cGUsIGhhbmRsZXIpIHtcbiAgICB0aGlzLnByb21pc2UgPSBwcm9taXNlO1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5oYW5kbGVyID0gaGFuZGxlcjtcbiAgICB0aGlzLmNhbGxlZCA9IGZhbHNlO1xuICAgIHRoaXMuY2FuY2VsUHJvbWlzZSA9IG51bGw7XG59XG5cblBhc3NUaHJvdWdoSGFuZGxlckNvbnRleHQucHJvdG90eXBlLmlzRmluYWxseUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy50eXBlID09PSAwO1xufTtcblxuZnVuY3Rpb24gRmluYWxseUhhbmRsZXJDYW5jZWxSZWFjdGlvbihmaW5hbGx5SGFuZGxlcikge1xuICAgIHRoaXMuZmluYWxseUhhbmRsZXIgPSBmaW5hbGx5SGFuZGxlcjtcbn1cblxuRmluYWxseUhhbmRsZXJDYW5jZWxSZWFjdGlvbi5wcm90b3R5cGUuX3Jlc3VsdENhbmNlbGxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIGNoZWNrQ2FuY2VsKHRoaXMuZmluYWxseUhhbmRsZXIpO1xufTtcblxuZnVuY3Rpb24gY2hlY2tDYW5jZWwoY3R4LCByZWFzb24pIHtcbiAgICBpZiAoY3R4LmNhbmNlbFByb21pc2UgIT0gbnVsbCkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGN0eC5jYW5jZWxQcm9taXNlLl9yZWplY3QocmVhc29uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN0eC5jYW5jZWxQcm9taXNlLl9jYW5jZWwoKTtcbiAgICAgICAgfVxuICAgICAgICBjdHguY2FuY2VsUHJvbWlzZSA9IG51bGw7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHN1Y2NlZWQoKSB7XG4gICAgcmV0dXJuIGZpbmFsbHlIYW5kbGVyLmNhbGwodGhpcywgdGhpcy5wcm9taXNlLl90YXJnZXQoKS5fc2V0dGxlZFZhbHVlKCkpO1xufVxuZnVuY3Rpb24gZmFpbChyZWFzb24pIHtcbiAgICBpZiAoY2hlY2tDYW5jZWwodGhpcywgcmVhc29uKSkgcmV0dXJuO1xuICAgIGVycm9yT2JqLmUgPSByZWFzb247XG4gICAgcmV0dXJuIGVycm9yT2JqO1xufVxuZnVuY3Rpb24gZmluYWxseUhhbmRsZXIocmVhc29uT3JWYWx1ZSkge1xuICAgIHZhciBwcm9taXNlID0gdGhpcy5wcm9taXNlO1xuICAgIHZhciBoYW5kbGVyID0gdGhpcy5oYW5kbGVyO1xuXG4gICAgaWYgKCF0aGlzLmNhbGxlZCkge1xuICAgICAgICB0aGlzLmNhbGxlZCA9IHRydWU7XG4gICAgICAgIHZhciByZXQgPSB0aGlzLmlzRmluYWxseUhhbmRsZXIoKVxuICAgICAgICAgICAgPyBoYW5kbGVyLmNhbGwocHJvbWlzZS5fYm91bmRWYWx1ZSgpKVxuICAgICAgICAgICAgOiBoYW5kbGVyLmNhbGwocHJvbWlzZS5fYm91bmRWYWx1ZSgpLCByZWFzb25PclZhbHVlKTtcbiAgICAgICAgaWYgKHJldCA9PT0gTkVYVF9GSUxURVIpIHtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0gZWxzZSBpZiAocmV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHByb21pc2UuX3NldFJldHVybmVkTm9uVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShyZXQsIHByb21pc2UpO1xuICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYW5jZWxQcm9taXNlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZS5faXNDYW5jZWxsZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlYXNvbiA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IENhbmNlbGxhdGlvbkVycm9yKFwibGF0ZSBjYW5jZWxsYXRpb24gb2JzZXJ2ZXJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlLl9hdHRhY2hFeHRyYVRyYWNlKHJlYXNvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvck9iai5lID0gcmVhc29uO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yT2JqO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1heWJlUHJvbWlzZS5pc1BlbmRpbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlLl9hdHRhY2hDYW5jZWxsYXRpb25DYWxsYmFjayhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgRmluYWxseUhhbmRsZXJDYW5jZWxSZWFjdGlvbih0aGlzKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1heWJlUHJvbWlzZS5fdGhlbihcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VlZCwgZmFpbCwgdW5kZWZpbmVkLCB0aGlzLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHByb21pc2UuaXNSZWplY3RlZCgpKSB7XG4gICAgICAgIGNoZWNrQ2FuY2VsKHRoaXMpO1xuICAgICAgICBlcnJvck9iai5lID0gcmVhc29uT3JWYWx1ZTtcbiAgICAgICAgcmV0dXJuIGVycm9yT2JqO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNoZWNrQ2FuY2VsKHRoaXMpO1xuICAgICAgICByZXR1cm4gcmVhc29uT3JWYWx1ZTtcbiAgICB9XG59XG5cblByb21pc2UucHJvdG90eXBlLl9wYXNzVGhyb3VnaCA9IGZ1bmN0aW9uKGhhbmRsZXIsIHR5cGUsIHN1Y2Nlc3MsIGZhaWwpIHtcbiAgICBpZiAodHlwZW9mIGhhbmRsZXIgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRoaXMudGhlbigpO1xuICAgIHJldHVybiB0aGlzLl90aGVuKHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgZmFpbCxcbiAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgbmV3IFBhc3NUaHJvdWdoSGFuZGxlckNvbnRleHQodGhpcywgdHlwZSwgaGFuZGxlciksXG4gICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmxhc3RseSA9XG5Qcm9taXNlLnByb3RvdHlwZVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgIHJldHVybiB0aGlzLl9wYXNzVGhyb3VnaChoYW5kbGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaW5hbGx5SGFuZGxlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxseUhhbmRsZXIpO1xufTtcblxuXG5Qcm9taXNlLnByb3RvdHlwZS50YXAgPSBmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgIHJldHVybiB0aGlzLl9wYXNzVGhyb3VnaChoYW5kbGVyLCAxLCBmaW5hbGx5SGFuZGxlcik7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50YXBDYXRjaCA9IGZ1bmN0aW9uIChoYW5kbGVyT3JQcmVkaWNhdGUpIHtcbiAgICB2YXIgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBpZihsZW4gPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Bhc3NUaHJvdWdoKGhhbmRsZXJPclByZWRpY2F0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaW5hbGx5SGFuZGxlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgIHZhciBjYXRjaEluc3RhbmNlcyA9IG5ldyBBcnJheShsZW4gLSAxKSxcbiAgICAgICAgICAgIGogPSAwLCBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuIC0gMTsgKytpKSB7XG4gICAgICAgICAgICB2YXIgaXRlbSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGlmICh1dGlsLmlzT2JqZWN0KGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgY2F0Y2hJbnN0YW5jZXNbaisrXSA9IGl0ZW07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcInRhcENhdGNoIHN0YXRlbWVudCBwcmVkaWNhdGU6IFwiXG4gICAgICAgICAgICAgICAgICAgICsgXCJleHBlY3RpbmcgYW4gb2JqZWN0IGJ1dCBnb3QgXCIgKyB1dGlsLmNsYXNzU3RyaW5nKGl0ZW0pXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2hJbnN0YW5jZXMubGVuZ3RoID0gajtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXNzVGhyb3VnaChjYXRjaEZpbHRlcihjYXRjaEluc3RhbmNlcywgaGFuZGxlciwgdGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxseUhhbmRsZXIpO1xuICAgIH1cblxufTtcblxucmV0dXJuIFBhc3NUaHJvdWdoSGFuZGxlckNvbnRleHQ7XG59O1xuXG59LHtcIi4vY2F0Y2hfZmlsdGVyXCI6NyxcIi4vdXRpbFwiOjM2fV0sMTY6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFwaVJlamVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgSU5URVJOQUwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRyeUNvbnZlcnRUb1Byb21pc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFByb3h5YWJsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcpIHtcbnZhciBlcnJvcnMgPSBfZGVyZXFfKFwiLi9lcnJvcnNcIik7XG52YXIgVHlwZUVycm9yID0gZXJyb3JzLlR5cGVFcnJvcjtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xudmFyIHlpZWxkSGFuZGxlcnMgPSBbXTtcblxuZnVuY3Rpb24gcHJvbWlzZUZyb21ZaWVsZEhhbmRsZXIodmFsdWUsIHlpZWxkSGFuZGxlcnMsIHRyYWNlUGFyZW50KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB5aWVsZEhhbmRsZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHRyYWNlUGFyZW50Ll9wdXNoQ29udGV4dCgpO1xuICAgICAgICB2YXIgcmVzdWx0ID0gdHJ5Q2F0Y2goeWllbGRIYW5kbGVyc1tpXSkodmFsdWUpO1xuICAgICAgICB0cmFjZVBhcmVudC5fcG9wQ29udGV4dCgpO1xuICAgICAgICBpZiAocmVzdWx0ID09PSBlcnJvck9iaikge1xuICAgICAgICAgICAgdHJhY2VQYXJlbnQuX3B1c2hDb250ZXh0KCk7XG4gICAgICAgICAgICB2YXIgcmV0ID0gUHJvbWlzZS5yZWplY3QoZXJyb3JPYmouZSk7XG4gICAgICAgICAgICB0cmFjZVBhcmVudC5fcG9wQ29udGV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShyZXN1bHQsIHRyYWNlUGFyZW50KTtcbiAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHJldHVybiBtYXliZVByb21pc2U7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBQcm9taXNlU3Bhd24oZ2VuZXJhdG9yRnVuY3Rpb24sIHJlY2VpdmVyLCB5aWVsZEhhbmRsZXIsIHN0YWNrKSB7XG4gICAgaWYgKGRlYnVnLmNhbmNlbGxhdGlvbigpKSB7XG4gICAgICAgIHZhciBpbnRlcm5hbCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICAgICAgdmFyIF9maW5hbGx5UHJvbWlzZSA9IHRoaXMuX2ZpbmFsbHlQcm9taXNlID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgICAgICB0aGlzLl9wcm9taXNlID0gaW50ZXJuYWwubGFzdGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIF9maW5hbGx5UHJvbWlzZTtcbiAgICAgICAgfSk7XG4gICAgICAgIGludGVybmFsLl9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgICAgICBpbnRlcm5hbC5fc2V0T25DYW5jZWwodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSB0aGlzLl9wcm9taXNlID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgICAgICBwcm9taXNlLl9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgIH1cbiAgICB0aGlzLl9zdGFjayA9IHN0YWNrO1xuICAgIHRoaXMuX2dlbmVyYXRvckZ1bmN0aW9uID0gZ2VuZXJhdG9yRnVuY3Rpb247XG4gICAgdGhpcy5fcmVjZWl2ZXIgPSByZWNlaXZlcjtcbiAgICB0aGlzLl9nZW5lcmF0b3IgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5feWllbGRIYW5kbGVycyA9IHR5cGVvZiB5aWVsZEhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICA/IFt5aWVsZEhhbmRsZXJdLmNvbmNhdCh5aWVsZEhhbmRsZXJzKVxuICAgICAgICA6IHlpZWxkSGFuZGxlcnM7XG4gICAgdGhpcy5feWllbGRlZFByb21pc2UgPSBudWxsO1xuICAgIHRoaXMuX2NhbmNlbGxhdGlvblBoYXNlID0gZmFsc2U7XG59XG51dGlsLmluaGVyaXRzKFByb21pc2VTcGF3biwgUHJveHlhYmxlKTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5faXNSZXNvbHZlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9wcm9taXNlID09PSBudWxsO1xufTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5fY2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX3Byb21pc2UgPSB0aGlzLl9nZW5lcmF0b3IgPSBudWxsO1xuICAgIGlmIChkZWJ1Zy5jYW5jZWxsYXRpb24oKSAmJiB0aGlzLl9maW5hbGx5UHJvbWlzZSAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9maW5hbGx5UHJvbWlzZS5fZnVsZmlsbCgpO1xuICAgICAgICB0aGlzLl9maW5hbGx5UHJvbWlzZSA9IG51bGw7XG4gICAgfVxufTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5fcHJvbWlzZUNhbmNlbGxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9pc1Jlc29sdmVkKCkpIHJldHVybjtcbiAgICB2YXIgaW1wbGVtZW50c1JldHVybiA9IHR5cGVvZiB0aGlzLl9nZW5lcmF0b3JbXCJyZXR1cm5cIl0gIT09IFwidW5kZWZpbmVkXCI7XG5cbiAgICB2YXIgcmVzdWx0O1xuICAgIGlmICghaW1wbGVtZW50c1JldHVybikge1xuICAgICAgICB2YXIgcmVhc29uID0gbmV3IFByb21pc2UuQ2FuY2VsbGF0aW9uRXJyb3IoXG4gICAgICAgICAgICBcImdlbmVyYXRvciAucmV0dXJuKCkgc2VudGluZWxcIik7XG4gICAgICAgIFByb21pc2UuY29yb3V0aW5lLnJldHVyblNlbnRpbmVsID0gcmVhc29uO1xuICAgICAgICB0aGlzLl9wcm9taXNlLl9hdHRhY2hFeHRyYVRyYWNlKHJlYXNvbik7XG4gICAgICAgIHRoaXMuX3Byb21pc2UuX3B1c2hDb250ZXh0KCk7XG4gICAgICAgIHJlc3VsdCA9IHRyeUNhdGNoKHRoaXMuX2dlbmVyYXRvcltcInRocm93XCJdKS5jYWxsKHRoaXMuX2dlbmVyYXRvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlYXNvbik7XG4gICAgICAgIHRoaXMuX3Byb21pc2UuX3BvcENvbnRleHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wcm9taXNlLl9wdXNoQ29udGV4dCgpO1xuICAgICAgICByZXN1bHQgPSB0cnlDYXRjaCh0aGlzLl9nZW5lcmF0b3JbXCJyZXR1cm5cIl0pLmNhbGwodGhpcy5fZ2VuZXJhdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCk7XG4gICAgICAgIHRoaXMuX3Byb21pc2UuX3BvcENvbnRleHQoKTtcbiAgICB9XG4gICAgdGhpcy5fY2FuY2VsbGF0aW9uUGhhc2UgPSB0cnVlO1xuICAgIHRoaXMuX3lpZWxkZWRQcm9taXNlID0gbnVsbDtcbiAgICB0aGlzLl9jb250aW51ZShyZXN1bHQpO1xufTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5fcHJvbWlzZUZ1bGZpbGxlZCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdGhpcy5feWllbGRlZFByb21pc2UgPSBudWxsO1xuICAgIHRoaXMuX3Byb21pc2UuX3B1c2hDb250ZXh0KCk7XG4gICAgdmFyIHJlc3VsdCA9IHRyeUNhdGNoKHRoaXMuX2dlbmVyYXRvci5uZXh0KS5jYWxsKHRoaXMuX2dlbmVyYXRvciwgdmFsdWUpO1xuICAgIHRoaXMuX3Byb21pc2UuX3BvcENvbnRleHQoKTtcbiAgICB0aGlzLl9jb250aW51ZShyZXN1bHQpO1xufTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5fcHJvbWlzZVJlamVjdGVkID0gZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgdGhpcy5feWllbGRlZFByb21pc2UgPSBudWxsO1xuICAgIHRoaXMuX3Byb21pc2UuX2F0dGFjaEV4dHJhVHJhY2UocmVhc29uKTtcbiAgICB0aGlzLl9wcm9taXNlLl9wdXNoQ29udGV4dCgpO1xuICAgIHZhciByZXN1bHQgPSB0cnlDYXRjaCh0aGlzLl9nZW5lcmF0b3JbXCJ0aHJvd1wiXSlcbiAgICAgICAgLmNhbGwodGhpcy5fZ2VuZXJhdG9yLCByZWFzb24pO1xuICAgIHRoaXMuX3Byb21pc2UuX3BvcENvbnRleHQoKTtcbiAgICB0aGlzLl9jb250aW51ZShyZXN1bHQpO1xufTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5fcmVzdWx0Q2FuY2VsbGVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX3lpZWxkZWRQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICB2YXIgcHJvbWlzZSA9IHRoaXMuX3lpZWxkZWRQcm9taXNlO1xuICAgICAgICB0aGlzLl95aWVsZGVkUHJvbWlzZSA9IG51bGw7XG4gICAgICAgIHByb21pc2UuY2FuY2VsKCk7XG4gICAgfVxufTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5wcm9taXNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9wcm9taXNlO1xufTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5fcnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2dlbmVyYXRvciA9IHRoaXMuX2dlbmVyYXRvckZ1bmN0aW9uLmNhbGwodGhpcy5fcmVjZWl2ZXIpO1xuICAgIHRoaXMuX3JlY2VpdmVyID1cbiAgICAgICAgdGhpcy5fZ2VuZXJhdG9yRnVuY3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fcHJvbWlzZUZ1bGZpbGxlZCh1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZVNwYXduLnByb3RvdHlwZS5fY29udGludWUgPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzLl9wcm9taXNlO1xuICAgIGlmIChyZXN1bHQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgIHRoaXMuX2NsZWFudXAoKTtcbiAgICAgICAgaWYgKHRoaXMuX2NhbmNlbGxhdGlvblBoYXNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZS5jYW5jZWwoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlLl9yZWplY3RDYWxsYmFjayhyZXN1bHQuZSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHZhbHVlID0gcmVzdWx0LnZhbHVlO1xuICAgIGlmIChyZXN1bHQuZG9uZSA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLl9jbGVhbnVwKCk7XG4gICAgICAgIGlmICh0aGlzLl9jYW5jZWxsYXRpb25QaGFzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2UuY2FuY2VsKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZS5fcmVzb2x2ZUNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHZhbHVlLCB0aGlzLl9wcm9taXNlKTtcbiAgICAgICAgaWYgKCEobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkpIHtcbiAgICAgICAgICAgIG1heWJlUHJvbWlzZSA9XG4gICAgICAgICAgICAgICAgcHJvbWlzZUZyb21ZaWVsZEhhbmRsZXIobWF5YmVQcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3lpZWxkSGFuZGxlcnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvbWlzZSk7XG4gICAgICAgICAgICBpZiAobWF5YmVQcm9taXNlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvbWlzZVJlamVjdGVkKFxuICAgICAgICAgICAgICAgICAgICBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJBIHZhbHVlICVzIHdhcyB5aWVsZGVkIHRoYXQgY291bGQgbm90IGJlIHRyZWF0ZWQgYXMgYSBwcm9taXNlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvTXFyRm1YXFx1MDAwYVxcdTAwMGFcIi5yZXBsYWNlKFwiJXNcIiwgU3RyaW5nKHZhbHVlKSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJGcm9tIGNvcm91dGluZTpcXHUwMDBhXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhY2suc3BsaXQoXCJcXG5cIikuc2xpY2UoMSwgLTcpLmpvaW4oXCJcXG5cIilcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG1heWJlUHJvbWlzZSA9IG1heWJlUHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgICAgIHZhciBiaXRGaWVsZCA9IG1heWJlUHJvbWlzZS5fYml0RmllbGQ7XG4gICAgICAgIDtcbiAgICAgICAgaWYgKCgoYml0RmllbGQgJiA1MDM5NzE4NCkgPT09IDApKSB7XG4gICAgICAgICAgICB0aGlzLl95aWVsZGVkUHJvbWlzZSA9IG1heWJlUHJvbWlzZTtcbiAgICAgICAgICAgIG1heWJlUHJvbWlzZS5fcHJveHkodGhpcywgbnVsbCk7XG4gICAgICAgIH0gZWxzZSBpZiAoKChiaXRGaWVsZCAmIDMzNTU0NDMyKSAhPT0gMCkpIHtcbiAgICAgICAgICAgIFByb21pc2UuX2FzeW5jLmludm9rZShcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9taXNlRnVsZmlsbGVkLCB0aGlzLCBtYXliZVByb21pc2UuX3ZhbHVlKClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoKChiaXRGaWVsZCAmIDE2Nzc3MjE2KSAhPT0gMCkpIHtcbiAgICAgICAgICAgIFByb21pc2UuX2FzeW5jLmludm9rZShcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9taXNlUmVqZWN0ZWQsIHRoaXMsIG1heWJlUHJvbWlzZS5fcmVhc29uKClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9wcm9taXNlQ2FuY2VsbGVkKCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Qcm9taXNlLmNvcm91dGluZSA9IGZ1bmN0aW9uIChnZW5lcmF0b3JGdW5jdGlvbiwgb3B0aW9ucykge1xuICAgIGlmICh0eXBlb2YgZ2VuZXJhdG9yRnVuY3Rpb24gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiZ2VuZXJhdG9yRnVuY3Rpb24gbXVzdCBiZSBhIGZ1bmN0aW9uXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvTXFyRm1YXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgdmFyIHlpZWxkSGFuZGxlciA9IE9iamVjdChvcHRpb25zKS55aWVsZEhhbmRsZXI7XG4gICAgdmFyIFByb21pc2VTcGF3biQgPSBQcm9taXNlU3Bhd247XG4gICAgdmFyIHN0YWNrID0gbmV3IEVycm9yKCkuc3RhY2s7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGdlbmVyYXRvciA9IGdlbmVyYXRvckZ1bmN0aW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBzcGF3biA9IG5ldyBQcm9taXNlU3Bhd24kKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB5aWVsZEhhbmRsZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrKTtcbiAgICAgICAgdmFyIHJldCA9IHNwYXduLnByb21pc2UoKTtcbiAgICAgICAgc3Bhd24uX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgc3Bhd24uX3Byb21pc2VGdWxmaWxsZWQodW5kZWZpbmVkKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5jb3JvdXRpbmUuYWRkWWllbGRIYW5kbGVyID0gZnVuY3Rpb24oZm4pIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImV4cGVjdGluZyBhIGZ1bmN0aW9uIGJ1dCBnb3QgXCIgKyB1dGlsLmNsYXNzU3RyaW5nKGZuKSk7XG4gICAgfVxuICAgIHlpZWxkSGFuZGxlcnMucHVzaChmbik7XG59O1xuXG5Qcm9taXNlLnNwYXduID0gZnVuY3Rpb24gKGdlbmVyYXRvckZ1bmN0aW9uKSB7XG4gICAgZGVidWcuZGVwcmVjYXRlZChcIlByb21pc2Uuc3Bhd24oKVwiLCBcIlByb21pc2UuY29yb3V0aW5lKClcIik7XG4gICAgaWYgKHR5cGVvZiBnZW5lcmF0b3JGdW5jdGlvbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBhcGlSZWplY3Rpb24oXCJnZW5lcmF0b3JGdW5jdGlvbiBtdXN0IGJlIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9NcXJGbVhcXHUwMDBhXCIpO1xuICAgIH1cbiAgICB2YXIgc3Bhd24gPSBuZXcgUHJvbWlzZVNwYXduKGdlbmVyYXRvckZ1bmN0aW9uLCB0aGlzKTtcbiAgICB2YXIgcmV0ID0gc3Bhd24ucHJvbWlzZSgpO1xuICAgIHNwYXduLl9ydW4oUHJvbWlzZS5zcGF3bik7XG4gICAgcmV0dXJuIHJldDtcbn07XG59O1xuXG59LHtcIi4vZXJyb3JzXCI6MTIsXCIuL3V0aWxcIjozNn1dLDE3OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPVxuZnVuY3Rpb24oUHJvbWlzZSwgUHJvbWlzZUFycmF5LCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBJTlRFUk5BTCwgYXN5bmMpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnZhciBjYW5FdmFsdWF0ZSA9IHV0aWwuY2FuRXZhbHVhdGU7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcbnZhciByZWplY3Q7XG5cbmlmICghdHJ1ZSkge1xuaWYgKGNhbkV2YWx1YXRlKSB7XG4gICAgdmFyIHRoZW5DYWxsYmFjayA9IGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcInZhbHVlXCIsIFwiaG9sZGVyXCIsIFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgaG9sZGVyLnBJbmRleCA9IHZhbHVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgaG9sZGVyLmNoZWNrRnVsZmlsbG1lbnQodGhpcyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgXCIucmVwbGFjZSgvSW5kZXgvZywgaSkpO1xuICAgIH07XG5cbiAgICB2YXIgcHJvbWlzZVNldHRlciA9IGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcInByb21pc2VcIiwgXCJob2xkZXJcIiwgXCIgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgaG9sZGVyLnBJbmRleCA9IHByb21pc2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgXCIucmVwbGFjZSgvSW5kZXgvZywgaSkpO1xuICAgIH07XG5cbiAgICB2YXIgZ2VuZXJhdGVIb2xkZXJDbGFzcyA9IGZ1bmN0aW9uKHRvdGFsKSB7XG4gICAgICAgIHZhciBwcm9wcyA9IG5ldyBBcnJheSh0b3RhbCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHByb3BzW2ldID0gXCJ0aGlzLnBcIiArIChpKzEpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhc3NpZ25tZW50ID0gcHJvcHMuam9pbihcIiA9IFwiKSArIFwiID0gbnVsbDtcIjtcbiAgICAgICAgdmFyIGNhbmNlbGxhdGlvbkNvZGU9IFwidmFyIHByb21pc2U7XFxuXCIgKyBwcm9wcy5tYXAoZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICAgICBwcm9taXNlID0gXCIgKyBwcm9wICsgXCI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIGlmIChwcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLmNhbmNlbCgpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgXCI7XG4gICAgICAgIH0pLmpvaW4oXCJcXG5cIik7XG4gICAgICAgIHZhciBwYXNzZWRBcmd1bWVudHMgPSBwcm9wcy5qb2luKFwiLCBcIik7XG4gICAgICAgIHZhciBuYW1lID0gXCJIb2xkZXIkXCIgKyB0b3RhbDtcblxuXG4gICAgICAgIHZhciBjb2RlID0gXCJyZXR1cm4gZnVuY3Rpb24odHJ5Q2F0Y2gsIGVycm9yT2JqLCBQcm9taXNlLCBhc3luYykgeyAgICBcXG5cXFxuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgZnVuY3Rpb24gW1RoZU5hbWVdKGZuKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIFtUaGVQcm9wZXJ0aWVzXSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIHRoaXMuZm4gPSBmbjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIHRoaXMuYXN5bmNOZWVkZWQgPSB0cnVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIHRoaXMubm93ID0gMDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgW1RoZU5hbWVdLnByb3RvdHlwZS5fY2FsbEZ1bmN0aW9uID0gZnVuY3Rpb24ocHJvbWlzZSkgeyAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIHByb21pc2UuX3B1c2hDb250ZXh0KCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIHZhciByZXQgPSB0cnlDYXRjaCh0aGlzLmZuKShbVGhlUGFzc2VkQXJndW1lbnRzXSk7ICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIHByb21pc2UuX3BvcENvbnRleHQoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLl9yZWplY3RDYWxsYmFjayhyZXQuZSwgZmFsc2UpOyAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLl9yZXNvbHZlQ2FsbGJhY2socmV0KTsgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgfTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgW1RoZU5hbWVdLnByb3RvdHlwZS5jaGVja0Z1bGZpbGxtZW50ID0gZnVuY3Rpb24ocHJvbWlzZSkgeyAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIHZhciBub3cgPSArK3RoaXMubm93OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIGlmIChub3cgPT09IFtUaGVUb3RhbF0pIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5hc3luY05lZWRlZCkgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmMuaW52b2tlKHRoaXMuX2NhbGxGdW5jdGlvbiwgdGhpcywgcHJvbWlzZSk7ICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FsbEZ1bmN0aW9uKHByb21pc2UpOyAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgfTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgW1RoZU5hbWVdLnByb3RvdHlwZS5fcmVzdWx0Q2FuY2VsbGVkID0gZnVuY3Rpb24oKSB7ICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIFtDYW5jZWxsYXRpb25Db2RlXSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgfTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgcmV0dXJuIFtUaGVOYW1lXTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICB9KHRyeUNhdGNoLCBlcnJvck9iaiwgUHJvbWlzZSwgYXN5bmMpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICBcIjtcblxuICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKC9cXFtUaGVOYW1lXFxdL2csIG5hbWUpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxbVGhlVG90YWxcXF0vZywgdG90YWwpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxbVGhlUGFzc2VkQXJndW1lbnRzXFxdL2csIHBhc3NlZEFyZ3VtZW50cylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXFtUaGVQcm9wZXJ0aWVzXFxdL2csIGFzc2lnbm1lbnQpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxbQ2FuY2VsbGF0aW9uQ29kZVxcXS9nLCBjYW5jZWxsYXRpb25Db2RlKTtcblxuICAgICAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKFwidHJ5Q2F0Y2hcIiwgXCJlcnJvck9ialwiLCBcIlByb21pc2VcIiwgXCJhc3luY1wiLCBjb2RlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRyeUNhdGNoLCBlcnJvck9iaiwgUHJvbWlzZSwgYXN5bmMpO1xuICAgIH07XG5cbiAgICB2YXIgaG9sZGVyQ2xhc3NlcyA9IFtdO1xuICAgIHZhciB0aGVuQ2FsbGJhY2tzID0gW107XG4gICAgdmFyIHByb21pc2VTZXR0ZXJzID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDg7ICsraSkge1xuICAgICAgICBob2xkZXJDbGFzc2VzLnB1c2goZ2VuZXJhdGVIb2xkZXJDbGFzcyhpICsgMSkpO1xuICAgICAgICB0aGVuQ2FsbGJhY2tzLnB1c2godGhlbkNhbGxiYWNrKGkgKyAxKSk7XG4gICAgICAgIHByb21pc2VTZXR0ZXJzLnB1c2gocHJvbWlzZVNldHRlcihpICsgMSkpO1xuICAgIH1cblxuICAgIHJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgdGhpcy5fcmVqZWN0KHJlYXNvbik7XG4gICAgfTtcbn19XG5cblByb21pc2Uuam9pbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFzdCA9IGFyZ3VtZW50cy5sZW5ndGggLSAxO1xuICAgIHZhciBmbjtcbiAgICBpZiAobGFzdCA+IDAgJiYgdHlwZW9mIGFyZ3VtZW50c1tsYXN0XSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGZuID0gYXJndW1lbnRzW2xhc3RdO1xuICAgICAgICBpZiAoIXRydWUpIHtcbiAgICAgICAgICAgIGlmIChsYXN0IDw9IDggJiYgY2FuRXZhbHVhdGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmV0ID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgICAgICAgICAgICAgIHJldC5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgSG9sZGVyQ2xhc3MgPSBob2xkZXJDbGFzc2VzW2xhc3QgLSAxXTtcbiAgICAgICAgICAgICAgICB2YXIgaG9sZGVyID0gbmV3IEhvbGRlckNsYXNzKGZuKTtcbiAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2tzID0gdGhlbkNhbGxiYWNrcztcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFzdDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKGFyZ3VtZW50c1tpXSwgcmV0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZSA9IG1heWJlUHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYml0RmllbGQgPSBtYXliZVByb21pc2UuX2JpdEZpZWxkO1xuICAgICAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCgoYml0RmllbGQgJiA1MDM5NzE4NCkgPT09IDApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlLl90aGVuKGNhbGxiYWNrc1tpXSwgcmVqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHJldCwgaG9sZGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlU2V0dGVyc1tpXShtYXliZVByb21pc2UsIGhvbGRlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9sZGVyLmFzeW5jTmVlZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCgoYml0RmllbGQgJiAzMzU1NDQzMikgIT09IDApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzW2ldLmNhbGwocmV0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZS5fdmFsdWUoKSwgaG9sZGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKChiaXRGaWVsZCAmIDE2Nzc3MjE2KSAhPT0gMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXQuX3JlamVjdChtYXliZVByb21pc2UuX3JlYXNvbigpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0Ll9jYW5jZWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tpXS5jYWxsKHJldCwgbWF5YmVQcm9taXNlLCBob2xkZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFyZXQuX2lzRmF0ZVNlYWxlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChob2xkZXIuYXN5bmNOZWVkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0gUHJvbWlzZS5fZ2V0Q29udGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaG9sZGVyLmZuID0gdXRpbC5jb250ZXh0QmluZChjb250ZXh0LCBob2xkZXIuZm4pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldC5fc2V0QXN5bmNHdWFyYW50ZWVkKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldC5fc2V0T25DYW5jZWwoaG9sZGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTs7XG4gICAgaWYgKGZuKSBhcmdzLnBvcCgpO1xuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZUFycmF5KGFyZ3MpLnByb21pc2UoKTtcbiAgICByZXR1cm4gZm4gIT09IHVuZGVmaW5lZCA/IHJldC5zcHJlYWQoZm4pIDogcmV0O1xufTtcblxufTtcblxufSx7XCIuL3V0aWxcIjozNn1dLDE4OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlQXJyYXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFwaVJlamVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5Q29udmVydFRvUHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgSU5URVJOQUwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWxcIik7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcbnZhciBhc3luYyA9IFByb21pc2UuX2FzeW5jO1xuXG5mdW5jdGlvbiBNYXBwaW5nUHJvbWlzZUFycmF5KHByb21pc2VzLCBmbiwgbGltaXQsIF9maWx0ZXIpIHtcbiAgICB0aGlzLmNvbnN0cnVjdG9yJChwcm9taXNlcyk7XG4gICAgdGhpcy5fcHJvbWlzZS5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICB2YXIgY29udGV4dCA9IFByb21pc2UuX2dldENvbnRleHQoKTtcbiAgICB0aGlzLl9jYWxsYmFjayA9IHV0aWwuY29udGV4dEJpbmQoY29udGV4dCwgZm4pO1xuICAgIHRoaXMuX3ByZXNlcnZlZFZhbHVlcyA9IF9maWx0ZXIgPT09IElOVEVSTkFMXG4gICAgICAgID8gbmV3IEFycmF5KHRoaXMubGVuZ3RoKCkpXG4gICAgICAgIDogbnVsbDtcbiAgICB0aGlzLl9saW1pdCA9IGxpbWl0O1xuICAgIHRoaXMuX2luRmxpZ2h0ID0gMDtcbiAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgIGFzeW5jLmludm9rZSh0aGlzLl9hc3luY0luaXQsIHRoaXMsIHVuZGVmaW5lZCk7XG4gICAgaWYgKHV0aWwuaXNBcnJheShwcm9taXNlcykpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9taXNlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IHByb21pc2VzW2ldO1xuICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgICAgICBtYXliZVByb21pc2Uuc3VwcHJlc3NVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG51dGlsLmluaGVyaXRzKE1hcHBpbmdQcm9taXNlQXJyYXksIFByb21pc2VBcnJheSk7XG5cbk1hcHBpbmdQcm9taXNlQXJyYXkucHJvdG90eXBlLl9hc3luY0luaXQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9pbml0JCh1bmRlZmluZWQsIC0yKTtcbn07XG5cbk1hcHBpbmdQcm9taXNlQXJyYXkucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gKCkge307XG5cbk1hcHBpbmdQcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlRnVsZmlsbGVkID0gZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgIHZhciB2YWx1ZXMgPSB0aGlzLl92YWx1ZXM7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgdmFyIHByZXNlcnZlZFZhbHVlcyA9IHRoaXMuX3ByZXNlcnZlZFZhbHVlcztcbiAgICB2YXIgbGltaXQgPSB0aGlzLl9saW1pdDtcblxuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgaW5kZXggPSAoaW5kZXggKiAtMSkgLSAxO1xuICAgICAgICB2YWx1ZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgIGlmIChsaW1pdCA+PSAxKSB7XG4gICAgICAgICAgICB0aGlzLl9pbkZsaWdodC0tO1xuICAgICAgICAgICAgdGhpcy5fZHJhaW5RdWV1ZSgpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzUmVzb2x2ZWQoKSkgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobGltaXQgPj0gMSAmJiB0aGlzLl9pbkZsaWdodCA+PSBsaW1pdCkge1xuICAgICAgICAgICAgdmFsdWVzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5fcXVldWUucHVzaChpbmRleCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZXNlcnZlZFZhbHVlcyAhPT0gbnVsbCkgcHJlc2VydmVkVmFsdWVzW2luZGV4XSA9IHZhbHVlO1xuXG4gICAgICAgIHZhciBwcm9taXNlID0gdGhpcy5fcHJvbWlzZTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gdGhpcy5fY2FsbGJhY2s7XG4gICAgICAgIHZhciByZWNlaXZlciA9IHByb21pc2UuX2JvdW5kVmFsdWUoKTtcbiAgICAgICAgcHJvbWlzZS5fcHVzaENvbnRleHQoKTtcbiAgICAgICAgdmFyIHJldCA9IHRyeUNhdGNoKGNhbGxiYWNrKS5jYWxsKHJlY2VpdmVyLCB2YWx1ZSwgaW5kZXgsIGxlbmd0aCk7XG4gICAgICAgIHZhciBwcm9taXNlQ3JlYXRlZCA9IHByb21pc2UuX3BvcENvbnRleHQoKTtcbiAgICAgICAgZGVidWcuY2hlY2tGb3Jnb3R0ZW5SZXR1cm5zKFxuICAgICAgICAgICAgcmV0LFxuICAgICAgICAgICAgcHJvbWlzZUNyZWF0ZWQsXG4gICAgICAgICAgICBwcmVzZXJ2ZWRWYWx1ZXMgIT09IG51bGwgPyBcIlByb21pc2UuZmlsdGVyXCIgOiBcIlByb21pc2UubWFwXCIsXG4gICAgICAgICAgICBwcm9taXNlXG4gICAgICAgICk7XG4gICAgICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWplY3QocmV0LmUpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShyZXQsIHRoaXMuX3Byb21pc2UpO1xuICAgICAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgbWF5YmVQcm9taXNlID0gbWF5YmVQcm9taXNlLl90YXJnZXQoKTtcbiAgICAgICAgICAgIHZhciBiaXRGaWVsZCA9IG1heWJlUHJvbWlzZS5fYml0RmllbGQ7XG4gICAgICAgICAgICA7XG4gICAgICAgICAgICBpZiAoKChiaXRGaWVsZCAmIDUwMzk3MTg0KSA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgICBpZiAobGltaXQgPj0gMSkgdGhpcy5faW5GbGlnaHQrKztcbiAgICAgICAgICAgICAgICB2YWx1ZXNbaW5kZXhdID0gbWF5YmVQcm9taXNlO1xuICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZS5fcHJveHkodGhpcywgKGluZGV4ICsgMSkgKiAtMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgoKGJpdEZpZWxkICYgMzM1NTQ0MzIpICE9PSAwKSkge1xuICAgICAgICAgICAgICAgIHJldCA9IG1heWJlUHJvbWlzZS5fdmFsdWUoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoKChiaXRGaWVsZCAmIDE2Nzc3MjE2KSAhPT0gMCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWplY3QobWF5YmVQcm9taXNlLl9yZWFzb24oKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhbmNlbCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhbHVlc1tpbmRleF0gPSByZXQ7XG4gICAgfVxuICAgIHZhciB0b3RhbFJlc29sdmVkID0gKyt0aGlzLl90b3RhbFJlc29sdmVkO1xuICAgIGlmICh0b3RhbFJlc29sdmVkID49IGxlbmd0aCkge1xuICAgICAgICBpZiAocHJlc2VydmVkVmFsdWVzICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9maWx0ZXIodmFsdWVzLCBwcmVzZXJ2ZWRWYWx1ZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSh2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG5NYXBwaW5nUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fZHJhaW5RdWV1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcXVldWUgPSB0aGlzLl9xdWV1ZTtcbiAgICB2YXIgbGltaXQgPSB0aGlzLl9saW1pdDtcbiAgICB2YXIgdmFsdWVzID0gdGhpcy5fdmFsdWVzO1xuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGggPiAwICYmIHRoaXMuX2luRmxpZ2h0IDwgbGltaXQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzUmVzb2x2ZWQoKSkgcmV0dXJuO1xuICAgICAgICB2YXIgaW5kZXggPSBxdWV1ZS5wb3AoKTtcbiAgICAgICAgdGhpcy5fcHJvbWlzZUZ1bGZpbGxlZCh2YWx1ZXNbaW5kZXhdLCBpbmRleCk7XG4gICAgfVxufTtcblxuTWFwcGluZ1Byb21pc2VBcnJheS5wcm90b3R5cGUuX2ZpbHRlciA9IGZ1bmN0aW9uIChib29sZWFucywgdmFsdWVzKSB7XG4gICAgdmFyIGxlbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgdmFyIHJldCA9IG5ldyBBcnJheShsZW4pO1xuICAgIHZhciBqID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIGlmIChib29sZWFuc1tpXSkgcmV0W2orK10gPSB2YWx1ZXNbaV07XG4gICAgfVxuICAgIHJldC5sZW5ndGggPSBqO1xuICAgIHRoaXMuX3Jlc29sdmUocmV0KTtcbn07XG5cbk1hcHBpbmdQcm9taXNlQXJyYXkucHJvdG90eXBlLnByZXNlcnZlZFZhbHVlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fcHJlc2VydmVkVmFsdWVzO1xufTtcblxuZnVuY3Rpb24gbWFwKHByb21pc2VzLCBmbiwgb3B0aW9ucywgX2ZpbHRlcikge1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gYXBpUmVqZWN0aW9uKFwiZXhwZWN0aW5nIGEgZnVuY3Rpb24gYnV0IGdvdCBcIiArIHV0aWwuY2xhc3NTdHJpbmcoZm4pKTtcbiAgICB9XG5cbiAgICB2YXIgbGltaXQgPSAwO1xuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcIm9iamVjdFwiICYmIG9wdGlvbnMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5jb25jdXJyZW5jeSAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgICAgICAgICAgICAgbmV3IFR5cGVFcnJvcihcIidjb25jdXJyZW5jeScgbXVzdCBiZSBhIG51bWJlciBidXQgaXQgaXMgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXRpbC5jbGFzc1N0cmluZyhvcHRpb25zLmNvbmN1cnJlbmN5KSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGltaXQgPSBvcHRpb25zLmNvbmN1cnJlbmN5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvcHRpb25zIGFyZ3VtZW50IG11c3QgYmUgYW4gb2JqZWN0IGJ1dCBpdCBpcyBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV0aWwuY2xhc3NTdHJpbmcob3B0aW9ucykpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsaW1pdCA9IHR5cGVvZiBsaW1pdCA9PT0gXCJudW1iZXJcIiAmJlxuICAgICAgICBpc0Zpbml0ZShsaW1pdCkgJiYgbGltaXQgPj0gMSA/IGxpbWl0IDogMDtcbiAgICByZXR1cm4gbmV3IE1hcHBpbmdQcm9taXNlQXJyYXkocHJvbWlzZXMsIGZuLCBsaW1pdCwgX2ZpbHRlcikucHJvbWlzZSgpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoZm4sIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbWFwKHRoaXMsIGZuLCBvcHRpb25zLCBudWxsKTtcbn07XG5cblByb21pc2UubWFwID0gZnVuY3Rpb24gKHByb21pc2VzLCBmbiwgb3B0aW9ucywgX2ZpbHRlcikge1xuICAgIHJldHVybiBtYXAocHJvbWlzZXMsIGZuLCBvcHRpb25zLCBfZmlsdGVyKTtcbn07XG5cblxufTtcblxufSx7XCIuL3V0aWxcIjozNn1dLDE5OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPVxuZnVuY3Rpb24oUHJvbWlzZSwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UsIGFwaVJlamVjdGlvbiwgZGVidWcpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnZhciB0cnlDYXRjaCA9IHV0aWwudHJ5Q2F0Y2g7XG5cblByb21pc2UubWV0aG9kID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBQcm9taXNlLlR5cGVFcnJvcihcImV4cGVjdGluZyBhIGZ1bmN0aW9uIGJ1dCBnb3QgXCIgKyB1dGlsLmNsYXNzU3RyaW5nKGZuKSk7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgICAgIHJldC5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICAgICAgcmV0Ll9wdXNoQ29udGV4dCgpO1xuICAgICAgICB2YXIgdmFsdWUgPSB0cnlDYXRjaChmbikuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIHByb21pc2VDcmVhdGVkID0gcmV0Ll9wb3BDb250ZXh0KCk7XG4gICAgICAgIGRlYnVnLmNoZWNrRm9yZ290dGVuUmV0dXJucyhcbiAgICAgICAgICAgIHZhbHVlLCBwcm9taXNlQ3JlYXRlZCwgXCJQcm9taXNlLm1ldGhvZFwiLCByZXQpO1xuICAgICAgICByZXQuX3Jlc29sdmVGcm9tU3luY1ZhbHVlKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5hdHRlbXB0ID0gUHJvbWlzZVtcInRyeVwiXSA9IGZ1bmN0aW9uIChmbikge1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gYXBpUmVqZWN0aW9uKFwiZXhwZWN0aW5nIGEgZnVuY3Rpb24gYnV0IGdvdCBcIiArIHV0aWwuY2xhc3NTdHJpbmcoZm4pKTtcbiAgICB9XG4gICAgdmFyIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICByZXQuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgcmV0Ll9wdXNoQ29udGV4dCgpO1xuICAgIHZhciB2YWx1ZTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZGVidWcuZGVwcmVjYXRlZChcImNhbGxpbmcgUHJvbWlzZS50cnkgd2l0aCBtb3JlIHRoYW4gMSBhcmd1bWVudFwiKTtcbiAgICAgICAgdmFyIGFyZyA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgdmFyIGN0eCA9IGFyZ3VtZW50c1syXTtcbiAgICAgICAgdmFsdWUgPSB1dGlsLmlzQXJyYXkoYXJnKSA/IHRyeUNhdGNoKGZuKS5hcHBseShjdHgsIGFyZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHRyeUNhdGNoKGZuKS5jYWxsKGN0eCwgYXJnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IHRyeUNhdGNoKGZuKSgpO1xuICAgIH1cbiAgICB2YXIgcHJvbWlzZUNyZWF0ZWQgPSByZXQuX3BvcENvbnRleHQoKTtcbiAgICBkZWJ1Zy5jaGVja0ZvcmdvdHRlblJldHVybnMoXG4gICAgICAgIHZhbHVlLCBwcm9taXNlQ3JlYXRlZCwgXCJQcm9taXNlLnRyeVwiLCByZXQpO1xuICAgIHJldC5fcmVzb2x2ZUZyb21TeW5jVmFsdWUodmFsdWUpO1xuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVzb2x2ZUZyb21TeW5jVmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHV0aWwuZXJyb3JPYmopIHtcbiAgICAgICAgdGhpcy5fcmVqZWN0Q2FsbGJhY2sodmFsdWUuZSwgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmVDYWxsYmFjayh2YWx1ZSwgdHJ1ZSk7XG4gICAgfVxufTtcbn07XG5cbn0se1wiLi91dGlsXCI6MzZ9XSwyMDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnZhciBtYXliZVdyYXBBc0Vycm9yID0gdXRpbC5tYXliZVdyYXBBc0Vycm9yO1xudmFyIGVycm9ycyA9IF9kZXJlcV8oXCIuL2Vycm9yc1wiKTtcbnZhciBPcGVyYXRpb25hbEVycm9yID0gZXJyb3JzLk9wZXJhdGlvbmFsRXJyb3I7XG52YXIgZXM1ID0gX2RlcmVxXyhcIi4vZXM1XCIpO1xuXG5mdW5jdGlvbiBpc1VudHlwZWRFcnJvcihvYmopIHtcbiAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRXJyb3IgJiZcbiAgICAgICAgZXM1LmdldFByb3RvdHlwZU9mKG9iaikgPT09IEVycm9yLnByb3RvdHlwZTtcbn1cblxudmFyIHJFcnJvcktleSA9IC9eKD86bmFtZXxtZXNzYWdlfHN0YWNrfGNhdXNlKSQvO1xuZnVuY3Rpb24gd3JhcEFzT3BlcmF0aW9uYWxFcnJvcihvYmopIHtcbiAgICB2YXIgcmV0O1xuICAgIGlmIChpc1VudHlwZWRFcnJvcihvYmopKSB7XG4gICAgICAgIHJldCA9IG5ldyBPcGVyYXRpb25hbEVycm9yKG9iaik7XG4gICAgICAgIHJldC5uYW1lID0gb2JqLm5hbWU7XG4gICAgICAgIHJldC5tZXNzYWdlID0gb2JqLm1lc3NhZ2U7XG4gICAgICAgIHJldC5zdGFjayA9IG9iai5zdGFjaztcbiAgICAgICAgdmFyIGtleXMgPSBlczUua2V5cyhvYmopO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICAgICAgaWYgKCFyRXJyb3JLZXkudGVzdChrZXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0W2tleV0gPSBvYmpba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICB1dGlsLm1hcmtBc09yaWdpbmF0aW5nRnJvbVJlamVjdGlvbihvYmopO1xuICAgIHJldHVybiBvYmo7XG59XG5cbmZ1bmN0aW9uIG5vZGViYWNrRm9yUHJvbWlzZShwcm9taXNlLCBtdWx0aUFyZ3MpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXJyLCB2YWx1ZSkge1xuICAgICAgICBpZiAocHJvbWlzZSA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB2YXIgd3JhcHBlZCA9IHdyYXBBc09wZXJhdGlvbmFsRXJyb3IobWF5YmVXcmFwQXNFcnJvcihlcnIpKTtcbiAgICAgICAgICAgIHByb21pc2UuX2F0dGFjaEV4dHJhVHJhY2Uod3JhcHBlZCk7XG4gICAgICAgICAgICBwcm9taXNlLl9yZWplY3Qod3JhcHBlZCk7XG4gICAgICAgIH0gZWxzZSBpZiAoIW11bHRpQXJncykge1xuICAgICAgICAgICAgcHJvbWlzZS5fZnVsZmlsbCh2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTs7XG4gICAgICAgICAgICBwcm9taXNlLl9mdWxmaWxsKGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbm9kZWJhY2tGb3JQcm9taXNlO1xuXG59LHtcIi4vZXJyb3JzXCI6MTIsXCIuL2VzNVwiOjEzLFwiLi91dGlsXCI6MzZ9XSwyMTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSkge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsXCIpO1xudmFyIGFzeW5jID0gUHJvbWlzZS5fYXN5bmM7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcblxuZnVuY3Rpb24gc3ByZWFkQWRhcHRlcih2YWwsIG5vZGViYWNrKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzO1xuICAgIGlmICghdXRpbC5pc0FycmF5KHZhbCkpIHJldHVybiBzdWNjZXNzQWRhcHRlci5jYWxsKHByb21pc2UsIHZhbCwgbm9kZWJhY2spO1xuICAgIHZhciByZXQgPVxuICAgICAgICB0cnlDYXRjaChub2RlYmFjaykuYXBwbHkocHJvbWlzZS5fYm91bmRWYWx1ZSgpLCBbbnVsbF0uY29uY2F0KHZhbCkpO1xuICAgIGlmIChyZXQgPT09IGVycm9yT2JqKSB7XG4gICAgICAgIGFzeW5jLnRocm93TGF0ZXIocmV0LmUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc3VjY2Vzc0FkYXB0ZXIodmFsLCBub2RlYmFjaykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcztcbiAgICB2YXIgcmVjZWl2ZXIgPSBwcm9taXNlLl9ib3VuZFZhbHVlKCk7XG4gICAgdmFyIHJldCA9IHZhbCA9PT0gdW5kZWZpbmVkXG4gICAgICAgID8gdHJ5Q2F0Y2gobm9kZWJhY2spLmNhbGwocmVjZWl2ZXIsIG51bGwpXG4gICAgICAgIDogdHJ5Q2F0Y2gobm9kZWJhY2spLmNhbGwocmVjZWl2ZXIsIG51bGwsIHZhbCk7XG4gICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgYXN5bmMudGhyb3dMYXRlcihyZXQuZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gZXJyb3JBZGFwdGVyKHJlYXNvbiwgbm9kZWJhY2spIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgaWYgKCFyZWFzb24pIHtcbiAgICAgICAgdmFyIG5ld1JlYXNvbiA9IG5ldyBFcnJvcihyZWFzb24gKyBcIlwiKTtcbiAgICAgICAgbmV3UmVhc29uLmNhdXNlID0gcmVhc29uO1xuICAgICAgICByZWFzb24gPSBuZXdSZWFzb247XG4gICAgfVxuICAgIHZhciByZXQgPSB0cnlDYXRjaChub2RlYmFjaykuY2FsbChwcm9taXNlLl9ib3VuZFZhbHVlKCksIHJlYXNvbik7XG4gICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgYXN5bmMudGhyb3dMYXRlcihyZXQuZSk7XG4gICAgfVxufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hc0NhbGxiYWNrID0gUHJvbWlzZS5wcm90b3R5cGUubm9kZWlmeSA9IGZ1bmN0aW9uIChub2RlYmFjayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIG5vZGViYWNrID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB2YXIgYWRhcHRlciA9IHN1Y2Nlc3NBZGFwdGVyO1xuICAgICAgICBpZiAob3B0aW9ucyAhPT0gdW5kZWZpbmVkICYmIE9iamVjdChvcHRpb25zKS5zcHJlYWQpIHtcbiAgICAgICAgICAgIGFkYXB0ZXIgPSBzcHJlYWRBZGFwdGVyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3RoZW4oXG4gICAgICAgICAgICBhZGFwdGVyLFxuICAgICAgICAgICAgZXJyb3JBZGFwdGVyLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIG5vZGViYWNrXG4gICAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbn07XG5cbn0se1wiLi91dGlsXCI6MzZ9XSwyMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG52YXIgbWFrZVNlbGZSZXNvbHV0aW9uRXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoXCJjaXJjdWxhciBwcm9taXNlIHJlc29sdXRpb24gY2hhaW5cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9NcXJGbVhcXHUwMDBhXCIpO1xufTtcbnZhciByZWZsZWN0SGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZS5Qcm9taXNlSW5zcGVjdGlvbih0aGlzLl90YXJnZXQoKSk7XG59O1xudmFyIGFwaVJlamVjdGlvbiA9IGZ1bmN0aW9uKG1zZykge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKG1zZykpO1xufTtcbmZ1bmN0aW9uIFByb3h5YWJsZSgpIHt9XG52YXIgVU5ERUZJTkVEX0JJTkRJTkcgPSB7fTtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnV0aWwuc2V0UmVmbGVjdEhhbmRsZXIocmVmbGVjdEhhbmRsZXIpO1xuXG52YXIgZ2V0RG9tYWluID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRvbWFpbiA9IHByb2Nlc3MuZG9tYWluO1xuICAgIGlmIChkb21haW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGRvbWFpbjtcbn07XG52YXIgZ2V0Q29udGV4dERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbnVsbDtcbn07XG52YXIgZ2V0Q29udGV4dERvbWFpbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGRvbWFpbjogZ2V0RG9tYWluKCksXG4gICAgICAgIGFzeW5jOiBudWxsXG4gICAgfTtcbn07XG52YXIgQXN5bmNSZXNvdXJjZSA9IHV0aWwuaXNOb2RlICYmIHV0aWwubm9kZVN1cHBvcnRzQXN5bmNSZXNvdXJjZSA/XG4gICAgX2RlcmVxXyhcImFzeW5jX2hvb2tzXCIpLkFzeW5jUmVzb3VyY2UgOiBudWxsO1xudmFyIGdldENvbnRleHRBc3luY0hvb2tzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZG9tYWluOiBnZXREb21haW4oKSxcbiAgICAgICAgYXN5bmM6IG5ldyBBc3luY1Jlc291cmNlKFwiQmx1ZWJpcmQ6OlByb21pc2VcIilcbiAgICB9O1xufTtcbnZhciBnZXRDb250ZXh0ID0gdXRpbC5pc05vZGUgPyBnZXRDb250ZXh0RG9tYWluIDogZ2V0Q29udGV4dERlZmF1bHQ7XG51dGlsLm5vdEVudW1lcmFibGVQcm9wKFByb21pc2UsIFwiX2dldENvbnRleHRcIiwgZ2V0Q29udGV4dCk7XG52YXIgZW5hYmxlQXN5bmNIb29rcyA9IGZ1bmN0aW9uKCkge1xuICAgIGdldENvbnRleHQgPSBnZXRDb250ZXh0QXN5bmNIb29rcztcbiAgICB1dGlsLm5vdEVudW1lcmFibGVQcm9wKFByb21pc2UsIFwiX2dldENvbnRleHRcIiwgZ2V0Q29udGV4dEFzeW5jSG9va3MpO1xufTtcbnZhciBkaXNhYmxlQXN5bmNIb29rcyA9IGZ1bmN0aW9uKCkge1xuICAgIGdldENvbnRleHQgPSBnZXRDb250ZXh0RG9tYWluO1xuICAgIHV0aWwubm90RW51bWVyYWJsZVByb3AoUHJvbWlzZSwgXCJfZ2V0Q29udGV4dFwiLCBnZXRDb250ZXh0RG9tYWluKTtcbn07XG5cbnZhciBlczUgPSBfZGVyZXFfKFwiLi9lczVcIik7XG52YXIgQXN5bmMgPSBfZGVyZXFfKFwiLi9hc3luY1wiKTtcbnZhciBhc3luYyA9IG5ldyBBc3luYygpO1xuZXM1LmRlZmluZVByb3BlcnR5KFByb21pc2UsIFwiX2FzeW5jXCIsIHt2YWx1ZTogYXN5bmN9KTtcbnZhciBlcnJvcnMgPSBfZGVyZXFfKFwiLi9lcnJvcnNcIik7XG52YXIgVHlwZUVycm9yID0gUHJvbWlzZS5UeXBlRXJyb3IgPSBlcnJvcnMuVHlwZUVycm9yO1xuUHJvbWlzZS5SYW5nZUVycm9yID0gZXJyb3JzLlJhbmdlRXJyb3I7XG52YXIgQ2FuY2VsbGF0aW9uRXJyb3IgPSBQcm9taXNlLkNhbmNlbGxhdGlvbkVycm9yID0gZXJyb3JzLkNhbmNlbGxhdGlvbkVycm9yO1xuUHJvbWlzZS5UaW1lb3V0RXJyb3IgPSBlcnJvcnMuVGltZW91dEVycm9yO1xuUHJvbWlzZS5PcGVyYXRpb25hbEVycm9yID0gZXJyb3JzLk9wZXJhdGlvbmFsRXJyb3I7XG5Qcm9taXNlLlJlamVjdGlvbkVycm9yID0gZXJyb3JzLk9wZXJhdGlvbmFsRXJyb3I7XG5Qcm9taXNlLkFnZ3JlZ2F0ZUVycm9yID0gZXJyb3JzLkFnZ3JlZ2F0ZUVycm9yO1xudmFyIElOVEVSTkFMID0gZnVuY3Rpb24oKXt9O1xudmFyIEFQUExZID0ge307XG52YXIgTkVYVF9GSUxURVIgPSB7fTtcbnZhciB0cnlDb252ZXJ0VG9Qcm9taXNlID0gX2RlcmVxXyhcIi4vdGhlbmFibGVzXCIpKFByb21pc2UsIElOVEVSTkFMKTtcbnZhciBQcm9taXNlQXJyYXkgPVxuICAgIF9kZXJlcV8oXCIuL3Byb21pc2VfYXJyYXlcIikoUHJvbWlzZSwgSU5URVJOQUwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5Q29udmVydFRvUHJvbWlzZSwgYXBpUmVqZWN0aW9uLCBQcm94eWFibGUpO1xudmFyIENvbnRleHQgPSBfZGVyZXFfKFwiLi9jb250ZXh0XCIpKFByb21pc2UpO1xuIC8qanNoaW50IHVudXNlZDpmYWxzZSovXG52YXIgY3JlYXRlQ29udGV4dCA9IENvbnRleHQuY3JlYXRlO1xuXG52YXIgZGVidWcgPSBfZGVyZXFfKFwiLi9kZWJ1Z2dhYmlsaXR5XCIpKFByb21pc2UsIENvbnRleHQsXG4gICAgZW5hYmxlQXN5bmNIb29rcywgZGlzYWJsZUFzeW5jSG9va3MpO1xudmFyIENhcHR1cmVkVHJhY2UgPSBkZWJ1Zy5DYXB0dXJlZFRyYWNlO1xudmFyIFBhc3NUaHJvdWdoSGFuZGxlckNvbnRleHQgPVxuICAgIF9kZXJlcV8oXCIuL2ZpbmFsbHlcIikoUHJvbWlzZSwgdHJ5Q29udmVydFRvUHJvbWlzZSwgTkVYVF9GSUxURVIpO1xudmFyIGNhdGNoRmlsdGVyID0gX2RlcmVxXyhcIi4vY2F0Y2hfZmlsdGVyXCIpKE5FWFRfRklMVEVSKTtcbnZhciBub2RlYmFja0ZvclByb21pc2UgPSBfZGVyZXFfKFwiLi9ub2RlYmFja1wiKTtcbnZhciBlcnJvck9iaiA9IHV0aWwuZXJyb3JPYmo7XG52YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xuZnVuY3Rpb24gY2hlY2soc2VsZiwgZXhlY3V0b3IpIHtcbiAgICBpZiAoc2VsZiA9PSBudWxsIHx8IHNlbGYuY29uc3RydWN0b3IgIT09IFByb21pc2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInRoZSBwcm9taXNlIGNvbnN0cnVjdG9yIGNhbm5vdCBiZSBpbnZva2VkIGRpcmVjdGx5XFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvTXFyRm1YXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBleGVjdXRvciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJleHBlY3RpbmcgYSBmdW5jdGlvbiBidXQgZ290IFwiICsgdXRpbC5jbGFzc1N0cmluZyhleGVjdXRvcikpO1xuICAgIH1cblxufVxuXG5mdW5jdGlvbiBQcm9taXNlKGV4ZWN1dG9yKSB7XG4gICAgaWYgKGV4ZWN1dG9yICE9PSBJTlRFUk5BTCkge1xuICAgICAgICBjaGVjayh0aGlzLCBleGVjdXRvcik7XG4gICAgfVxuICAgIHRoaXMuX2JpdEZpZWxkID0gMDtcbiAgICB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXIwID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3JlamVjdGlvbkhhbmRsZXIwID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3Byb21pc2UwID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3JlY2VpdmVyMCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9yZXNvbHZlRnJvbUV4ZWN1dG9yKGV4ZWN1dG9yKTtcbiAgICB0aGlzLl9wcm9taXNlQ3JlYXRlZCgpO1xuICAgIHRoaXMuX2ZpcmVFdmVudChcInByb21pc2VDcmVhdGVkXCIsIHRoaXMpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gXCJbb2JqZWN0IFByb21pc2VdXCI7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5jYXVnaHQgPSBQcm9taXNlLnByb3RvdHlwZVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKGxlbiA+IDEpIHtcbiAgICAgICAgdmFyIGNhdGNoSW5zdGFuY2VzID0gbmV3IEFycmF5KGxlbiAtIDEpLFxuICAgICAgICAgICAgaiA9IDAsIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW4gLSAxOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKHV0aWwuaXNPYmplY3QoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICBjYXRjaEluc3RhbmNlc1tqKytdID0gaXRlbTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFwaVJlamVjdGlvbihcIkNhdGNoIHN0YXRlbWVudCBwcmVkaWNhdGU6IFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJleHBlY3RpbmcgYW4gb2JqZWN0IGJ1dCBnb3QgXCIgKyB1dGlsLmNsYXNzU3RyaW5nKGl0ZW0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaEluc3RhbmNlcy5sZW5ndGggPSBqO1xuICAgICAgICBmbiA9IGFyZ3VtZW50c1tpXTtcblxuICAgICAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJUaGUgbGFzdCBhcmd1bWVudCB0byAuY2F0Y2goKSBcIiArXG4gICAgICAgICAgICAgICAgXCJtdXN0IGJlIGEgZnVuY3Rpb24sIGdvdCBcIiArIHV0aWwudG9TdHJpbmcoZm4pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy50aGVuKHVuZGVmaW5lZCwgY2F0Y2hGaWx0ZXIoY2F0Y2hJbnN0YW5jZXMsIGZuLCB0aGlzKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnRoZW4odW5kZWZpbmVkLCBmbik7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5yZWZsZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl90aGVuKHJlZmxlY3RIYW5kbGVyLFxuICAgICAgICByZWZsZWN0SGFuZGxlciwgdW5kZWZpbmVkLCB0aGlzLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChkaWRGdWxmaWxsLCBkaWRSZWplY3QpIHtcbiAgICBpZiAoZGVidWcud2FybmluZ3MoKSAmJiBhcmd1bWVudHMubGVuZ3RoID4gMCAmJlxuICAgICAgICB0eXBlb2YgZGlkRnVsZmlsbCAhPT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgIHR5cGVvZiBkaWRSZWplY3QgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB2YXIgbXNnID0gXCIudGhlbigpIG9ubHkgYWNjZXB0cyBmdW5jdGlvbnMgYnV0IHdhcyBwYXNzZWQ6IFwiICtcbiAgICAgICAgICAgICAgICB1dGlsLmNsYXNzU3RyaW5nKGRpZEZ1bGZpbGwpO1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIG1zZyArPSBcIiwgXCIgKyB1dGlsLmNsYXNzU3RyaW5nKGRpZFJlamVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fd2Fybihtc2cpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fdGhlbihkaWRGdWxmaWxsLCBkaWRSZWplY3QsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uIChkaWRGdWxmaWxsLCBkaWRSZWplY3QpIHtcbiAgICB2YXIgcHJvbWlzZSA9XG4gICAgICAgIHRoaXMuX3RoZW4oZGlkRnVsZmlsbCwgZGlkUmVqZWN0LCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbiAgICBwcm9taXNlLl9zZXRJc0ZpbmFsKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zcHJlYWQgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGFwaVJlamVjdGlvbihcImV4cGVjdGluZyBhIGZ1bmN0aW9uIGJ1dCBnb3QgXCIgKyB1dGlsLmNsYXNzU3RyaW5nKGZuKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFsbCgpLl90aGVuKGZuLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgQVBQTFksIHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJldCA9IHtcbiAgICAgICAgaXNGdWxmaWxsZWQ6IGZhbHNlLFxuICAgICAgICBpc1JlamVjdGVkOiBmYWxzZSxcbiAgICAgICAgZnVsZmlsbG1lbnRWYWx1ZTogdW5kZWZpbmVkLFxuICAgICAgICByZWplY3Rpb25SZWFzb246IHVuZGVmaW5lZFxuICAgIH07XG4gICAgaWYgKHRoaXMuaXNGdWxmaWxsZWQoKSkge1xuICAgICAgICByZXQuZnVsZmlsbG1lbnRWYWx1ZSA9IHRoaXMudmFsdWUoKTtcbiAgICAgICAgcmV0LmlzRnVsZmlsbGVkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaXNSZWplY3RlZCgpKSB7XG4gICAgICAgIHJldC5yZWplY3Rpb25SZWFzb24gPSB0aGlzLnJlYXNvbigpO1xuICAgICAgICByZXQuaXNSZWplY3RlZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuX3dhcm4oXCIuYWxsKCkgd2FzIHBhc3NlZCBhcmd1bWVudHMgYnV0IGl0IGRvZXMgbm90IHRha2UgYW55XCIpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFByb21pc2VBcnJheSh0aGlzKS5wcm9taXNlKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiB0aGlzLmNhdWdodCh1dGlsLm9yaWdpbmF0ZXNGcm9tUmVqZWN0aW9uLCBmbik7XG59O1xuXG5Qcm9taXNlLmdldE5ld0xpYnJhcnlDb3B5ID0gbW9kdWxlLmV4cG9ydHM7XG5cblByb21pc2UuaXMgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgcmV0dXJuIHZhbCBpbnN0YW5jZW9mIFByb21pc2U7XG59O1xuXG5Qcm9taXNlLmZyb21Ob2RlID0gUHJvbWlzZS5mcm9tQ2FsbGJhY2sgPSBmdW5jdGlvbihmbikge1xuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgcmV0Ll9jYXB0dXJlU3RhY2tUcmFjZSgpO1xuICAgIHZhciBtdWx0aUFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/ICEhT2JqZWN0KGFyZ3VtZW50c1sxXSkubXVsdGlBcmdzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogZmFsc2U7XG4gICAgdmFyIHJlc3VsdCA9IHRyeUNhdGNoKGZuKShub2RlYmFja0ZvclByb21pc2UocmV0LCBtdWx0aUFyZ3MpKTtcbiAgICBpZiAocmVzdWx0ID09PSBlcnJvck9iaikge1xuICAgICAgICByZXQuX3JlamVjdENhbGxiYWNrKHJlc3VsdC5lLCB0cnVlKTtcbiAgICB9XG4gICAgaWYgKCFyZXQuX2lzRmF0ZVNlYWxlZCgpKSByZXQuX3NldEFzeW5jR3VhcmFudGVlZCgpO1xuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLmFsbCA9IGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZUFycmF5KHByb21pc2VzKS5wcm9taXNlKCk7XG59O1xuXG5Qcm9taXNlLmNhc3QgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHJldCA9IHRyeUNvbnZlcnRUb1Byb21pc2Uob2JqKTtcbiAgICBpZiAoIShyZXQgaW5zdGFuY2VvZiBQcm9taXNlKSkge1xuICAgICAgICByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgICAgIHJldC5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICAgICAgcmV0Ll9zZXRGdWxmaWxsZWQoKTtcbiAgICAgICAgcmV0Ll9yZWplY3Rpb25IYW5kbGVyMCA9IG9iajtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UucmVzb2x2ZSA9IFByb21pc2UuZnVsZmlsbGVkID0gUHJvbWlzZS5jYXN0O1xuXG5Qcm9taXNlLnJlamVjdCA9IFByb21pc2UucmVqZWN0ZWQgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgdmFyIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICByZXQuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgcmV0Ll9yZWplY3RDYWxsYmFjayhyZWFzb24sIHRydWUpO1xuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnNldFNjaGVkdWxlciA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJleHBlY3RpbmcgYSBmdW5jdGlvbiBidXQgZ290IFwiICsgdXRpbC5jbGFzc1N0cmluZyhmbikpO1xuICAgIH1cbiAgICByZXR1cm4gYXN5bmMuc2V0U2NoZWR1bGVyKGZuKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl90aGVuID0gZnVuY3Rpb24gKFxuICAgIGRpZEZ1bGZpbGwsXG4gICAgZGlkUmVqZWN0LFxuICAgIF8sICAgIHJlY2VpdmVyLFxuICAgIGludGVybmFsRGF0YVxuKSB7XG4gICAgdmFyIGhhdmVJbnRlcm5hbERhdGEgPSBpbnRlcm5hbERhdGEgIT09IHVuZGVmaW5lZDtcbiAgICB2YXIgcHJvbWlzZSA9IGhhdmVJbnRlcm5hbERhdGEgPyBpbnRlcm5hbERhdGEgOiBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgdmFyIHRhcmdldCA9IHRoaXMuX3RhcmdldCgpO1xuICAgIHZhciBiaXRGaWVsZCA9IHRhcmdldC5fYml0RmllbGQ7XG5cbiAgICBpZiAoIWhhdmVJbnRlcm5hbERhdGEpIHtcbiAgICAgICAgcHJvbWlzZS5fcHJvcGFnYXRlRnJvbSh0aGlzLCAzKTtcbiAgICAgICAgcHJvbWlzZS5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICAgICAgaWYgKHJlY2VpdmVyID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICgodGhpcy5fYml0RmllbGQgJiAyMDk3MTUyKSAhPT0gMCkpIHtcbiAgICAgICAgICAgIGlmICghKChiaXRGaWVsZCAmIDUwMzk3MTg0KSA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgICByZWNlaXZlciA9IHRoaXMuX2JvdW5kVmFsdWUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVjZWl2ZXIgPSB0YXJnZXQgPT09IHRoaXMgPyB1bmRlZmluZWQgOiB0aGlzLl9ib3VuZFRvO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2ZpcmVFdmVudChcInByb21pc2VDaGFpbmVkXCIsIHRoaXMsIHByb21pc2UpO1xuICAgIH1cblxuICAgIHZhciBjb250ZXh0ID0gZ2V0Q29udGV4dCgpO1xuICAgIGlmICghKChiaXRGaWVsZCAmIDUwMzk3MTg0KSA9PT0gMCkpIHtcbiAgICAgICAgdmFyIGhhbmRsZXIsIHZhbHVlLCBzZXR0bGVyID0gdGFyZ2V0Ll9zZXR0bGVQcm9taXNlQ3R4O1xuICAgICAgICBpZiAoKChiaXRGaWVsZCAmIDMzNTU0NDMyKSAhPT0gMCkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdGFyZ2V0Ll9yZWplY3Rpb25IYW5kbGVyMDtcbiAgICAgICAgICAgIGhhbmRsZXIgPSBkaWRGdWxmaWxsO1xuICAgICAgICB9IGVsc2UgaWYgKCgoYml0RmllbGQgJiAxNjc3NzIxNikgIT09IDApKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHRhcmdldC5fZnVsZmlsbG1lbnRIYW5kbGVyMDtcbiAgICAgICAgICAgIGhhbmRsZXIgPSBkaWRSZWplY3Q7XG4gICAgICAgICAgICB0YXJnZXQuX3Vuc2V0UmVqZWN0aW9uSXNVbmhhbmRsZWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldHRsZXIgPSB0YXJnZXQuX3NldHRsZVByb21pc2VMYXRlQ2FuY2VsbGF0aW9uT2JzZXJ2ZXI7XG4gICAgICAgICAgICB2YWx1ZSA9IG5ldyBDYW5jZWxsYXRpb25FcnJvcihcImxhdGUgY2FuY2VsbGF0aW9uIG9ic2VydmVyXCIpO1xuICAgICAgICAgICAgdGFyZ2V0Ll9hdHRhY2hFeHRyYVRyYWNlKHZhbHVlKTtcbiAgICAgICAgICAgIGhhbmRsZXIgPSBkaWRSZWplY3Q7XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYy5pbnZva2Uoc2V0dGxlciwgdGFyZ2V0LCB7XG4gICAgICAgICAgICBoYW5kbGVyOiB1dGlsLmNvbnRleHRCaW5kKGNvbnRleHQsIGhhbmRsZXIpLFxuICAgICAgICAgICAgcHJvbWlzZTogcHJvbWlzZSxcbiAgICAgICAgICAgIHJlY2VpdmVyOiByZWNlaXZlcixcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZVxuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXQuX2FkZENhbGxiYWNrcyhkaWRGdWxmaWxsLCBkaWRSZWplY3QsIHByb21pc2UsXG4gICAgICAgICAgICAgICAgcmVjZWl2ZXIsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2xlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fYml0RmllbGQgJiA2NTUzNTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9pc0ZhdGVTZWFsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDExNzUwNjA0OCkgIT09IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNGb2xsb3dpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDY3MTA4ODY0KSA9PT0gNjcxMDg4NjQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0TGVuZ3RoID0gZnVuY3Rpb24gKGxlbikge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gKHRoaXMuX2JpdEZpZWxkICYgLTY1NTM2KSB8XG4gICAgICAgIChsZW4gJiA2NTUzNSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0RnVsZmlsbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAzMzU1NDQzMjtcbiAgICB0aGlzLl9maXJlRXZlbnQoXCJwcm9taXNlRnVsZmlsbGVkXCIsIHRoaXMpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldFJlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAxNjc3NzIxNjtcbiAgICB0aGlzLl9maXJlRXZlbnQoXCJwcm9taXNlUmVqZWN0ZWRcIiwgdGhpcyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0Rm9sbG93aW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCA2NzEwODg2NDtcbiAgICB0aGlzLl9maXJlRXZlbnQoXCJwcm9taXNlUmVzb2x2ZWRcIiwgdGhpcyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0SXNGaW5hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkIHwgNDE5NDMwNDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9pc0ZpbmFsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiA0MTk0MzA0KSA+IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdW5zZXRDYW5jZWxsZWQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9iaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkICYgKH42NTUzNik7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0Q2FuY2VsbGVkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDY1NTM2O1xuICAgIHRoaXMuX2ZpcmVFdmVudChcInByb21pc2VDYW5jZWxsZWRcIiwgdGhpcyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0V2lsbEJlQ2FuY2VsbGVkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZCB8IDgzODg2MDg7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0QXN5bmNHdWFyYW50ZWVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKGFzeW5jLmhhc0N1c3RvbVNjaGVkdWxlcigpKSByZXR1cm47XG4gICAgdmFyIGJpdEZpZWxkID0gdGhpcy5fYml0RmllbGQ7XG4gICAgdGhpcy5fYml0RmllbGQgPSBiaXRGaWVsZCB8XG4gICAgICAgICgoKGJpdEZpZWxkICYgNTM2ODcwOTEyKSA+PiAyKSBeXG4gICAgICAgIDEzNDIxNzcyOCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0Tm9Bc3luY0d1YXJhbnRlZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX2JpdEZpZWxkID0gKHRoaXMuX2JpdEZpZWxkIHwgNTM2ODcwOTEyKSAmXG4gICAgICAgICh+MTM0MjE3NzI4KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZWNlaXZlckF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgdmFyIHJldCA9IGluZGV4ID09PSAwID8gdGhpcy5fcmVjZWl2ZXIwIDogdGhpc1tcbiAgICAgICAgICAgIGluZGV4ICogNCAtIDQgKyAzXTtcbiAgICBpZiAocmV0ID09PSBVTkRFRklORURfQklORElORykge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSBpZiAocmV0ID09PSB1bmRlZmluZWQgJiYgdGhpcy5faXNCb3VuZCgpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ib3VuZFZhbHVlKCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcHJvbWlzZUF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXNbXG4gICAgICAgICAgICBpbmRleCAqIDQgLSA0ICsgMl07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fZnVsZmlsbG1lbnRIYW5kbGVyQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpc1tcbiAgICAgICAgICAgIGluZGV4ICogNCAtIDQgKyAwXTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZWplY3Rpb25IYW5kbGVyQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpc1tcbiAgICAgICAgICAgIGluZGV4ICogNCAtIDQgKyAxXTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9ib3VuZFZhbHVlID0gZnVuY3Rpb24oKSB7fTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX21pZ3JhdGVDYWxsYmFjazAgPSBmdW5jdGlvbiAoZm9sbG93ZXIpIHtcbiAgICB2YXIgYml0RmllbGQgPSBmb2xsb3dlci5fYml0RmllbGQ7XG4gICAgdmFyIGZ1bGZpbGwgPSBmb2xsb3dlci5fZnVsZmlsbG1lbnRIYW5kbGVyMDtcbiAgICB2YXIgcmVqZWN0ID0gZm9sbG93ZXIuX3JlamVjdGlvbkhhbmRsZXIwO1xuICAgIHZhciBwcm9taXNlID0gZm9sbG93ZXIuX3Byb21pc2UwO1xuICAgIHZhciByZWNlaXZlciA9IGZvbGxvd2VyLl9yZWNlaXZlckF0KDApO1xuICAgIGlmIChyZWNlaXZlciA9PT0gdW5kZWZpbmVkKSByZWNlaXZlciA9IFVOREVGSU5FRF9CSU5ESU5HO1xuICAgIHRoaXMuX2FkZENhbGxiYWNrcyhmdWxmaWxsLCByZWplY3QsIHByb21pc2UsIHJlY2VpdmVyLCBudWxsKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9taWdyYXRlQ2FsbGJhY2tBdCA9IGZ1bmN0aW9uIChmb2xsb3dlciwgaW5kZXgpIHtcbiAgICB2YXIgZnVsZmlsbCA9IGZvbGxvd2VyLl9mdWxmaWxsbWVudEhhbmRsZXJBdChpbmRleCk7XG4gICAgdmFyIHJlamVjdCA9IGZvbGxvd2VyLl9yZWplY3Rpb25IYW5kbGVyQXQoaW5kZXgpO1xuICAgIHZhciBwcm9taXNlID0gZm9sbG93ZXIuX3Byb21pc2VBdChpbmRleCk7XG4gICAgdmFyIHJlY2VpdmVyID0gZm9sbG93ZXIuX3JlY2VpdmVyQXQoaW5kZXgpO1xuICAgIGlmIChyZWNlaXZlciA9PT0gdW5kZWZpbmVkKSByZWNlaXZlciA9IFVOREVGSU5FRF9CSU5ESU5HO1xuICAgIHRoaXMuX2FkZENhbGxiYWNrcyhmdWxmaWxsLCByZWplY3QsIHByb21pc2UsIHJlY2VpdmVyLCBudWxsKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9hZGRDYWxsYmFja3MgPSBmdW5jdGlvbiAoXG4gICAgZnVsZmlsbCxcbiAgICByZWplY3QsXG4gICAgcHJvbWlzZSxcbiAgICByZWNlaXZlcixcbiAgICBjb250ZXh0XG4pIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl9sZW5ndGgoKTtcblxuICAgIGlmIChpbmRleCA+PSA2NTUzNSAtIDQpIHtcbiAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICB0aGlzLl9zZXRMZW5ndGgoMCk7XG4gICAgfVxuXG4gICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgIHRoaXMuX3Byb21pc2UwID0gcHJvbWlzZTtcbiAgICAgICAgdGhpcy5fcmVjZWl2ZXIwID0gcmVjZWl2ZXI7XG4gICAgICAgIGlmICh0eXBlb2YgZnVsZmlsbCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXIwID0gdXRpbC5jb250ZXh0QmluZChjb250ZXh0LCBmdWxmaWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHJlamVjdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWplY3Rpb25IYW5kbGVyMCA9IHV0aWwuY29udGV4dEJpbmQoY29udGV4dCwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBiYXNlID0gaW5kZXggKiA0IC0gNDtcbiAgICAgICAgdGhpc1tiYXNlICsgMl0gPSBwcm9taXNlO1xuICAgICAgICB0aGlzW2Jhc2UgKyAzXSA9IHJlY2VpdmVyO1xuICAgICAgICBpZiAodHlwZW9mIGZ1bGZpbGwgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpc1tiYXNlICsgMF0gPVxuICAgICAgICAgICAgICAgIHV0aWwuY29udGV4dEJpbmQoY29udGV4dCwgZnVsZmlsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByZWplY3QgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpc1tiYXNlICsgMV0gPVxuICAgICAgICAgICAgICAgIHV0aWwuY29udGV4dEJpbmQoY29udGV4dCwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9zZXRMZW5ndGgoaW5kZXggKyAxKTtcbiAgICByZXR1cm4gaW5kZXg7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcHJveHkgPSBmdW5jdGlvbiAocHJveHlhYmxlLCBhcmcpIHtcbiAgICB0aGlzLl9hZGRDYWxsYmFja3ModW5kZWZpbmVkLCB1bmRlZmluZWQsIGFyZywgcHJveHlhYmxlLCBudWxsKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9yZXNvbHZlQ2FsbGJhY2sgPSBmdW5jdGlvbih2YWx1ZSwgc2hvdWxkQmluZCkge1xuICAgIGlmICgoKHRoaXMuX2JpdEZpZWxkICYgMTE3NTA2MDQ4KSAhPT0gMCkpIHJldHVybjtcbiAgICBpZiAodmFsdWUgPT09IHRoaXMpXG4gICAgICAgIHJldHVybiB0aGlzLl9yZWplY3RDYWxsYmFjayhtYWtlU2VsZlJlc29sdXRpb25FcnJvcigpLCBmYWxzZSk7XG4gICAgdmFyIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UodmFsdWUsIHRoaXMpO1xuICAgIGlmICghKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpKSByZXR1cm4gdGhpcy5fZnVsZmlsbCh2YWx1ZSk7XG5cbiAgICBpZiAoc2hvdWxkQmluZCkgdGhpcy5fcHJvcGFnYXRlRnJvbShtYXliZVByb21pc2UsIDIpO1xuXG5cbiAgICB2YXIgcHJvbWlzZSA9IG1heWJlUHJvbWlzZS5fdGFyZ2V0KCk7XG5cbiAgICBpZiAocHJvbWlzZSA9PT0gdGhpcykge1xuICAgICAgICB0aGlzLl9yZWplY3QobWFrZVNlbGZSZXNvbHV0aW9uRXJyb3IoKSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYml0RmllbGQgPSBwcm9taXNlLl9iaXRGaWVsZDtcbiAgICBpZiAoKChiaXRGaWVsZCAmIDUwMzk3MTg0KSA9PT0gMCkpIHtcbiAgICAgICAgdmFyIGxlbiA9IHRoaXMuX2xlbmd0aCgpO1xuICAgICAgICBpZiAobGVuID4gMCkgcHJvbWlzZS5fbWlncmF0ZUNhbGxiYWNrMCh0aGlzKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgcHJvbWlzZS5fbWlncmF0ZUNhbGxiYWNrQXQodGhpcywgaSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc2V0Rm9sbG93aW5nKCk7XG4gICAgICAgIHRoaXMuX3NldExlbmd0aCgwKTtcbiAgICAgICAgdGhpcy5fc2V0Rm9sbG93ZWUobWF5YmVQcm9taXNlKTtcbiAgICB9IGVsc2UgaWYgKCgoYml0RmllbGQgJiAzMzU1NDQzMikgIT09IDApKSB7XG4gICAgICAgIHRoaXMuX2Z1bGZpbGwocHJvbWlzZS5fdmFsdWUoKSk7XG4gICAgfSBlbHNlIGlmICgoKGJpdEZpZWxkICYgMTY3NzcyMTYpICE9PSAwKSkge1xuICAgICAgICB0aGlzLl9yZWplY3QocHJvbWlzZS5fcmVhc29uKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciByZWFzb24gPSBuZXcgQ2FuY2VsbGF0aW9uRXJyb3IoXCJsYXRlIGNhbmNlbGxhdGlvbiBvYnNlcnZlclwiKTtcbiAgICAgICAgcHJvbWlzZS5fYXR0YWNoRXh0cmFUcmFjZShyZWFzb24pO1xuICAgICAgICB0aGlzLl9yZWplY3QocmVhc29uKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVqZWN0Q2FsbGJhY2sgPVxuZnVuY3Rpb24ocmVhc29uLCBzeW5jaHJvbm91cywgaWdub3JlTm9uRXJyb3JXYXJuaW5ncykge1xuICAgIHZhciB0cmFjZSA9IHV0aWwuZW5zdXJlRXJyb3JPYmplY3QocmVhc29uKTtcbiAgICB2YXIgaGFzU3RhY2sgPSB0cmFjZSA9PT0gcmVhc29uO1xuICAgIGlmICghaGFzU3RhY2sgJiYgIWlnbm9yZU5vbkVycm9yV2FybmluZ3MgJiYgZGVidWcud2FybmluZ3MoKSkge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IFwiYSBwcm9taXNlIHdhcyByZWplY3RlZCB3aXRoIGEgbm9uLWVycm9yOiBcIiArXG4gICAgICAgICAgICB1dGlsLmNsYXNzU3RyaW5nKHJlYXNvbik7XG4gICAgICAgIHRoaXMuX3dhcm4obWVzc2FnZSwgdHJ1ZSk7XG4gICAgfVxuICAgIHRoaXMuX2F0dGFjaEV4dHJhVHJhY2UodHJhY2UsIHN5bmNocm9ub3VzID8gaGFzU3RhY2sgOiBmYWxzZSk7XG4gICAgdGhpcy5fcmVqZWN0KHJlYXNvbik7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVzb2x2ZUZyb21FeGVjdXRvciA9IGZ1bmN0aW9uIChleGVjdXRvcikge1xuICAgIGlmIChleGVjdXRvciA9PT0gSU5URVJOQUwpIHJldHVybjtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgdGhpcy5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICB0aGlzLl9wdXNoQ29udGV4dCgpO1xuICAgIHZhciBzeW5jaHJvbm91cyA9IHRydWU7XG4gICAgdmFyIHIgPSB0aGlzLl9leGVjdXRlKGV4ZWN1dG9yLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBwcm9taXNlLl9yZXNvbHZlQ2FsbGJhY2sodmFsdWUpO1xuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgcHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2socmVhc29uLCBzeW5jaHJvbm91cyk7XG4gICAgfSk7XG4gICAgc3luY2hyb25vdXMgPSBmYWxzZTtcbiAgICB0aGlzLl9wb3BDb250ZXh0KCk7XG5cbiAgICBpZiAociAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHByb21pc2UuX3JlamVjdENhbGxiYWNrKHIsIHRydWUpO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXR0bGVQcm9taXNlRnJvbUhhbmRsZXIgPSBmdW5jdGlvbiAoXG4gICAgaGFuZGxlciwgcmVjZWl2ZXIsIHZhbHVlLCBwcm9taXNlXG4pIHtcbiAgICB2YXIgYml0RmllbGQgPSBwcm9taXNlLl9iaXRGaWVsZDtcbiAgICBpZiAoKChiaXRGaWVsZCAmIDY1NTM2KSAhPT0gMCkpIHJldHVybjtcbiAgICBwcm9taXNlLl9wdXNoQ29udGV4dCgpO1xuICAgIHZhciB4O1xuICAgIGlmIChyZWNlaXZlciA9PT0gQVBQTFkpIHtcbiAgICAgICAgaWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUubGVuZ3RoICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICB4ID0gZXJyb3JPYmo7XG4gICAgICAgICAgICB4LmUgPSBuZXcgVHlwZUVycm9yKFwiY2Fubm90IC5zcHJlYWQoKSBhIG5vbi1hcnJheTogXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXRpbC5jbGFzc1N0cmluZyh2YWx1ZSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgeCA9IHRyeUNhdGNoKGhhbmRsZXIpLmFwcGx5KHRoaXMuX2JvdW5kVmFsdWUoKSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgeCA9IHRyeUNhdGNoKGhhbmRsZXIpLmNhbGwocmVjZWl2ZXIsIHZhbHVlKTtcbiAgICB9XG4gICAgdmFyIHByb21pc2VDcmVhdGVkID0gcHJvbWlzZS5fcG9wQ29udGV4dCgpO1xuICAgIGJpdEZpZWxkID0gcHJvbWlzZS5fYml0RmllbGQ7XG4gICAgaWYgKCgoYml0RmllbGQgJiA2NTUzNikgIT09IDApKSByZXR1cm47XG5cbiAgICBpZiAoeCA9PT0gTkVYVF9GSUxURVIpIHtcbiAgICAgICAgcHJvbWlzZS5fcmVqZWN0KHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHggPT09IGVycm9yT2JqKSB7XG4gICAgICAgIHByb21pc2UuX3JlamVjdENhbGxiYWNrKHguZSwgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGRlYnVnLmNoZWNrRm9yZ290dGVuUmV0dXJucyh4LCBwcm9taXNlQ3JlYXRlZCwgXCJcIiwgIHByb21pc2UsIHRoaXMpO1xuICAgICAgICBwcm9taXNlLl9yZXNvbHZlQ2FsbGJhY2soeCk7XG4gICAgfVxufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3RhcmdldCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXQgPSB0aGlzO1xuICAgIHdoaWxlIChyZXQuX2lzRm9sbG93aW5nKCkpIHJldCA9IHJldC5fZm9sbG93ZWUoKTtcbiAgICByZXR1cm4gcmV0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX2ZvbGxvd2VlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlamVjdGlvbkhhbmRsZXIwO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldEZvbGxvd2VlID0gZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgIHRoaXMuX3JlamVjdGlvbkhhbmRsZXIwID0gcHJvbWlzZTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXR0bGVQcm9taXNlID0gZnVuY3Rpb24ocHJvbWlzZSwgaGFuZGxlciwgcmVjZWl2ZXIsIHZhbHVlKSB7XG4gICAgdmFyIGlzUHJvbWlzZSA9IHByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlO1xuICAgIHZhciBiaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkO1xuICAgIHZhciBhc3luY0d1YXJhbnRlZWQgPSAoKGJpdEZpZWxkICYgMTM0MjE3NzI4KSAhPT0gMCk7XG4gICAgaWYgKCgoYml0RmllbGQgJiA2NTUzNikgIT09IDApKSB7XG4gICAgICAgIGlmIChpc1Byb21pc2UpIHByb21pc2UuX2ludm9rZUludGVybmFsT25DYW5jZWwoKTtcblxuICAgICAgICBpZiAocmVjZWl2ZXIgaW5zdGFuY2VvZiBQYXNzVGhyb3VnaEhhbmRsZXJDb250ZXh0ICYmXG4gICAgICAgICAgICByZWNlaXZlci5pc0ZpbmFsbHlIYW5kbGVyKCkpIHtcbiAgICAgICAgICAgIHJlY2VpdmVyLmNhbmNlbFByb21pc2UgPSBwcm9taXNlO1xuICAgICAgICAgICAgaWYgKHRyeUNhdGNoKGhhbmRsZXIpLmNhbGwocmVjZWl2ZXIsIHZhbHVlKSA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlLl9yZWplY3QoZXJyb3JPYmouZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoaGFuZGxlciA9PT0gcmVmbGVjdEhhbmRsZXIpIHtcbiAgICAgICAgICAgIHByb21pc2UuX2Z1bGZpbGwocmVmbGVjdEhhbmRsZXIuY2FsbChyZWNlaXZlcikpO1xuICAgICAgICB9IGVsc2UgaWYgKHJlY2VpdmVyIGluc3RhbmNlb2YgUHJveHlhYmxlKSB7XG4gICAgICAgICAgICByZWNlaXZlci5fcHJvbWlzZUNhbmNlbGxlZChwcm9taXNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1Byb21pc2UgfHwgcHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2VBcnJheSkge1xuICAgICAgICAgICAgcHJvbWlzZS5fY2FuY2VsKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWNlaXZlci5jYW5jZWwoKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBpZiAoIWlzUHJvbWlzZSkge1xuICAgICAgICAgICAgaGFuZGxlci5jYWxsKHJlY2VpdmVyLCB2YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoYXN5bmNHdWFyYW50ZWVkKSBwcm9taXNlLl9zZXRBc3luY0d1YXJhbnRlZWQoKTtcbiAgICAgICAgICAgIHRoaXMuX3NldHRsZVByb21pc2VGcm9tSGFuZGxlcihoYW5kbGVyLCByZWNlaXZlciwgdmFsdWUsIHByb21pc2UpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChyZWNlaXZlciBpbnN0YW5jZW9mIFByb3h5YWJsZSkge1xuICAgICAgICBpZiAoIXJlY2VpdmVyLl9pc1Jlc29sdmVkKCkpIHtcbiAgICAgICAgICAgIGlmICgoKGJpdEZpZWxkICYgMzM1NTQ0MzIpICE9PSAwKSkge1xuICAgICAgICAgICAgICAgIHJlY2VpdmVyLl9wcm9taXNlRnVsZmlsbGVkKHZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVjZWl2ZXIuX3Byb21pc2VSZWplY3RlZCh2YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzUHJvbWlzZSkge1xuICAgICAgICBpZiAoYXN5bmNHdWFyYW50ZWVkKSBwcm9taXNlLl9zZXRBc3luY0d1YXJhbnRlZWQoKTtcbiAgICAgICAgaWYgKCgoYml0RmllbGQgJiAzMzU1NDQzMikgIT09IDApKSB7XG4gICAgICAgICAgICBwcm9taXNlLl9mdWxmaWxsKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb21pc2UuX3JlamVjdCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0dGxlUHJvbWlzZUxhdGVDYW5jZWxsYXRpb25PYnNlcnZlciA9IGZ1bmN0aW9uKGN0eCkge1xuICAgIHZhciBoYW5kbGVyID0gY3R4LmhhbmRsZXI7XG4gICAgdmFyIHByb21pc2UgPSBjdHgucHJvbWlzZTtcbiAgICB2YXIgcmVjZWl2ZXIgPSBjdHgucmVjZWl2ZXI7XG4gICAgdmFyIHZhbHVlID0gY3R4LnZhbHVlO1xuICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGlmICghKHByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSkge1xuICAgICAgICAgICAgaGFuZGxlci5jYWxsKHJlY2VpdmVyLCB2YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZXR0bGVQcm9taXNlRnJvbUhhbmRsZXIoaGFuZGxlciwgcmVjZWl2ZXIsIHZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgcHJvbWlzZS5fcmVqZWN0KHZhbHVlKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0dGxlUHJvbWlzZUN0eCA9IGZ1bmN0aW9uKGN0eCkge1xuICAgIHRoaXMuX3NldHRsZVByb21pc2UoY3R4LnByb21pc2UsIGN0eC5oYW5kbGVyLCBjdHgucmVjZWl2ZXIsIGN0eC52YWx1ZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fc2V0dGxlUHJvbWlzZTAgPSBmdW5jdGlvbihoYW5kbGVyLCB2YWx1ZSwgYml0RmllbGQpIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXMuX3Byb21pc2UwO1xuICAgIHZhciByZWNlaXZlciA9IHRoaXMuX3JlY2VpdmVyQXQoMCk7XG4gICAgdGhpcy5fcHJvbWlzZTAgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fcmVjZWl2ZXIwID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3NldHRsZVByb21pc2UocHJvbWlzZSwgaGFuZGxlciwgcmVjZWl2ZXIsIHZhbHVlKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9jbGVhckNhbGxiYWNrRGF0YUF0SW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xuICAgIHZhciBiYXNlID0gaW5kZXggKiA0IC0gNDtcbiAgICB0aGlzW2Jhc2UgKyAyXSA9XG4gICAgdGhpc1tiYXNlICsgM10gPVxuICAgIHRoaXNbYmFzZSArIDBdID1cbiAgICB0aGlzW2Jhc2UgKyAxXSA9IHVuZGVmaW5lZDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLl9mdWxmaWxsID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdmFyIGJpdEZpZWxkID0gdGhpcy5fYml0RmllbGQ7XG4gICAgaWYgKCgoYml0RmllbGQgJiAxMTc1MDYwNDgpID4+PiAxNikpIHJldHVybjtcbiAgICBpZiAodmFsdWUgPT09IHRoaXMpIHtcbiAgICAgICAgdmFyIGVyciA9IG1ha2VTZWxmUmVzb2x1dGlvbkVycm9yKCk7XG4gICAgICAgIHRoaXMuX2F0dGFjaEV4dHJhVHJhY2UoZXJyKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlamVjdChlcnIpO1xuICAgIH1cbiAgICB0aGlzLl9zZXRGdWxmaWxsZWQoKTtcbiAgICB0aGlzLl9yZWplY3Rpb25IYW5kbGVyMCA9IHZhbHVlO1xuXG4gICAgaWYgKChiaXRGaWVsZCAmIDY1NTM1KSA+IDApIHtcbiAgICAgICAgaWYgKCgoYml0RmllbGQgJiAxMzQyMTc3MjgpICE9PSAwKSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0dGxlUHJvbWlzZXMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFzeW5jLnNldHRsZVByb21pc2VzKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RlcmVmZXJlbmNlVHJhY2UoKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHZhciBiaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkO1xuICAgIGlmICgoKGJpdEZpZWxkICYgMTE3NTA2MDQ4KSA+Pj4gMTYpKSByZXR1cm47XG4gICAgdGhpcy5fc2V0UmVqZWN0ZWQoKTtcbiAgICB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXIwID0gcmVhc29uO1xuXG4gICAgaWYgKHRoaXMuX2lzRmluYWwoKSkge1xuICAgICAgICByZXR1cm4gYXN5bmMuZmF0YWxFcnJvcihyZWFzb24sIHV0aWwuaXNOb2RlKTtcbiAgICB9XG5cbiAgICBpZiAoKGJpdEZpZWxkICYgNjU1MzUpID4gMCkge1xuICAgICAgICBhc3luYy5zZXR0bGVQcm9taXNlcyh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9lbnN1cmVQb3NzaWJsZVJlamVjdGlvbkhhbmRsZWQoKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fZnVsZmlsbFByb21pc2VzID0gZnVuY3Rpb24gKGxlbiwgdmFsdWUpIHtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVyQXQoaSk7XG4gICAgICAgIHZhciBwcm9taXNlID0gdGhpcy5fcHJvbWlzZUF0KGkpO1xuICAgICAgICB2YXIgcmVjZWl2ZXIgPSB0aGlzLl9yZWNlaXZlckF0KGkpO1xuICAgICAgICB0aGlzLl9jbGVhckNhbGxiYWNrRGF0YUF0SW5kZXgoaSk7XG4gICAgICAgIHRoaXMuX3NldHRsZVByb21pc2UocHJvbWlzZSwgaGFuZGxlciwgcmVjZWl2ZXIsIHZhbHVlKTtcbiAgICB9XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVqZWN0UHJvbWlzZXMgPSBmdW5jdGlvbiAobGVuLCByZWFzb24pIHtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5fcmVqZWN0aW9uSGFuZGxlckF0KGkpO1xuICAgICAgICB2YXIgcHJvbWlzZSA9IHRoaXMuX3Byb21pc2VBdChpKTtcbiAgICAgICAgdmFyIHJlY2VpdmVyID0gdGhpcy5fcmVjZWl2ZXJBdChpKTtcbiAgICAgICAgdGhpcy5fY2xlYXJDYWxsYmFja0RhdGFBdEluZGV4KGkpO1xuICAgICAgICB0aGlzLl9zZXR0bGVQcm9taXNlKHByb21pc2UsIGhhbmRsZXIsIHJlY2VpdmVyLCByZWFzb24pO1xuICAgIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLl9zZXR0bGVQcm9taXNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYml0RmllbGQgPSB0aGlzLl9iaXRGaWVsZDtcbiAgICB2YXIgbGVuID0gKGJpdEZpZWxkICYgNjU1MzUpO1xuXG4gICAgaWYgKGxlbiA+IDApIHtcbiAgICAgICAgaWYgKCgoYml0RmllbGQgJiAxNjg0Mjc1MikgIT09IDApKSB7XG4gICAgICAgICAgICB2YXIgcmVhc29uID0gdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVyMDtcbiAgICAgICAgICAgIHRoaXMuX3NldHRsZVByb21pc2UwKHRoaXMuX3JlamVjdGlvbkhhbmRsZXIwLCByZWFzb24sIGJpdEZpZWxkKTtcbiAgICAgICAgICAgIHRoaXMuX3JlamVjdFByb21pc2VzKGxlbiwgcmVhc29uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRoaXMuX3JlamVjdGlvbkhhbmRsZXIwO1xuICAgICAgICAgICAgdGhpcy5fc2V0dGxlUHJvbWlzZTAodGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVyMCwgdmFsdWUsIGJpdEZpZWxkKTtcbiAgICAgICAgICAgIHRoaXMuX2Z1bGZpbGxQcm9taXNlcyhsZW4sIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZXRMZW5ndGgoMCk7XG4gICAgfVxuICAgIHRoaXMuX2NsZWFyQ2FuY2VsbGF0aW9uRGF0YSgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuX3NldHRsZWRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBiaXRGaWVsZCA9IHRoaXMuX2JpdEZpZWxkO1xuICAgIGlmICgoKGJpdEZpZWxkICYgMzM1NTQ0MzIpICE9PSAwKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVqZWN0aW9uSGFuZGxlcjA7XG4gICAgfSBlbHNlIGlmICgoKGJpdEZpZWxkICYgMTY3NzcyMTYpICE9PSAwKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVyMDtcbiAgICB9XG59O1xuXG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiAgICBlczUuZGVmaW5lUHJvcGVydHkoUHJvbWlzZS5wcm90b3R5cGUsIFN5bWJvbC50b1N0cmluZ1RhZywge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBcIk9iamVjdFwiO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGRlZmVyUmVzb2x2ZSh2KSB7dGhpcy5wcm9taXNlLl9yZXNvbHZlQ2FsbGJhY2sodik7fVxuZnVuY3Rpb24gZGVmZXJSZWplY3Qodikge3RoaXMucHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2sodiwgZmFsc2UpO31cblxuUHJvbWlzZS5kZWZlciA9IFByb21pc2UucGVuZGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGRlYnVnLmRlcHJlY2F0ZWQoXCJQcm9taXNlLmRlZmVyXCIsIFwibmV3IFByb21pc2VcIik7XG4gICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJvbWlzZTogcHJvbWlzZSxcbiAgICAgICAgcmVzb2x2ZTogZGVmZXJSZXNvbHZlLFxuICAgICAgICByZWplY3Q6IGRlZmVyUmVqZWN0XG4gICAgfTtcbn07XG5cbnV0aWwubm90RW51bWVyYWJsZVByb3AoUHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgXCJfbWFrZVNlbGZSZXNvbHV0aW9uRXJyb3JcIixcbiAgICAgICAgICAgICAgICAgICAgICAgbWFrZVNlbGZSZXNvbHV0aW9uRXJyb3IpO1xuXG5fZGVyZXFfKFwiLi9tZXRob2RcIikoUHJvbWlzZSwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UsIGFwaVJlamVjdGlvbixcbiAgICBkZWJ1Zyk7XG5fZGVyZXFfKFwiLi9iaW5kXCIpKFByb21pc2UsIElOVEVSTkFMLCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBkZWJ1Zyk7XG5fZGVyZXFfKFwiLi9jYW5jZWxcIikoUHJvbWlzZSwgUHJvbWlzZUFycmF5LCBhcGlSZWplY3Rpb24sIGRlYnVnKTtcbl9kZXJlcV8oXCIuL2RpcmVjdF9yZXNvbHZlXCIpKFByb21pc2UpO1xuX2RlcmVxXyhcIi4vc3luY2hyb25vdXNfaW5zcGVjdGlvblwiKShQcm9taXNlKTtcbl9kZXJlcV8oXCIuL2pvaW5cIikoXG4gICAgUHJvbWlzZSwgUHJvbWlzZUFycmF5LCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBJTlRFUk5BTCwgYXN5bmMpO1xuUHJvbWlzZS5Qcm9taXNlID0gUHJvbWlzZTtcblByb21pc2UudmVyc2lvbiA9IFwiMy43LjFcIjtcbl9kZXJlcV8oJy4vY2FsbF9nZXQuanMnKShQcm9taXNlKTtcbl9kZXJlcV8oJy4vZ2VuZXJhdG9ycy5qcycpKFByb21pc2UsIGFwaVJlamVjdGlvbiwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UsIFByb3h5YWJsZSwgZGVidWcpO1xuX2RlcmVxXygnLi9tYXAuanMnKShQcm9taXNlLCBQcm9taXNlQXJyYXksIGFwaVJlamVjdGlvbiwgdHJ5Q29udmVydFRvUHJvbWlzZSwgSU5URVJOQUwsIGRlYnVnKTtcbl9kZXJlcV8oJy4vbm9kZWlmeS5qcycpKFByb21pc2UpO1xuX2RlcmVxXygnLi9wcm9taXNpZnkuanMnKShQcm9taXNlLCBJTlRFUk5BTCk7XG5fZGVyZXFfKCcuL3Byb3BzLmpzJykoUHJvbWlzZSwgUHJvbWlzZUFycmF5LCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBhcGlSZWplY3Rpb24pO1xuX2RlcmVxXygnLi9yYWNlLmpzJykoUHJvbWlzZSwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UsIGFwaVJlamVjdGlvbik7XG5fZGVyZXFfKCcuL3JlZHVjZS5qcycpKFByb21pc2UsIFByb21pc2VBcnJheSwgYXBpUmVqZWN0aW9uLCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBJTlRFUk5BTCwgZGVidWcpO1xuX2RlcmVxXygnLi9zZXR0bGUuanMnKShQcm9taXNlLCBQcm9taXNlQXJyYXksIGRlYnVnKTtcbl9kZXJlcV8oJy4vc29tZS5qcycpKFByb21pc2UsIFByb21pc2VBcnJheSwgYXBpUmVqZWN0aW9uKTtcbl9kZXJlcV8oJy4vdGltZXJzLmpzJykoUHJvbWlzZSwgSU5URVJOQUwsIGRlYnVnKTtcbl9kZXJlcV8oJy4vdXNpbmcuanMnKShQcm9taXNlLCBhcGlSZWplY3Rpb24sIHRyeUNvbnZlcnRUb1Byb21pc2UsIGNyZWF0ZUNvbnRleHQsIElOVEVSTkFMLCBkZWJ1Zyk7XG5fZGVyZXFfKCcuL2FueS5qcycpKFByb21pc2UpO1xuX2RlcmVxXygnLi9lYWNoLmpzJykoUHJvbWlzZSwgSU5URVJOQUwpO1xuX2RlcmVxXygnLi9maWx0ZXIuanMnKShQcm9taXNlLCBJTlRFUk5BTCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICB1dGlsLnRvRmFzdFByb3BlcnRpZXMoUHJvbWlzZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgdXRpbC50b0Zhc3RQcm9wZXJ0aWVzKFByb21pc2UucHJvdG90eXBlKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZ1bmN0aW9uIGZpbGxUeXBlcyh2YWx1ZSkgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgdmFyIHAgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHAuX2Z1bGZpbGxtZW50SGFuZGxlcjAgPSB2YWx1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBwLl9yZWplY3Rpb25IYW5kbGVyMCA9IHZhbHVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcC5fcHJvbWlzZTAgPSB2YWx1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHAuX3JlY2VpdmVyMCA9IHZhbHVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAvLyBDb21wbGV0ZSBzbGFjayB0cmFja2luZywgb3B0IG91dCBvZiBmaWVsZC10eXBlIHRyYWNraW5nIGFuZCAgICAgICAgICAgXG4gICAgLy8gc3RhYmlsaXplIG1hcCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZpbGxUeXBlcyh7YTogMX0pOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBmaWxsVHlwZXMoe2I6IDJ9KTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZmlsbFR5cGVzKHtjOiAzfSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZpbGxUeXBlcygxKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBmaWxsVHlwZXMoZnVuY3Rpb24oKXt9KTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZmlsbFR5cGVzKHVuZGVmaW5lZCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGZpbGxUeXBlcyhmYWxzZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBmaWxsVHlwZXMobmV3IFByb21pc2UoSU5URVJOQUwpKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZGVidWcuc2V0Qm91bmRzKEFzeW5jLmZpcnN0TGluZUVycm9yLCB1dGlsLmxhc3RMaW5lRXJyb3IpOyAgICAgICAgICAgICAgIFxuICAgIHJldHVybiBQcm9taXNlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcblxufTtcblxufSx7XCIuL2FueS5qc1wiOjEsXCIuL2FzeW5jXCI6MixcIi4vYmluZFwiOjMsXCIuL2NhbGxfZ2V0LmpzXCI6NSxcIi4vY2FuY2VsXCI6NixcIi4vY2F0Y2hfZmlsdGVyXCI6NyxcIi4vY29udGV4dFwiOjgsXCIuL2RlYnVnZ2FiaWxpdHlcIjo5LFwiLi9kaXJlY3RfcmVzb2x2ZVwiOjEwLFwiLi9lYWNoLmpzXCI6MTEsXCIuL2Vycm9yc1wiOjEyLFwiLi9lczVcIjoxMyxcIi4vZmlsdGVyLmpzXCI6MTQsXCIuL2ZpbmFsbHlcIjoxNSxcIi4vZ2VuZXJhdG9ycy5qc1wiOjE2LFwiLi9qb2luXCI6MTcsXCIuL21hcC5qc1wiOjE4LFwiLi9tZXRob2RcIjoxOSxcIi4vbm9kZWJhY2tcIjoyMCxcIi4vbm9kZWlmeS5qc1wiOjIxLFwiLi9wcm9taXNlX2FycmF5XCI6MjMsXCIuL3Byb21pc2lmeS5qc1wiOjI0LFwiLi9wcm9wcy5qc1wiOjI1LFwiLi9yYWNlLmpzXCI6MjcsXCIuL3JlZHVjZS5qc1wiOjI4LFwiLi9zZXR0bGUuanNcIjozMCxcIi4vc29tZS5qc1wiOjMxLFwiLi9zeW5jaHJvbm91c19pbnNwZWN0aW9uXCI6MzIsXCIuL3RoZW5hYmxlc1wiOjMzLFwiLi90aW1lcnMuanNcIjozNCxcIi4vdXNpbmcuanNcIjozNSxcIi4vdXRpbFwiOjM2LFwiYXN5bmNfaG9va3NcIjp1bmRlZmluZWR9XSwyMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSwgSU5URVJOQUwsIHRyeUNvbnZlcnRUb1Byb21pc2UsXG4gICAgYXBpUmVqZWN0aW9uLCBQcm94eWFibGUpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnZhciBpc0FycmF5ID0gdXRpbC5pc0FycmF5O1xuXG5mdW5jdGlvbiB0b1Jlc29sdXRpb25WYWx1ZSh2YWwpIHtcbiAgICBzd2l0Y2godmFsKSB7XG4gICAgY2FzZSAtMjogcmV0dXJuIFtdO1xuICAgIGNhc2UgLTM6IHJldHVybiB7fTtcbiAgICBjYXNlIC02OiByZXR1cm4gbmV3IE1hcCgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gUHJvbWlzZUFycmF5KHZhbHVlcykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcy5fcHJvbWlzZSA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICBpZiAodmFsdWVzIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICBwcm9taXNlLl9wcm9wYWdhdGVGcm9tKHZhbHVlcywgMyk7XG4gICAgICAgIHZhbHVlcy5zdXBwcmVzc1VuaGFuZGxlZFJlamVjdGlvbnMoKTtcbiAgICB9XG4gICAgcHJvbWlzZS5fc2V0T25DYW5jZWwodGhpcyk7XG4gICAgdGhpcy5fdmFsdWVzID0gdmFsdWVzO1xuICAgIHRoaXMuX2xlbmd0aCA9IDA7XG4gICAgdGhpcy5fdG90YWxSZXNvbHZlZCA9IDA7XG4gICAgdGhpcy5faW5pdCh1bmRlZmluZWQsIC0yKTtcbn1cbnV0aWwuaW5oZXJpdHMoUHJvbWlzZUFycmF5LCBQcm94eWFibGUpO1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5wcm9taXNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9wcm9taXNlO1xufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uIGluaXQoXywgcmVzb2x2ZVZhbHVlSWZFbXB0eSkge1xuICAgIHZhciB2YWx1ZXMgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHRoaXMuX3ZhbHVlcywgdGhpcy5fcHJvbWlzZSk7XG4gICAgaWYgKHZhbHVlcyBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgdmFsdWVzID0gdmFsdWVzLl90YXJnZXQoKTtcbiAgICAgICAgdmFyIGJpdEZpZWxkID0gdmFsdWVzLl9iaXRGaWVsZDtcbiAgICAgICAgO1xuICAgICAgICB0aGlzLl92YWx1ZXMgPSB2YWx1ZXM7XG5cbiAgICAgICAgaWYgKCgoYml0RmllbGQgJiA1MDM5NzE4NCkgPT09IDApKSB7XG4gICAgICAgICAgICB0aGlzLl9wcm9taXNlLl9zZXRBc3luY0d1YXJhbnRlZWQoKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZXMuX3RoZW4oXG4gICAgICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWplY3QsXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgcmVzb2x2ZVZhbHVlSWZFbXB0eVxuICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKCgoYml0RmllbGQgJiAzMzU1NDQzMikgIT09IDApKSB7XG4gICAgICAgICAgICB2YWx1ZXMgPSB2YWx1ZXMuX3ZhbHVlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoKChiaXRGaWVsZCAmIDE2Nzc3MjE2KSAhPT0gMCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWplY3QodmFsdWVzLl9yZWFzb24oKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FuY2VsKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFsdWVzID0gdXRpbC5hc0FycmF5KHZhbHVlcyk7XG4gICAgaWYgKHZhbHVlcyA9PT0gbnVsbCkge1xuICAgICAgICB2YXIgZXJyID0gYXBpUmVqZWN0aW9uKFxuICAgICAgICAgICAgXCJleHBlY3RpbmcgYW4gYXJyYXkgb3IgYW4gaXRlcmFibGUgb2JqZWN0IGJ1dCBnb3QgXCIgKyB1dGlsLmNsYXNzU3RyaW5nKHZhbHVlcykpLnJlYXNvbigpO1xuICAgICAgICB0aGlzLl9wcm9taXNlLl9yZWplY3RDYWxsYmFjayhlcnIsIGZhbHNlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGlmIChyZXNvbHZlVmFsdWVJZkVtcHR5ID09PSAtNSkge1xuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZUVtcHR5QXJyYXkoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc29sdmUodG9SZXNvbHV0aW9uVmFsdWUocmVzb2x2ZVZhbHVlSWZFbXB0eSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5faXRlcmF0ZSh2YWx1ZXMpO1xufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5faXRlcmF0ZSA9IGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIHZhciBsZW4gPSB0aGlzLmdldEFjdHVhbExlbmd0aCh2YWx1ZXMubGVuZ3RoKTtcbiAgICB0aGlzLl9sZW5ndGggPSBsZW47XG4gICAgdGhpcy5fdmFsdWVzID0gdGhpcy5zaG91bGRDb3B5VmFsdWVzKCkgPyBuZXcgQXJyYXkobGVuKSA6IHRoaXMuX3ZhbHVlcztcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5fcHJvbWlzZTtcbiAgICB2YXIgaXNSZXNvbHZlZCA9IGZhbHNlO1xuICAgIHZhciBiaXRGaWVsZCA9IG51bGw7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZSh2YWx1ZXNbaV0sIHJlc3VsdCk7XG5cbiAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgIG1heWJlUHJvbWlzZSA9IG1heWJlUHJvbWlzZS5fdGFyZ2V0KCk7XG4gICAgICAgICAgICBiaXRGaWVsZCA9IG1heWJlUHJvbWlzZS5fYml0RmllbGQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBiaXRGaWVsZCA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNSZXNvbHZlZCkge1xuICAgICAgICAgICAgaWYgKGJpdEZpZWxkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlLnN1cHByZXNzVW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGJpdEZpZWxkICE9PSBudWxsKSB7XG4gICAgICAgICAgICBpZiAoKChiaXRGaWVsZCAmIDUwMzk3MTg0KSA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgICBtYXliZVByb21pc2UuX3Byb3h5KHRoaXMsIGkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlc1tpXSA9IG1heWJlUHJvbWlzZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoKChiaXRGaWVsZCAmIDMzNTU0NDMyKSAhPT0gMCkpIHtcbiAgICAgICAgICAgICAgICBpc1Jlc29sdmVkID0gdGhpcy5fcHJvbWlzZUZ1bGZpbGxlZChtYXliZVByb21pc2UuX3ZhbHVlKCksIGkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgoKGJpdEZpZWxkICYgMTY3NzcyMTYpICE9PSAwKSkge1xuICAgICAgICAgICAgICAgIGlzUmVzb2x2ZWQgPSB0aGlzLl9wcm9taXNlUmVqZWN0ZWQobWF5YmVQcm9taXNlLl9yZWFzb24oKSwgaSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlzUmVzb2x2ZWQgPSB0aGlzLl9wcm9taXNlQ2FuY2VsbGVkKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaXNSZXNvbHZlZCA9IHRoaXMuX3Byb21pc2VGdWxmaWxsZWQobWF5YmVQcm9taXNlLCBpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWlzUmVzb2x2ZWQpIHJlc3VsdC5fc2V0QXN5bmNHdWFyYW50ZWVkKCk7XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9pc1Jlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZXMgPT09IG51bGw7XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5fdmFsdWVzID0gbnVsbDtcbiAgICB0aGlzLl9wcm9taXNlLl9mdWxmaWxsKHZhbHVlKTtcbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuX2NhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9pc1Jlc29sdmVkKCkgfHwgIXRoaXMuX3Byb21pc2UuX2lzQ2FuY2VsbGFibGUoKSkgcmV0dXJuO1xuICAgIHRoaXMuX3ZhbHVlcyA9IG51bGw7XG4gICAgdGhpcy5fcHJvbWlzZS5fY2FuY2VsKCk7XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9yZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgdGhpcy5fdmFsdWVzID0gbnVsbDtcbiAgICB0aGlzLl9wcm9taXNlLl9yZWplY3RDYWxsYmFjayhyZWFzb24sIGZhbHNlKTtcbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VGdWxmaWxsZWQgPSBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgdGhpcy5fdmFsdWVzW2luZGV4XSA9IHZhbHVlO1xuICAgIHZhciB0b3RhbFJlc29sdmVkID0gKyt0aGlzLl90b3RhbFJlc29sdmVkO1xuICAgIGlmICh0b3RhbFJlc29sdmVkID49IHRoaXMuX2xlbmd0aCkge1xuICAgICAgICB0aGlzLl9yZXNvbHZlKHRoaXMuX3ZhbHVlcyk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlQ2FuY2VsbGVkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fY2FuY2VsKCk7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlUmVqZWN0ZWQgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgdGhpcy5fdG90YWxSZXNvbHZlZCsrO1xuICAgIHRoaXMuX3JlamVjdChyZWFzb24pO1xuICAgIHJldHVybiB0cnVlO1xufTtcblxuUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcmVzdWx0Q2FuY2VsbGVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2lzUmVzb2x2ZWQoKSkgcmV0dXJuO1xuICAgIHZhciB2YWx1ZXMgPSB0aGlzLl92YWx1ZXM7XG4gICAgdGhpcy5fY2FuY2VsKCk7XG4gICAgaWYgKHZhbHVlcyBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgdmFsdWVzLmNhbmNlbCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAodmFsdWVzW2ldIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgICAgIHZhbHVlc1tpXS5jYW5jZWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuc2hvdWxkQ29weVZhbHVlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cblByb21pc2VBcnJheS5wcm90b3R5cGUuZ2V0QWN0dWFsTGVuZ3RoID0gZnVuY3Rpb24gKGxlbikge1xuICAgIHJldHVybiBsZW47XG59O1xuXG5yZXR1cm4gUHJvbWlzZUFycmF5O1xufTtcblxufSx7XCIuL3V0aWxcIjozNn1dLDI0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCkge1xudmFyIFRISVMgPSB7fTtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnZhciBub2RlYmFja0ZvclByb21pc2UgPSBfZGVyZXFfKFwiLi9ub2RlYmFja1wiKTtcbnZhciB3aXRoQXBwZW5kZWQgPSB1dGlsLndpdGhBcHBlbmRlZDtcbnZhciBtYXliZVdyYXBBc0Vycm9yID0gdXRpbC5tYXliZVdyYXBBc0Vycm9yO1xudmFyIGNhbkV2YWx1YXRlID0gdXRpbC5jYW5FdmFsdWF0ZTtcbnZhciBUeXBlRXJyb3IgPSBfZGVyZXFfKFwiLi9lcnJvcnNcIikuVHlwZUVycm9yO1xudmFyIGRlZmF1bHRTdWZmaXggPSBcIkFzeW5jXCI7XG52YXIgZGVmYXVsdFByb21pc2lmaWVkID0ge19faXNQcm9taXNpZmllZF9fOiB0cnVlfTtcbnZhciBub0NvcHlQcm9wcyA9IFtcbiAgICBcImFyaXR5XCIsICAgIFwibGVuZ3RoXCIsXG4gICAgXCJuYW1lXCIsXG4gICAgXCJhcmd1bWVudHNcIixcbiAgICBcImNhbGxlclwiLFxuICAgIFwiY2FsbGVlXCIsXG4gICAgXCJwcm90b3R5cGVcIixcbiAgICBcIl9faXNQcm9taXNpZmllZF9fXCJcbl07XG52YXIgbm9Db3B5UHJvcHNQYXR0ZXJuID0gbmV3IFJlZ0V4cChcIl4oPzpcIiArIG5vQ29weVByb3BzLmpvaW4oXCJ8XCIpICsgXCIpJFwiKTtcblxudmFyIGRlZmF1bHRGaWx0ZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHV0aWwuaXNJZGVudGlmaWVyKG5hbWUpICYmXG4gICAgICAgIG5hbWUuY2hhckF0KDApICE9PSBcIl9cIiAmJlxuICAgICAgICBuYW1lICE9PSBcImNvbnN0cnVjdG9yXCI7XG59O1xuXG5mdW5jdGlvbiBwcm9wc0ZpbHRlcihrZXkpIHtcbiAgICByZXR1cm4gIW5vQ29weVByb3BzUGF0dGVybi50ZXN0KGtleSk7XG59XG5cbmZ1bmN0aW9uIGlzUHJvbWlzaWZpZWQoZm4pIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZm4uX19pc1Byb21pc2lmaWVkX18gPT09IHRydWU7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc1Byb21pc2lmaWVkKG9iaiwga2V5LCBzdWZmaXgpIHtcbiAgICB2YXIgdmFsID0gdXRpbC5nZXREYXRhUHJvcGVydHlPckRlZmF1bHQob2JqLCBrZXkgKyBzdWZmaXgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRQcm9taXNpZmllZCk7XG4gICAgcmV0dXJuIHZhbCA/IGlzUHJvbWlzaWZpZWQodmFsKSA6IGZhbHNlO1xufVxuZnVuY3Rpb24gY2hlY2tWYWxpZChyZXQsIHN1ZmZpeCwgc3VmZml4UmVnZXhwKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXQubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgdmFyIGtleSA9IHJldFtpXTtcbiAgICAgICAgaWYgKHN1ZmZpeFJlZ2V4cC50ZXN0KGtleSkpIHtcbiAgICAgICAgICAgIHZhciBrZXlXaXRob3V0QXN5bmNTdWZmaXggPSBrZXkucmVwbGFjZShzdWZmaXhSZWdleHAsIFwiXCIpO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZXQubGVuZ3RoOyBqICs9IDIpIHtcbiAgICAgICAgICAgICAgICBpZiAocmV0W2pdID09PSBrZXlXaXRob3V0QXN5bmNTdWZmaXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBwcm9taXNpZnkgYW4gQVBJIHRoYXQgaGFzIG5vcm1hbCBtZXRob2RzIHdpdGggJyVzJy1zdWZmaXhcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9NcXJGbVhcXHUwMDBhXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKFwiJXNcIiwgc3VmZml4KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwcm9taXNpZmlhYmxlTWV0aG9kcyhvYmosIHN1ZmZpeCwgc3VmZml4UmVnZXhwLCBmaWx0ZXIpIHtcbiAgICB2YXIga2V5cyA9IHV0aWwuaW5oZXJpdGVkRGF0YUtleXMob2JqKTtcbiAgICB2YXIgcmV0ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICB2YXIgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgICAgdmFyIHBhc3Nlc0RlZmF1bHRGaWx0ZXIgPSBmaWx0ZXIgPT09IGRlZmF1bHRGaWx0ZXJcbiAgICAgICAgICAgID8gdHJ1ZSA6IGRlZmF1bHRGaWx0ZXIoa2V5LCB2YWx1ZSwgb2JqKTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICAhaXNQcm9taXNpZmllZCh2YWx1ZSkgJiZcbiAgICAgICAgICAgICFoYXNQcm9taXNpZmllZChvYmosIGtleSwgc3VmZml4KSAmJlxuICAgICAgICAgICAgZmlsdGVyKGtleSwgdmFsdWUsIG9iaiwgcGFzc2VzRGVmYXVsdEZpbHRlcikpIHtcbiAgICAgICAgICAgIHJldC5wdXNoKGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNoZWNrVmFsaWQocmV0LCBzdWZmaXgsIHN1ZmZpeFJlZ2V4cCk7XG4gICAgcmV0dXJuIHJldDtcbn1cblxudmFyIGVzY2FwZUlkZW50UmVnZXggPSBmdW5jdGlvbihzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbJF0pLywgXCJcXFxcJFwiKTtcbn07XG5cbnZhciBtYWtlTm9kZVByb21pc2lmaWVkRXZhbDtcbmlmICghdHJ1ZSkge1xudmFyIHN3aXRjaENhc2VBcmd1bWVudE9yZGVyID0gZnVuY3Rpb24obGlrZWx5QXJndW1lbnRDb3VudCkge1xuICAgIHZhciByZXQgPSBbbGlrZWx5QXJndW1lbnRDb3VudF07XG4gICAgdmFyIG1pbiA9IE1hdGgubWF4KDAsIGxpa2VseUFyZ3VtZW50Q291bnQgLSAxIC0gMyk7XG4gICAgZm9yKHZhciBpID0gbGlrZWx5QXJndW1lbnRDb3VudCAtIDE7IGkgPj0gbWluOyAtLWkpIHtcbiAgICAgICAgcmV0LnB1c2goaSk7XG4gICAgfVxuICAgIGZvcih2YXIgaSA9IGxpa2VseUFyZ3VtZW50Q291bnQgKyAxOyBpIDw9IDM7ICsraSkge1xuICAgICAgICByZXQucHVzaChpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cbnZhciBhcmd1bWVudFNlcXVlbmNlID0gZnVuY3Rpb24oYXJndW1lbnRDb3VudCkge1xuICAgIHJldHVybiB1dGlsLmZpbGxlZFJhbmdlKGFyZ3VtZW50Q291bnQsIFwiX2FyZ1wiLCBcIlwiKTtcbn07XG5cbnZhciBwYXJhbWV0ZXJEZWNsYXJhdGlvbiA9IGZ1bmN0aW9uKHBhcmFtZXRlckNvdW50KSB7XG4gICAgcmV0dXJuIHV0aWwuZmlsbGVkUmFuZ2UoXG4gICAgICAgIE1hdGgubWF4KHBhcmFtZXRlckNvdW50LCAzKSwgXCJfYXJnXCIsIFwiXCIpO1xufTtcblxudmFyIHBhcmFtZXRlckNvdW50ID0gZnVuY3Rpb24oZm4pIHtcbiAgICBpZiAodHlwZW9mIGZuLmxlbmd0aCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgoTWF0aC5taW4oZm4ubGVuZ3RoLCAxMDIzICsgMSksIDApO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbn07XG5cbm1ha2VOb2RlUHJvbWlzaWZpZWRFdmFsID1cbmZ1bmN0aW9uKGNhbGxiYWNrLCByZWNlaXZlciwgb3JpZ2luYWxOYW1lLCBmbiwgXywgbXVsdGlBcmdzKSB7XG4gICAgdmFyIG5ld1BhcmFtZXRlckNvdW50ID0gTWF0aC5tYXgoMCwgcGFyYW1ldGVyQ291bnQoZm4pIC0gMSk7XG4gICAgdmFyIGFyZ3VtZW50T3JkZXIgPSBzd2l0Y2hDYXNlQXJndW1lbnRPcmRlcihuZXdQYXJhbWV0ZXJDb3VudCk7XG4gICAgdmFyIHNob3VsZFByb3h5VGhpcyA9IHR5cGVvZiBjYWxsYmFjayA9PT0gXCJzdHJpbmdcIiB8fCByZWNlaXZlciA9PT0gVEhJUztcblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlQ2FsbEZvckFyZ3VtZW50Q291bnQoY291bnQpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudFNlcXVlbmNlKGNvdW50KS5qb2luKFwiLCBcIik7XG4gICAgICAgIHZhciBjb21tYSA9IGNvdW50ID4gMCA/IFwiLCBcIiA6IFwiXCI7XG4gICAgICAgIHZhciByZXQ7XG4gICAgICAgIGlmIChzaG91bGRQcm94eVRoaXMpIHtcbiAgICAgICAgICAgIHJldCA9IFwicmV0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCB7e2FyZ3N9fSwgbm9kZWJhY2spOyBicmVhaztcXG5cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldCA9IHJlY2VpdmVyID09PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICA/IFwicmV0ID0gY2FsbGJhY2soe3thcmdzfX0sIG5vZGViYWNrKTsgYnJlYWs7XFxuXCJcbiAgICAgICAgICAgICAgICA6IFwicmV0ID0gY2FsbGJhY2suY2FsbChyZWNlaXZlciwge3thcmdzfX0sIG5vZGViYWNrKTsgYnJlYWs7XFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldC5yZXBsYWNlKFwie3thcmdzfX1cIiwgYXJncykucmVwbGFjZShcIiwgXCIsIGNvbW1hKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZUFyZ3VtZW50U3dpdGNoQ2FzZSgpIHtcbiAgICAgICAgdmFyIHJldCA9IFwiXCI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRPcmRlci5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgcmV0ICs9IFwiY2FzZSBcIiArIGFyZ3VtZW50T3JkZXJbaV0gK1wiOlwiICtcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZUNhbGxGb3JBcmd1bWVudENvdW50KGFyZ3VtZW50T3JkZXJbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0ICs9IFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShsZW4gKyAxKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB2YXIgaSA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2ldOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBhcmdzW2ldID0gbm9kZWJhY2s7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBbQ29kZUZvckNhbGxdICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgICAgICBicmVhazsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgICAgIFwiLnJlcGxhY2UoXCJbQ29kZUZvckNhbGxdXCIsIChzaG91bGRQcm94eVRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBcInJldCA9IGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xcblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogXCJyZXQgPSBjYWxsYmFjay5hcHBseShyZWNlaXZlciwgYXJncyk7XFxuXCIpKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICB2YXIgZ2V0RnVuY3Rpb25Db2RlID0gdHlwZW9mIGNhbGxiYWNrID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gKFwidGhpcyAhPSBudWxsID8gdGhpc1snXCIrY2FsbGJhY2srXCInXSA6IGZuXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogXCJmblwiO1xuICAgIHZhciBib2R5ID0gXCIndXNlIHN0cmljdCc7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgdmFyIHJldCA9IGZ1bmN0aW9uIChQYXJhbWV0ZXJzKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JzsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciBsZW4gPSBhcmd1bWVudHMubGVuZ3RoOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoSU5URVJOQUwpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHByb21pc2UuX2NhcHR1cmVTdGFja1RyYWNlKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxuXFxcbiAgICAgICAgICAgIHZhciBub2RlYmFjayA9IG5vZGViYWNrRm9yUHJvbWlzZShwcm9taXNlLCBcIiArIG11bHRpQXJncyArIFwiKTsgICBcXG5cXFxuICAgICAgICAgICAgdmFyIHJldDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gdHJ5Q2F0Y2goW0dldEZ1bmN0aW9uQ29kZV0pOyAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgc3dpdGNoKGxlbikgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIFtDb2RlRm9yU3dpdGNoQ2FzZV0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgaWYgKHJldCA9PT0gZXJyb3JPYmopIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgICAgIHByb21pc2UuX3JlamVjdENhbGxiYWNrKG1heWJlV3JhcEFzRXJyb3IocmV0LmUpLCB0cnVlLCB0cnVlKTtcXG5cXFxuICAgICAgICAgICAgfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICAgICAgaWYgKCFwcm9taXNlLl9pc0ZhdGVTZWFsZWQoKSkgcHJvbWlzZS5fc2V0QXN5bmNHdWFyYW50ZWVkKCk7ICAgICBcXG5cXFxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICB9OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICBub3RFbnVtZXJhYmxlUHJvcChyZXQsICdfX2lzUHJvbWlzaWZpZWRfXycsIHRydWUpOyAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgICAgICByZXR1cm4gcmV0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXG5cXFxuICAgIFwiLnJlcGxhY2UoXCJbQ29kZUZvclN3aXRjaENhc2VdXCIsIGdlbmVyYXRlQXJndW1lbnRTd2l0Y2hDYXNlKCkpXG4gICAgICAgIC5yZXBsYWNlKFwiW0dldEZ1bmN0aW9uQ29kZV1cIiwgZ2V0RnVuY3Rpb25Db2RlKTtcbiAgICBib2R5ID0gYm9keS5yZXBsYWNlKFwiUGFyYW1ldGVyc1wiLCBwYXJhbWV0ZXJEZWNsYXJhdGlvbihuZXdQYXJhbWV0ZXJDb3VudCkpO1xuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oXCJQcm9taXNlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImZuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlY2VpdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIndpdGhBcHBlbmRlZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJtYXliZVdyYXBBc0Vycm9yXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIm5vZGViYWNrRm9yUHJvbWlzZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0cnlDYXRjaFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJlcnJvck9ialwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJub3RFbnVtZXJhYmxlUHJvcFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJJTlRFUk5BTFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9keSkoXG4gICAgICAgICAgICAgICAgICAgIFByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgIGZuLFxuICAgICAgICAgICAgICAgICAgICByZWNlaXZlcixcbiAgICAgICAgICAgICAgICAgICAgd2l0aEFwcGVuZGVkLFxuICAgICAgICAgICAgICAgICAgICBtYXliZVdyYXBBc0Vycm9yLFxuICAgICAgICAgICAgICAgICAgICBub2RlYmFja0ZvclByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgIHV0aWwudHJ5Q2F0Y2gsXG4gICAgICAgICAgICAgICAgICAgIHV0aWwuZXJyb3JPYmosXG4gICAgICAgICAgICAgICAgICAgIHV0aWwubm90RW51bWVyYWJsZVByb3AsXG4gICAgICAgICAgICAgICAgICAgIElOVEVSTkFMKTtcbn07XG59XG5cbmZ1bmN0aW9uIG1ha2VOb2RlUHJvbWlzaWZpZWRDbG9zdXJlKGNhbGxiYWNrLCByZWNlaXZlciwgXywgZm4sIF9fLCBtdWx0aUFyZ3MpIHtcbiAgICB2YXIgZGVmYXVsdFRoaXMgPSAoZnVuY3Rpb24oKSB7cmV0dXJuIHRoaXM7fSkoKTtcbiAgICB2YXIgbWV0aG9kID0gY2FsbGJhY2s7XG4gICAgaWYgKHR5cGVvZiBtZXRob2QgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBmbjtcbiAgICB9XG4gICAgZnVuY3Rpb24gcHJvbWlzaWZpZWQoKSB7XG4gICAgICAgIHZhciBfcmVjZWl2ZXIgPSByZWNlaXZlcjtcbiAgICAgICAgaWYgKHJlY2VpdmVyID09PSBUSElTKSBfcmVjZWl2ZXIgPSB0aGlzO1xuICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICAgICAgcHJvbWlzZS5fY2FwdHVyZVN0YWNrVHJhY2UoKTtcbiAgICAgICAgdmFyIGNiID0gdHlwZW9mIG1ldGhvZCA9PT0gXCJzdHJpbmdcIiAmJiB0aGlzICE9PSBkZWZhdWx0VGhpc1xuICAgICAgICAgICAgPyB0aGlzW21ldGhvZF0gOiBjYWxsYmFjaztcbiAgICAgICAgdmFyIGZuID0gbm9kZWJhY2tGb3JQcm9taXNlKHByb21pc2UsIG11bHRpQXJncyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjYi5hcHBseShfcmVjZWl2ZXIsIHdpdGhBcHBlbmRlZChhcmd1bWVudHMsIGZuKSk7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgcHJvbWlzZS5fcmVqZWN0Q2FsbGJhY2sobWF5YmVXcmFwQXNFcnJvcihlKSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwcm9taXNlLl9pc0ZhdGVTZWFsZWQoKSkgcHJvbWlzZS5fc2V0QXN5bmNHdWFyYW50ZWVkKCk7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICB1dGlsLm5vdEVudW1lcmFibGVQcm9wKHByb21pc2lmaWVkLCBcIl9faXNQcm9taXNpZmllZF9fXCIsIHRydWUpO1xuICAgIHJldHVybiBwcm9taXNpZmllZDtcbn1cblxudmFyIG1ha2VOb2RlUHJvbWlzaWZpZWQgPSBjYW5FdmFsdWF0ZVxuICAgID8gbWFrZU5vZGVQcm9taXNpZmllZEV2YWxcbiAgICA6IG1ha2VOb2RlUHJvbWlzaWZpZWRDbG9zdXJlO1xuXG5mdW5jdGlvbiBwcm9taXNpZnlBbGwob2JqLCBzdWZmaXgsIGZpbHRlciwgcHJvbWlzaWZpZXIsIG11bHRpQXJncykge1xuICAgIHZhciBzdWZmaXhSZWdleHAgPSBuZXcgUmVnRXhwKGVzY2FwZUlkZW50UmVnZXgoc3VmZml4KSArIFwiJFwiKTtcbiAgICB2YXIgbWV0aG9kcyA9XG4gICAgICAgIHByb21pc2lmaWFibGVNZXRob2RzKG9iaiwgc3VmZml4LCBzdWZmaXhSZWdleHAsIGZpbHRlcik7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbWV0aG9kcy5sZW5ndGg7IGkgPCBsZW47IGkrPSAyKSB7XG4gICAgICAgIHZhciBrZXkgPSBtZXRob2RzW2ldO1xuICAgICAgICB2YXIgZm4gPSBtZXRob2RzW2krMV07XG4gICAgICAgIHZhciBwcm9taXNpZmllZEtleSA9IGtleSArIHN1ZmZpeDtcbiAgICAgICAgaWYgKHByb21pc2lmaWVyID09PSBtYWtlTm9kZVByb21pc2lmaWVkKSB7XG4gICAgICAgICAgICBvYmpbcHJvbWlzaWZpZWRLZXldID1cbiAgICAgICAgICAgICAgICBtYWtlTm9kZVByb21pc2lmaWVkKGtleSwgVEhJUywga2V5LCBmbiwgc3VmZml4LCBtdWx0aUFyZ3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHByb21pc2lmaWVkID0gcHJvbWlzaWZpZXIoZm4sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYWtlTm9kZVByb21pc2lmaWVkKGtleSwgVEhJUywga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuLCBzdWZmaXgsIG11bHRpQXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHV0aWwubm90RW51bWVyYWJsZVByb3AocHJvbWlzaWZpZWQsIFwiX19pc1Byb21pc2lmaWVkX19cIiwgdHJ1ZSk7XG4gICAgICAgICAgICBvYmpbcHJvbWlzaWZpZWRLZXldID0gcHJvbWlzaWZpZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXRpbC50b0Zhc3RQcm9wZXJ0aWVzKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbn1cblxuZnVuY3Rpb24gcHJvbWlzaWZ5KGNhbGxiYWNrLCByZWNlaXZlciwgbXVsdGlBcmdzKSB7XG4gICAgcmV0dXJuIG1ha2VOb2RlUHJvbWlzaWZpZWQoY2FsbGJhY2ssIHJlY2VpdmVyLCB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLCBudWxsLCBtdWx0aUFyZ3MpO1xufVxuXG5Qcm9taXNlLnByb21pc2lmeSA9IGZ1bmN0aW9uIChmbiwgb3B0aW9ucykge1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiZXhwZWN0aW5nIGEgZnVuY3Rpb24gYnV0IGdvdCBcIiArIHV0aWwuY2xhc3NTdHJpbmcoZm4pKTtcbiAgICB9XG4gICAgaWYgKGlzUHJvbWlzaWZpZWQoZm4pKSB7XG4gICAgICAgIHJldHVybiBmbjtcbiAgICB9XG4gICAgb3B0aW9ucyA9IE9iamVjdChvcHRpb25zKTtcbiAgICB2YXIgcmVjZWl2ZXIgPSBvcHRpb25zLmNvbnRleHQgPT09IHVuZGVmaW5lZCA/IFRISVMgOiBvcHRpb25zLmNvbnRleHQ7XG4gICAgdmFyIG11bHRpQXJncyA9ICEhb3B0aW9ucy5tdWx0aUFyZ3M7XG4gICAgdmFyIHJldCA9IHByb21pc2lmeShmbiwgcmVjZWl2ZXIsIG11bHRpQXJncyk7XG4gICAgdXRpbC5jb3B5RGVzY3JpcHRvcnMoZm4sIHJldCwgcHJvcHNGaWx0ZXIpO1xuICAgIHJldHVybiByZXQ7XG59O1xuXG5Qcm9taXNlLnByb21pc2lmeUFsbCA9IGZ1bmN0aW9uICh0YXJnZXQsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiB0YXJnZXQgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInRoZSB0YXJnZXQgb2YgcHJvbWlzaWZ5QWxsIG11c3QgYmUgYW4gb2JqZWN0IG9yIGEgZnVuY3Rpb25cXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9NcXJGbVhcXHUwMDBhXCIpO1xuICAgIH1cbiAgICBvcHRpb25zID0gT2JqZWN0KG9wdGlvbnMpO1xuICAgIHZhciBtdWx0aUFyZ3MgPSAhIW9wdGlvbnMubXVsdGlBcmdzO1xuICAgIHZhciBzdWZmaXggPSBvcHRpb25zLnN1ZmZpeDtcbiAgICBpZiAodHlwZW9mIHN1ZmZpeCAhPT0gXCJzdHJpbmdcIikgc3VmZml4ID0gZGVmYXVsdFN1ZmZpeDtcbiAgICB2YXIgZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgIT09IFwiZnVuY3Rpb25cIikgZmlsdGVyID0gZGVmYXVsdEZpbHRlcjtcbiAgICB2YXIgcHJvbWlzaWZpZXIgPSBvcHRpb25zLnByb21pc2lmaWVyO1xuICAgIGlmICh0eXBlb2YgcHJvbWlzaWZpZXIgIT09IFwiZnVuY3Rpb25cIikgcHJvbWlzaWZpZXIgPSBtYWtlTm9kZVByb21pc2lmaWVkO1xuXG4gICAgaWYgKCF1dGlsLmlzSWRlbnRpZmllcihzdWZmaXgpKSB7XG4gICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwic3VmZml4IG11c3QgYmUgYSB2YWxpZCBpZGVudGlmaWVyXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvTXFyRm1YXFx1MDAwYVwiKTtcbiAgICB9XG5cbiAgICB2YXIga2V5cyA9IHV0aWwuaW5oZXJpdGVkRGF0YUtleXModGFyZ2V0KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gdGFyZ2V0W2tleXNbaV1dO1xuICAgICAgICBpZiAoa2V5c1tpXSAhPT0gXCJjb25zdHJ1Y3RvclwiICYmXG4gICAgICAgICAgICB1dGlsLmlzQ2xhc3ModmFsdWUpKSB7XG4gICAgICAgICAgICBwcm9taXNpZnlBbGwodmFsdWUucHJvdG90eXBlLCBzdWZmaXgsIGZpbHRlciwgcHJvbWlzaWZpZXIsXG4gICAgICAgICAgICAgICAgbXVsdGlBcmdzKTtcbiAgICAgICAgICAgIHByb21pc2lmeUFsbCh2YWx1ZSwgc3VmZml4LCBmaWx0ZXIsIHByb21pc2lmaWVyLCBtdWx0aUFyZ3MpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2lmeUFsbCh0YXJnZXQsIHN1ZmZpeCwgZmlsdGVyLCBwcm9taXNpZmllciwgbXVsdGlBcmdzKTtcbn07XG59O1xuXG5cbn0se1wiLi9lcnJvcnNcIjoxMixcIi4vbm9kZWJhY2tcIjoyMCxcIi4vdXRpbFwiOjM2fV0sMjU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFxuICAgIFByb21pc2UsIFByb21pc2VBcnJheSwgdHJ5Q29udmVydFRvUHJvbWlzZSwgYXBpUmVqZWN0aW9uKSB7XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWxcIik7XG52YXIgaXNPYmplY3QgPSB1dGlsLmlzT2JqZWN0O1xudmFyIGVzNSA9IF9kZXJlcV8oXCIuL2VzNVwiKTtcbnZhciBFczZNYXA7XG5pZiAodHlwZW9mIE1hcCA9PT0gXCJmdW5jdGlvblwiKSBFczZNYXAgPSBNYXA7XG5cbnZhciBtYXBUb0VudHJpZXMgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc2l6ZSA9IDA7XG5cbiAgICBmdW5jdGlvbiBleHRyYWN0RW50cnkodmFsdWUsIGtleSkge1xuICAgICAgICB0aGlzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICB0aGlzW2luZGV4ICsgc2l6ZV0gPSBrZXk7XG4gICAgICAgIGluZGV4Kys7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG1hcFRvRW50cmllcyhtYXApIHtcbiAgICAgICAgc2l6ZSA9IG1hcC5zaXplO1xuICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIHZhciByZXQgPSBuZXcgQXJyYXkobWFwLnNpemUgKiAyKTtcbiAgICAgICAgbWFwLmZvckVhY2goZXh0cmFjdEVudHJ5LCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG59KSgpO1xuXG52YXIgZW50cmllc1RvTWFwID0gZnVuY3Rpb24oZW50cmllcykge1xuICAgIHZhciByZXQgPSBuZXcgRXM2TWFwKCk7XG4gICAgdmFyIGxlbmd0aCA9IGVudHJpZXMubGVuZ3RoIC8gMiB8IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIga2V5ID0gZW50cmllc1tsZW5ndGggKyBpXTtcbiAgICAgICAgdmFyIHZhbHVlID0gZW50cmllc1tpXTtcbiAgICAgICAgcmV0LnNldChrZXksIHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIFByb3BlcnRpZXNQcm9taXNlQXJyYXkob2JqKSB7XG4gICAgdmFyIGlzTWFwID0gZmFsc2U7XG4gICAgdmFyIGVudHJpZXM7XG4gICAgaWYgKEVzNk1hcCAhPT0gdW5kZWZpbmVkICYmIG9iaiBpbnN0YW5jZW9mIEVzNk1hcCkge1xuICAgICAgICBlbnRyaWVzID0gbWFwVG9FbnRyaWVzKG9iaik7XG4gICAgICAgIGlzTWFwID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIga2V5cyA9IGVzNS5rZXlzKG9iaik7XG4gICAgICAgIHZhciBsZW4gPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgZW50cmllcyA9IG5ldyBBcnJheShsZW4gKiAyKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgICBlbnRyaWVzW2ldID0gb2JqW2tleV07XG4gICAgICAgICAgICBlbnRyaWVzW2kgKyBsZW5dID0ga2V5O1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMuY29uc3RydWN0b3IkKGVudHJpZXMpO1xuICAgIHRoaXMuX2lzTWFwID0gaXNNYXA7XG4gICAgdGhpcy5faW5pdCQodW5kZWZpbmVkLCBpc01hcCA/IC02IDogLTMpO1xufVxudXRpbC5pbmhlcml0cyhQcm9wZXJ0aWVzUHJvbWlzZUFycmF5LCBQcm9taXNlQXJyYXkpO1xuXG5Qcm9wZXJ0aWVzUHJvbWlzZUFycmF5LnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uICgpIHt9O1xuXG5Qcm9wZXJ0aWVzUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZUZ1bGZpbGxlZCA9IGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICB0aGlzLl92YWx1ZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgdmFyIHRvdGFsUmVzb2x2ZWQgPSArK3RoaXMuX3RvdGFsUmVzb2x2ZWQ7XG4gICAgaWYgKHRvdGFsUmVzb2x2ZWQgPj0gdGhpcy5fbGVuZ3RoKSB7XG4gICAgICAgIHZhciB2YWw7XG4gICAgICAgIGlmICh0aGlzLl9pc01hcCkge1xuICAgICAgICAgICAgdmFsID0gZW50cmllc1RvTWFwKHRoaXMuX3ZhbHVlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWwgPSB7fTtcbiAgICAgICAgICAgIHZhciBrZXlPZmZzZXQgPSB0aGlzLmxlbmd0aCgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoKCk7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgICAgIHZhbFt0aGlzLl92YWx1ZXNbaSArIGtleU9mZnNldF1dID0gdGhpcy5fdmFsdWVzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Jlc29sdmUodmFsKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn07XG5cblByb3BlcnRpZXNQcm9taXNlQXJyYXkucHJvdG90eXBlLnNob3VsZENvcHlWYWx1ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xufTtcblxuUHJvcGVydGllc1Byb21pc2VBcnJheS5wcm90b3R5cGUuZ2V0QWN0dWFsTGVuZ3RoID0gZnVuY3Rpb24gKGxlbikge1xuICAgIHJldHVybiBsZW4gPj4gMTtcbn07XG5cbmZ1bmN0aW9uIHByb3BzKHByb21pc2VzKSB7XG4gICAgdmFyIHJldDtcbiAgICB2YXIgY2FzdFZhbHVlID0gdHJ5Q29udmVydFRvUHJvbWlzZShwcm9taXNlcyk7XG5cbiAgICBpZiAoIWlzT2JqZWN0KGNhc3RWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGFwaVJlamVjdGlvbihcImNhbm5vdCBhd2FpdCBwcm9wZXJ0aWVzIG9mIGEgbm9uLW9iamVjdFxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL01xckZtWFxcdTAwMGFcIik7XG4gICAgfSBlbHNlIGlmIChjYXN0VmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHJldCA9IGNhc3RWYWx1ZS5fdGhlbihcbiAgICAgICAgICAgIFByb21pc2UucHJvcHMsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0ID0gbmV3IFByb3BlcnRpZXNQcm9taXNlQXJyYXkoY2FzdFZhbHVlKS5wcm9taXNlKCk7XG4gICAgfVxuXG4gICAgaWYgKGNhc3RWYWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgcmV0Ll9wcm9wYWdhdGVGcm9tKGNhc3RWYWx1ZSwgMik7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cblByb21pc2UucHJvdG90eXBlLnByb3BzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBwcm9wcyh0aGlzKTtcbn07XG5cblByb21pc2UucHJvcHMgPSBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gcHJvcHMocHJvbWlzZXMpO1xufTtcbn07XG5cbn0se1wiLi9lczVcIjoxMyxcIi4vdXRpbFwiOjM2fV0sMjY6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBhcnJheU1vdmUoc3JjLCBzcmNJbmRleCwgZHN0LCBkc3RJbmRleCwgbGVuKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBsZW47ICsraikge1xuICAgICAgICBkc3RbaiArIGRzdEluZGV4XSA9IHNyY1tqICsgc3JjSW5kZXhdO1xuICAgICAgICBzcmNbaiArIHNyY0luZGV4XSA9IHZvaWQgMDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIFF1ZXVlKGNhcGFjaXR5KSB7XG4gICAgdGhpcy5fY2FwYWNpdHkgPSBjYXBhY2l0eTtcbiAgICB0aGlzLl9sZW5ndGggPSAwO1xuICAgIHRoaXMuX2Zyb250ID0gMDtcbn1cblxuUXVldWUucHJvdG90eXBlLl93aWxsQmVPdmVyQ2FwYWNpdHkgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICAgIHJldHVybiB0aGlzLl9jYXBhY2l0eSA8IHNpemU7XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUuX3B1c2hPbmUgPSBmdW5jdGlvbiAoYXJnKSB7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgdGhpcy5fY2hlY2tDYXBhY2l0eShsZW5ndGggKyAxKTtcbiAgICB2YXIgaSA9ICh0aGlzLl9mcm9udCArIGxlbmd0aCkgJiAodGhpcy5fY2FwYWNpdHkgLSAxKTtcbiAgICB0aGlzW2ldID0gYXJnO1xuICAgIHRoaXMuX2xlbmd0aCA9IGxlbmd0aCArIDE7XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uIChmbiwgcmVjZWl2ZXIsIGFyZykge1xuICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCgpICsgMztcbiAgICBpZiAodGhpcy5fd2lsbEJlT3ZlckNhcGFjaXR5KGxlbmd0aCkpIHtcbiAgICAgICAgdGhpcy5fcHVzaE9uZShmbik7XG4gICAgICAgIHRoaXMuX3B1c2hPbmUocmVjZWl2ZXIpO1xuICAgICAgICB0aGlzLl9wdXNoT25lKGFyZyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGogPSB0aGlzLl9mcm9udCArIGxlbmd0aCAtIDM7XG4gICAgdGhpcy5fY2hlY2tDYXBhY2l0eShsZW5ndGgpO1xuICAgIHZhciB3cmFwTWFzayA9IHRoaXMuX2NhcGFjaXR5IC0gMTtcbiAgICB0aGlzWyhqICsgMCkgJiB3cmFwTWFza10gPSBmbjtcbiAgICB0aGlzWyhqICsgMSkgJiB3cmFwTWFza10gPSByZWNlaXZlcjtcbiAgICB0aGlzWyhqICsgMikgJiB3cmFwTWFza10gPSBhcmc7XG4gICAgdGhpcy5fbGVuZ3RoID0gbGVuZ3RoO1xufTtcblxuUXVldWUucHJvdG90eXBlLnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmcm9udCA9IHRoaXMuX2Zyb250LFxuICAgICAgICByZXQgPSB0aGlzW2Zyb250XTtcblxuICAgIHRoaXNbZnJvbnRdID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX2Zyb250ID0gKGZyb250ICsgMSkgJiAodGhpcy5fY2FwYWNpdHkgLSAxKTtcbiAgICB0aGlzLl9sZW5ndGgtLTtcbiAgICByZXR1cm4gcmV0O1xufTtcblxuUXVldWUucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xufTtcblxuUXVldWUucHJvdG90eXBlLl9jaGVja0NhcGFjaXR5ID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgICBpZiAodGhpcy5fY2FwYWNpdHkgPCBzaXplKSB7XG4gICAgICAgIHRoaXMuX3Jlc2l6ZVRvKHRoaXMuX2NhcGFjaXR5IDw8IDEpO1xuICAgIH1cbn07XG5cblF1ZXVlLnByb3RvdHlwZS5fcmVzaXplVG8gPSBmdW5jdGlvbiAoY2FwYWNpdHkpIHtcbiAgICB2YXIgb2xkQ2FwYWNpdHkgPSB0aGlzLl9jYXBhY2l0eTtcbiAgICB0aGlzLl9jYXBhY2l0eSA9IGNhcGFjaXR5O1xuICAgIHZhciBmcm9udCA9IHRoaXMuX2Zyb250O1xuICAgIHZhciBsZW5ndGggPSB0aGlzLl9sZW5ndGg7XG4gICAgdmFyIG1vdmVJdGVtc0NvdW50ID0gKGZyb250ICsgbGVuZ3RoKSAmIChvbGRDYXBhY2l0eSAtIDEpO1xuICAgIGFycmF5TW92ZSh0aGlzLCAwLCB0aGlzLCBvbGRDYXBhY2l0eSwgbW92ZUl0ZW1zQ291bnQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWV1ZTtcblxufSx7fV0sMjc6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFxuICAgIFByb21pc2UsIElOVEVSTkFMLCB0cnlDb252ZXJ0VG9Qcm9taXNlLCBhcGlSZWplY3Rpb24pIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcblxudmFyIHJhY2VMYXRlciA9IGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgcmV0dXJuIHByb21pc2UudGhlbihmdW5jdGlvbihhcnJheSkge1xuICAgICAgICByZXR1cm4gcmFjZShhcnJheSwgcHJvbWlzZSk7XG4gICAgfSk7XG59O1xuXG5mdW5jdGlvbiByYWNlKHByb21pc2VzLCBwYXJlbnQpIHtcbiAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShwcm9taXNlcyk7XG5cbiAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICByZXR1cm4gcmFjZUxhdGVyKG1heWJlUHJvbWlzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcHJvbWlzZXMgPSB1dGlsLmFzQXJyYXkocHJvbWlzZXMpO1xuICAgICAgICBpZiAocHJvbWlzZXMgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gYXBpUmVqZWN0aW9uKFwiZXhwZWN0aW5nIGFuIGFycmF5IG9yIGFuIGl0ZXJhYmxlIG9iamVjdCBidXQgZ290IFwiICsgdXRpbC5jbGFzc1N0cmluZyhwcm9taXNlcykpO1xuICAgIH1cblxuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgaWYgKHBhcmVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldC5fcHJvcGFnYXRlRnJvbShwYXJlbnQsIDMpO1xuICAgIH1cbiAgICB2YXIgZnVsZmlsbCA9IHJldC5fZnVsZmlsbDtcbiAgICB2YXIgcmVqZWN0ID0gcmV0Ll9yZWplY3Q7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHByb21pc2VzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIHZhciB2YWwgPSBwcm9taXNlc1tpXTtcblxuICAgICAgICBpZiAodmFsID09PSB1bmRlZmluZWQgJiYgIShpIGluIHByb21pc2VzKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBQcm9taXNlLmNhc3QodmFsKS5fdGhlbihmdWxmaWxsLCByZWplY3QsIHVuZGVmaW5lZCwgcmV0LCBudWxsKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuUHJvbWlzZS5yYWNlID0gZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHJhY2UocHJvbWlzZXMsIHVuZGVmaW5lZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5yYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiByYWNlKHRoaXMsIHVuZGVmaW5lZCk7XG59O1xuXG59O1xuXG59LHtcIi4vdXRpbFwiOjM2fV0sMjg6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2VBcnJheSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXBpUmVqZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0cnlDb252ZXJ0VG9Qcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBJTlRFUk5BTCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcpIHtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnZhciB0cnlDYXRjaCA9IHV0aWwudHJ5Q2F0Y2g7XG5cbmZ1bmN0aW9uIFJlZHVjdGlvblByb21pc2VBcnJheShwcm9taXNlcywgZm4sIGluaXRpYWxWYWx1ZSwgX2VhY2gpIHtcbiAgICB0aGlzLmNvbnN0cnVjdG9yJChwcm9taXNlcyk7XG4gICAgdmFyIGNvbnRleHQgPSBQcm9taXNlLl9nZXRDb250ZXh0KCk7XG4gICAgdGhpcy5fZm4gPSB1dGlsLmNvbnRleHRCaW5kKGNvbnRleHQsIGZuKTtcbiAgICBpZiAoaW5pdGlhbFZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaW5pdGlhbFZhbHVlID0gUHJvbWlzZS5yZXNvbHZlKGluaXRpYWxWYWx1ZSk7XG4gICAgICAgIGluaXRpYWxWYWx1ZS5fYXR0YWNoQ2FuY2VsbGF0aW9uQ2FsbGJhY2sodGhpcyk7XG4gICAgfVxuICAgIHRoaXMuX2luaXRpYWxWYWx1ZSA9IGluaXRpYWxWYWx1ZTtcbiAgICB0aGlzLl9jdXJyZW50Q2FuY2VsbGFibGUgPSBudWxsO1xuICAgIGlmKF9lYWNoID09PSBJTlRFUk5BTCkge1xuICAgICAgICB0aGlzLl9lYWNoVmFsdWVzID0gQXJyYXkodGhpcy5fbGVuZ3RoKTtcbiAgICB9IGVsc2UgaWYgKF9lYWNoID09PSAwKSB7XG4gICAgICAgIHRoaXMuX2VhY2hWYWx1ZXMgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2VhY2hWYWx1ZXMgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMuX3Byb21pc2UuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgdGhpcy5faW5pdCQodW5kZWZpbmVkLCAtNSk7XG59XG51dGlsLmluaGVyaXRzKFJlZHVjdGlvblByb21pc2VBcnJheSwgUHJvbWlzZUFycmF5KTtcblxuUmVkdWN0aW9uUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fZ290QWNjdW0gPSBmdW5jdGlvbihhY2N1bSkge1xuICAgIGlmICh0aGlzLl9lYWNoVmFsdWVzICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgdGhpcy5fZWFjaFZhbHVlcyAhPT0gbnVsbCAmJlxuICAgICAgICBhY2N1bSAhPT0gSU5URVJOQUwpIHtcbiAgICAgICAgdGhpcy5fZWFjaFZhbHVlcy5wdXNoKGFjY3VtKTtcbiAgICB9XG59O1xuXG5SZWR1Y3Rpb25Qcm9taXNlQXJyYXkucHJvdG90eXBlLl9lYWNoQ29tcGxldGUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIGlmICh0aGlzLl9lYWNoVmFsdWVzICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuX2VhY2hWYWx1ZXMucHVzaCh2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9lYWNoVmFsdWVzO1xufTtcblxuUmVkdWN0aW9uUHJvbWlzZUFycmF5LnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCkge307XG5cblJlZHVjdGlvblByb21pc2VBcnJheS5wcm90b3R5cGUuX3Jlc29sdmVFbXB0eUFycmF5ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fcmVzb2x2ZSh0aGlzLl9lYWNoVmFsdWVzICE9PSB1bmRlZmluZWQgPyB0aGlzLl9lYWNoVmFsdWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLl9pbml0aWFsVmFsdWUpO1xufTtcblxuUmVkdWN0aW9uUHJvbWlzZUFycmF5LnByb3RvdHlwZS5zaG91bGRDb3B5VmFsdWVzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmYWxzZTtcbn07XG5cblJlZHVjdGlvblByb21pc2VBcnJheS5wcm90b3R5cGUuX3Jlc29sdmUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHRoaXMuX3Byb21pc2UuX3Jlc29sdmVDYWxsYmFjayh2YWx1ZSk7XG4gICAgdGhpcy5fdmFsdWVzID0gbnVsbDtcbn07XG5cblJlZHVjdGlvblByb21pc2VBcnJheS5wcm90b3R5cGUuX3Jlc3VsdENhbmNlbGxlZCA9IGZ1bmN0aW9uKHNlbmRlcikge1xuICAgIGlmIChzZW5kZXIgPT09IHRoaXMuX2luaXRpYWxWYWx1ZSkgcmV0dXJuIHRoaXMuX2NhbmNlbCgpO1xuICAgIGlmICh0aGlzLl9pc1Jlc29sdmVkKCkpIHJldHVybjtcbiAgICB0aGlzLl9yZXN1bHRDYW5jZWxsZWQkKCk7XG4gICAgaWYgKHRoaXMuX2N1cnJlbnRDYW5jZWxsYWJsZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgdGhpcy5fY3VycmVudENhbmNlbGxhYmxlLmNhbmNlbCgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5faW5pdGlhbFZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICB0aGlzLl9pbml0aWFsVmFsdWUuY2FuY2VsKCk7XG4gICAgfVxufTtcblxuUmVkdWN0aW9uUHJvbWlzZUFycmF5LnByb3RvdHlwZS5faXRlcmF0ZSA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICB0aGlzLl92YWx1ZXMgPSB2YWx1ZXM7XG4gICAgdmFyIHZhbHVlO1xuICAgIHZhciBpO1xuICAgIHZhciBsZW5ndGggPSB2YWx1ZXMubGVuZ3RoO1xuICAgIGlmICh0aGlzLl9pbml0aWFsVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YWx1ZSA9IHRoaXMuX2luaXRpYWxWYWx1ZTtcbiAgICAgICAgaSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBQcm9taXNlLnJlc29sdmUodmFsdWVzWzBdKTtcbiAgICAgICAgaSA9IDE7XG4gICAgfVxuXG4gICAgdGhpcy5fY3VycmVudENhbmNlbGxhYmxlID0gdmFsdWU7XG5cbiAgICBmb3IgKHZhciBqID0gaTsgaiA8IGxlbmd0aDsgKytqKSB7XG4gICAgICAgIHZhciBtYXliZVByb21pc2UgPSB2YWx1ZXNbal07XG4gICAgICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICBtYXliZVByb21pc2Uuc3VwcHJlc3NVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXZhbHVlLmlzUmVqZWN0ZWQoKSkge1xuICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgY3R4ID0ge1xuICAgICAgICAgICAgICAgIGFjY3VtOiBudWxsLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZXNbaV0sXG4gICAgICAgICAgICAgICAgaW5kZXg6IGksXG4gICAgICAgICAgICAgICAgbGVuZ3RoOiBsZW5ndGgsXG4gICAgICAgICAgICAgICAgYXJyYXk6IHRoaXNcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuX3RoZW4oZ290QWNjdW0sIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjdHgsIHVuZGVmaW5lZCk7XG5cbiAgICAgICAgICAgIGlmICgoaSAmIDEyNykgPT09IDApIHtcbiAgICAgICAgICAgICAgICB2YWx1ZS5fc2V0Tm9Bc3luY0d1YXJhbnRlZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2VhY2hWYWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlXG4gICAgICAgICAgICAuX3RoZW4odGhpcy5fZWFjaENvbXBsZXRlLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdGhpcywgdW5kZWZpbmVkKTtcbiAgICB9XG4gICAgdmFsdWUuX3RoZW4oY29tcGxldGVkLCBjb21wbGV0ZWQsIHVuZGVmaW5lZCwgdmFsdWUsIHRoaXMpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGZuLCBpbml0aWFsVmFsdWUpIHtcbiAgICByZXR1cm4gcmVkdWNlKHRoaXMsIGZuLCBpbml0aWFsVmFsdWUsIG51bGwpO1xufTtcblxuUHJvbWlzZS5yZWR1Y2UgPSBmdW5jdGlvbiAocHJvbWlzZXMsIGZuLCBpbml0aWFsVmFsdWUsIF9lYWNoKSB7XG4gICAgcmV0dXJuIHJlZHVjZShwcm9taXNlcywgZm4sIGluaXRpYWxWYWx1ZSwgX2VhY2gpO1xufTtcblxuZnVuY3Rpb24gY29tcGxldGVkKHZhbHVlT3JSZWFzb24sIGFycmF5KSB7XG4gICAgaWYgKHRoaXMuaXNGdWxmaWxsZWQoKSkge1xuICAgICAgICBhcnJheS5fcmVzb2x2ZSh2YWx1ZU9yUmVhc29uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBhcnJheS5fcmVqZWN0KHZhbHVlT3JSZWFzb24pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVkdWNlKHByb21pc2VzLCBmbiwgaW5pdGlhbFZhbHVlLCBfZWFjaCkge1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gYXBpUmVqZWN0aW9uKFwiZXhwZWN0aW5nIGEgZnVuY3Rpb24gYnV0IGdvdCBcIiArIHV0aWwuY2xhc3NTdHJpbmcoZm4pKTtcbiAgICB9XG4gICAgdmFyIGFycmF5ID0gbmV3IFJlZHVjdGlvblByb21pc2VBcnJheShwcm9taXNlcywgZm4sIGluaXRpYWxWYWx1ZSwgX2VhY2gpO1xuICAgIHJldHVybiBhcnJheS5wcm9taXNlKCk7XG59XG5cbmZ1bmN0aW9uIGdvdEFjY3VtKGFjY3VtKSB7XG4gICAgdGhpcy5hY2N1bSA9IGFjY3VtO1xuICAgIHRoaXMuYXJyYXkuX2dvdEFjY3VtKGFjY3VtKTtcbiAgICB2YXIgdmFsdWUgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHRoaXMudmFsdWUsIHRoaXMuYXJyYXkuX3Byb21pc2UpO1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgdGhpcy5hcnJheS5fY3VycmVudENhbmNlbGxhYmxlID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB2YWx1ZS5fdGhlbihnb3RWYWx1ZSwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHRoaXMsIHVuZGVmaW5lZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGdvdFZhbHVlLmNhbGwodGhpcywgdmFsdWUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ290VmFsdWUodmFsdWUpIHtcbiAgICB2YXIgYXJyYXkgPSB0aGlzLmFycmF5O1xuICAgIHZhciBwcm9taXNlID0gYXJyYXkuX3Byb21pc2U7XG4gICAgdmFyIGZuID0gdHJ5Q2F0Y2goYXJyYXkuX2ZuKTtcbiAgICBwcm9taXNlLl9wdXNoQ29udGV4dCgpO1xuICAgIHZhciByZXQ7XG4gICAgaWYgKGFycmF5Ll9lYWNoVmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0ID0gZm4uY2FsbChwcm9taXNlLl9ib3VuZFZhbHVlKCksIHZhbHVlLCB0aGlzLmluZGV4LCB0aGlzLmxlbmd0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0ID0gZm4uY2FsbChwcm9taXNlLl9ib3VuZFZhbHVlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjY3VtLCB2YWx1ZSwgdGhpcy5pbmRleCwgdGhpcy5sZW5ndGgpO1xuICAgIH1cbiAgICBpZiAocmV0IGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICBhcnJheS5fY3VycmVudENhbmNlbGxhYmxlID0gcmV0O1xuICAgIH1cbiAgICB2YXIgcHJvbWlzZUNyZWF0ZWQgPSBwcm9taXNlLl9wb3BDb250ZXh0KCk7XG4gICAgZGVidWcuY2hlY2tGb3Jnb3R0ZW5SZXR1cm5zKFxuICAgICAgICByZXQsXG4gICAgICAgIHByb21pc2VDcmVhdGVkLFxuICAgICAgICBhcnJheS5fZWFjaFZhbHVlcyAhPT0gdW5kZWZpbmVkID8gXCJQcm9taXNlLmVhY2hcIiA6IFwiUHJvbWlzZS5yZWR1Y2VcIixcbiAgICAgICAgcHJvbWlzZVxuICAgICk7XG4gICAgcmV0dXJuIHJldDtcbn1cbn07XG5cbn0se1wiLi91dGlsXCI6MzZ9XSwyOTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciB1dGlsID0gX2RlcmVxXyhcIi4vdXRpbFwiKTtcbnZhciBzY2hlZHVsZTtcbnZhciBub0FzeW5jU2NoZWR1bGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gYXN5bmMgc2NoZWR1bGVyIGF2YWlsYWJsZVxcdTAwMGFcXHUwMDBhICAgIFNlZSBodHRwOi8vZ29vLmdsL01xckZtWFxcdTAwMGFcIik7XG59O1xudmFyIE5hdGl2ZVByb21pc2UgPSB1dGlsLmdldE5hdGl2ZVByb21pc2UoKTtcbmlmICh1dGlsLmlzTm9kZSAmJiB0eXBlb2YgTXV0YXRpb25PYnNlcnZlciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHZhciBHbG9iYWxTZXRJbW1lZGlhdGUgPSBnbG9iYWwuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBQcm9jZXNzTmV4dFRpY2sgPSBwcm9jZXNzLm5leHRUaWNrO1xuICAgIHNjaGVkdWxlID0gdXRpbC5pc1JlY2VudE5vZGVcbiAgICAgICAgICAgICAgICA/IGZ1bmN0aW9uKGZuKSB7IEdsb2JhbFNldEltbWVkaWF0ZS5jYWxsKGdsb2JhbCwgZm4pOyB9XG4gICAgICAgICAgICAgICAgOiBmdW5jdGlvbihmbikgeyBQcm9jZXNzTmV4dFRpY2suY2FsbChwcm9jZXNzLCBmbik7IH07XG59IGVsc2UgaWYgKHR5cGVvZiBOYXRpdmVQcm9taXNlID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgICAgdHlwZW9mIE5hdGl2ZVByb21pc2UucmVzb2x2ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdmFyIG5hdGl2ZVByb21pc2UgPSBOYXRpdmVQcm9taXNlLnJlc29sdmUoKTtcbiAgICBzY2hlZHVsZSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgIG5hdGl2ZVByb21pc2UudGhlbihmbik7XG4gICAgfTtcbn0gZWxzZSBpZiAoKHR5cGVvZiBNdXRhdGlvbk9ic2VydmVyICE9PSBcInVuZGVmaW5lZFwiKSAmJlxuICAgICAgICAgICEodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRvciAmJlxuICAgICAgICAgICAgKHdpbmRvdy5uYXZpZ2F0b3Iuc3RhbmRhbG9uZSB8fCB3aW5kb3cuY29yZG92YSkpICYmXG4gICAgICAgICAgKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSkge1xuICAgIHNjaGVkdWxlID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdmFyIG9wdHMgPSB7YXR0cmlidXRlczogdHJ1ZX07XG4gICAgICAgIHZhciB0b2dnbGVTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIGRpdjIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB2YXIgbzIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRpdi5jbGFzc0xpc3QudG9nZ2xlKFwiZm9vXCIpO1xuICAgICAgICAgICAgdG9nZ2xlU2NoZWR1bGVkID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICBvMi5vYnNlcnZlKGRpdjIsIG9wdHMpO1xuXG4gICAgICAgIHZhciBzY2hlZHVsZVRvZ2dsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHRvZ2dsZVNjaGVkdWxlZCkgcmV0dXJuO1xuICAgICAgICAgICAgdG9nZ2xlU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGRpdjIuY2xhc3NMaXN0LnRvZ2dsZShcImZvb1wiKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gc2NoZWR1bGUoZm4pIHtcbiAgICAgICAgICAgIHZhciBvID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgby5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgby5vYnNlcnZlKGRpdiwgb3B0cyk7XG4gICAgICAgICAgICBzY2hlZHVsZVRvZ2dsZSgpO1xuICAgICAgICB9O1xuICAgIH0pKCk7XG59IGVsc2UgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBzY2hlZHVsZSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICBzZXRJbW1lZGlhdGUoZm4pO1xuICAgIH07XG59IGVsc2UgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgc2NoZWR1bGUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgc2NoZWR1bGUgPSBub0FzeW5jU2NoZWR1bGVyO1xufVxubW9kdWxlLmV4cG9ydHMgPSBzY2hlZHVsZTtcblxufSx7XCIuL3V0aWxcIjozNn1dLDMwOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPVxuICAgIGZ1bmN0aW9uKFByb21pc2UsIFByb21pc2VBcnJheSwgZGVidWcpIHtcbnZhciBQcm9taXNlSW5zcGVjdGlvbiA9IFByb21pc2UuUHJvbWlzZUluc3BlY3Rpb247XG52YXIgdXRpbCA9IF9kZXJlcV8oXCIuL3V0aWxcIik7XG5cbmZ1bmN0aW9uIFNldHRsZWRQcm9taXNlQXJyYXkodmFsdWVzKSB7XG4gICAgdGhpcy5jb25zdHJ1Y3RvciQodmFsdWVzKTtcbn1cbnV0aWwuaW5oZXJpdHMoU2V0dGxlZFByb21pc2VBcnJheSwgUHJvbWlzZUFycmF5KTtcblxuU2V0dGxlZFByb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VSZXNvbHZlZCA9IGZ1bmN0aW9uIChpbmRleCwgaW5zcGVjdGlvbikge1xuICAgIHRoaXMuX3ZhbHVlc1tpbmRleF0gPSBpbnNwZWN0aW9uO1xuICAgIHZhciB0b3RhbFJlc29sdmVkID0gKyt0aGlzLl90b3RhbFJlc29sdmVkO1xuICAgIGlmICh0b3RhbFJlc29sdmVkID49IHRoaXMuX2xlbmd0aCkge1xuICAgICAgICB0aGlzLl9yZXNvbHZlKHRoaXMuX3ZhbHVlcyk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG5TZXR0bGVkUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZUZ1bGZpbGxlZCA9IGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICB2YXIgcmV0ID0gbmV3IFByb21pc2VJbnNwZWN0aW9uKCk7XG4gICAgcmV0Ll9iaXRGaWVsZCA9IDMzNTU0NDMyO1xuICAgIHJldC5fc2V0dGxlZFZhbHVlRmllbGQgPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcy5fcHJvbWlzZVJlc29sdmVkKGluZGV4LCByZXQpO1xufTtcblNldHRsZWRQcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlUmVqZWN0ZWQgPSBmdW5jdGlvbiAocmVhc29uLCBpbmRleCkge1xuICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZUluc3BlY3Rpb24oKTtcbiAgICByZXQuX2JpdEZpZWxkID0gMTY3NzcyMTY7XG4gICAgcmV0Ll9zZXR0bGVkVmFsdWVGaWVsZCA9IHJlYXNvbjtcbiAgICByZXR1cm4gdGhpcy5fcHJvbWlzZVJlc29sdmVkKGluZGV4LCByZXQpO1xufTtcblxuUHJvbWlzZS5zZXR0bGUgPSBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICBkZWJ1Zy5kZXByZWNhdGVkKFwiLnNldHRsZSgpXCIsIFwiLnJlZmxlY3QoKVwiKTtcbiAgICByZXR1cm4gbmV3IFNldHRsZWRQcm9taXNlQXJyYXkocHJvbWlzZXMpLnByb21pc2UoKTtcbn07XG5cblByb21pc2UuYWxsU2V0dGxlZCA9IGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgIHJldHVybiBuZXcgU2V0dGxlZFByb21pc2VBcnJheShwcm9taXNlcykucHJvbWlzZSgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc2V0dGxlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBQcm9taXNlLnNldHRsZSh0aGlzKTtcbn07XG59O1xuXG59LHtcIi4vdXRpbFwiOjM2fV0sMzE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9XG5mdW5jdGlvbihQcm9taXNlLCBQcm9taXNlQXJyYXksIGFwaVJlamVjdGlvbikge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsXCIpO1xudmFyIFJhbmdlRXJyb3IgPSBfZGVyZXFfKFwiLi9lcnJvcnNcIikuUmFuZ2VFcnJvcjtcbnZhciBBZ2dyZWdhdGVFcnJvciA9IF9kZXJlcV8oXCIuL2Vycm9yc1wiKS5BZ2dyZWdhdGVFcnJvcjtcbnZhciBpc0FycmF5ID0gdXRpbC5pc0FycmF5O1xudmFyIENBTkNFTExBVElPTiA9IHt9O1xuXG5cbmZ1bmN0aW9uIFNvbWVQcm9taXNlQXJyYXkodmFsdWVzKSB7XG4gICAgdGhpcy5jb25zdHJ1Y3RvciQodmFsdWVzKTtcbiAgICB0aGlzLl9ob3dNYW55ID0gMDtcbiAgICB0aGlzLl91bndyYXAgPSBmYWxzZTtcbiAgICB0aGlzLl9pbml0aWFsaXplZCA9IGZhbHNlO1xufVxudXRpbC5pbmhlcml0cyhTb21lUHJvbWlzZUFycmF5LCBQcm9taXNlQXJyYXkpO1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuX2luaXRpYWxpemVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2hvd01hbnkgPT09IDApIHtcbiAgICAgICAgdGhpcy5fcmVzb2x2ZShbXSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5faW5pdCQodW5kZWZpbmVkLCAtNSk7XG4gICAgdmFyIGlzQXJyYXlSZXNvbHZlZCA9IGlzQXJyYXkodGhpcy5fdmFsdWVzKTtcbiAgICBpZiAoIXRoaXMuX2lzUmVzb2x2ZWQoKSAmJlxuICAgICAgICBpc0FycmF5UmVzb2x2ZWQgJiZcbiAgICAgICAgdGhpcy5faG93TWFueSA+IHRoaXMuX2NhblBvc3NpYmx5RnVsZmlsbCgpKSB7XG4gICAgICAgIHRoaXMuX3JlamVjdCh0aGlzLl9nZXRSYW5nZUVycm9yKHRoaXMubGVuZ3RoKCkpKTtcbiAgICB9XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB0aGlzLl9pbml0KCk7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5zZXRVbndyYXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fdW53cmFwID0gdHJ1ZTtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLmhvd01hbnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hvd01hbnk7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5zZXRIb3dNYW55ID0gZnVuY3Rpb24gKGNvdW50KSB7XG4gICAgdGhpcy5faG93TWFueSA9IGNvdW50O1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX3Byb21pc2VGdWxmaWxsZWQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLl9hZGRGdWxmaWxsZWQodmFsdWUpO1xuICAgIGlmICh0aGlzLl9mdWxmaWxsZWQoKSA9PT0gdGhpcy5ob3dNYW55KCkpIHtcbiAgICAgICAgdGhpcy5fdmFsdWVzLmxlbmd0aCA9IHRoaXMuaG93TWFueSgpO1xuICAgICAgICBpZiAodGhpcy5ob3dNYW55KCkgPT09IDEgJiYgdGhpcy5fdW53cmFwKSB7XG4gICAgICAgICAgICB0aGlzLl9yZXNvbHZlKHRoaXMuX3ZhbHVlc1swXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZXNvbHZlKHRoaXMuX3ZhbHVlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcblxufTtcblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9wcm9taXNlUmVqZWN0ZWQgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgdGhpcy5fYWRkUmVqZWN0ZWQocmVhc29uKTtcbiAgICByZXR1cm4gdGhpcy5fY2hlY2tPdXRjb21lKCk7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fcHJvbWlzZUNhbmNlbGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fdmFsdWVzIGluc3RhbmNlb2YgUHJvbWlzZSB8fCB0aGlzLl92YWx1ZXMgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2FuY2VsKCk7XG4gICAgfVxuICAgIHRoaXMuX2FkZFJlamVjdGVkKENBTkNFTExBVElPTik7XG4gICAgcmV0dXJuIHRoaXMuX2NoZWNrT3V0Y29tZSgpO1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX2NoZWNrT3V0Y29tZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmhvd01hbnkoKSA+IHRoaXMuX2NhblBvc3NpYmx5RnVsZmlsbCgpKSB7XG4gICAgICAgIHZhciBlID0gbmV3IEFnZ3JlZ2F0ZUVycm9yKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLmxlbmd0aCgpOyBpIDwgdGhpcy5fdmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fdmFsdWVzW2ldICE9PSBDQU5DRUxMQVRJT04pIHtcbiAgICAgICAgICAgICAgICBlLnB1c2godGhpcy5fdmFsdWVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWplY3QoZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jYW5jZWwoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX2Z1bGZpbGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fdG90YWxSZXNvbHZlZDtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9yZWplY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLmxlbmd0aCAtIHRoaXMubGVuZ3RoKCk7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fYWRkUmVqZWN0ZWQgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgdGhpcy5fdmFsdWVzLnB1c2gocmVhc29uKTtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9hZGRGdWxmaWxsZWQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLl92YWx1ZXNbdGhpcy5fdG90YWxSZXNvbHZlZCsrXSA9IHZhbHVlO1xufTtcblxuU29tZVByb21pc2VBcnJheS5wcm90b3R5cGUuX2NhblBvc3NpYmx5RnVsZmlsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5sZW5ndGgoKSAtIHRoaXMuX3JlamVjdGVkKCk7XG59O1xuXG5Tb21lUHJvbWlzZUFycmF5LnByb3RvdHlwZS5fZ2V0UmFuZ2VFcnJvciA9IGZ1bmN0aW9uIChjb3VudCkge1xuICAgIHZhciBtZXNzYWdlID0gXCJJbnB1dCBhcnJheSBtdXN0IGNvbnRhaW4gYXQgbGVhc3QgXCIgK1xuICAgICAgICAgICAgdGhpcy5faG93TWFueSArIFwiIGl0ZW1zIGJ1dCBjb250YWlucyBvbmx5IFwiICsgY291bnQgKyBcIiBpdGVtc1wiO1xuICAgIHJldHVybiBuZXcgUmFuZ2VFcnJvcihtZXNzYWdlKTtcbn07XG5cblNvbWVQcm9taXNlQXJyYXkucHJvdG90eXBlLl9yZXNvbHZlRW1wdHlBcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9yZWplY3QodGhpcy5fZ2V0UmFuZ2VFcnJvcigwKSk7XG59O1xuXG5mdW5jdGlvbiBzb21lKHByb21pc2VzLCBob3dNYW55KSB7XG4gICAgaWYgKChob3dNYW55IHwgMCkgIT09IGhvd01hbnkgfHwgaG93TWFueSA8IDApIHtcbiAgICAgICAgcmV0dXJuIGFwaVJlamVjdGlvbihcImV4cGVjdGluZyBhIHBvc2l0aXZlIGludGVnZXJcXHUwMDBhXFx1MDAwYSAgICBTZWUgaHR0cDovL2dvby5nbC9NcXJGbVhcXHUwMDBhXCIpO1xuICAgIH1cbiAgICB2YXIgcmV0ID0gbmV3IFNvbWVQcm9taXNlQXJyYXkocHJvbWlzZXMpO1xuICAgIHZhciBwcm9taXNlID0gcmV0LnByb21pc2UoKTtcbiAgICByZXQuc2V0SG93TWFueShob3dNYW55KTtcbiAgICByZXQuaW5pdCgpO1xuICAgIHJldHVybiBwcm9taXNlO1xufVxuXG5Qcm9taXNlLnNvbWUgPSBmdW5jdGlvbiAocHJvbWlzZXMsIGhvd01hbnkpIHtcbiAgICByZXR1cm4gc29tZShwcm9taXNlcywgaG93TWFueSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zb21lID0gZnVuY3Rpb24gKGhvd01hbnkpIHtcbiAgICByZXR1cm4gc29tZSh0aGlzLCBob3dNYW55KTtcbn07XG5cblByb21pc2UuX1NvbWVQcm9taXNlQXJyYXkgPSBTb21lUHJvbWlzZUFycmF5O1xufTtcblxufSx7XCIuL2Vycm9yc1wiOjEyLFwiLi91dGlsXCI6MzZ9XSwzMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvbWlzZSkge1xuZnVuY3Rpb24gUHJvbWlzZUluc3BlY3Rpb24ocHJvbWlzZSkge1xuICAgIGlmIChwcm9taXNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcHJvbWlzZSA9IHByb21pc2UuX3RhcmdldCgpO1xuICAgICAgICB0aGlzLl9iaXRGaWVsZCA9IHByb21pc2UuX2JpdEZpZWxkO1xuICAgICAgICB0aGlzLl9zZXR0bGVkVmFsdWVGaWVsZCA9IHByb21pc2UuX2lzRmF0ZVNlYWxlZCgpXG4gICAgICAgICAgICA/IHByb21pc2UuX3NldHRsZWRWYWx1ZSgpIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5fYml0RmllbGQgPSAwO1xuICAgICAgICB0aGlzLl9zZXR0bGVkVmFsdWVGaWVsZCA9IHVuZGVmaW5lZDtcbiAgICB9XG59XG5cblByb21pc2VJbnNwZWN0aW9uLnByb3RvdHlwZS5fc2V0dGxlZFZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NldHRsZWRWYWx1ZUZpZWxkO1xufTtcblxudmFyIHZhbHVlID0gUHJvbWlzZUluc3BlY3Rpb24ucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJjYW5ub3QgZ2V0IGZ1bGZpbGxtZW50IHZhbHVlIG9mIGEgbm9uLWZ1bGZpbGxlZCBwcm9taXNlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvTXFyRm1YXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3NldHRsZWRWYWx1ZSgpO1xufTtcblxudmFyIHJlYXNvbiA9IFByb21pc2VJbnNwZWN0aW9uLnByb3RvdHlwZS5lcnJvciA9XG5Qcm9taXNlSW5zcGVjdGlvbi5wcm90b3R5cGUucmVhc29uID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc1JlamVjdGVkKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImNhbm5vdCBnZXQgcmVqZWN0aW9uIHJlYXNvbiBvZiBhIG5vbi1yZWplY3RlZCBwcm9taXNlXFx1MDAwYVxcdTAwMGEgICAgU2VlIGh0dHA6Ly9nb28uZ2wvTXFyRm1YXFx1MDAwYVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3NldHRsZWRWYWx1ZSgpO1xufTtcblxudmFyIGlzRnVsZmlsbGVkID0gUHJvbWlzZUluc3BlY3Rpb24ucHJvdG90eXBlLmlzRnVsZmlsbGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDMzNTU0NDMyKSAhPT0gMDtcbn07XG5cbnZhciBpc1JlamVjdGVkID0gUHJvbWlzZUluc3BlY3Rpb24ucHJvdG90eXBlLmlzUmVqZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDE2Nzc3MjE2KSAhPT0gMDtcbn07XG5cbnZhciBpc1BlbmRpbmcgPSBQcm9taXNlSW5zcGVjdGlvbi5wcm90b3R5cGUuaXNQZW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiA1MDM5NzE4NCkgPT09IDA7XG59O1xuXG52YXIgaXNSZXNvbHZlZCA9IFByb21pc2VJbnNwZWN0aW9uLnByb3RvdHlwZS5pc1Jlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiA1MDMzMTY0OCkgIT09IDA7XG59O1xuXG5Qcm9taXNlSW5zcGVjdGlvbi5wcm90b3R5cGUuaXNDYW5jZWxsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKHRoaXMuX2JpdEZpZWxkICYgODQ1NDE0NCkgIT09IDA7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fX2lzQ2FuY2VsbGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICh0aGlzLl9iaXRGaWVsZCAmIDY1NTM2KSA9PT0gNjU1MzY7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5faXNDYW5jZWxsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fdGFyZ2V0KCkuX19pc0NhbmNlbGxlZCgpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuaXNDYW5jZWxsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKHRoaXMuX3RhcmdldCgpLl9iaXRGaWVsZCAmIDg0NTQxNDQpICE9PSAwO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuaXNQZW5kaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGlzUGVuZGluZy5jYWxsKHRoaXMuX3RhcmdldCgpKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmlzUmVqZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gaXNSZWplY3RlZC5jYWxsKHRoaXMuX3RhcmdldCgpKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmlzRnVsZmlsbGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGlzRnVsZmlsbGVkLmNhbGwodGhpcy5fdGFyZ2V0KCkpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuaXNSZXNvbHZlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBpc1Jlc29sdmVkLmNhbGwodGhpcy5fdGFyZ2V0KCkpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdmFsdWUuY2FsbCh0aGlzLl90YXJnZXQoKSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5yZWFzb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5fdGFyZ2V0KCk7XG4gICAgdGFyZ2V0Ll91bnNldFJlamVjdGlvbklzVW5oYW5kbGVkKCk7XG4gICAgcmV0dXJuIHJlYXNvbi5jYWxsKHRhcmdldCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fdmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fc2V0dGxlZFZhbHVlKCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5fcmVhc29uID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fdW5zZXRSZWplY3Rpb25Jc1VuaGFuZGxlZCgpO1xuICAgIHJldHVybiB0aGlzLl9zZXR0bGVkVmFsdWUoKTtcbn07XG5cblByb21pc2UuUHJvbWlzZUluc3BlY3Rpb24gPSBQcm9taXNlSW5zcGVjdGlvbjtcbn07XG5cbn0se31dLDMzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm9taXNlLCBJTlRFUk5BTCkge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsXCIpO1xudmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcbnZhciBpc09iamVjdCA9IHV0aWwuaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIHRyeUNvbnZlcnRUb1Byb21pc2Uob2JqLCBjb250ZXh0KSB7XG4gICAgaWYgKGlzT2JqZWN0KG9iaikpIHtcbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIFByb21pc2UpIHJldHVybiBvYmo7XG4gICAgICAgIHZhciB0aGVuID0gZ2V0VGhlbihvYmopO1xuICAgICAgICBpZiAodGhlbiA9PT0gZXJyb3JPYmopIHtcbiAgICAgICAgICAgIGlmIChjb250ZXh0KSBjb250ZXh0Ll9wdXNoQ29udGV4dCgpO1xuICAgICAgICAgICAgdmFyIHJldCA9IFByb21pc2UucmVqZWN0KHRoZW4uZSk7XG4gICAgICAgICAgICBpZiAoY29udGV4dCkgY29udGV4dC5fcG9wQ29udGV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBpZiAoaXNBbnlCbHVlYmlyZFByb21pc2Uob2JqKSkge1xuICAgICAgICAgICAgICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgICAgICAgICAgICAgb2JqLl90aGVuKFxuICAgICAgICAgICAgICAgICAgICByZXQuX2Z1bGZpbGwsXG4gICAgICAgICAgICAgICAgICAgIHJldC5fcmVqZWN0LFxuICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIHJldCxcbiAgICAgICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkb1RoZW5hYmxlKG9iaiwgdGhlbiwgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbn1cblxuZnVuY3Rpb24gZG9HZXRUaGVuKG9iaikge1xuICAgIHJldHVybiBvYmoudGhlbjtcbn1cblxuZnVuY3Rpb24gZ2V0VGhlbihvYmopIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZG9HZXRUaGVuKG9iaik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBlcnJvck9iai5lID0gZTtcbiAgICAgICAgcmV0dXJuIGVycm9yT2JqO1xuICAgIH1cbn1cblxudmFyIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcbmZ1bmN0aW9uIGlzQW55Qmx1ZWJpcmRQcm9taXNlKG9iaikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBoYXNQcm9wLmNhbGwob2JqLCBcIl9wcm9taXNlMFwiKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRvVGhlbmFibGUoeCwgdGhlbiwgY29udGV4dCkge1xuICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoSU5URVJOQUwpO1xuICAgIHZhciByZXQgPSBwcm9taXNlO1xuICAgIGlmIChjb250ZXh0KSBjb250ZXh0Ll9wdXNoQ29udGV4dCgpO1xuICAgIHByb21pc2UuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgaWYgKGNvbnRleHQpIGNvbnRleHQuX3BvcENvbnRleHQoKTtcbiAgICB2YXIgc3luY2hyb25vdXMgPSB0cnVlO1xuICAgIHZhciByZXN1bHQgPSB1dGlsLnRyeUNhdGNoKHRoZW4pLmNhbGwoeCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICBzeW5jaHJvbm91cyA9IGZhbHNlO1xuXG4gICAgaWYgKHByb21pc2UgJiYgcmVzdWx0ID09PSBlcnJvck9iaikge1xuICAgICAgICBwcm9taXNlLl9yZWplY3RDYWxsYmFjayhyZXN1bHQuZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc29sdmUodmFsdWUpIHtcbiAgICAgICAgaWYgKCFwcm9taXNlKSByZXR1cm47XG4gICAgICAgIHByb21pc2UuX3Jlc29sdmVDYWxsYmFjayh2YWx1ZSk7XG4gICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlamVjdChyZWFzb24pIHtcbiAgICAgICAgaWYgKCFwcm9taXNlKSByZXR1cm47XG4gICAgICAgIHByb21pc2UuX3JlamVjdENhbGxiYWNrKHJlYXNvbiwgc3luY2hyb25vdXMsIHRydWUpO1xuICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxucmV0dXJuIHRyeUNvbnZlcnRUb1Byb21pc2U7XG59O1xuXG59LHtcIi4vdXRpbFwiOjM2fV0sMzQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFByb21pc2UsIElOVEVSTkFMLCBkZWJ1Zykge1xudmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsXCIpO1xudmFyIFRpbWVvdXRFcnJvciA9IFByb21pc2UuVGltZW91dEVycm9yO1xuXG5mdW5jdGlvbiBIYW5kbGVXcmFwcGVyKGhhbmRsZSkgIHtcbiAgICB0aGlzLmhhbmRsZSA9IGhhbmRsZTtcbn1cblxuSGFuZGxlV3JhcHBlci5wcm90b3R5cGUuX3Jlc3VsdENhbmNlbGxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLmhhbmRsZSk7XG59O1xuXG52YXIgYWZ0ZXJWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7IHJldHVybiBkZWxheSgrdGhpcykudGhlblJldHVybih2YWx1ZSk7IH07XG52YXIgZGVsYXkgPSBQcm9taXNlLmRlbGF5ID0gZnVuY3Rpb24gKG1zLCB2YWx1ZSkge1xuICAgIHZhciByZXQ7XG4gICAgdmFyIGhhbmRsZTtcbiAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXQgPSBQcm9taXNlLnJlc29sdmUodmFsdWUpXG4gICAgICAgICAgICAgICAgLl90aGVuKGFmdGVyVmFsdWUsIG51bGwsIG51bGwsIG1zLCB1bmRlZmluZWQpO1xuICAgICAgICBpZiAoZGVidWcuY2FuY2VsbGF0aW9uKCkgJiYgdmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICByZXQuX3NldE9uQ2FuY2VsKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldCA9IG5ldyBQcm9taXNlKElOVEVSTkFMKTtcbiAgICAgICAgaGFuZGxlID0gc2V0VGltZW91dChmdW5jdGlvbigpIHsgcmV0Ll9mdWxmaWxsKCk7IH0sICttcyk7XG4gICAgICAgIGlmIChkZWJ1Zy5jYW5jZWxsYXRpb24oKSkge1xuICAgICAgICAgICAgcmV0Ll9zZXRPbkNhbmNlbChuZXcgSGFuZGxlV3JhcHBlcihoYW5kbGUpKTtcbiAgICAgICAgfVxuICAgICAgICByZXQuX2NhcHR1cmVTdGFja1RyYWNlKCk7XG4gICAgfVxuICAgIHJldC5fc2V0QXN5bmNHdWFyYW50ZWVkKCk7XG4gICAgcmV0dXJuIHJldDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24gKG1zKSB7XG4gICAgcmV0dXJuIGRlbGF5KG1zLCB0aGlzKTtcbn07XG5cbnZhciBhZnRlclRpbWVvdXQgPSBmdW5jdGlvbiAocHJvbWlzZSwgbWVzc2FnZSwgcGFyZW50KSB7XG4gICAgdmFyIGVycjtcbiAgICBpZiAodHlwZW9mIG1lc3NhZ2UgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgZXJyID0gbWVzc2FnZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVyciA9IG5ldyBUaW1lb3V0RXJyb3IoXCJvcGVyYXRpb24gdGltZWQgb3V0XCIpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZXJyID0gbmV3IFRpbWVvdXRFcnJvcihtZXNzYWdlKTtcbiAgICB9XG4gICAgdXRpbC5tYXJrQXNPcmlnaW5hdGluZ0Zyb21SZWplY3Rpb24oZXJyKTtcbiAgICBwcm9taXNlLl9hdHRhY2hFeHRyYVRyYWNlKGVycik7XG4gICAgcHJvbWlzZS5fcmVqZWN0KGVycik7XG5cbiAgICBpZiAocGFyZW50ICE9IG51bGwpIHtcbiAgICAgICAgcGFyZW50LmNhbmNlbCgpO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHN1Y2Nlc3NDbGVhcih2YWx1ZSkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBmYWlsdXJlQ2xlYXIocmVhc29uKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuaGFuZGxlKTtcbiAgICB0aHJvdyByZWFzb247XG59XG5cblByb21pc2UucHJvdG90eXBlLnRpbWVvdXQgPSBmdW5jdGlvbiAobXMsIG1lc3NhZ2UpIHtcbiAgICBtcyA9ICttcztcbiAgICB2YXIgcmV0LCBwYXJlbnQ7XG5cbiAgICB2YXIgaGFuZGxlV3JhcHBlciA9IG5ldyBIYW5kbGVXcmFwcGVyKHNldFRpbWVvdXQoZnVuY3Rpb24gdGltZW91dFRpbWVvdXQoKSB7XG4gICAgICAgIGlmIChyZXQuaXNQZW5kaW5nKCkpIHtcbiAgICAgICAgICAgIGFmdGVyVGltZW91dChyZXQsIG1lc3NhZ2UsIHBhcmVudCk7XG4gICAgICAgIH1cbiAgICB9LCBtcykpO1xuXG4gICAgaWYgKGRlYnVnLmNhbmNlbGxhdGlvbigpKSB7XG4gICAgICAgIHBhcmVudCA9IHRoaXMudGhlbigpO1xuICAgICAgICByZXQgPSBwYXJlbnQuX3RoZW4oc3VjY2Vzc0NsZWFyLCBmYWlsdXJlQ2xlYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCBoYW5kbGVXcmFwcGVyLCB1bmRlZmluZWQpO1xuICAgICAgICByZXQuX3NldE9uQ2FuY2VsKGhhbmRsZVdyYXBwZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldCA9IHRoaXMuX3RoZW4oc3VjY2Vzc0NsZWFyLCBmYWlsdXJlQ2xlYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCBoYW5kbGVXcmFwcGVyLCB1bmRlZmluZWQpO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59O1xuXG59O1xuXG59LHtcIi4vdXRpbFwiOjM2fV0sMzU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChQcm9taXNlLCBhcGlSZWplY3Rpb24sIHRyeUNvbnZlcnRUb1Byb21pc2UsXG4gICAgY3JlYXRlQ29udGV4dCwgSU5URVJOQUwsIGRlYnVnKSB7XG4gICAgdmFyIHV0aWwgPSBfZGVyZXFfKFwiLi91dGlsXCIpO1xuICAgIHZhciBUeXBlRXJyb3IgPSBfZGVyZXFfKFwiLi9lcnJvcnNcIikuVHlwZUVycm9yO1xuICAgIHZhciBpbmhlcml0cyA9IF9kZXJlcV8oXCIuL3V0aWxcIikuaW5oZXJpdHM7XG4gICAgdmFyIGVycm9yT2JqID0gdXRpbC5lcnJvck9iajtcbiAgICB2YXIgdHJ5Q2F0Y2ggPSB1dGlsLnRyeUNhdGNoO1xuICAgIHZhciBOVUxMID0ge307XG5cbiAgICBmdW5jdGlvbiB0aHJvd2VyKGUpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe3Rocm93IGU7fSwgMCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FzdFByZXNlcnZpbmdEaXNwb3NhYmxlKHRoZW5hYmxlKSB7XG4gICAgICAgIHZhciBtYXliZVByb21pc2UgPSB0cnlDb252ZXJ0VG9Qcm9taXNlKHRoZW5hYmxlKTtcbiAgICAgICAgaWYgKG1heWJlUHJvbWlzZSAhPT0gdGhlbmFibGUgJiZcbiAgICAgICAgICAgIHR5cGVvZiB0aGVuYWJsZS5faXNEaXNwb3NhYmxlID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgICAgIHR5cGVvZiB0aGVuYWJsZS5fZ2V0RGlzcG9zZXIgPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgICAgICAgdGhlbmFibGUuX2lzRGlzcG9zYWJsZSgpKSB7XG4gICAgICAgICAgICBtYXliZVByb21pc2UuX3NldERpc3Bvc2FibGUodGhlbmFibGUuX2dldERpc3Bvc2VyKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXliZVByb21pc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRpc3Bvc2UocmVzb3VyY2VzLCBpbnNwZWN0aW9uKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IHJlc291cmNlcy5sZW5ndGg7XG4gICAgICAgIHZhciByZXQgPSBuZXcgUHJvbWlzZShJTlRFUk5BTCk7XG4gICAgICAgIGZ1bmN0aW9uIGl0ZXJhdG9yKCkge1xuICAgICAgICAgICAgaWYgKGkgPj0gbGVuKSByZXR1cm4gcmV0Ll9mdWxmaWxsKCk7XG4gICAgICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gY2FzdFByZXNlcnZpbmdEaXNwb3NhYmxlKHJlc291cmNlc1tpKytdKTtcbiAgICAgICAgICAgIGlmIChtYXliZVByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlICYmXG4gICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlLl9pc0Rpc3Bvc2FibGUoKSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIG1heWJlUHJvbWlzZSA9IHRyeUNvbnZlcnRUb1Byb21pc2UoXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXliZVByb21pc2UuX2dldERpc3Bvc2VyKCkudHJ5RGlzcG9zZShpbnNwZWN0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlcy5wcm9taXNlKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aHJvd2VyKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobWF5YmVQcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF5YmVQcm9taXNlLl90aGVuKGl0ZXJhdG9yLCB0aHJvd2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGl0ZXJhdG9yKCk7XG4gICAgICAgIH1cbiAgICAgICAgaXRlcmF0b3IoKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBEaXNwb3NlcihkYXRhLCBwcm9taXNlLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuX2RhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLl9wcm9taXNlID0gcHJvbWlzZTtcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG4gICAgfVxuXG4gICAgRGlzcG9zZXIucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgIH07XG5cbiAgICBEaXNwb3Nlci5wcm90b3R5cGUucHJvbWlzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb21pc2U7XG4gICAgfTtcblxuICAgIERpc3Bvc2VyLnByb3RvdHlwZS5yZXNvdXJjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvbWlzZSgpLmlzRnVsZmlsbGVkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByb21pc2UoKS52YWx1ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBOVUxMO1xuICAgIH07XG5cbiAgICBEaXNwb3Nlci5wcm90b3R5cGUudHJ5RGlzcG9zZSA9IGZ1bmN0aW9uKGluc3BlY3Rpb24pIHtcbiAgICAgICAgdmFyIHJlc291cmNlID0gdGhpcy5yZXNvdXJjZSgpO1xuICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMuX2NvbnRleHQ7XG4gICAgICAgIGlmIChjb250ZXh0ICE9PSB1bmRlZmluZWQpIGNvbnRleHQuX3B1c2hDb250ZXh0KCk7XG4gICAgICAgIHZhciByZXQgPSByZXNvdXJjZSAhPT0gTlVMTFxuICAgICAgICAgICAgPyB0aGlzLmRvRGlzcG9zZShyZXNvdXJjZSwgaW5zcGVjdGlvbikgOiBudWxsO1xuICAgICAgICBpZiAoY29udGV4dCAhPT0gdW5kZWZpbmVkKSBjb250ZXh0Ll9wb3BDb250ZXh0KCk7XG4gICAgICAgIHRoaXMuX3Byb21pc2UuX3Vuc2V0RGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuXG4gICAgRGlzcG9zZXIuaXNEaXNwb3NlciA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiAoZCAhPSBudWxsICYmXG4gICAgICAgICAgICAgICAgdHlwZW9mIGQucmVzb3VyY2UgPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBkLnRyeURpc3Bvc2UgPT09IFwiZnVuY3Rpb25cIik7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIEZ1bmN0aW9uRGlzcG9zZXIoZm4sIHByb21pc2UsIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3RvciQoZm4sIHByb21pc2UsIGNvbnRleHQpO1xuICAgIH1cbiAgICBpbmhlcml0cyhGdW5jdGlvbkRpc3Bvc2VyLCBEaXNwb3Nlcik7XG5cbiAgICBGdW5jdGlvbkRpc3Bvc2VyLnByb3RvdHlwZS5kb0Rpc3Bvc2UgPSBmdW5jdGlvbiAocmVzb3VyY2UsIGluc3BlY3Rpb24pIHtcbiAgICAgICAgdmFyIGZuID0gdGhpcy5kYXRhKCk7XG4gICAgICAgIHJldHVybiBmbi5jYWxsKHJlc291cmNlLCByZXNvdXJjZSwgaW5zcGVjdGlvbik7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIG1heWJlVW53cmFwRGlzcG9zZXIodmFsdWUpIHtcbiAgICAgICAgaWYgKERpc3Bvc2VyLmlzRGlzcG9zZXIodmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLnJlc291cmNlc1t0aGlzLmluZGV4XS5fc2V0RGlzcG9zYWJsZSh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUucHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBSZXNvdXJjZUxpc3QobGVuZ3RoKSB7XG4gICAgICAgIHRoaXMubGVuZ3RoID0gbGVuZ3RoO1xuICAgICAgICB0aGlzLnByb21pc2UgPSBudWxsO1xuICAgICAgICB0aGlzW2xlbmd0aC0xXSA9IG51bGw7XG4gICAgfVxuXG4gICAgUmVzb3VyY2VMaXN0LnByb3RvdHlwZS5fcmVzdWx0Q2FuY2VsbGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBsZW4gPSB0aGlzLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSB0aGlzW2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0gaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5jYW5jZWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBQcm9taXNlLnVzaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbiA8IDIpIHJldHVybiBhcGlSZWplY3Rpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICBcInlvdSBtdXN0IHBhc3MgYXQgbGVhc3QgMiBhcmd1bWVudHMgdG8gUHJvbWlzZS51c2luZ1wiKTtcbiAgICAgICAgdmFyIGZuID0gYXJndW1lbnRzW2xlbiAtIDFdO1xuICAgICAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBhcGlSZWplY3Rpb24oXCJleHBlY3RpbmcgYSBmdW5jdGlvbiBidXQgZ290IFwiICsgdXRpbC5jbGFzc1N0cmluZyhmbikpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbnB1dDtcbiAgICAgICAgdmFyIHNwcmVhZEFyZ3MgPSB0cnVlO1xuICAgICAgICBpZiAobGVuID09PSAyICYmIEFycmF5LmlzQXJyYXkoYXJndW1lbnRzWzBdKSkge1xuICAgICAgICAgICAgaW5wdXQgPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICBsZW4gPSBpbnB1dC5sZW5ndGg7XG4gICAgICAgICAgICBzcHJlYWRBcmdzID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbnB1dCA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgIGxlbi0tO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXNvdXJjZXMgPSBuZXcgUmVzb3VyY2VMaXN0KGxlbik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciByZXNvdXJjZSA9IGlucHV0W2ldO1xuICAgICAgICAgICAgaWYgKERpc3Bvc2VyLmlzRGlzcG9zZXIocmVzb3VyY2UpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpc3Bvc2VyID0gcmVzb3VyY2U7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UgPSByZXNvdXJjZS5wcm9taXNlKCk7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuX3NldERpc3Bvc2FibGUoZGlzcG9zZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gdHJ5Q29udmVydFRvUHJvbWlzZShyZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2UgPVxuICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVQcm9taXNlLl90aGVuKG1heWJlVW53cmFwRGlzcG9zZXIsIG51bGwsIG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IHJlc291cmNlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaVxuICAgICAgICAgICAgICAgICAgICB9LCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc291cmNlc1tpXSA9IHJlc291cmNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlZmxlY3RlZFJlc291cmNlcyA9IG5ldyBBcnJheShyZXNvdXJjZXMubGVuZ3RoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWZsZWN0ZWRSZXNvdXJjZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHJlZmxlY3RlZFJlc291cmNlc1tpXSA9IFByb21pc2UucmVzb2x2ZShyZXNvdXJjZXNbaV0pLnJlZmxlY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXN1bHRQcm9taXNlID0gUHJvbWlzZS5hbGwocmVmbGVjdGVkUmVzb3VyY2VzKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oaW5zcGVjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluc3BlY3Rpb25zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnNwZWN0aW9uID0gaW5zcGVjdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnNwZWN0aW9uLmlzUmVqZWN0ZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JPYmouZSA9IGluc3BlY3Rpb24uZXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvck9iajtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghaW5zcGVjdGlvbi5pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRQcm9taXNlLmNhbmNlbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGluc3BlY3Rpb25zW2ldID0gaW5zcGVjdGlvbi52YWx1ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcm9taXNlLl9wdXNoQ29udGV4dCgpO1xuXG4gICAgICAgICAgICAgICAgZm4gPSB0cnlDYXRjaChmbik7XG4gICAgICAgICAgICAgICAgdmFyIHJldCA9IHNwcmVhZEFyZ3NcbiAgICAgICAgICAgICAgICAgICAgPyBmbi5hcHBseSh1bmRlZmluZWQsIGluc3BlY3Rpb25zKSA6IGZuKGluc3BlY3Rpb25zKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJvbWlzZUNyZWF0ZWQgPSBwcm9taXNlLl9wb3BDb250ZXh0KCk7XG4gICAgICAgICAgICAgICAgZGVidWcuY2hlY2tGb3Jnb3R0ZW5SZXR1cm5zKFxuICAgICAgICAgICAgICAgICAgICByZXQsIHByb21pc2VDcmVhdGVkLCBcIlByb21pc2UudXNpbmdcIiwgcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBwcm9taXNlID0gcmVzdWx0UHJvbWlzZS5sYXN0bHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGlvbiA9IG5ldyBQcm9taXNlLlByb21pc2VJbnNwZWN0aW9uKHJlc3VsdFByb21pc2UpO1xuICAgICAgICAgICAgcmV0dXJuIGRpc3Bvc2UocmVzb3VyY2VzLCBpbnNwZWN0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlc291cmNlcy5wcm9taXNlID0gcHJvbWlzZTtcbiAgICAgICAgcHJvbWlzZS5fc2V0T25DYW5jZWwocmVzb3VyY2VzKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfTtcblxuICAgIFByb21pc2UucHJvdG90eXBlLl9zZXREaXNwb3NhYmxlID0gZnVuY3Rpb24gKGRpc3Bvc2VyKSB7XG4gICAgICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgfCAxMzEwNzI7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2VyID0gZGlzcG9zZXI7XG4gICAgfTtcblxuICAgIFByb21pc2UucHJvdG90eXBlLl9pc0Rpc3Bvc2FibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAodGhpcy5fYml0RmllbGQgJiAxMzEwNzIpID4gMDtcbiAgICB9O1xuXG4gICAgUHJvbWlzZS5wcm90b3R5cGUuX2dldERpc3Bvc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGlzcG9zZXI7XG4gICAgfTtcblxuICAgIFByb21pc2UucHJvdG90eXBlLl91bnNldERpc3Bvc2FibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2JpdEZpZWxkID0gdGhpcy5fYml0RmllbGQgJiAofjEzMTA3Mik7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2VyID0gdW5kZWZpbmVkO1xuICAgIH07XG5cbiAgICBQcm9taXNlLnByb3RvdHlwZS5kaXNwb3NlciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICBpZiAodHlwZW9mIGZuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRnVuY3Rpb25EaXNwb3NlcihmbiwgdGhpcywgY3JlYXRlQ29udGV4dCgpKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgfTtcblxufTtcblxufSx7XCIuL2Vycm9yc1wiOjEyLFwiLi91dGlsXCI6MzZ9XSwzNjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBlczUgPSBfZGVyZXFfKFwiLi9lczVcIik7XG52YXIgY2FuRXZhbHVhdGUgPSB0eXBlb2YgbmF2aWdhdG9yID09IFwidW5kZWZpbmVkXCI7XG5cbnZhciBlcnJvck9iaiA9IHtlOiB7fX07XG52YXIgdHJ5Q2F0Y2hUYXJnZXQ7XG52YXIgZ2xvYmFsT2JqZWN0ID0gdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDpcbiAgICB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDpcbiAgICB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDpcbiAgICB0aGlzICE9PSB1bmRlZmluZWQgPyB0aGlzIDogbnVsbDtcblxuZnVuY3Rpb24gdHJ5Q2F0Y2hlcigpIHtcbiAgICB0cnkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdHJ5Q2F0Y2hUYXJnZXQ7XG4gICAgICAgIHRyeUNhdGNoVGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgZXJyb3JPYmouZSA9IGU7XG4gICAgICAgIHJldHVybiBlcnJvck9iajtcbiAgICB9XG59XG5mdW5jdGlvbiB0cnlDYXRjaChmbikge1xuICAgIHRyeUNhdGNoVGFyZ2V0ID0gZm47XG4gICAgcmV0dXJuIHRyeUNhdGNoZXI7XG59XG5cbnZhciBpbmhlcml0cyA9IGZ1bmN0aW9uKENoaWxkLCBQYXJlbnQpIHtcbiAgICB2YXIgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gICAgZnVuY3Rpb24gVCgpIHtcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3RvciA9IENoaWxkO1xuICAgICAgICB0aGlzLmNvbnN0cnVjdG9yJCA9IFBhcmVudDtcbiAgICAgICAgZm9yICh2YXIgcHJvcGVydHlOYW1lIGluIFBhcmVudC5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgIGlmIChoYXNQcm9wLmNhbGwoUGFyZW50LnByb3RvdHlwZSwgcHJvcGVydHlOYW1lKSAmJlxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZS5jaGFyQXQocHJvcGVydHlOYW1lLmxlbmd0aC0xKSAhPT0gXCIkXCJcbiAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eU5hbWUgKyBcIiRcIl0gPSBQYXJlbnQucHJvdG90eXBlW3Byb3BlcnR5TmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgVC5wcm90b3R5cGUgPSBQYXJlbnQucHJvdG90eXBlO1xuICAgIENoaWxkLnByb3RvdHlwZSA9IG5ldyBUKCk7XG4gICAgcmV0dXJuIENoaWxkLnByb3RvdHlwZTtcbn07XG5cblxuZnVuY3Rpb24gaXNQcmltaXRpdmUodmFsKSB7XG4gICAgcmV0dXJuIHZhbCA9PSBudWxsIHx8IHZhbCA9PT0gdHJ1ZSB8fCB2YWwgPT09IGZhbHNlIHx8XG4gICAgICAgIHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHZhbCA9PT0gXCJudW1iZXJcIjtcblxufVxuXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICAgICAgICB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIG1heWJlV3JhcEFzRXJyb3IobWF5YmVFcnJvcikge1xuICAgIGlmICghaXNQcmltaXRpdmUobWF5YmVFcnJvcikpIHJldHVybiBtYXliZUVycm9yO1xuXG4gICAgcmV0dXJuIG5ldyBFcnJvcihzYWZlVG9TdHJpbmcobWF5YmVFcnJvcikpO1xufVxuXG5mdW5jdGlvbiB3aXRoQXBwZW5kZWQodGFyZ2V0LCBhcHBlbmRlZSkge1xuICAgIHZhciBsZW4gPSB0YXJnZXQubGVuZ3RoO1xuICAgIHZhciByZXQgPSBuZXcgQXJyYXkobGVuICsgMSk7XG4gICAgdmFyIGk7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIHJldFtpXSA9IHRhcmdldFtpXTtcbiAgICB9XG4gICAgcmV0W2ldID0gYXBwZW5kZWU7XG4gICAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gZ2V0RGF0YVByb3BlcnR5T3JEZWZhdWx0KG9iaiwga2V5LCBkZWZhdWx0VmFsdWUpIHtcbiAgICBpZiAoZXM1LmlzRVM1KSB7XG4gICAgICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIGtleSk7XG5cbiAgICAgICAgaWYgKGRlc2MgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGRlc2MuZ2V0ID09IG51bGwgJiYgZGVzYy5zZXQgPT0gbnVsbFxuICAgICAgICAgICAgICAgICAgICA/IGRlc2MudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgOiBkZWZhdWx0VmFsdWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge30uaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkgPyBvYmpba2V5XSA6IHVuZGVmaW5lZDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5vdEVudW1lcmFibGVQcm9wKG9iaiwgbmFtZSwgdmFsdWUpIHtcbiAgICBpZiAoaXNQcmltaXRpdmUob2JqKSkgcmV0dXJuIG9iajtcbiAgICB2YXIgZGVzY3JpcHRvciA9IHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH07XG4gICAgZXM1LmRlZmluZVByb3BlcnR5KG9iaiwgbmFtZSwgZGVzY3JpcHRvcik7XG4gICAgcmV0dXJuIG9iajtcbn1cblxuZnVuY3Rpb24gdGhyb3dlcihyKSB7XG4gICAgdGhyb3cgcjtcbn1cblxudmFyIGluaGVyaXRlZERhdGFLZXlzID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBleGNsdWRlZFByb3RvdHlwZXMgPSBbXG4gICAgICAgIEFycmF5LnByb3RvdHlwZSxcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZSxcbiAgICAgICAgRnVuY3Rpb24ucHJvdG90eXBlXG4gICAgXTtcblxuICAgIHZhciBpc0V4Y2x1ZGVkUHJvdG8gPSBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleGNsdWRlZFByb3RvdHlwZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChleGNsdWRlZFByb3RvdHlwZXNbaV0gPT09IHZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgaWYgKGVzNS5pc0VTNSkge1xuICAgICAgICB2YXIgZ2V0S2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICB2YXIgcmV0ID0gW107XG4gICAgICAgICAgICB2YXIgdmlzaXRlZEtleXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICAgICAgd2hpbGUgKG9iaiAhPSBudWxsICYmICFpc0V4Y2x1ZGVkUHJvdG8ob2JqKSkge1xuICAgICAgICAgICAgICAgIHZhciBrZXlzO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGtleXMgPSBnZXRLZXlzKG9iaik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh2aXNpdGVkS2V5c1trZXldKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgdmlzaXRlZEtleXNba2V5XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIGtleSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXNjICE9IG51bGwgJiYgZGVzYy5nZXQgPT0gbnVsbCAmJiBkZXNjLnNldCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXQucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9iaiA9IGVzNS5nZXRQcm90b3R5cGVPZihvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICBpZiAoaXNFeGNsdWRlZFByb3RvKG9iaikpIHJldHVybiBbXTtcbiAgICAgICAgICAgIHZhciByZXQgPSBbXTtcblxuICAgICAgICAgICAgLypqc2hpbnQgZm9yaW46ZmFsc2UgKi9cbiAgICAgICAgICAgIGVudW1lcmF0aW9uOiBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhhc1Byb3AuY2FsbChvYmosIGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2goa2V5KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4Y2x1ZGVkUHJvdG90eXBlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc1Byb3AuY2FsbChleGNsdWRlZFByb3RvdHlwZXNbaV0sIGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBlbnVtZXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXQucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH07XG4gICAgfVxuXG59KSgpO1xuXG52YXIgdGhpc0Fzc2lnbm1lbnRQYXR0ZXJuID0gL3RoaXNcXHMqXFwuXFxzKlxcUytcXHMqPS87XG5mdW5jdGlvbiBpc0NsYXNzKGZuKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB2YXIga2V5cyA9IGVzNS5uYW1lcyhmbi5wcm90b3R5cGUpO1xuXG4gICAgICAgICAgICB2YXIgaGFzTWV0aG9kcyA9IGVzNS5pc0VTNSAmJiBrZXlzLmxlbmd0aCA+IDE7XG4gICAgICAgICAgICB2YXIgaGFzTWV0aG9kc090aGVyVGhhbkNvbnN0cnVjdG9yID0ga2V5cy5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICAgICAgIShrZXlzLmxlbmd0aCA9PT0gMSAmJiBrZXlzWzBdID09PSBcImNvbnN0cnVjdG9yXCIpO1xuICAgICAgICAgICAgdmFyIGhhc1RoaXNBc3NpZ25tZW50QW5kU3RhdGljTWV0aG9kcyA9XG4gICAgICAgICAgICAgICAgdGhpc0Fzc2lnbm1lbnRQYXR0ZXJuLnRlc3QoZm4gKyBcIlwiKSAmJiBlczUubmFtZXMoZm4pLmxlbmd0aCA+IDA7XG5cbiAgICAgICAgICAgIGlmIChoYXNNZXRob2RzIHx8IGhhc01ldGhvZHNPdGhlclRoYW5Db25zdHJ1Y3RvciB8fFxuICAgICAgICAgICAgICAgIGhhc1RoaXNBc3NpZ25tZW50QW5kU3RhdGljTWV0aG9kcykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRvRmFzdFByb3BlcnRpZXMob2JqKSB7XG4gICAgLypqc2hpbnQgLVcwMjcsLVcwNTUsLVcwMzEqL1xuICAgIGZ1bmN0aW9uIEZha2VDb25zdHJ1Y3RvcigpIHt9XG4gICAgRmFrZUNvbnN0cnVjdG9yLnByb3RvdHlwZSA9IG9iajtcbiAgICB2YXIgcmVjZWl2ZXIgPSBuZXcgRmFrZUNvbnN0cnVjdG9yKCk7XG4gICAgZnVuY3Rpb24gaWMoKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgcmVjZWl2ZXIuZm9vO1xuICAgIH1cbiAgICBpYygpO1xuICAgIGljKCk7XG4gICAgcmV0dXJuIG9iajtcbiAgICBldmFsKG9iaik7XG59XG5cbnZhciByaWRlbnQgPSAvXlthLXokX11bYS16JF8wLTldKiQvaTtcbmZ1bmN0aW9uIGlzSWRlbnRpZmllcihzdHIpIHtcbiAgICByZXR1cm4gcmlkZW50LnRlc3Qoc3RyKTtcbn1cblxuZnVuY3Rpb24gZmlsbGVkUmFuZ2UoY291bnQsIHByZWZpeCwgc3VmZml4KSB7XG4gICAgdmFyIHJldCA9IG5ldyBBcnJheShjb3VudCk7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGNvdW50OyArK2kpIHtcbiAgICAgICAgcmV0W2ldID0gcHJlZml4ICsgaSArIHN1ZmZpeDtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gc2FmZVRvU3RyaW5nKG9iaikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBvYmogKyBcIlwiO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIFwiW25vIHN0cmluZyByZXByZXNlbnRhdGlvbl1cIjtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzRXJyb3Iob2JqKSB7XG4gICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIEVycm9yIHx8XG4gICAgICAgIChvYmogIT09IG51bGwgJiZcbiAgICAgICAgICAgdHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICAgICB0eXBlb2Ygb2JqLm1lc3NhZ2UgPT09IFwic3RyaW5nXCIgJiZcbiAgICAgICAgICAgdHlwZW9mIG9iai5uYW1lID09PSBcInN0cmluZ1wiKTtcbn1cblxuZnVuY3Rpb24gbWFya0FzT3JpZ2luYXRpbmdGcm9tUmVqZWN0aW9uKGUpIHtcbiAgICB0cnkge1xuICAgICAgICBub3RFbnVtZXJhYmxlUHJvcChlLCBcImlzT3BlcmF0aW9uYWxcIiwgdHJ1ZSk7XG4gICAgfVxuICAgIGNhdGNoKGlnbm9yZSkge31cbn1cblxuZnVuY3Rpb24gb3JpZ2luYXRlc0Zyb21SZWplY3Rpb24oZSkge1xuICAgIGlmIChlID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gKChlIGluc3RhbmNlb2YgRXJyb3JbXCJfX0JsdWViaXJkRXJyb3JUeXBlc19fXCJdLk9wZXJhdGlvbmFsRXJyb3IpIHx8XG4gICAgICAgIGVbXCJpc09wZXJhdGlvbmFsXCJdID09PSB0cnVlKTtcbn1cblxuZnVuY3Rpb24gY2FuQXR0YWNoVHJhY2Uob2JqKSB7XG4gICAgcmV0dXJuIGlzRXJyb3Iob2JqKSAmJiBlczUucHJvcGVydHlJc1dyaXRhYmxlKG9iaiwgXCJzdGFja1wiKTtcbn1cblxudmFyIGVuc3VyZUVycm9yT2JqZWN0ID0gKGZ1bmN0aW9uKCkge1xuICAgIGlmICghKFwic3RhY2tcIiBpbiBuZXcgRXJyb3IoKSkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoY2FuQXR0YWNoVHJhY2UodmFsdWUpKSByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB0cnkge3Rocm93IG5ldyBFcnJvcihzYWZlVG9TdHJpbmcodmFsdWUpKTt9XG4gICAgICAgICAgICBjYXRjaChlcnIpIHtyZXR1cm4gZXJyO31cbiAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChjYW5BdHRhY2hUcmFjZSh2YWx1ZSkpIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3Ioc2FmZVRvU3RyaW5nKHZhbHVlKSk7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTtcblxuZnVuY3Rpb24gY2xhc3NTdHJpbmcob2JqKSB7XG4gICAgcmV0dXJuIHt9LnRvU3RyaW5nLmNhbGwob2JqKTtcbn1cblxuZnVuY3Rpb24gY29weURlc2NyaXB0b3JzKGZyb20sIHRvLCBmaWx0ZXIpIHtcbiAgICB2YXIga2V5cyA9IGVzNS5uYW1lcyhmcm9tKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgIGlmIChmaWx0ZXIoa2V5KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBlczUuZGVmaW5lUHJvcGVydHkodG8sIGtleSwgZXM1LmdldERlc2NyaXB0b3IoZnJvbSwga2V5KSk7XG4gICAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnZhciBhc0FycmF5ID0gZnVuY3Rpb24odikge1xuICAgIGlmIChlczUuaXNBcnJheSh2KSkge1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59O1xuXG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBTeW1ib2wuaXRlcmF0b3IpIHtcbiAgICB2YXIgQXJyYXlGcm9tID0gdHlwZW9mIEFycmF5LmZyb20gPT09IFwiZnVuY3Rpb25cIiA/IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odik7XG4gICAgfSA6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICB2YXIgaXQgPSB2W1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgICAgICAgdmFyIGl0UmVzdWx0O1xuICAgICAgICB3aGlsZSAoISgoaXRSZXN1bHQgPSBpdC5uZXh0KCkpLmRvbmUpKSB7XG4gICAgICAgICAgICByZXQucHVzaChpdFJlc3VsdC52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuXG4gICAgYXNBcnJheSA9IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgaWYgKGVzNS5pc0FycmF5KHYpKSB7XG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSBlbHNlIGlmICh2ICE9IG51bGwgJiYgdHlwZW9mIHZbU3ltYm9sLml0ZXJhdG9yXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICByZXR1cm4gQXJyYXlGcm9tKHYpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG59XG5cbnZhciBpc05vZGUgPSB0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICBjbGFzc1N0cmluZyhwcm9jZXNzKS50b0xvd2VyQ2FzZSgpID09PSBcIltvYmplY3QgcHJvY2Vzc11cIjtcblxudmFyIGhhc0VudlZhcmlhYmxlcyA9IHR5cGVvZiBwcm9jZXNzICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgdHlwZW9mIHByb2Nlc3MuZW52ICE9PSBcInVuZGVmaW5lZFwiO1xuXG5mdW5jdGlvbiBlbnYoa2V5KSB7XG4gICAgcmV0dXJuIGhhc0VudlZhcmlhYmxlcyA/IHByb2Nlc3MuZW52W2tleV0gOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGdldE5hdGl2ZVByb21pc2UoKSB7XG4gICAgaWYgKHR5cGVvZiBQcm9taXNlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24oKXt9KTtcbiAgICAgICAgICAgIGlmIChjbGFzc1N0cmluZyhwcm9taXNlKSA9PT0gXCJbb2JqZWN0IFByb21pc2VdXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG59XG5cbnZhciByZWZsZWN0SGFuZGxlcjtcbmZ1bmN0aW9uIGNvbnRleHRCaW5kKGN0eCwgY2IpIHtcbiAgICBpZiAoY3R4ID09PSBudWxsIHx8XG4gICAgICAgIHR5cGVvZiBjYiAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAgIGNiID09PSByZWZsZWN0SGFuZGxlcikge1xuICAgICAgICByZXR1cm4gY2I7XG4gICAgfVxuXG4gICAgaWYgKGN0eC5kb21haW4gIT09IG51bGwpIHtcbiAgICAgICAgY2IgPSBjdHguZG9tYWluLmJpbmQoY2IpO1xuICAgIH1cblxuICAgIHZhciBhc3luYyA9IGN0eC5hc3luYztcbiAgICBpZiAoYXN5bmMgIT09IG51bGwpIHtcbiAgICAgICAgdmFyIG9sZCA9IGNiO1xuICAgICAgICBjYiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSAobmV3IEFycmF5KDIpKS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKTs7XG4gICAgICAgICAgICBhcmdzWzBdID0gb2xkO1xuICAgICAgICAgICAgYXJnc1sxXSA9IHRoaXM7XG4gICAgICAgICAgICByZXR1cm4gYXN5bmMucnVuSW5Bc3luY1Njb3BlLmFwcGx5KGFzeW5jLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGNiO1xufVxuXG52YXIgcmV0ID0ge1xuICAgIHNldFJlZmxlY3RIYW5kbGVyOiBmdW5jdGlvbihmbikge1xuICAgICAgICByZWZsZWN0SGFuZGxlciA9IGZuO1xuICAgIH0sXG4gICAgaXNDbGFzczogaXNDbGFzcyxcbiAgICBpc0lkZW50aWZpZXI6IGlzSWRlbnRpZmllcixcbiAgICBpbmhlcml0ZWREYXRhS2V5czogaW5oZXJpdGVkRGF0YUtleXMsXG4gICAgZ2V0RGF0YVByb3BlcnR5T3JEZWZhdWx0OiBnZXREYXRhUHJvcGVydHlPckRlZmF1bHQsXG4gICAgdGhyb3dlcjogdGhyb3dlcixcbiAgICBpc0FycmF5OiBlczUuaXNBcnJheSxcbiAgICBhc0FycmF5OiBhc0FycmF5LFxuICAgIG5vdEVudW1lcmFibGVQcm9wOiBub3RFbnVtZXJhYmxlUHJvcCxcbiAgICBpc1ByaW1pdGl2ZTogaXNQcmltaXRpdmUsXG4gICAgaXNPYmplY3Q6IGlzT2JqZWN0LFxuICAgIGlzRXJyb3I6IGlzRXJyb3IsXG4gICAgY2FuRXZhbHVhdGU6IGNhbkV2YWx1YXRlLFxuICAgIGVycm9yT2JqOiBlcnJvck9iaixcbiAgICB0cnlDYXRjaDogdHJ5Q2F0Y2gsXG4gICAgaW5oZXJpdHM6IGluaGVyaXRzLFxuICAgIHdpdGhBcHBlbmRlZDogd2l0aEFwcGVuZGVkLFxuICAgIG1heWJlV3JhcEFzRXJyb3I6IG1heWJlV3JhcEFzRXJyb3IsXG4gICAgdG9GYXN0UHJvcGVydGllczogdG9GYXN0UHJvcGVydGllcyxcbiAgICBmaWxsZWRSYW5nZTogZmlsbGVkUmFuZ2UsXG4gICAgdG9TdHJpbmc6IHNhZmVUb1N0cmluZyxcbiAgICBjYW5BdHRhY2hUcmFjZTogY2FuQXR0YWNoVHJhY2UsXG4gICAgZW5zdXJlRXJyb3JPYmplY3Q6IGVuc3VyZUVycm9yT2JqZWN0LFxuICAgIG9yaWdpbmF0ZXNGcm9tUmVqZWN0aW9uOiBvcmlnaW5hdGVzRnJvbVJlamVjdGlvbixcbiAgICBtYXJrQXNPcmlnaW5hdGluZ0Zyb21SZWplY3Rpb246IG1hcmtBc09yaWdpbmF0aW5nRnJvbVJlamVjdGlvbixcbiAgICBjbGFzc1N0cmluZzogY2xhc3NTdHJpbmcsXG4gICAgY29weURlc2NyaXB0b3JzOiBjb3B5RGVzY3JpcHRvcnMsXG4gICAgaXNOb2RlOiBpc05vZGUsXG4gICAgaGFzRW52VmFyaWFibGVzOiBoYXNFbnZWYXJpYWJsZXMsXG4gICAgZW52OiBlbnYsXG4gICAgZ2xvYmFsOiBnbG9iYWxPYmplY3QsXG4gICAgZ2V0TmF0aXZlUHJvbWlzZTogZ2V0TmF0aXZlUHJvbWlzZSxcbiAgICBjb250ZXh0QmluZDogY29udGV4dEJpbmRcbn07XG5yZXQuaXNSZWNlbnROb2RlID0gcmV0LmlzTm9kZSAmJiAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZlcnNpb247XG4gICAgaWYgKHByb2Nlc3MudmVyc2lvbnMgJiYgcHJvY2Vzcy52ZXJzaW9ucy5ub2RlKSB7XG4gICAgICAgIHZlcnNpb24gPSBwcm9jZXNzLnZlcnNpb25zLm5vZGUuc3BsaXQoXCIuXCIpLm1hcChOdW1iZXIpO1xuICAgIH0gZWxzZSBpZiAocHJvY2Vzcy52ZXJzaW9uKSB7XG4gICAgICAgIHZlcnNpb24gPSBwcm9jZXNzLnZlcnNpb24uc3BsaXQoXCIuXCIpLm1hcChOdW1iZXIpO1xuICAgIH1cbiAgICByZXR1cm4gKHZlcnNpb25bMF0gPT09IDAgJiYgdmVyc2lvblsxXSA+IDEwKSB8fCAodmVyc2lvblswXSA+IDApO1xufSkoKTtcbnJldC5ub2RlU3VwcG9ydHNBc3luY1Jlc291cmNlID0gcmV0LmlzTm9kZSAmJiAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN1cHBvcnRzQXN5bmMgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgICB2YXIgcmVzID0gX2RlcmVxXyhcImFzeW5jX2hvb2tzXCIpLkFzeW5jUmVzb3VyY2U7XG4gICAgICAgIHN1cHBvcnRzQXN5bmMgPSB0eXBlb2YgcmVzLnByb3RvdHlwZS5ydW5JbkFzeW5jU2NvcGUgPT09IFwiZnVuY3Rpb25cIjtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHN1cHBvcnRzQXN5bmMgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cHBvcnRzQXN5bmM7XG59KSgpO1xuXG5pZiAocmV0LmlzTm9kZSkgcmV0LnRvRmFzdFByb3BlcnRpZXMocHJvY2Vzcyk7XG5cbnRyeSB7dGhyb3cgbmV3IEVycm9yKCk7IH0gY2F0Y2ggKGUpIHtyZXQubGFzdExpbmVFcnJvciA9IGU7fVxubW9kdWxlLmV4cG9ydHMgPSByZXQ7XG5cbn0se1wiLi9lczVcIjoxMyxcImFzeW5jX2hvb2tzXCI6dW5kZWZpbmVkfV19LHt9LFs0XSkoNClcbn0pOyAgICAgICAgICAgICAgICAgICAgO2lmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cgIT09IG51bGwpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LlAgPSB3aW5kb3cuUHJvbWlzZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICYmIHNlbGYgIT09IG51bGwpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuUCA9IHNlbGYuUHJvbWlzZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsInZhciBuZXh0VGljayA9IHJlcXVpcmUoJ3Byb2Nlc3MvYnJvd3Nlci5qcycpLm5leHRUaWNrO1xudmFyIGFwcGx5ID0gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5O1xudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGltbWVkaWF0ZUlkcyA9IHt9O1xudmFyIG5leHRJbW1lZGlhdGVJZCA9IDA7XG5cbi8vIERPTSBBUElzLCBmb3IgY29tcGxldGVuZXNzXG5cbmV4cG9ydHMuc2V0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRUaW1lb3V0LCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFyVGltZW91dCk7XG59O1xuZXhwb3J0cy5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRJbnRlcnZhbCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhckludGVydmFsKTtcbn07XG5leHBvcnRzLmNsZWFyVGltZW91dCA9XG5leHBvcnRzLmNsZWFySW50ZXJ2YWwgPSBmdW5jdGlvbih0aW1lb3V0KSB7IHRpbWVvdXQuY2xvc2UoKTsgfTtcblxuZnVuY3Rpb24gVGltZW91dChpZCwgY2xlYXJGbikge1xuICB0aGlzLl9pZCA9IGlkO1xuICB0aGlzLl9jbGVhckZuID0gY2xlYXJGbjtcbn1cblRpbWVvdXQucHJvdG90eXBlLnVucmVmID0gVGltZW91dC5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7fTtcblRpbWVvdXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2NsZWFyRm4uY2FsbCh3aW5kb3csIHRoaXMuX2lkKTtcbn07XG5cbi8vIERvZXMgbm90IHN0YXJ0IHRoZSB0aW1lLCBqdXN0IHNldHMgdXAgdGhlIG1lbWJlcnMgbmVlZGVkLlxuZXhwb3J0cy5lbnJvbGwgPSBmdW5jdGlvbihpdGVtLCBtc2Vjcykge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gbXNlY3M7XG59O1xuXG5leHBvcnRzLnVuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gLTE7XG59O1xuXG5leHBvcnRzLl91bnJlZkFjdGl2ZSA9IGV4cG9ydHMuYWN0aXZlID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cbiAgdmFyIG1zZWNzID0gaXRlbS5faWRsZVRpbWVvdXQ7XG4gIGlmIChtc2VjcyA+PSAwKSB7XG4gICAgaXRlbS5faWRsZVRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gb25UaW1lb3V0KCkge1xuICAgICAgaWYgKGl0ZW0uX29uVGltZW91dClcbiAgICAgICAgaXRlbS5fb25UaW1lb3V0KCk7XG4gICAgfSwgbXNlY3MpO1xuICB9XG59O1xuXG4vLyBUaGF0J3Mgbm90IGhvdyBub2RlLmpzIGltcGxlbWVudHMgaXQgYnV0IHRoZSBleHBvc2VkIGFwaSBpcyB0aGUgc2FtZS5cbmV4cG9ydHMuc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gc2V0SW1tZWRpYXRlIDogZnVuY3Rpb24oZm4pIHtcbiAgdmFyIGlkID0gbmV4dEltbWVkaWF0ZUlkKys7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aCA8IDIgPyBmYWxzZSA6IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICBpbW1lZGlhdGVJZHNbaWRdID0gdHJ1ZTtcblxuICBuZXh0VGljayhmdW5jdGlvbiBvbk5leHRUaWNrKCkge1xuICAgIGlmIChpbW1lZGlhdGVJZHNbaWRdKSB7XG4gICAgICAvLyBmbi5jYWxsKCkgaXMgZmFzdGVyIHNvIHdlIG9wdGltaXplIGZvciB0aGUgY29tbW9uIHVzZS1jYXNlXG4gICAgICAvLyBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL2NhbGwtYXBwbHktc2VndVxuICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmbi5jYWxsKG51bGwpO1xuICAgICAgfVxuICAgICAgLy8gUHJldmVudCBpZHMgZnJvbSBsZWFraW5nXG4gICAgICBleHBvcnRzLmNsZWFySW1tZWRpYXRlKGlkKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBpZDtcbn07XG5cbmV4cG9ydHMuY2xlYXJJbW1lZGlhdGUgPSB0eXBlb2YgY2xlYXJJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IGNsZWFySW1tZWRpYXRlIDogZnVuY3Rpb24oaWQpIHtcbiAgZGVsZXRlIGltbWVkaWF0ZUlkc1tpZF07XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5jbGFzcyBBY3Rpb25TdHJhdGVneSB7XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGNvbnN0cnVjdG9yKGZpZWxkLCBmaWVsZFZpZXcpIHtcbiAgICAgICAgdGhpcy5maWVsZCAgICAgPSBmaWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFZpZXcgPSBmaWVsZFZpZXc7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBhY3Rpb24oZmlsbFN0cmF0ZWd5LCBtbikge1xuXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFjdGlvblN0cmF0ZWd5OyIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBQcm9taXNlICAgICAgICAgICAgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIik7XG5jb25zdCBBY3Rpb25TdHJhdGVneSAgICAgPSByZXF1aXJlKFwiLi4vQWN0aW9uU3RyYXRlZ3lcIik7XG5jb25zdCBGaWVsZCAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vLi4vRmllbGRcIik7XG5jb25zdCBCb3R0b21Nb3ZlU3RyYXRlZ3kgPSByZXF1aXJlKFwiLi4vLi4vTW92ZVN0cmF0ZWd5L0JvdHRvbU1vdmVTdHJhdGVneS9Cb3R0b21Nb3ZlU3RyYXRlZ3lcIik7XG5jb25zdCByZXMgICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vLi4vcmVzXCIpO1xuY29uc3QgUmVndWxhclRpbGUgICAgICAgID0gcmVxdWlyZShcIi4uLy4uL1RpbGUvUmVndWxhclRpbGUvUmVndWxhclRpbGVcIik7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuY2xhc3MgQm9tYkFjdGlvblN0cmF0ZWd5IGV4dGVuZHMgQWN0aW9uU3RyYXRlZ3kge1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBjb25zdHJ1Y3RvcihmaWVsZCwgZmllbGRWaWV3KSB7XG4gICAgICAgIHN1cGVyKGZpZWxkLCBmaWVsZFZpZXcpO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgYWN0aW9uKGZpbGxTdHJhdGVneSwgbW4pIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJCb21iQWN0aW9uU3RyYXRlZ3kuYWN0aW9uXCIpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICBjb25zdCBtbnMgPSBbbW5dO1xuICAgICAgICAgICAgZm9yIChsZXQgX21uIG9mIFtcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLmNhbGNUb3AobW4pLFxuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQuY2FsY1JpZ2h0KG1uKSxcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLmNhbGNCb3R0b20obW4pLFxuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQuY2FsY0xlZnQobW4pXG4gICAgICAgICAgICBdKSB7XG4gICAgICAgICAgICAgICAgaWYgKF9tbiA9PT0gbnVsbCkgY29udGludWU7XG4gICAgICAgICAgICAgICAgbW5zLnB1c2goX21uKTtcbiAgICAgICAgICAgICAgICBjb25zdCBfdGlsZSA9IHRoaXMuZmllbGQuZ2V0VGlsZShfbW4pO1xuICAgICAgICAgICAgICAgIGlmIChfdGlsZSBpbnN0YW5jZW9mIFJlZ3VsYXJUaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRbX3RpbGUuY29sb3JJbmRleF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W190aWxlLmNvbG9ySW5kZXhdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHRbX3RpbGUuY29sb3JJbmRleF0rKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJtbnM6XCIsIG1ucyk7XG4gICAgICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5RWZmZWN0KHJlcy5zb3VuZEJ1cm4sIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuZmllbGQuYnVyblRpbGVzKG1ucyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maWVsZFZpZXcuZmFkZU91dFRpbGVzKG1ucykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbW92ZXMgPSBuZXcgQm90dG9tTW92ZVN0cmF0ZWd5KCkuZmluZE1vdmVzKHRoaXMuZmllbGQpO1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJtb3ZlczpcIiwgbW92ZXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQuYXBwbHlNb3Zlcyhtb3Zlcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmllbGRWaWV3Lm1ha2VNb3Zlcyhtb3ZlcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVtcHR5TU5zID0gdGhpcy5maWVsZC5nZXRFbXB0eVRpbGVzTU5zKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJuZXcgdGlsZXM6XCIsIGVtcHR5TU5zKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsbFN0cmF0ZWd5LnJlZmlsbEZpZWxkKGVtcHR5TU5zKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsbFN0cmF0ZWd5LnJlZmlsbEZpZWxkVmlldyhlbXB0eU1Ocyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZpZWxkVmlldy5mYWRlSW5UaWxlcyhlbXB0eU1Ocyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJvbWJBY3Rpb25TdHJhdGVneTsiLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFByb21pc2UgICAgICAgICAgICA9IHJlcXVpcmUoXCJibHVlYmlyZFwiKTtcbmNvbnN0IEFjdGlvblN0cmF0ZWd5ICAgICA9IHJlcXVpcmUoXCIuLi9BY3Rpb25TdHJhdGVneVwiKTtcbmNvbnN0IENvbnN0ICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi8uLi9Db25zdFwiKTtcbmNvbnN0IHJlcyAgICAgICAgICAgICAgICA9ICByZXF1aXJlKFwiLi4vLi4vcmVzXCIpO1xuY29uc3QgQm90dG9tTW92ZVN0cmF0ZWd5ID0gcmVxdWlyZShcIi4uLy4uL01vdmVTdHJhdGVneS9Cb3R0b21Nb3ZlU3RyYXRlZ3kvQm90dG9tTW92ZVN0cmF0ZWd5XCIpO1xuY29uc3QgQmFnICAgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4uLy4uL0JhZ1wiKTtcbmNvbnN0IEZpZWxkICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi8uLi9GaWVsZFwiKTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5jbGFzcyBSZWd1bGFyQWN0aW9uU3RyYXRlZ3kgZXh0ZW5kcyBBY3Rpb25TdHJhdGVneSB7XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGNvbnN0cnVjdG9yKGZpZWxkLCBmaWVsZFZpZXcpIHtcbiAgICAgICAgc3VwZXIoZmllbGQsIGZpZWxkVmlldyk7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBmaW5kVGlsZXMobW4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRDb2xvckFyZWEobW4pO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgX2ZpbmRDb2xvckFyZWEobW4pIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIlJlZ3VsYXJBY3Rpb25TdHJhdGVneS5maW5kQ29sb3JBcmVhXCIsIG1uKTtcbiAgICAgICAgY29uc3QgYmFnID0gbmV3IEJhZygpO1xuICAgICAgICBiYWcucHV0KG1uKTtcbiAgICAgICAgdGhpcy5fY2hlY2tOZWFyYnkobW4sIGJhZyk7XG4gICAgICAgIHJldHVybiBiYWcudG9BcnJheSgpO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgX2NoZWNrTmVhcmJ5KG1uLCBiYWcpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIlJlZ3VsYXJBY3Rpb25TdHJhdGVneS5jaGVja05lYXJieVwiLCBtbiwgSlNPTi5zdHJpbmdpZnkoYmFnKSk7XG4gICAgICAgIGNvbnN0IFJlZ3VsYXJUaWxlID0gcmVxdWlyZShcIi4uLy4uL1RpbGUvUmVndWxhclRpbGUvUmVndWxhclRpbGVcIik7XG4gICAgICAgIGNvbnN0IHRpbGUgPSB0aGlzLmZpZWxkLmdldFRpbGUobW4pO1xuICAgICAgICBjb25zdCBteUNvbG9ySW5kZXggPSB0aWxlLmNvbG9ySW5kZXg7XG4gICAgICAgIGZvciAobGV0IF9tbiBvZiBbXG4gICAgICAgICAgICB0aGlzLmZpZWxkLmNhbGNUb3AobW4pLFxuICAgICAgICAgICAgdGhpcy5maWVsZC5jYWxjUmlnaHQobW4pLFxuICAgICAgICAgICAgdGhpcy5maWVsZC5jYWxjQm90dG9tKG1uKSxcbiAgICAgICAgICAgIHRoaXMuZmllbGQuY2FsY0xlZnQobW4pXG4gICAgICAgIF0pIHtcbiAgICAgICAgICAgIGlmIChfbW4gPT09IG51bGwpIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3QgX3RpbGUgPSB0aGlzLmZpZWxkLmdldFRpbGUoX21uKTtcbiAgICAgICAgICAgIGlmIChfdGlsZSBpbnN0YW5jZW9mIFJlZ3VsYXJUaWxlICYmIF90aWxlLmNvbG9ySW5kZXggPT09IG15Q29sb3JJbmRleCAmJiAhYmFnLmNvbnRhaW5zKF9tbikpIHtcbiAgICAgICAgICAgICAgICBiYWcucHV0KF9tbik7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2hlY2tOZWFyYnkoX21uLCBiYWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBhY3Rpb24oZmlsbFN0cmF0ZWd5LCBtbikge1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiUmVndWxhckFjdGlvblN0cmF0ZWd5LmFjdGlvblwiLCBmaWVsZCwgZmllbGRWaWV3LCBtbik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0aWxlID0gdGhpcy5maWVsZC5nZXRUaWxlKG1uKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yTU5zID0gdGhpcy5fZmluZENvbG9yQXJlYShtbik7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiY29sb3JNTnM6XCIsIGNvbG9yTU5zLmxlbmd0aCwgY29sb3JNTnMpO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICByZXN1bHRbdGlsZS5jb2xvckluZGV4XSA9IGNvbG9yTU5zLmxlbmd0aDtcbiAgICAgICAgICAgIGlmIChjb2xvck1Ocy5sZW5ndGggPj0gdGhpcy5maWVsZC5nYW1lLm9wdGlvbnMuSykge1xuICAgICAgICAgICAgICAgIGNjLmF1ZGlvRW5naW5lLnBsYXlFZmZlY3QocmVzLnNvdW5kQnVybiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQuYnVyblRpbGVzKGNvbG9yTU5zKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5maWVsZFZpZXcuZmFkZU91dFRpbGVzKGNvbG9yTU5zKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW92ZXMgPSBuZXcgQm90dG9tTW92ZVN0cmF0ZWd5KCkuZmluZE1vdmVzKHRoaXMuZmllbGQpO1xuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwibW92ZXM6XCIsIG1vdmVzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWVsZC5hcHBseU1vdmVzKG1vdmVzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmllbGRWaWV3Lm1ha2VNb3Zlcyhtb3Zlcyk7XG4gICAgICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVtcHR5TU5zID0gdGhpcy5maWVsZC5nZXRFbXB0eVRpbGVzTU5zKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJuZXcgdGlsZXM6XCIsIGVtcHR5TU5zKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsbFN0cmF0ZWd5LnJlZmlsbEZpZWxkKGVtcHR5TU5zLCB7dXNlQm9tYjogdHJ1ZX0pO1xuICAgICAgICAgICAgICAgICAgICBmaWxsU3RyYXRlZ3kucmVmaWxsRmllbGRWaWV3KGVtcHR5TU5zKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmllbGRWaWV3LmZhZGVJblRpbGVzKGVtcHR5TU5zKTtcbiAgICAgICAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUucGxheUVmZmVjdChyZXMuc291bmRXcm9uZywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZpZWxkVmlldy5mbGFzaFRpbGUobW4pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZ3VsYXJBY3Rpb25TdHJhdGVneTsiLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgUHJvbWlzZSAgICAgICAgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIik7XG5jb25zdCBDb25zdCAgICAgICAgICA9IHJlcXVpcmUoXCIuL0NvbnN0XCIpO1xuY29uc3QgSGVscGVyICAgICAgICAgPSByZXF1aXJlKFwiLi9IZWxwZXJcIik7XG5jb25zdCByZXMgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL3Jlc1wiKTtcbmNvbnN0IEhvbWVDb250cm9sbGVyID0gcmVxdWlyZShcIi4vSG9tZUNvbnRyb2xsZXJcIik7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuY2xhc3MgQXBwbGljYXRpb24ge1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgY2MuYXBwID0gdGhpcztcbiAgICAgICAgY2MucmVzID0gcmVzO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgaW5pdCgpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIkFwcGxpY2F0aW9uLmluaXRcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2Mudmlldy5nZXRDYW52YXNTaXplKCk6IFwiICAgICAgICAgICAgICsgSlNPTi5zdHJpbmdpZnkoY2Mudmlldy5nZXRDYW52YXNTaXplKCkpKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJjYy52aWV3LmdldEZyYW1lU2l6ZSgpOiBcIiAgICAgICAgICAgICAgKyBKU09OLnN0cmluZ2lmeShjYy52aWV3LmdldEZyYW1lU2l6ZSgpKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2MuZGlyZWN0b3IuZ2V0V2luU2l6ZSgpOiBcIiAgICAgICAgICAgICsgSlNPTi5zdHJpbmdpZnkoY2MuZGlyZWN0b3IuZ2V0V2luU2l6ZSgpKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2MuZGlyZWN0b3IuZ2V0V2luU2l6ZUluUGl4ZWxzKCk6IFwiICAgICsgSlNPTi5zdHJpbmdpZnkoY2MuZGlyZWN0b3IuZ2V0V2luU2l6ZUluUGl4ZWxzKCkpKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJjYy5kaXJlY3Rvci5nZXRDb250ZW50U2NhbGVGYWN0b3IoKTogXCIgKyBjYy5kaXJlY3Rvci5nZXRDb250ZW50U2NhbGVGYWN0b3IoKSk7XG5cblxuICAgICAgICAvLyBJZiByZWZlcmVuY2VkIGxvYWRpbmcuanMsIHBsZWFzZSByZW1vdmUgaXRcbiAgICAgICAgaWYgKCFjYy5zeXMuaXNOYXRpdmUgJiYgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb2Nvc0xvYWRpbmdcIikpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb2Nvc0xvYWRpbmdcIikpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGFzcyB0cnVlIHRvIGVuYWJsZSByZXRpbmEgZGlzcGxheSwgb24gQW5kcm9pZCBkaXNhYmxlZCBieSBkZWZhdWx0IHRvIGltcHJvdmUgcGVyZm9ybWFuY2VcbiAgICAgICAgY2Mudmlldy5lbmFibGVSZXRpbmEoY2Muc3lzLm9zID09PSBjYy5zeXMuT1NfSU9TID8gdHJ1ZSA6IGZhbHNlKTtcblxuICAgICAgICAvLyBBZGp1c3Qgdmlld3BvcnQgbWV0YVxuICAgICAgICBjYy52aWV3LmFkanVzdFZpZXdQb3J0KHRydWUpO1xuXG4gICAgICAgIC8vIFVuY29tbWVudCB0aGUgZm9sbG93aW5nIGxpbmUgdG8gc2V0IGEgZml4ZWQgb3JpZW50YXRpb24gZm9yIHlvdXIgZ2FtZVxuICAgICAgICAvLyBjYy52aWV3LnNldE9yaWVudGF0aW9uKGNjLk9SSUVOVEFUSU9OX1BPUlRSQUlUKTtcblxuICAgICAgICAvLyBTZXR1cCB0aGUgcmVzb2x1dGlvbiBwb2xpY3kgYW5kIGRlc2lnbiByZXNvbHV0aW9uIHNpemVcbiAgICAgICAgdGhpcy5zZXR1cFJlc29sdXRpb25Qb2xpY3koKTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGxvYWQoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQXBwbGljYXRpb24ubG9hZFwiKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgY2MuTG9hZGVyU2NlbmUucHJlbG9hZChIZWxwZXIucmVzVG9BcnJheShyZXMpLCByZXNvbHZlKTsgICAgICAvLyAvL2xvYWQgcmVzb3VyY2VzXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgcnVuKCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiQXBwbGljYXRpb24ucnVuXCIpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwid2luZG93LmxvY2F0aW9uOlwiLCB3aW5kb3cubG9jYXRpb24pO1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiY2Muc3lzOlwiLCBjYy5zeXMpO1xuXG4gICAgICAgIC8vIGhvbWVDb250cm9sbGVyXG4gICAgICAgIGNvbnN0IGhvbWVDb250cm9sbGVyID0gbmV3IEhvbWVDb250cm9sbGVyKCk7XG4gICAgICAgIGhvbWVDb250cm9sbGVyLmluaXQoKTtcbiAgICAgICAgaG9tZUNvbnRyb2xsZXIucnVuKCk7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzZXR1cFJlc29sdXRpb25Qb2xpY3koKSB7XG4gICAgICAgIGxldCB3aWR0aDtcbiAgICAgICAgbGV0IGhlaWdodDtcbiAgICAgICAgLy9pZiAoY2Muc3lzLmlzTmF0aXZlKSB7XG4gICAgICAgIC8vICAgIHdpZHRoICA9IENvbnN0Lk5BVElWRV9XSURUSDtcbiAgICAgICAgLy8gICAgaGVpZ2h0ID0gQ29uc3QuTkFUSVZFX0hFSUdIVDtcbiAgICAgICAgLy99IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZ2FtZUNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZUNhbnZhc1wiKTtcbiAgICAgICAgICAgIHdpZHRoICA9IGdhbWVDYW52YXMud2lkdGggIC8gZ2FtZUNhbnZhcy5XRUJfU0NBTEU7XG4gICAgICAgICAgICBoZWlnaHQgPSBnYW1lQ2FudmFzLmhlaWdodCAvIGdhbWVDYW52YXMuV0VCX1NDQUxFO1xuICAgICAgICAgICAgLy8gVGhlIGdhbWUgd2lsbCBiZSByZXNpemVkIHdoZW4gYnJvd3NlciBzaXplIGNoYW5nZVxuICAgICAgICAgICAgLy9jYy52aWV3LnJlc2l6ZVdpdGhCcm93c2VyU2l6ZSh0cnVlKTtcbiAgICAgICAgLy99XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2Mud2luU2l6ZSBiZWZvcmU6XCIsIEpTT04uc3RyaW5naWZ5KGNjLndpblNpemUpKTtcbiAgICAgICAgY2Mudmlldy5zZXREZXNpZ25SZXNvbHV0aW9uU2l6ZSh3aWR0aCwgaGVpZ2h0LCBjYy5zeXMuaXNOYXRpdmUgPyBjYy5SZXNvbHV0aW9uUG9saWN5LkZJWEVEX1dJRFRIIDogY2MuUmVzb2x1dGlvblBvbGljeS5TSE9XX0FMTCk7XG4gICAgICAgIC8vY2Mudmlldy5zZXREZXNpZ25SZXNvbHV0aW9uU2l6ZSh3aWR0aCwgaGVpZ2h0LCBjYy5zeXMuaXNOYXRpdmUgPyBjYy5SZXNvbHV0aW9uUG9saWN5LkVYQUNUX0ZJVCA6IGNjLlJlc29sdXRpb25Qb2xpY3kuU0hPV19BTEwpO1xuICAgICAgICBjYy5kaXJlY3Rvci5zZXRDb250ZW50U2NhbGVGYWN0b3IoQ29uc3QuU0NBTEVfRkFDVE9SKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJjYy53aW5TaXplIGFmdGVyOlwiLCBKU09OLnN0cmluZ2lmeShjYy53aW5TaXplKSk7XG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwbGljYXRpb247IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuY2xhc3MgQmFnIHtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgY29udGFpbnMoW20sIG5dKSB7XG4gICAgICAgIHJldHVybiB0aGlzW21dICE9PSB1bmRlZmluZWQgJiYgdGhpc1ttXVtuXSAhPT0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgcHV0KFttLCBuXSwgdmFsdWUgPSB0cnVlKSB7XG4gICAgICAgIGlmICghdGhpc1ttXSkge1xuICAgICAgICAgICAgdGhpc1ttXSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXNbbV1bbl0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGl0ZXJhdGUoZm4pIHtcbiAgICAgICAgZm9yIChsZXQgbSBpbiB0aGlzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBuIGluIHRoaXNbbV0pIHtcbiAgICAgICAgICAgICAgICBmbihbcGFyc2VJbnQobSksIHBhcnNlSW50KG4pXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGdldExlbmd0aCgpIHtcbiAgICAgICAgbGV0IGwgPSAwO1xuICAgICAgICBmb3IgKGxldCBtIGluIHRoaXMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IG4gaW4gdGhpc1ttXSkge1xuICAgICAgICAgICAgICAgIGwrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbDtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHRvQXJyYXkoKSB7XG4gICAgICAgIGNvbnN0IGFyciA9IFtdO1xuICAgICAgICBmb3IgKGxldCBtIGluIHRoaXMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IG4gaW4gdGhpc1ttXSkge1xuICAgICAgICAgICAgICAgIGFyci5wdXNoKFtwYXJzZUludChtKSwgcGFyc2VJbnQobildKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhZzsiLCIndXNlIHN0cmljdCc7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuY2xhc3MgQ29uc3Qge31cblxuLy8gc2NyZWVuXG4vL0NvbnN0Lk5BVElWRV9XSURUSCAgPSAzNjA7XG4vL0NvbnN0Lk5BVElWRV9IRUlHSFQgPSA2NDA7XG5Db25zdC5TQ0FMRV9GQUNUT1IgID0gICAyO1xuXG5Db25zdC5TQ0VORV9CQUNLR1JPVU5EX0NPTE9SID0gY2MuY29sb3IoMTYxLCAxNjEsIDE2MSk7XG5cbkNvbnN0LlNDRU5FX01BUkdJTl9IICAgICAgICAgPSAxNTtcbkNvbnN0LlNDRU5FX01BUkdJTl9WICAgICAgICAgPSAxMDtcblxuQ29uc3QuVElUTEVfRk9OVF9OQU1FICAgICAgICA9IFwiQW1lcmljYW5DYXB0YWluXCI7XG5Db25zdC5TQ0VORV9USVRMRV9GT05UX1NJWkUgID0gMzA7XG5cbkNvbnN0LlRJTEVfQUNUVUFMX1dJRFRIICA9IDQzO1xuQ29uc3QuVElMRV9BQ1RVQUxfSEVJR0hUID0gNDg7XG5cbkNvbnN0LlRJTEVfQ09MT1IgPSBbXG4gICAgY2MuY29sb3IuUkVELFxuICAgIGNjLmNvbG9yLkdSRUVOLFxuICAgIGNjLmNvbG9yKDAsIDE3NywgMjQ0KSwgIC8vIEJMVUVcbiAgICBjYy5jb2xvci5PUkFOR0UsXG4gICAgY2MuY29sb3IuTUFHRU5UQVxuXTtcblxuQ29uc3QuTEVWRUxfT1BUSU9OUyA9IHtcbiAgICAnMSc6IHtcbiAgICAgICAgTTogNywgICAvLyByb3dzXG4gICAgICAgIE46IDksICAgLy8gY29sdW1uc1xuICAgICAgICBDOiA1LCAgIC8vIGNvbG9yc1xuICAgICAgICBLOiAyLCAgIC8vIG1hdGNoIEtcbiAgICAgICAgbW92ZXM6IDMwLFxuICAgICAgICBtaXNzaW9uOiB7XG4gICAgICAgICAgICAnMCc6IDEwLFxuICAgICAgICAgICAgJzEnOiAxMCxcbiAgICAgICAgICAgICcyJzogMTBcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJzInOiB7XG4gICAgICAgIE06IDUsICAgLy8gcm93c1xuICAgICAgICBOOiA1LCAgIC8vIGNvbHVtbnNcbiAgICAgICAgQzogNSwgICAvLyBjb2xvcnNcbiAgICAgICAgSzogMiwgICAvLyBtYXRjaCBLXG4gICAgICAgIG1vdmVzOiAzMCxcbiAgICAgICAgbWlzc2lvbjoge1xuICAgICAgICAgICAgJzAnOiAxMCxcbiAgICAgICAgICAgICcxJzogMTAsXG4gICAgICAgICAgICAnMic6IDEwXG4gICAgICAgIH1cbiAgICB9LFxuICAgICczJzoge1xuICAgICAgICBNOiAxMCwgICAvLyByb3dzXG4gICAgICAgIE46IDEwLCAgIC8vIGNvbHVtbnNcbiAgICAgICAgQzogNSwgICAgLy8gY29sb3JzXG4gICAgICAgIEs6IDIsICAgIC8vIG1hdGNoIEtcbiAgICAgICAgbW92ZXM6IDMwLFxuICAgICAgICBtaXNzaW9uOiB7XG4gICAgICAgICAgICAnMCc6IDEwLFxuICAgICAgICAgICAgJzEnOiAxMCxcbiAgICAgICAgICAgICcyJzogMTBcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblxuQ29uc3QuQ09MT1JfTkFNRSA9IFtcInJlZFwiLCBcImdyZWVuXCIsIFwiYmx1ZVwiLCBcIm9yYW5nZVwiLCBcIm1hZ2VudGFcIl07XG5cbi8vIGJ1dHRvblxuQ29uc3QuQlVUVE9OX0ZPTlRfU0laRSA9IDIyO1xuQ29uc3QuQlVUVE9OX1RFWFRfQ09MT1IgPSBjYy5jb2xvcihcIiM4MDcwNEZcIik7XG5Db25zdC5CVVRUT05fVEVYVF9ESVNBQkxFX0NPTE9SID0gY2MuY29sb3IoXCIjYmZhOTc5XCIpO1xuQ29uc3QuQlVUVE9OX1dJRFRIICA9IDEwMDtcbkNvbnN0LkJVVFRPTl9IRUlHSFQgPSA0MDtcbkNvbnN0LkJVVFRPTl9TSVpFICAgPSB7d2lkdGg6IDIwMCwgaGVpZ2h0OiA1MH07XG5Db25zdC5CVVRUT05fSU5URVJWQUwgPSAyMDtcbkNvbnN0LkJVVFRPTl9DT0xPUiAgICA9IGNjLmNvbG9yKCcjRUNENTkyJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDb25zdDsiLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgQ29uc3QgID0gcmVxdWlyZShcIi4vQ29uc3RcIik7XG5jb25zdCBIZWxwZXIgPSByZXF1aXJlKFwiLi9IZWxwZXJcIik7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuY2xhc3MgRmllbGQge1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBjb25zdHJ1Y3RvcihnYW1lKSB7XG4gICAgICAgIHRoaXMuZ2FtZSAgID0gZ2FtZTtcbiAgICAgICAgdGhpcy5tYXRyaXggPSBIZWxwZXIuY3JlYXRlTWF0cml4KGdhbWUub3B0aW9ucy5NLCBnYW1lLm9wdGlvbnMuTik7XG4gICAgICAgIC8vY29uc29sZS5sb2coXCJtYXRyaXg6XCIsIHRoaXMubWF0cml4KTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHNldFRpbGUoW20sIG5dLCB0aWxlKSB7XG4gICAgICAgIGlmICh0aGlzLmlzVGlsZUV4aXN0cyhbbSwgbl0pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJzZXRUaWxlOiB0aWxlIHBsYWNlIG5vdCBlbXB0eVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1hdHJpeFttXVtuXSA9IHRpbGU7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBnZXRUaWxlKFttLCBuXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXRyaXhbbV1bbl07XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBidXJuVGlsZXMobW5zKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coXCJidXJuVGlsZXM6XCIsIG1ucyk7XG4gICAgICAgIG1ucy5mb3JFYWNoKChbbSwgbl0pID0+IHRoaXMubWF0cml4W21dW25dID0gbnVsbCk7XG4gICAgICAgIC8vY29uc29sZS5sb2coXCJtYXRyaXg6XCIsIHRoaXMubWF0cml4KTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGNhbGNUb3AoW20sIG5dKSB7XG4gICAgICAgIGNvbnN0IF9tID0gbSAtIDE7XG4gICAgICAgIHJldHVybiBfbSA+PSAwID8gW19tLCBuXSA6IG51bGw7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBjYWxjUmlnaHQoW20sIG5dKSB7XG4gICAgICAgIGNvbnN0IF9uID0gbiArIDE7XG4gICAgICAgIHJldHVybiBfbiA8IHRoaXMuZ2FtZS5vcHRpb25zLk4gPyBbbSwgX25dIDogbnVsbDtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGNhbGNCb3R0b20oW20sIG5dKSB7XG4gICAgICAgIGNvbnN0IF9tID0gbSArIDE7XG4gICAgICAgIHJldHVybiBfbSA8IHRoaXMuZ2FtZS5vcHRpb25zLk0gPyBbX20sIG5dIDogbnVsbDtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGNhbGNMZWZ0KFttLCBuXSkge1xuICAgICAgICBjb25zdCBfbiA9IG4gLSAxO1xuICAgICAgICByZXR1cm4gX24gPj0gMCA/IFttLCBfbl0gOiBudWxsO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgaXNUaWxlRXhpc3RzKFttLCBuXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXRyaXhbbV1bbl0gIT0gbnVsbDtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGFwcGx5TW92ZXMobW92ZXMpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIkZpZWxkLmFwcGx5TW92ZXNcIiwgbW92ZXMpO1xuICAgICAgICBtb3Zlcy5mb3JFYWNoKCh7ZnJvbTogW20sIG5dLCB0bzogW19tLCBfbl19KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1hdHJpeFtfbV1bX25dID0gdGhpcy5tYXRyaXhbbV1bbl07XG4gICAgICAgICAgICB0aGlzLm1hdHJpeFttXVtuXSA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwibWF0cml4XCIsIHRoaXMubWF0cml4KTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGdldEVtcHR5VGlsZXNNTnMoKSB7XG4gICAgICAgIGNvbnN0IG1ucyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBtID0gMDsgbSA8IHRoaXMuZ2FtZS5vcHRpb25zLk07IG0rKykge1xuICAgICAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCB0aGlzLmdhbWUub3B0aW9ucy5OOyBuKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNUaWxlRXhpc3RzKFttLG5dKSkge1xuICAgICAgICAgICAgICAgICAgICBtbnMucHVzaChbbSxuXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtbnM7XG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gRmllbGQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoXCJibHVlYmlyZFwiKTtcbmNvbnN0IENvbnN0ICAgPSByZXF1aXJlKFwiLi9Db25zdFwiKTtcbmNvbnN0IEhlbHBlciAgPSByZXF1aXJlKFwiLi9IZWxwZXJcIik7XG5jb25zdCByZXMgICAgID0gcmVxdWlyZShcIi4vcmVzXCIpO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmNsYXNzIEZpZWxkQ29udHJvbGxlciB7XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGNvbnN0cnVjdG9yKGZpZWxkLCBmaWVsZFZpZXcsIGZpbGxTdHJhdGVneSkge1xuICAgICAgICB0aGlzLmZpZWxkICAgICAgICA9IGZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVmlldyAgICA9IGZpZWxkVmlldztcbiAgICAgICAgdGhpcy5maWxsU3RyYXRlZ3kgPSBmaWxsU3RyYXRlZ3k7XG4gICAgICAgIHRoaXMuYnVzeSAgICAgICAgID0gZmFsc2U7XG5cbiAgICAgICAgLy8gZXZlbnRzXG4gICAgICAgIHRoaXMub25BY3Rpb24gPSBudWxsO1xuXG4gICAgICAgIC8vIHN1YnNjcmlwdGlvbnNcbiAgICAgICAgdGhpcy5maWVsZFZpZXcub25UaWxlQ2xpY2sgPSB0aGlzLm9uVGlsZUNsaWNrLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBmaWxsKCkge1xuICAgICAgICB0aGlzLmZpbGxTdHJhdGVneS5maWxsRmllbGQoKTtcbiAgICAgICAgdGhpcy5maWxsU3RyYXRlZ3kuZmlsbEZpZWxkVmlldygpO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgb25UaWxlQ2xpY2sobW4pIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIkZpZWxkVmlldy5vblRpbGVDbGlja1wiLCBtbik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5maWVsZC5nYW1lLmlzT3ZlcigpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuYnVzeSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcImJ1c3lcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmJ1c3kgPSB0cnVlO1xuICAgICAgICAgICAgY29uc3QgdGlsZSA9IHRoaXMuZmllbGQuZ2V0VGlsZShtbik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInRpbGU6XCIsIHRpbGUpO1xuICAgICAgICAgICAgcmV0dXJuIHRpbGUuY3JlYXRlQWN0aW9uU3RyYXRlZ3kodGhpcy5maWVsZCwgdGhpcy5maWVsZFZpZXcpLmFjdGlvbih0aGlzLmZpbGxTdHJhdGVneSwgbW4pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vbkFjdGlvbiAmJiByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub25BY3Rpb24ocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmJ1c3kgPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gRmllbGRDb250cm9sbGVyOyIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBQcm9taXNlID0gcmVxdWlyZShcImJsdWViaXJkXCIpO1xuY29uc3QgQ29uc3QgICA9IHJlcXVpcmUoXCIuL0NvbnN0XCIpO1xuY29uc3QgcmVzICAgICA9IHJlcXVpcmUoXCIuL3Jlc1wiKTtcbmNvbnN0IEhlbHBlciAgPSByZXF1aXJlKFwiLi9IZWxwZXJcIik7XG5cbmNvbnN0IE1BUkdJTiAgICAgPSAgMTU7XG5jb25zdCBGQURFX1RJTUUgID0gMC4zO1xuY29uc3QgRkxBU0hfVElNRSA9IDAuMjtcbmNvbnN0IE1PVkVfVElNRSAgPSAwLjI7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuY2xhc3MgRmllbGRWaWV3IHtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgY29uc3RydWN0b3IoZmllbGQpIHtcbiAgICAgICAgdGhpcy5maWVsZCAgPSBmaWVsZDtcbiAgICAgICAgdGhpcy5ub2RlICAgPSBudWxsO1xuICAgICAgICB0aGlzLm9uVGlsZUNsaWNrID0gbnVsbDtcblxuICAgICAgICB0aGlzLk0gPSBmaWVsZC5nYW1lLm9wdGlvbnMuTTtcbiAgICAgICAgdGhpcy5OID0gZmllbGQuZ2FtZS5vcHRpb25zLk47XG5cbiAgICAgICAgLy8gbWF0cml4XG4gICAgICAgIHRoaXMubWF0cml4ID0gSGVscGVyLmNyZWF0ZU1hdHJpeCh0aGlzLk0sIHRoaXMuTik7XG5cblxuICAgICAgICAvLyBjYWxjXG4gICAgICAgIGNvbnN0IGZpZWxkV2lkdGggICAgICAgPSB0aGlzLmZpZWxkV2lkdGggICAgICAgPSBjYy53aW5TaXplLndpZHRoO1xuICAgICAgICBjb25zdCBmaWVsZFBsYWNlV2lkdGggID0gdGhpcy5maWVsZFBsYWNlV2lkdGggID0gZmllbGRXaWR0aCAtIE1BUkdJTioyO1xuICAgICAgICBjb25zdCB0aWxlUGxhY2VXaWR0aCAgID0gdGhpcy50aWxlUGxhY2VXaWR0aCAgID0gZmllbGRQbGFjZVdpZHRoIC8gdGhpcy5OO1xuICAgICAgICBjb25zdCB0aWxlUGxhY2VTY2FsZSAgID0gdGhpcy50aWxlUGxhY2VTY2FsZSAgID0gdGlsZVBsYWNlV2lkdGggLyBDb25zdC5USUxFX0FDVFVBTF9XSURUSDtcbiAgICAgICAgY29uc3QgdGlsZVBsYWNlSGVpZ2h0ICA9IHRoaXMudGlsZVBsYWNlSGVpZ2h0ICA9IENvbnN0LlRJTEVfQUNUVUFMX0hFSUdIVCAqIHRpbGVQbGFjZVNjYWxlO1xuICAgICAgICBjb25zdCBmaWVsZEhlaWdodCAgICAgID0gdGhpcy5maWVsZEhlaWdodCAgICAgID0gdGlsZVBsYWNlSGVpZ2h0ICogdGhpcy5NICsgTUFSR0lOKjI7XG4gICAgICAgIGNvbnN0IGZpZWxkUGxhY2VIZWlnaHQgPSB0aGlzLmZpZWxkUGxhY2VIZWlnaHQgPSBmaWVsZEhlaWdodCAtIE1BUkdJTioyO1xuICAgICAgICBjb25zdCB0aWxlU2NhbGUgICAgICAgID0gdGhpcy50aWxlU2NhbGUgICAgICAgID0gdGlsZVBsYWNlU2NhbGUgKiAwLjk1O1xuXG4gICAgICAgIHRoaXMubGFzdExvY2FsWk9yZGVyID0gMDtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGNyZWF0ZU5vZGUoKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGUgPSBuZXcgY2MuU2NhbGU5U3ByaXRlKHJlcy5maWVsZCk7XG4gICAgICAgIG5vZGUud2lkdGggID0gdGhpcy5maWVsZFdpZHRoO1xuICAgICAgICBub2RlLmhlaWdodCA9IHRoaXMuZmllbGRIZWlnaHQ7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgY3JlYXRlVGlsZShbbSwgbl0sIGNvbG9ySW5kZXgsIG9wYWNpdHkgPSAyNTUpIHtcbiAgICAgICAgY29uc3QgY29sb3IgPSBDb25zdC5USUxFX0NPTE9SW2NvbG9ySW5kZXhdO1xuICAgICAgICBjb25zdCB0aWxlID0gbmV3IGNjLlNwcml0ZShyZXMudGlsZSk7XG4gICAgICAgIHRpbGUuc2V0Q29sb3IoY29sb3IpO1xuICAgICAgICB0aWxlLnNldFNjYWxlKHRoaXMudGlsZVNjYWxlKTtcbiAgICAgICAgdGlsZS5zZXRPcGFjaXR5KG9wYWNpdHkpO1xuICAgICAgICB0aWxlLl90YWcgPSBbbSwgbl07XG4gICAgICAgIHRoaXMucGxhY2VUaWxlKHRpbGUsIFttLCBuXSk7XG4gICAgICAgIHRoaXMubm9kZS5hZGRDaGlsZCh0aGlzLm1hdHJpeFttXVtuXSA9IHRpbGUpO1xuICAgICAgICBIZWxwZXIub25Ob2RlQ2xpY2sodGlsZSwgdGhpcy5fb25UaWxlQ2xpY2suYmluZCh0aGlzKSk7XG4gICAgICAgIHJldHVybiB0aWxlO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgY3JlYXRlQm9tYlRpbGUoW20sIG5dLCBvcGFjaXR5ID0gMjU1KSB7XG4gICAgICAgIGNvbnN0IHRpbGUgPSBuZXcgY2MuU3ByaXRlKHJlcy5ib21iKTtcbiAgICAgICAgdGlsZS5zZXRTY2FsZSh0aGlzLnRpbGVTY2FsZSk7XG4gICAgICAgIHRpbGUuc2V0T3BhY2l0eShvcGFjaXR5KTtcbiAgICAgICAgdGlsZS5fdGFnID0gW20sIG5dO1xuICAgICAgICB0aGlzLnBsYWNlVGlsZSh0aWxlLCBbbSwgbl0pO1xuICAgICAgICB0aGlzLm5vZGUuYWRkQ2hpbGQodGhpcy5tYXRyaXhbbV1bbl0gPSB0aWxlKTtcbiAgICAgICAgSGVscGVyLm9uTm9kZUNsaWNrKHRpbGUsIHRoaXMuX29uVGlsZUNsaWNrLmJpbmQodGhpcykpO1xuICAgICAgICByZXR1cm4gdGlsZTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHBsYWNlVGlsZSh0aWxlLCBtbikge1xuICAgICAgICBjb25zdCBbeCwgeV0gPSB0aGlzLmNhbGNUaWxlUG9zaXRpb24obW4pO1xuICAgICAgICB0aWxlLnNldFBvc2l0aW9uKHgsIHkpO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgY2FsY1RpbGVQb3NpdGlvbihbbSwgbl0pIHtcbiAgICAgICAgaWYgKG0gPj0gdGhpcy5NKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG0gb3V0IG9mIHJhbmdlOiAke219IG9mICR7dGhpcy5NfWApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuID49IHRoaXMuTikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBuIG91dCBvZiByYW5nZTogJHtufSBvZiAke3RoaXMuTn1gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBfbSA9IHRoaXMuTSAtIG0gIC0gMTtcbiAgICAgICAgY29uc3QgX24gPSAgICAgICAgICBuO1xuICAgICAgICBjb25zdCB4ID0gX24gKiB0aGlzLnRpbGVQbGFjZVdpZHRoICArIHRoaXMudGlsZVBsYWNlV2lkdGggLzIgKyBNQVJHSU47XG4gICAgICAgIGNvbnN0IHkgPSBfbSAqIHRoaXMudGlsZVBsYWNlSGVpZ2h0ICsgdGhpcy50aWxlUGxhY2VIZWlnaHQvMiArIE1BUkdJTjtcbiAgICAgICAgcmV0dXJuIFt4LCB5XTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGZsYXNoVGlsZShbbSwgbl0pIHtcbiAgICAgICAgY29uc3QgdGlsZSA9IHRoaXMubWF0cml4W21dW25dO1xuICAgICAgICB0aGlzLmJyaW5nVG9Gcm9udCh0aWxlKTtcbiAgICAgICAgcmV0dXJuIEhlbHBlci5ydW5BY3Rpb25zKHRpbGUsIFtcbiAgICAgICAgICAgIGNjLnNjYWxlVG8oRkxBU0hfVElNRS8yLCB0aGlzLnRpbGVTY2FsZSArIDAuMTUpLFxuICAgICAgICAgICAgY2Muc2NhbGVUbyhGTEFTSF9USU1FLzIsIHRoaXMudGlsZVNjYWxlKVxuICAgICAgICBdKTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGZhZGVPdXRUaWxlcyhtbnMpIHtcbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcbiAgICAgICAgbW5zLmZvckVhY2gobW4gPT4gcHJvbWlzZXMucHVzaCh0aGlzLmZhZGVPdXRUaWxlKG1uKSkpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgZmFkZU91dFRpbGUoW20sbl0pIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIkZpZWxkVmlldy5mYWRlT3V0VGlsZVwiLCBtLCBuKTtcbiAgICAgICAgY29uc3QgdGlsZSA9IHRoaXMubWF0cml4W21dW25dO1xuICAgICAgICBIZWxwZXIucnVuQWN0aW9ucyh0aWxlLCBbXG4gICAgICAgICAgICBjYy5zY2FsZVRvKEZBREVfVElNRSwgMC42KS5lYXNpbmcoY2MuZWFzZUN1YmljQWN0aW9uT3V0KCkpXG4gICAgICAgIF0pO1xuICAgICAgICByZXR1cm4gSGVscGVyLnJ1bkFjdGlvbnModGlsZSwgW1xuICAgICAgICAgICAgY2MuZmFkZU91dChGQURFX1RJTUUpLmVhc2luZyhjYy5lYXNlQ3ViaWNBY3Rpb25PdXQoKSlcbiAgICAgICAgXSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm5vZGUucmVtb3ZlQ2hpbGQodGlsZSk7XG4gICAgICAgICAgICB0aGlzLm1hdHJpeFttXVtuXSA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgZmFkZUluVGlsZXModGlsZXMpIHtcbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcbiAgICAgICAgdGlsZXMuZm9yRWFjaChtbiA9PiBwcm9taXNlcy5wdXNoKHRoaXMuZmFkZUluVGlsZShtbikpKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGZhZGVJblRpbGUoW20sbl0pIHtcbiAgICAgICAgY29uc3QgdGlsZSA9IHRoaXMubWF0cml4W21dW25dO1xuICAgICAgICByZXR1cm4gSGVscGVyLnJ1bkFjdGlvbnModGlsZSwgW1xuICAgICAgICAgICAgY2MuZmFkZVRvKEZBREVfVElNRSwgMjU1KS5lYXNpbmcoY2MuZWFzZUN1YmljQWN0aW9uT3V0KCkpXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgYnJpbmdUb0Zyb250KHRpbGUpIHtcbiAgICAgICAgdGhpcy5sYXN0TG9jYWxaT3JkZXIrKztcbiAgICAgICAgdGlsZS5zZXRMb2NhbFpPcmRlcih0aGlzLmxhc3RMb2NhbFpPcmRlcik7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzZXRUaWxlT3BhY2l0eShbbSwgbl0sIG9wYWNpdHkpIHtcbiAgICAgICAgY29uc3QgdGlsZSA9IHRoaXMubWF0cml4W21dW25dO1xuICAgICAgICB0aWxlLnNldE9wYWNpdHkob3BhY2l0eSk7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBtYWtlTW92ZXMobW92ZXMpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIkZpZWxkVmlldy5tYWtlTW92ZXM6XCIsIG1vdmVzKTtcbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcbiAgICAgICAgbW92ZXMuZm9yRWFjaChtb3ZlID0+IHByb21pc2VzLnB1c2godGhpcy5tYWtlTW92ZShtb3ZlKSkpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgbWFrZU1vdmUoe2Zyb206IFttLCBuXSwgdG86IFtfbSwgX25dfSkge1xuICAgICAgICBpZiAodGhpcy5tYXRyaXhbX21dW19uXSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibWFrZU1vdmU6IGNhbm5vdCBtb3ZlIHRpbGUgdG8gbm90IGVtcHR5IHBsYWNlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRpbGUgPSB0aGlzLm1hdHJpeFtfbV1bX25dID0gdGhpcy5tYXRyaXhbbV1bbl07XG4gICAgICAgIHRpbGUuX3RhZyA9IFtfbSwgX25dO1xuICAgICAgICB0aGlzLm1hdHJpeFttXVtuXSA9IG51bGw7XG4gICAgICAgIGNvbnN0IFt4LCB5XSA9IHRoaXMuY2FsY1RpbGVQb3NpdGlvbihbX20sIF9uXSk7XG4gICAgICAgIHJldHVybiBIZWxwZXIucnVuQWN0aW9ucyh0aWxlLCBbXG4gICAgICAgICAgICBjYy5tb3ZlVG8oTU9WRV9USU1FLCBjYy5wKHgsIHkpKS5lYXNpbmcoY2MuZWFzZUN1YmljQWN0aW9uT3V0KCkpXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgX29uVGlsZUNsaWNrKHRvdWNoLCBldmVudCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkZpZWxkVmlldy5vblRpbGVDbGlja1wiKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UudHJ5KCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uVGlsZUNsaWNrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbW4gPSBldmVudC5nZXRDdXJyZW50VGFyZ2V0KCkuX3RhZztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vblRpbGVDbGljayhtbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gRmllbGRWaWV3OyIsIlwidXNlIHN0cmljdFwiO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmNsYXNzIEZpbGxTdHJhdGVneSB7XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGNvbnN0cnVjdG9yKGZpZWxkLCBmaWVsZFZpZXcpIHtcbiAgICAgICAgdGhpcy5maWVsZCAgICAgPSBmaWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFZpZXcgPSBmaWVsZFZpZXc7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBmaWxsRmllbGQoKSB7XG5cbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGZpbGxGaWVsZFZpZXcoKSB7XG5cbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHJlZmlsbEZpZWxkKG1ucywgb3B0aW9ucyA9IHt9KSB7XG5cbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHJlZmlsbEZpZWxkVmlldyhlbXB0eU1Ocykge1xuXG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsbFN0cmF0ZWd5OyIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBGaWxsU3RyYXRlZ3kgPSByZXF1aXJlKFwiLi4vRmlsbFN0cmF0ZWd5XCIpO1xuY29uc3QgQ29uc3QgICAgICAgID0gcmVxdWlyZShcIi4uLy4uL0NvbnN0XCIpO1xuY29uc3QgSGVscGVyICAgICAgID0gcmVxdWlyZShcIi4uLy4uL0hlbHBlclwiKTtcbmNvbnN0IFJlZ3VsYXJUaWxlICA9IHJlcXVpcmUoXCIuLi8uLi9UaWxlL1JlZ3VsYXJUaWxlL1JlZ3VsYXJUaWxlXCIpO1xuY29uc3QgQm9tYlRpbGUgICAgID0gcmVxdWlyZShcIi4uLy4uL1RpbGUvQm9tYlRpbGUvQm9tYlRpbGVcIik7XG5cbmNvbnN0IE1JTl9CVVJOX1RJTEVTX1RPX0dFVF9CT01CID0gNDtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5jbGFzcyBSZWd1bGFyRmlsbFN0cmF0ZWd5IGV4dGVuZHMgRmlsbFN0cmF0ZWd5IHtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgY29uc3RydWN0b3IoZmllbGQsIGZpZWxkVmlldykge1xuICAgICAgICBzdXBlcihmaWVsZCwgZmllbGRWaWV3KTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGZpbGxGaWVsZCgpIHtcbiAgICAgICAgZm9yIChsZXQgbSA9IDA7IG0gPCB0aGlzLmZpZWxkLmdhbWUub3B0aW9ucy5NOyBtKyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IG4gPSAwOyBuIDwgdGhpcy5maWVsZC5nYW1lLm9wdGlvbnMuTjsgbisrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sb3JJbmRleCA9IEhlbHBlci5yYW5kb21JbnRlZ2VyKDAsIHRoaXMuZmllbGQuZ2FtZS5vcHRpb25zLkMgLSAxKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLnNldFRpbGUoW20sIG5dLCBuZXcgUmVndWxhclRpbGUoY29sb3JJbmRleCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBmaWxsRmllbGRWaWV3KCkge1xuICAgICAgICBmb3IgKGxldCBtID0gMDsgbSA8IHRoaXMuZmllbGQuZ2FtZS5vcHRpb25zLk07IG0rKykge1xuICAgICAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCB0aGlzLmZpZWxkLmdhbWUub3B0aW9ucy5OOyBuKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jcmVhdGVUaWxlVmlldyhbbSwgbl0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBfY3JlYXRlVGlsZVZpZXcoW20sIG5dLCBvcGFjaXR5ID0gMjU1KSB7XG4gICAgICAgIGNvbnN0IHRpbGUgPSB0aGlzLmZpZWxkLmdldFRpbGUoW20sIG5dKTtcbiAgICAgICAgaWYgKHRpbGUgaW5zdGFuY2VvZiBSZWd1bGFyVGlsZSkge1xuICAgICAgICAgICAgdGhpcy5maWVsZFZpZXcuY3JlYXRlVGlsZShbbSwgbl0sIHRpbGUuY29sb3JJbmRleCwgb3BhY2l0eSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGlsZSBpbnN0YW5jZW9mIEJvbWJUaWxlKSB7XG4gICAgICAgICAgICB0aGlzLmZpZWxkVmlldy5jcmVhdGVCb21iVGlsZShbbSwgbl0sIG9wYWNpdHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICByZWZpbGxGaWVsZChtbnMsIG9wdGlvbnMgPSB7fSkge1xuICAgICAgICBsZXQgYm9tYkkgPSAtMTtcbiAgICAgICAgaWYgKG9wdGlvbnMudXNlQm9tYiAmJiBtbnMubGVuZ3RoID49IE1JTl9CVVJOX1RJTEVTX1RPX0dFVF9CT01CKSB7XG4gICAgICAgICAgICBib21iSSA9IEhlbHBlci5yYW5kb21JbnRlZ2VyKDAsIG1ucy5sZW5ndGgtMSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IFttLCBuXSA9IG1uc1tpXTtcbiAgICAgICAgICAgIGlmIChib21iSSA9PT0gaSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQuc2V0VGlsZShbbSwgbl0sIG5ldyBCb21iVGlsZSgpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sb3JJbmRleCA9IEhlbHBlci5yYW5kb21JbnRlZ2VyKDAsIHRoaXMuZmllbGQuZ2FtZS5vcHRpb25zLkMgLSAxKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLnNldFRpbGUoW20sIG5dLCBuZXcgUmVndWxhclRpbGUoY29sb3JJbmRleCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICByZWZpbGxGaWVsZFZpZXcoZW1wdHlNTnMpIHtcbiAgICAgICAgZW1wdHlNTnMuZm9yRWFjaCgoW20sIG5dKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVUaWxlVmlldyhbbSwgbl0sIDApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZWd1bGFyRmlsbFN0cmF0ZWd5OyIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBDb25zdCA9IHJlcXVpcmUoXCIuL0NvbnN0XCIpO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmNsYXNzIEdhbWUge1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgICAgICAvLyBzY29yZSBieSBjb2xvclxuICAgICAgICB0aGlzLnNjb3JlID0ge307XG4gICAgICAgIGZvciAobGV0IGMgPSAwOyBjIDwgdGhpcy5vcHRpb25zLkM7IGMrKykge1xuICAgICAgICAgICAgdGhpcy5zY29yZVtjXSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtaXNzaW9uXG4gICAgICAgIHRoaXMubWlzc2lvbiA9IHt9O1xuICAgICAgICBmb3IgKGxldCBjIGluIG9wdGlvbnMubWlzc2lvbikge1xuICAgICAgICAgICAgdGhpcy5taXNzaW9uW2NdID0gb3B0aW9ucy5taXNzaW9uW2NdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY291bnRlclxuICAgICAgICB0aGlzLmNvdW50ZXIgPSAwO1xuICAgICAgICB0aGlzLm1vdmVzID0gb3B0aW9ucy5tb3ZlcztcblxuICAgICAgICB0aGlzLnJlc3VsdCA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBpc092ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlc3VsdCAhPT0gbnVsbDtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGFwcGx5QWN0aW9uUmVzdWx0KHJlc3VsdCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiR2FtZS5hcHBseUFjdGlvblJlc3VsdDpcIiwgcmVzdWx0KTtcbiAgICAgICAgdGhpcy5jb3VudGVyKys7XG4gICAgICAgIGlmICh0aGlzLm1vdmVzID4gMCkge1xuICAgICAgICAgICAgdGhpcy5tb3Zlcy0tO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGMgaW4gcmVzdWx0KSB7XG4gICAgICAgICAgICB0aGlzLnNjb3JlW2NdICs9IHJlc3VsdFtjXTtcbiAgICAgICAgICAgIGlmICh0aGlzLm1pc3Npb25bY10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLm1pc3Npb25bY10gPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5taXNzaW9uW2NdIC09IHJlc3VsdFtjXTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5taXNzaW9uW2NdIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pc3Npb25bY10gPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL2NvbnNvbGUubG9nKFwiZ2FtZTpcIiwgdGhpcyk7XG5cbiAgICAgICAgLy8gc3VtXG4gICAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgICBmb3IgKGxldCBjIG9mIE9iamVjdC5rZXlzKHRoaXMubWlzc2lvbikpIHtcbiAgICAgICAgICAgIHN1bSArPSB0aGlzLm1pc3Npb25bY107XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjaGVjayByZXN1bHRcbiAgICAgICAgaWYgKHN1bSA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5yZXN1bHQgPSBcIndpblwiO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubW92ZXMgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMucmVzdWx0ID0gXCJsb3NlXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5yZXN1bHQ7XG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgR2FtZSAgICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0dhbWVcIik7XG5jb25zdCBHYW1lU2NlbmUgICAgICAgICAgID0gcmVxdWlyZShcIi4vR2FtZVNjZW5lXCIpO1xuY29uc3QgRmllbGQgICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0ZpZWxkXCIpO1xuY29uc3QgRmllbGRWaWV3ICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0ZpZWxkVmlld1wiKTtcbmNvbnN0IEZpZWxkQ29udHJvbGxlciAgICAgPSByZXF1aXJlKFwiLi9GaWVsZENvbnRyb2xsZXJcIik7XG5jb25zdCBSZWd1bGFyRmlsbFN0cmF0ZWd5ID0gcmVxdWlyZShcIi4vRmlsbFN0cmF0ZWd5L1JlZ3VsYXJGaWxsU3RyYXRlZ3kvUmVndWxhckZpbGxTdHJhdGVneVwiKTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5jbGFzcyBHYW1lQ29udHJvbGxlciB7XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGNvbnN0cnVjdG9yKGdhbWVPcHRpb25zKSB7XG5cbiAgICAgICAgdGhpcy5nYW1lT3B0aW9ucyA9IGdhbWVPcHRpb25zO1xuXG4gICAgICAgIC8vIGdhbWVcbiAgICAgICAgdGhpcy5nYW1lICAgICAgICAgICAgPSBudWxsOyAgICAgICAgLy8gbW9kZWxcbiAgICAgICAgdGhpcy5nYW1lU2NlbmUgICAgICAgPSBudWxsOyAgICAgICAgLy8gdmlld1xuICAgICAgICAvL3RoaXMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb250cm9sbGVyXG5cbiAgICAgICAgLy8gZmllbGRcbiAgICAgICAgdGhpcy5maWVsZCAgICAgICAgICAgPSBudWxsOyAgICAgICAgLy8gbW9kZWxcbiAgICAgICAgdGhpcy5maWVsZFZpZXcgICAgICAgPSBudWxsOyAgICAgICAgLy8gdmlld1xuICAgICAgICB0aGlzLmZpZWxkQ29udHJvbGxlciA9IG51bGw7ICAgICAgICAvLyBjb250cm9sbGVyXG5cbiAgICAgICAgLy8gbG9naWNcbiAgICAgICAgdGhpcy5maWxsU3RyYXRlZ3kgICAgPSBudWxsO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgaW5pdCgpIHtcblxuICAgICAgICAvLyBnYW1lXG4gICAgICAgIGNvbnN0IGdhbWUgPSB0aGlzLmdhbWUgPSBuZXcgR2FtZSh0aGlzLmdhbWVPcHRpb25zKTtcbiAgICAgICAgY29uc3QgZ2FtZVNjZW5lID0gdGhpcy5nYW1lU2NlbmUgPSBuZXcgR2FtZVNjZW5lKHtnYW1lfSk7XG4gICAgICAgIGdhbWVTY2VuZS5pbml0KCk7XG5cbiAgICAgICAgLy8gZmllbGRcbiAgICAgICAgY29uc3QgZmllbGQgPSB0aGlzLmZpZWxkID0gbmV3IEZpZWxkKGdhbWUpO1xuXG4gICAgICAgIC8vIGZpZWxkVmlld1xuICAgICAgICBjb25zdCBmaWVsZFZpZXcgPSB0aGlzLmZpZWxkVmlldyA9IG5ldyBGaWVsZFZpZXcoZmllbGQpO1xuICAgICAgICBjb25zdCBmaWVsZFZpZXdOb2RlID0gZmllbGRWaWV3LmNyZWF0ZU5vZGUoKTtcbiAgICAgICAgZmllbGRWaWV3Tm9kZS5zZXRQb3NpdGlvbihjYy53aW5TaXplLndpZHRoLzIsIGNjLndpblNpemUuaGVpZ2h0LzIpO1xuICAgICAgICB0aGlzLmdhbWVTY2VuZS5hZGRDaGlsZChmaWVsZFZpZXdOb2RlKTtcblxuICAgICAgICAvLyBmaWxsU3RyYXRlZ3lcbiAgICAgICAgY29uc3QgZmlsbFN0cmF0ZWd5ID0gdGhpcy5maWxsU3RyYXRlZ3kgPSBuZXcgUmVndWxhckZpbGxTdHJhdGVneShmaWVsZCwgZmllbGRWaWV3KTtcblxuICAgICAgICAvLyBmaWVsZENvbnRyb2xsZXJcbiAgICAgICAgY29uc3QgZmllbGRDb250cm9sbGVyID0gdGhpcy5maWVsZENvbnRyb2xsZXIgPSBuZXcgRmllbGRDb250cm9sbGVyKGZpZWxkLCBmaWVsZFZpZXcsIGZpbGxTdHJhdGVneSk7XG4gICAgICAgIHRoaXMuZmllbGRDb250cm9sbGVyLm9uQWN0aW9uID0gdGhpcy5vbkFjdGlvbi5iaW5kKHRoaXMpO1xuICAgICAgICBmaWVsZENvbnRyb2xsZXIuZmlsbCgpO1xuXG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBydW4oKSB7XG4gICAgICAgIGNjLmRpcmVjdG9yLnJ1blNjZW5lKHRoaXMuZ2FtZVNjZW5lKTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIG9uQWN0aW9uKHJlc3VsdCkge1xuICAgICAgICBjb25zdCBnYW1lUmVzdWx0ID0gdGhpcy5nYW1lLmFwcGx5QWN0aW9uUmVzdWx0KHJlc3VsdCk7XG4gICAgICAgIHRoaXMuZ2FtZVNjZW5lLnNldFNjb3JlKHRoaXMuZ2FtZS5zY29yZSk7XG4gICAgICAgIHRoaXMuZ2FtZVNjZW5lLnNldENvdW50ZXIodGhpcy5nYW1lLmNvdW50ZXIpO1xuICAgICAgICB0aGlzLmdhbWVTY2VuZS5zZXRNaXNzaW9uKHRoaXMuZ2FtZS5taXNzaW9uKTtcbiAgICAgICAgdGhpcy5nYW1lU2NlbmUuc2V0TW92ZXModGhpcy5nYW1lLm1vdmVzKTtcbiAgICAgICAgaWYgKGdhbWVSZXN1bHQgPT09IFwid2luXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZVNjZW5lLnNldEdhbWVPdmVyTWVzc2FnZShcInlvdSB3aW5cIiwgXCJ3aW5cIik7XG4gICAgICAgIH0gZWxzZSBpZiAoZ2FtZVJlc3VsdCA9PT0gXCJsb3NlXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZVNjZW5lLnNldEdhbWVPdmVyTWVzc2FnZShcInlvdSBsb3NlXCIsIFwibG9zZVwiKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHYW1lQ29udHJvbGxlcjsiLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgUHJvbWlzZSAgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIik7XG5jb25zdCBDb25zdCAgICA9IHJlcXVpcmUoXCIuL0NvbnN0XCIpO1xuY29uc3QgSGVscGVyICAgPSByZXF1aXJlKFwiLi9IZWxwZXJcIik7XG5jb25zdCByZXMgICAgICA9IHJlcXVpcmUoXCIuL3Jlc1wiKTtcblxuY29uc3QgU1BBQ0UgPSA3MjtcblxudmFyIEdBTUVfT1ZFUl9NRVNTQUdFX0NPTE9SX1dJTiAgPSBjYy5jb2xvcihcIiM0ZGMxNDRcIik7XG52YXIgR0FNRV9PVkVSX01FU1NBR0VfQ09MT1JfRFJBVyA9IGNjLmNvbG9yKFwiIzE2NThkYlwiKTtcbnZhciBHQU1FX09WRVJfTUVTU0FHRV9DT0xPUl9MT1NFID0gY2MuY29sb3IoXCIjZTgyZDJkXCIpO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmNvbnN0IEdhbWVTY2VuZSA9IGNjLlNjZW5lLmV4dGVuZCh7XG5cbiAgICBfY2xhc3NOYW1lICAgICA6IFwiR2FtZVNjZW5lXCIsXG4gICAgc2NvcmVMYWJlbHMgICAgOiBudWxsLFxuICAgIGNvdW50ZXJMYWJlbCAgIDogbnVsbCxcbiAgICBtaXNzaW9uTGFiZWxzICA6IG51bGwsXG4gICAgbW92ZXNMYWJlbCAgICAgOiBudWxsLFxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLl9zdXBlcigpO1xuICAgICAgICB0aGlzLmdhbWUgPSBvcHRpb25zLmdhbWU7XG4gICAgICAgIHRoaXMuc2NvcmVMYWJlbHMgPSBuZXcgQXJyYXkodGhpcy5nYW1lLm9wdGlvbnMuQyk7XG4gICAgICAgIHRoaXMubWlzc2lvbkxhYmVscyA9IG5ldyBBcnJheShPYmplY3Qua2V5cyh0aGlzLmdhbWUubWlzc2lvbikubGVuZ3RoKTtcbiAgICB9LFxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBpbml0KCkge1xuXG4gICAgICAgIC8vIGJhY2tncm91bmRcbiAgICAgICAgdGhpcy5hZGRDaGlsZChIZWxwZXIuY3JlYXRlQmFja2dyb3VuZChDb25zdC5TQ0VORV9CQUNLR1JPVU5EX0NPTE9SKSk7XG5cblxuICAgICAgICAvLyBiYWNrQnV0dG9uXG4gICAgICAgIGNvbnN0IGJhY2tCdXR0b24gPSBIZWxwZXIuY3JlYXRlQmFja0J1dHRvbigpO1xuICAgICAgICBiYWNrQnV0dG9uLm9uQ2xpY2sgPSB0aGlzLm9uQmFja1ByZXNzZWQuYmluZCh0aGlzKTtcblxuICAgICAgICB0aGlzLmFkZENoaWxkKGJhY2tCdXR0b24pO1xuXG4gICAgICAgIC8vIHNjb3JlIGxhYmVsc1xuICAgICAgICBmb3IgKGxldCBjID0gMDsgYyA8IHRoaXMuZ2FtZS5vcHRpb25zLkM7IGMrKykge1xuICAgICAgICAgICAgY29uc3QgbGFiZWwgPSB0aGlzLnNjb3JlTGFiZWxzW2NdID0gSGVscGVyLmNyZWF0ZUxhYmVsVFRGKGAke0NvbnN0LkNPTE9SX05BTUVbY119OiAkezB9YCwgSGVscGVyLmdldEZvbnQoQ29uc3QuVElUTEVfRk9OVF9OQU1FKSk7XG4gICAgICAgICAgICBsYWJlbC5zZXRBbmNob3JQb2ludCgwLCAwLjUpO1xuICAgICAgICAgICAgbGFiZWwuc2V0UG9zaXRpb24oNSArIFNQQUNFKmMsIDIwKTtcbiAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQobGFiZWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY291bnRlckxhYmVsXG4gICAgICAgIGNvbnN0IGNvdW50ZXJMYWJlbCA9IHRoaXMuY291bnRlckxhYmVsID0gSGVscGVyLmNyZWF0ZUxhYmVsVFRGKFwiY291bnRlcjogMFwiLCBIZWxwZXIuZ2V0Rm9udChDb25zdC5USVRMRV9GT05UX05BTUUpKTtcbiAgICAgICAgY291bnRlckxhYmVsLnNldEFuY2hvclBvaW50KDAsIDAuNSk7XG4gICAgICAgIGNvdW50ZXJMYWJlbC5zZXRQb3NpdGlvbig1LCA1MCk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQoY291bnRlckxhYmVsKTtcblxuICAgICAgICAvLyBtaXNzaW9uTGFiZWxzXG4gICAgICAgIGZvciAobGV0IGMgPSAwOyBjIDwgT2JqZWN0LmtleXModGhpcy5nYW1lLm1pc3Npb24pLmxlbmd0aDsgYysrKSB7XG5cbiAgICAgICAgICAgIGNvbnN0IGxhYmVsID0gdGhpcy5taXNzaW9uTGFiZWxzW2NdID0gSGVscGVyLmNyZWF0ZUxhYmVsVFRGKGAke0NvbnN0LkNPTE9SX05BTUVbY119OiAke3RoaXMuZ2FtZS5taXNzaW9uW2NdfWAsIEhlbHBlci5nZXRGb250KENvbnN0LlRJVExFX0ZPTlRfTkFNRSkpO1xuICAgICAgICAgICAgbGFiZWwuc2V0QW5jaG9yUG9pbnQoMCwgMC41KTtcbiAgICAgICAgICAgIGxhYmVsLnNldFBvc2l0aW9uKDUgKyBTUEFDRSpjLCBjYy53aW5TaXplLmhlaWdodCAtIDEzMCk7XG4gICAgICAgICAgICB0aGlzLmFkZENoaWxkKGxhYmVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvdW50ZXJMYWJlbFxuICAgICAgICBjb25zdCBtb3Zlc0xhYmVsID0gdGhpcy5tb3Zlc0xhYmVsID0gSGVscGVyLmNyZWF0ZUxhYmVsVFRGKGBtb3ZlczogJHt0aGlzLmdhbWUubW92ZXN9YCwgSGVscGVyLmdldEZvbnQoQ29uc3QuVElUTEVfRk9OVF9OQU1FKSk7XG4gICAgICAgIG1vdmVzTGFiZWwuc2V0QW5jaG9yUG9pbnQoMCwgMC41KTtcbiAgICAgICAgbW92ZXNMYWJlbC5zZXRQb3NpdGlvbig1LCBjYy53aW5TaXplLmhlaWdodCAtIDEwMCk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQobW92ZXNMYWJlbCk7XG5cblxuICAgICAgICAvKlxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0R2FtZU92ZXJNZXNzYWdlKFwiR0FNRSBPVkVSXCIsIFwiZHJhd1wiKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgKi9cblxuICAgICAgICAvLyBtaXNzaW9uTGFiZWxcbiAgICAgICAgdmFyIG1pc3Npb25MYWJlbCA9IEhlbHBlci5jcmVhdGVMYWJlbFRURignbWlzc2lvbicsIEhlbHBlci5nZXRGb250KENvbnN0LlRJVExFX0ZPTlRfTkFNRSksIENvbnN0LlNDRU5FX1RJVExFX0ZPTlRfU0laRSk7XG4gICAgICAgIG1pc3Npb25MYWJlbC5zZXRQb3NpdGlvbihIZWxwZXIudG9MZWZ0VG9wKGNjLnZpc2libGVSZWN0LCBjYy52aXNpYmxlUmVjdC5jZW50ZXIueCwgODApKTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZChtaXNzaW9uTGFiZWwpO1xuXG5cbiAgICAgICAgLy8gc2NvcmVMYWJlbFxuICAgICAgICB2YXIgc2NvcmVMYWJlbCA9IEhlbHBlci5jcmVhdGVMYWJlbFRURignc2NvcmUnLCBIZWxwZXIuZ2V0Rm9udChDb25zdC5USVRMRV9GT05UX05BTUUpLCBDb25zdC5TQ0VORV9USVRMRV9GT05UX1NJWkUpO1xuICAgICAgICBzY29yZUxhYmVsLnNldFBvc2l0aW9uKEhlbHBlci5mcm9tTGVmdEJvdHRvbShjYy52aXNpYmxlUmVjdCwgY2MudmlzaWJsZVJlY3QuY2VudGVyLngsIDEwMCkpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKHNjb3JlTGFiZWwpO1xuXG5cbiAgICB9LFxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBvbkJhY2tQcmVzc2VkKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIm9uQmFja1ByZXNzZWRcIik7XG5cbiAgICAgICAgY29uc3QgSG9tZUNvbnRyb2xsZXIgICAgICA9IHJlcXVpcmUoXCIuL0hvbWVDb250cm9sbGVyXCIpO1xuXG4gICAgICAgIC8vIGhvbWVDb250cm9sbGVyXG4gICAgICAgIGNvbnN0IGhvbWVDb250cm9sbGVyID0gbmV3IEhvbWVDb250cm9sbGVyKCk7XG4gICAgICAgIGhvbWVDb250cm9sbGVyLmluaXQoKTtcbiAgICAgICAgaG9tZUNvbnRyb2xsZXIucnVuKCk7XG4gICAgfSxcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgc2V0U2NvcmUoc2NvcmUpIHtcbiAgICAgICAgZm9yIChsZXQgYyBpbiBzY29yZSkge1xuICAgICAgICAgICAgdGhpcy5zY29yZUxhYmVsc1tjXS5zZXRTdHJpbmcoYCR7Q29uc3QuQ09MT1JfTkFNRVtjXX06ICR7c2NvcmVbY119YCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzZXRDb3VudGVyKGNvdW50ZXIpIHtcbiAgICAgICAgdGhpcy5jb3VudGVyTGFiZWwuc2V0U3RyaW5nKGBjb3VudGVyOiAke2NvdW50ZXJ9YCk7XG4gICAgfSxcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgc2V0TW92ZXMobW92ZXMpIHtcbiAgICAgICAgdGhpcy5tb3Zlc0xhYmVsLnNldFN0cmluZyhgbW92ZXM6ICR7bW92ZXN9YCk7XG4gICAgfSxcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgc2V0TWlzc2lvbihtaXNzaW9uKSB7XG4gICAgICAgIGZvciAobGV0IGMgaW4gbWlzc2lvbikge1xuICAgICAgICAgICAgdGhpcy5taXNzaW9uTGFiZWxzW2NdLnNldFN0cmluZyhgJHtDb25zdC5DT0xPUl9OQU1FW2NdfTogJHttaXNzaW9uW2NdfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzZXRHYW1lT3Zlck1lc3NhZ2UobWVzc2FnZSwgcmVzdWx0KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiR2FtZVNjZW5lLnNldEdhbWVPdmVyTWVzc2FnZVwiLCBtZXNzYWdlKTtcbiAgICAgICAgdmFyIGdhbWVPdmVyTGFiZWwgPSBIZWxwZXIuY3JlYXRlTGFiZWxUVEYobWVzc2FnZS50b1VwcGVyQ2FzZSgpLCBIZWxwZXIuZ2V0Rm9udChDb25zdC5USVRMRV9GT05UX05BTUUpLCA1MCk7XG4gICAgICAgIGdhbWVPdmVyTGFiZWwuc2V0UG9zaXRpb24oY2Mud2luU2l6ZS53aWR0aC8yLCBjYy53aW5TaXplLmhlaWdodC8yKTtcbiAgICAgICAgZ2FtZU92ZXJMYWJlbC5zZXRIb3Jpem9udGFsQWxpZ25tZW50KGNjLlRFWFRfQUxJR05NRU5UX0NFTlRFUik7XG4gICAgICAgIHZhciBib3ggPSBnYW1lT3ZlckxhYmVsLmdldEJvdW5kaW5nQm94KCk7XG5cbiAgICAgICAgLy8gY29sb3JcbiAgICAgICAgdmFyIGNvbG9yID0gR0FNRV9PVkVSX01FU1NBR0VfQ09MT1JfRFJBVztcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gXCJ3aW5cIikge1xuICAgICAgICAgICAgY29sb3IgPSBHQU1FX09WRVJfTUVTU0FHRV9DT0xPUl9XSU47XG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0ID09PSBcImxvc2VcIikge1xuICAgICAgICAgICAgY29sb3IgPSBHQU1FX09WRVJfTUVTU0FHRV9DT0xPUl9MT1NFO1xuICAgICAgICB9XG4gICAgICAgIHZhciBnYW1lT3Zlck1lc3NhZ2VMYXllciA9IG5ldyBjYy5MYXllckNvbG9yKGNvbG9yLCBib3gud2lkdGggKyAxMCwgYm94LmhlaWdodCArIDEwKTtcbiAgICAgICAgZ2FtZU92ZXJNZXNzYWdlTGF5ZXIuc2V0UG9zaXRpb24oY2Mud2luU2l6ZS53aWR0aC8yIC0gZ2FtZU92ZXJNZXNzYWdlTGF5ZXIud2lkdGgvMiwgY2Mud2luU2l6ZS5oZWlnaHQvMiAtIGdhbWVPdmVyTWVzc2FnZUxheWVyLmhlaWdodC8yKTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZChnYW1lT3Zlck1lc3NhZ2VMYXllcik7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQoZ2FtZU92ZXJMYWJlbCk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBHYW1lU2NlbmU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IFByb21pc2UgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIik7XG5jb25zdCBDb25zdCAgID0gcmVxdWlyZShcIi4vQ29uc3RcIik7XG5jb25zdCByZXMgICAgID0gcmVxdWlyZShcIi4vcmVzXCIpO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuY2xhc3MgSGVscGVyIHtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHN0YXRpYyByZXNUb0FycmF5KHJlcykge1xuICAgICAgICBjb25zdCBhc3NldHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaWQgaW4gcmVzKSB7XG4gICAgICAgICAgICBhc3NldHMucHVzaChyZXNbaWRdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXNzZXRzO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHN0YXRpYyBjcmVhdGVCYWNrZ3JvdW5kKGNvbG9yKSB7XG4gICAgICAgIGNvbnN0IGJhY2tncm91bmQgPSBuZXcgY2MuU3ByaXRlKHJlcy5jb2xvcldoaXRlKTtcbiAgICAgICAgYmFja2dyb3VuZC5zZXRBbmNob3JQb2ludCgwLCAwKTtcbiAgICAgICAgYmFja2dyb3VuZC5zZXRDb2xvcihjb2xvcik7XG4gICAgICAgIGJhY2tncm91bmQuc2V0U2NhbGUoXG4gICAgICAgICAgICBjYy53aW5TaXplLndpZHRoICAvIGJhY2tncm91bmQud2lkdGgsXG4gICAgICAgICAgICBjYy53aW5TaXplLmhlaWdodCAvIGJhY2tncm91bmQuaGVpZ2h0XG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBiYWNrZ3JvdW5kO1xuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzdGF0aWMgZ2V0Rm9udChuYW1lKSB7XG4gICAgICAgIHJldHVybiBuYW1lID8gSGVscGVyLmdldEZvbnRCeVJlcyhyZXNbbmFtZV0pIDogbnVsbDtcbiAgICB9O1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgc3RhdGljIGdldEZvbnRCeVJlcyhmb250UmVzKSB7XG4gICAgICAgIGlmIChmb250UmVzKSB7XG4gICAgICAgICAgICBpZiAoY2Muc3lzLmlzTmF0aXZlICYmIGNjLnN5cy5vcyA9PT0gY2Muc3lzLk9TX0FORFJPSUQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJyZXMvZm9udHMvXCIgKyBmb250UmVzLm5hbWUgKyBcIi50dGZcIjtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9udFJlcy5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzdGF0aWMgY3JlYXRlTGFiZWxUVEYodGl0bGUsIGZvbnQsIGZvbnRTaXplLCBkaW1lbnNpb25zKSB7XG4gICAgICAgIGZvbnRTaXplID0gZm9udFNpemUgfHwgMTY7XG4gICAgICAgIGNvbnN0IHNjYWxlRmFjdG9yID0gY2MuZGlyZWN0b3IuZ2V0Q29udGVudFNjYWxlRmFjdG9yKCk7XG4gICAgICAgIGNvbnN0IGxhYmVsVFRGID0gbmV3IGNjLkxhYmVsVFRGKHRpdGxlLCBmb250LCBmb250U2l6ZSAqIHNjYWxlRmFjdG9yLCBkaW1lbnNpb25zKTtcbiAgICAgICAgbGFiZWxUVEYuc2V0U2NhbGUoMSAvIHNjYWxlRmFjdG9yKTtcbiAgICAgICAgcmV0dXJuIGxhYmVsVFRGO1xuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzdGF0aWMgdG9MZWZ0VG9wKG5vZGUsIHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIGNjLnAoeCwgbm9kZS5oZWlnaHQgLSB5KTtcbiAgICB9O1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgc3RhdGljIHJhbmRvbUludGVnZXIobWluLCBtYXgpIHtcbiAgICAgICAgLy9sZXQgcmFuZCA9IG1pbiAtIDAuNSArIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSk7XG4gICAgICAgIC8vcmV0dXJuIE1hdGgucm91bmQocmFuZCk7XG4gICAgICAgIGxldCByYW5kID0gbWluICsgTWF0aC5yYW5kb20oKSAqIChtYXggKyAxIC0gbWluKTtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IocmFuZCk7XG4gICAgfTtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHN0YXRpYyBvbk5vZGVDbGljayhub2RlLCBjYWxsYmFjaywgaGl0QXJlYSkge1xuICAgICAgICBjYy5ldmVudE1hbmFnZXIuYWRkTGlzdGVuZXIoe1xuICAgICAgICAgICAgZXZlbnQgICAgICAgICA6IGNjLkV2ZW50TGlzdGVuZXIuVE9VQ0hfT05FX0JZX09ORSxcbiAgICAgICAgICAgIHN3YWxsb3dUb3VjaGVzOiB0cnVlLFxuICAgICAgICAgICAgb25Ub3VjaEJlZ2FuICA6ICh0b3VjaCwgZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdIZWxwZXIub25Ob2RlQ2xpY2s6b25Ub3VjaEJlZ2FuJyk7XG4gICAgICAgICAgICAgICAgaWYgKEhlbHBlci5pc05vZGVWaXNpYmxlKG5vZGUpICYmIEhlbHBlci5oaXRUZXN0KHRvdWNoLCBldmVudCwgaGl0QXJlYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uVG91Y2hFbmRlZCAgOiBjYWxsYmFja1xuICAgICAgICB9LCBub2RlKTtcbiAgICB9O1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgc3RhdGljIGlzTm9kZVZpc2libGUobm9kZSkge1xuICAgICAgICBpZiAobm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlLnZpc2libGUgJiYgSGVscGVyLmlzTm9kZVZpc2libGUobm9kZS5wYXJlbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUudmlzaWJsZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzdGF0aWMgaGl0VGVzdCh0b3VjaCwgZXZlbnQsIGhpdEFyZWEpIHtcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSB0b3VjaC5nZXRMb2NhdGlvbigpO1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC5nZXRDdXJyZW50VGFyZ2V0KCk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3RhcmdldDonLCB0YXJnZXQpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCd0b3VjaDonLCB0b3VjaCk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ2V2ZW50OicsIGV2ZW50KTtcbiAgICAgICAgY29uc3QgbG9jYXRpb25Jbk5vZGUgPSB0YXJnZXQuY29udmVydFRvTm9kZVNwYWNlKGxvY2F0aW9uKTtcbiAgICAgICAgY29uc3QgcyA9IHRhcmdldC5nZXRDb250ZW50U2l6ZSgpO1xuICAgICAgICBsZXQgcmVjdDtcbiAgICAgICAgaWYgKHR5cGVvZiBoaXRBcmVhID09PSAnb2JqZWN0JyAmJiBoaXRBcmVhICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZWN0ID0gY2MucmVjdCgwIC0gaGl0QXJlYS5sZWZ0LCAwIC0gaGl0QXJlYS5ib3R0b20sIHMud2lkdGggKyBoaXRBcmVhLmxlZnQgKyBoaXRBcmVhLnJpZ2h0LCBzLmhlaWdodCArIGhpdEFyZWEudG9wICsgaGl0QXJlYS5ib3R0b20pO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBoaXRBcmVhID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgcmVjdCA9IGNjLnJlY3QoMCAtIGhpdEFyZWEsIDAgLSBoaXRBcmVhLCBzLndpZHRoICsgaGl0QXJlYSAqIDIsIHMuaGVpZ2h0ICsgaGl0QXJlYSAqIDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVjdCA9IGNjLnJlY3QoMCwgMCwgcy53aWR0aCwgcy5oZWlnaHQpO1xuICAgICAgICB9XG4gICAgICAgIC8vY29uc3QgcmVjdCA9IGNjLnJlY3QoMCwgMCwgcy53aWR0aCwgcy5oZWlnaHQpO1xuICAgICAgICByZXR1cm4gY2MucmVjdENvbnRhaW5zUG9pbnQocmVjdCwgbG9jYXRpb25Jbk5vZGUpO1xuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzdGF0aWMgY3JlYXRlTWF0cml4KE0sIE4pIHtcbiAgICAgICAgY29uc3QgbWF0cml4ID0gbmV3IEFycmF5KE0pO1xuICAgICAgICBmb3IgKGxldCBtID0gMDsgbSA8IE07IG0rKykge1xuICAgICAgICAgICAgbWF0cml4W21dID0gbmV3IEFycmF5KE4pO1xuICAgICAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCBOOyBuKyspIHtcbiAgICAgICAgICAgICAgICBtYXRyaXhbbV1bbl0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXRyaXg7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgc3RhdGljIHJ1bkFjdGlvbnMobm9kZSwgYWN0aW9ucykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goY2MuY2FsbEZ1bmMocmVzb2x2ZSkpO1xuICAgICAgICAgICAgbm9kZS5ydW5BY3Rpb24oY2Muc2VxdWVuY2UoYWN0aW9ucykpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzdGF0aWMgY3JlYXRlQnV0dG9uKG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIHZhciBTY2FsZTlTcHJpdGVCdXR0b24gPSByZXF1aXJlKCcuL1NjYWxlOVNwcml0ZUJ1dHRvbicpO1xuICAgICAgICB2YXIgdGV4dCA9ICdCdXR0b24nO1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudGV4dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRleHQgPSBvcHRpb25zLnRleHQ7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMudGl0bGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0ZXh0ID0gb3B0aW9ucy50aXRsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghb3B0aW9ucy5maWxlICYmICFvcHRpb25zLmNvbG9yKSB7XG4gICAgICAgICAgICBvcHRpb25zLmNvbG9yID0gQ29uc3QuQlVUVE9OX0NPTE9SO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb3B0aW9ucy5mb250Q29sb3IpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZm9udENvbG9yID0gQ29uc3QuQlVUVE9OX1RFWFRfQ09MT1I7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFNjYWxlOVNwcml0ZUJ1dHRvbih7XG4gICAgICAgICAgICBub3JtYWxGaWxlOiBvcHRpb25zLmZpbGUgICAgIHx8IHJlcy5jb2xvcldoaXRlLFxuICAgICAgICAgICAgY29sb3IgICAgIDogb3B0aW9ucy5jb2xvcixcbiAgICAgICAgICAgIHdpZHRoICAgICA6IG9wdGlvbnMud2lkdGggICAgfHwgQ29uc3QuQlVUVE9OX1dJRFRILFxuICAgICAgICAgICAgaGVpZ2h0ICAgIDogb3B0aW9ucy5oZWlnaHQgICB8fCBDb25zdC5CVVRUT05fSEVJR0hULFxuICAgICAgICAgICAgdGV4dCAgICAgIDogdGV4dCxcbiAgICAgICAgICAgIGZvbnROYW1lICA6IG9wdGlvbnMuZm9udE5hbWUgfHwgQ29uc3QuVElUTEVfRk9OVF9OQU1FLFxuICAgICAgICAgICAgZm9udFNpemUgIDogb3B0aW9ucy5mb250U2l6ZSB8fCBDb25zdC5CVVRUT05fRk9OVF9TSVpFLFxuICAgICAgICAgICAgZm9udENvbG9yIDogb3B0aW9ucy5mb250Q29sb3IsXG4gICAgICAgICAgICBoaXRBcmVhICAgOiBvcHRpb25zLmhpdEFyZWEsXG4gICAgICAgICAgICB2aXNpYmxlICAgOiBvcHRpb25zLnZpc2libGUsXG4gICAgICAgICAgICBvZmZzZXRZICAgOiBvcHRpb25zLm9mZnNldFkgfHwgLTNcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgc3RhdGljIGFkZFRvdWNoTGlzdGVuZXIob3B0aW9ucykge1xuICAgICAgICBjYy5ldmVudE1hbmFnZXIuYWRkTGlzdGVuZXIoe1xuICAgICAgICAgICAgZXZlbnQgICAgICAgICA6IGNjLkV2ZW50TGlzdGVuZXIuVE9VQ0hfT05FX0JZX09ORSxcbiAgICAgICAgICAgIHN3YWxsb3dUb3VjaGVzOiBvcHRpb25zLnN3YWxsb3cgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuc3dhbGxvdyA6IGZhbHNlLFxuICAgICAgICAgICAgb25Ub3VjaEJlZ2FuICA6IG9wdGlvbnMub25Ub3VjaEJlZ2FuLFxuICAgICAgICAgICAgb25Ub3VjaE1vdmVkICA6IG9wdGlvbnMub25Ub3VjaE1vdmVkLFxuICAgICAgICAgICAgb25Ub3VjaEVuZGVkICA6IG9wdGlvbnMub25Ub3VjaEVuZGVkXG4gICAgICAgIH0sIG9wdGlvbnMudGFyZ2V0KTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzdGF0aWMgc2V0U2NhbGU5U3ByaXRlRmlsZShzY2FsZTlTcHJpdGUsIGZpbGUpIHtcbiAgICAgICAgdmFyIHdpZHRoICA9IHNjYWxlOVNwcml0ZS53aWR0aDtcbiAgICAgICAgdmFyIGhlaWdodCA9IHNjYWxlOVNwcml0ZS5oZWlnaHQ7XG4gICAgICAgIHNjYWxlOVNwcml0ZS5pbml0V2l0aEZpbGUoZmlsZSwgY2MucmVjdCgwLCAwLCAwLCAwKSwgY2MucmVjdCgwLCAwLCAwLCAwKSk7XG4gICAgICAgIHNjYWxlOVNwcml0ZS53aWR0aCAgPSB3aWR0aDtcbiAgICAgICAgc2NhbGU5U3ByaXRlLmhlaWdodCA9IGhlaWdodDtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzdGF0aWMgY3JlYXRlQmFja0J1dHRvbigpIHtcbiAgICAgICAgdmFyIGJhY2tCdXR0b24gPSBIZWxwZXIuY3JlYXRlQnV0dG9uKHt0aXRsZTogXCJiYWNrXCIsIHdpZHRoOiAxMzAsIGhpdEFyZWE6IDEwfSk7XG4gICAgICAgIGJhY2tCdXR0b24uc2V0UG9zaXRpb24oSGVscGVyLnRvTGVmdFRvcChjYy53aW5TaXplLCAxMCArIDEzMC8yLCAxMCArIDE1KSk7XG4gICAgICAgIGJhY2tCdXR0b24ub25DbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLnBvcFNjZW5lKCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBiYWNrQnV0dG9uO1xuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzdGF0aWMgZnJvbUxlZnRUb3AocmVjdCwgeCwgeSkge1xuICAgICAgICByZXR1cm4gY2MucCh4LCByZWN0LmhlaWdodCAtIHkpO1xuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBzdGF0aWMgZnJvbVJpZ2h0VG9wKHBhcmVudCwgeCwgeSkge1xuICAgICAgICByZXR1cm4gY2MucChwYXJlbnQud2lkdGggLSB4LCBwYXJlbnQuaGVpZ2h0IC0geSk7XG4gICAgfTtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHN0YXRpYyBmcm9tUmlnaHRCb3R0b20obm9kZSwgeCwgeSkge1xuICAgICAgICByZXR1cm4gY2MucChub2RlLndpZHRoIC0geCwgeSk7XG4gICAgfTtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHN0YXRpYyBmcm9tTGVmdEJvdHRvbShub2RlLCB4LCB5KSB7XG4gICAgICAgIHJldHVybiBjYy5wKHgsIHkpO1xuICAgIH07XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIZWxwZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgQ29uc3QgICAgICAgICAgPSByZXF1aXJlKFwiLi9Db25zdFwiKTtcbmNvbnN0IEhvbWVTY2VuZSAgICAgID0gcmVxdWlyZShcIi4vSG9tZVNjZW5lXCIpO1xuY29uc3QgR2FtZUNvbnRyb2xsZXIgPSByZXF1aXJlKFwiLi9HYW1lQ29udHJvbGxlclwiKTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuY2xhc3MgSG9tZUNvbnRyb2xsZXIge1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ob21lU2NlbmUgPSBuZXcgSG9tZVNjZW5lKCk7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBpbml0KCkge1xuICAgICAgICB0aGlzLmhvbWVTY2VuZS5pbml0KCk7XG4gICAgICAgIHRoaXMuaG9tZVNjZW5lLm9uU3RhcnRMZXZlbCA9IHRoaXMub25TdGFydExldmVsLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBydW4oKSB7XG4gICAgICAgIGNjLmRpcmVjdG9yLnJ1blNjZW5lKHRoaXMuaG9tZVNjZW5lKTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIG9uU3RhcnRMZXZlbChsZXZlbCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkhvbWVDb250cm9sbGVyLm9uU3RhcnRMZXZlbFwiLCBsZXZlbCk7XG5cbiAgICAgICAgY29uc3QgZ2FtZUNvbnRyb2xsZXIgPSBuZXcgR2FtZUNvbnRyb2xsZXIoQ29uc3QuTEVWRUxfT1BUSU9OU1tsZXZlbF0pO1xuICAgICAgICBnYW1lQ29udHJvbGxlci5pbml0KCk7XG4gICAgICAgIGdhbWVDb250cm9sbGVyLnJ1bigpO1xuXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhvbWVDb250cm9sbGVyOyIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBQcm9taXNlICAgICAgICAgICAgID0gcmVxdWlyZShcImJsdWViaXJkXCIpO1xuY29uc3QgQ29uc3QgICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0NvbnN0XCIpO1xuY29uc3QgSGVscGVyICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL0hlbHBlclwiKTtcbmNvbnN0IHJlcyAgICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi9yZXNcIik7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuY29uc3QgSG9tZVNjZW5lID0gY2MuU2NlbmUuZXh0ZW5kKHtcblxuICAgIF9jbGFzc05hbWUgICAgIDogXCJIb21lU2NlbmVcIixcbiAgICBvblN0YXJ0TGV2ZWwgICA6IG51bGwsXG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuX3N1cGVyKCk7XG4gICAgfSxcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgaW5pdCgpIHtcblxuICAgICAgICAvLyBiYWNrZ3JvdW5kXG4gICAgICAgIHRoaXMuYWRkQ2hpbGQoSGVscGVyLmNyZWF0ZUJhY2tncm91bmQoQ29uc3QuU0NFTkVfQkFDS0dST1VORF9DT0xPUikpO1xuXG5cbiAgICAgICAgLy8gdGl0bGVcbiAgICAgICAgdmFyIHRpdGxlID0gSGVscGVyLmNyZWF0ZUxhYmVsVFRGKCdibGFzdCcsIEhlbHBlci5nZXRGb250KENvbnN0LlRJVExFX0ZPTlRfTkFNRSksIENvbnN0LlNDRU5FX1RJVExFX0ZPTlRfU0laRSk7XG4gICAgICAgIHRpdGxlLnNldFBvc2l0aW9uKEhlbHBlci50b0xlZnRUb3AoY2MudmlzaWJsZVJlY3QsIGNjLnZpc2libGVSZWN0LmNlbnRlci54LCAzMCkpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKHRpdGxlKTtcblxuICAgICAgICAvLyBidXR0b24xXG4gICAgICAgIGNvbnN0IGJ1dHRvbjEgPSBuZXcgSGVscGVyLmNyZWF0ZUJ1dHRvbih7dGl0bGU6ICdsZXZlbCAxJ30pO1xuICAgICAgICBidXR0b24xLnNldFBvc2l0aW9uKGNjLndpblNpemUud2lkdGgvMiwgY2Mud2luU2l6ZS5oZWlnaHQvMiArIDEwMCk7XG4gICAgICAgIGJ1dHRvbjEub25DbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uU3RhcnRMZXZlbCkge1xuICAgICAgICAgICAgICAgIHRoaXMub25TdGFydExldmVsKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmFkZENoaWxkKGJ1dHRvbjEpO1xuXG4gICAgICAgIC8vIGJ1dHRvbjJcbiAgICAgICAgY29uc3QgYnV0dG9uMiA9IG5ldyBIZWxwZXIuY3JlYXRlQnV0dG9uKHt0aXRsZTogJ2xldmVsIDInfSk7XG4gICAgICAgIGJ1dHRvbjIuc2V0UG9zaXRpb24oY2Mud2luU2l6ZS53aWR0aC8yLCBjYy53aW5TaXplLmhlaWdodC8yKTtcbiAgICAgICAgYnV0dG9uMi5vbkNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub25TdGFydExldmVsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vblN0YXJ0TGV2ZWwoMik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQoYnV0dG9uMik7XG5cbiAgICAgICAgLy8gYnV0dG9uM1xuICAgICAgICBjb25zdCBidXR0b24zID0gbmV3IEhlbHBlci5jcmVhdGVCdXR0b24oe3RpdGxlOiAnbGV2ZWwgMyd9KTtcbiAgICAgICAgYnV0dG9uMy5zZXRQb3NpdGlvbihjYy53aW5TaXplLndpZHRoLzIsIGNjLndpblNpemUuaGVpZ2h0LzIgLSAxMDApO1xuICAgICAgICBidXR0b24zLm9uQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vblN0YXJ0TGV2ZWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uU3RhcnRMZXZlbCgzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZChidXR0b24zKTtcbiAgICAgICAgXG4gICAgfVxuXG5cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSG9tZVNjZW5lOyIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBDb25zdCAgICAgICAgPSByZXF1aXJlKFwiLi4vLi4vQ29uc3RcIik7XG5jb25zdCBNb3ZlU3RyYXRlZ3kgPSByZXF1aXJlKFwiLi4vTW92ZVN0cmF0ZWd5XCIpO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmNsYXNzIEJvdHRvbU1vdmVTdHJhdGVneSBleHRlbmRzIE1vdmVTdHJhdGVneSB7XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGZpbmRNb3ZlcyhmaWVsZCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiQm90dG9tTW92ZVN0cmF0ZWd5LmZpbmRNb3Zlc1wiKTtcbiAgICAgICAgY29uc3QgbW92ZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCBmaWVsZC5nYW1lLm9wdGlvbnMuTjsgbisrKSB7XG4gICAgICAgICAgICBsZXQgY29sdW1uID0gbmV3IEFycmF5KGZpZWxkLmdhbWUub3B0aW9ucy5NKTtcbiAgICAgICAgICAgIGZvciAobGV0IG0gPSAwOyBtIDwgZmllbGQuZ2FtZS5vcHRpb25zLk07IG0rKykge1xuICAgICAgICAgICAgICAgIGNvbHVtblttXSA9IGZpZWxkLmlzVGlsZUV4aXN0cyhbbSwgbl0pID8gbSA6IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwib3JpZ2luYWwgY29sdW1uOlwiLCBKU09OLnN0cmluZ2lmeShjb2x1bW4pKTtcbiAgICAgICAgICAgIGNvbHVtbiA9IGNvbHVtbi5maWx0ZXIobSA9PiBtICE9PSBudWxsKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJmaWx0ZXJlZCBjb2x1bW46XCIsIEpTT04uc3RyaW5naWZ5KGNvbHVtbikpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcIm5ldyBsZW46XCIsIGNvbHVtbi5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc3QgY250ID0gZmllbGQuZ2FtZS5vcHRpb25zLk0gLSBjb2x1bW4ubGVuZ3RoO1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcImNudDpcIiwgY250KTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY250OyBpKyspIGNvbHVtbi51bnNoaWZ0KG51bGwpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcInVuc2hpZnRlZCBjb2x1bW46XCIsIEpTT04uc3RyaW5naWZ5KGNvbHVtbikpO1xuICAgICAgICAgICAgZm9yIChsZXQgbSA9IGZpZWxkLmdhbWUub3B0aW9ucy5NLTE7IG0gPj0gMDsgbS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbHVtblttXSAhPT0gbnVsbCAmJiBjb2x1bW5bbV0gIT09IG0pIHtcbiAgICAgICAgICAgICAgICAgICAgbW92ZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tOiBbY29sdW1uW21dLCBuXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvICA6IFsgICAgICAgbSAsIG5dXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbW92ZXM7XG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQm90dG9tTW92ZVN0cmF0ZWd5OyIsIlwidXNlIHN0cmljdFwiO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuY2xhc3MgTW92ZVN0cmF0ZWd5IHtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBmaW5kTW92ZXMoZmllbGQpIHtcblxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNb3ZlU3RyYXRlZ3k7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUHJvbWlzZSAgICAgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xudmFyIENvbnN0ICAgICAgID0gcmVxdWlyZSgnLi9Db25zdCcpO1xudmFyIEhlbHBlciAgICAgID0gcmVxdWlyZSgnLi9IZWxwZXInKTtcbnZhciByZXMgICAgICAgICA9IHJlcXVpcmUoJy4vcmVzJyk7XG52YXIgQXBwbGljYXRpb24gPSByZXF1aXJlKCcuL0FwcGxpY2F0aW9uJyk7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xudmFyIFNjYWxlOVNwcml0ZUJ1dHRvbiA9IGNjLlNjYWxlOVNwcml0ZS5leHRlbmQoe1xuXG4gICAgb3B0aW9ucyAgIDogbnVsbCxcbiAgICBsYWJlbCAgICAgOiBudWxsLFxuICAgIGlzRGlzYWJsZWQ6IGZhbHNlLFxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIHRoaXMuX3N1cGVyKG9wdGlvbnMubm9ybWFsRmlsZSk7XG5cbiAgICAgICAgLy8gY29sb3JcbiAgICAgICAgaWYgKG9wdGlvbnMuY29sb3IpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0Q29sb3Iob3B0aW9ucy5jb2xvcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB3aWR0aFxuICAgICAgICBpZiAob3B0aW9ucy53aWR0aCkge1xuICAgICAgICAgICAgdGhpcy53aWR0aCA9IG9wdGlvbnMud2lkdGg7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBoZWlnaHRcbiAgICAgICAgaWYgKG9wdGlvbnMuaGVpZ2h0KSB7XG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMudmlzaWJsZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGV4dFxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudGV4dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHZhciBmb250TmFtZSA9IG9wdGlvbnMuZm9udE5hbWUgfHwgQ29uc3QuVElUTEVfRk9OVF9OQU1FO1xuICAgICAgICAgICAgdmFyIGZvbnRTaXplID0gb3B0aW9ucy5mb250U2l6ZSB8fCBDb25zdC5CVVRUT05fRk9OVF9TSVpFO1xuXG4gICAgICAgICAgICAvLyBsYWJlbFxuICAgICAgICAgICAgdmFyIGxhYmVsID0gdGhpcy5sYWJlbCA9IEhlbHBlci5jcmVhdGVMYWJlbFRURihvcHRpb25zLnRleHQsIEhlbHBlci5nZXRGb250KGZvbnROYW1lKSwgZm9udFNpemUpO1xuICAgICAgICAgICAgbGFiZWwuc2V0UG9zaXRpb24oXG4gICAgICAgICAgICAgICAgdGhpcy53aWR0aCAvMiArICh0aGlzLm9wdGlvbnMub2Zmc2V0WCB8fCAwKSxcbiAgICAgICAgICAgICAgICB0aGlzLmhlaWdodC8yICsgKHRoaXMub3B0aW9ucy5vZmZzZXRZIHx8IDApXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZm9udENvbG9yKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwuc2V0Q29sb3Iob3B0aW9ucy5mb250Q29sb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hZGRDaGlsZChsYWJlbCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldENhc2NhZGVPcGFjaXR5RW5hYmxlZCh0cnVlKTtcblxuICAgICAgICAvLyBldmVudHNcbiAgICAgICAgSGVscGVyLmFkZFRvdWNoTGlzdGVuZXIoe1xuICAgICAgICAgICAgdGFyZ2V0ICAgICAgOiB0aGlzLFxuICAgICAgICAgICAgc3dhbGxvdyAgICAgOiB0cnVlLFxuICAgICAgICAgICAgb25Ub3VjaEJlZ2FuOiB0aGlzLm9uVG91Y2hCZWdhbi5iaW5kKHRoaXMpLFxuICAgICAgICAgICAgb25Ub3VjaEVuZGVkOiB0aGlzLm9uVG91Y2hFbmRlZC5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIG9uVG91Y2hCZWdhbih0b3VjaCwgZXZlbnQpIHtcbiAgICAgICAgaWYgKEhlbHBlci5pc05vZGVWaXNpYmxlKHRoaXMpICYmICF0aGlzLmlzRGlzYWJsZWQgJiYgSGVscGVyLmhpdFRlc3QodG91Y2gsIGV2ZW50LCB0aGlzLm9wdGlvbnMuaGl0QXJlYSkpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ1NjYWxlOVNwcml0ZUJ1dHRvbi5vblRvdWNoQmVnYW4nKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlU3R5bGUoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgc2V0QWN0aXZlU3R5bGUoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWN0aXZlRmlsZSkge1xuICAgICAgICAgICAgSGVscGVyLnNldFNjYWxlOVNwcml0ZUZpbGUodGhpcywgdGhpcy5vcHRpb25zLmFjdGl2ZUZpbGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jb2xvciAmJiB0aGlzLm9wdGlvbnMuZm9udENvbG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRDb2xvcih0aGlzLm9wdGlvbnMuZm9udENvbG9yKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxhYmVsLnNldENvbG9yKHRoaXMub3B0aW9ucy5jb2xvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U2NhbGUoMS4xKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHNldE5vcm1hbFN0eWxlKCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFjdGl2ZUZpbGUpIHtcbiAgICAgICAgICAgIEhlbHBlci5zZXRTY2FsZTlTcHJpdGVGaWxlKHRoaXMsIHRoaXMub3B0aW9ucy5ub3JtYWxGaWxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY29sb3IgJiYgdGhpcy5vcHRpb25zLmZvbnRDb2xvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q29sb3IodGhpcy5vcHRpb25zLmNvbG9yKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxhYmVsLnNldENvbG9yKHRoaXMub3B0aW9ucy5mb250Q29sb3IpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFNjYWxlKDEuMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBvblRvdWNoRW5kZWQodG91Y2gsIGV2ZW50KSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ1NjYWxlOVNwcml0ZUJ1dHRvbi5vblRvdWNoRW5kZWQnKTtcbiAgICAgICAgdGhpcy5zZXROb3JtYWxTdHlsZSgpO1xuICAgICAgICBpZiAoSGVscGVyLmhpdFRlc3QodG91Y2gsIGV2ZW50LCB0aGlzLm9wdGlvbnMuaGl0QXJlYSkpIHtcbiAgICAgICAgICAgIC8vY2MuYXBwLnBsYXlTb3VuZChyZXMuc291bmRUYXApO1xuICAgICAgICAgICAgaWYgKHRoaXMub25DbGljaykge1xuICAgICAgICAgICAgICAgIFByb21pc2UudHJ5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub25DbGljayh0aGlzKTtcbiAgICAgICAgICAgICAgICB9KS8qLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEFwcGxpY2F0aW9uLmhhbmRsZUNsaWVudEVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgfSkqLztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHNldEZvbnRDb2xvcihjb2xvcikge1xuICAgICAgICB0aGlzLmxhYmVsLnNldENvbG9yKGNvbG9yKTtcbiAgICB9LFxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBkaXNhYmxlKCkge1xuICAgICAgICB0aGlzLmlzRGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5sYWJlbCkge1xuICAgICAgICAgICAgdGhpcy5zZXRGb250Q29sb3IodGhpcy5vcHRpb25zLmRpc2FibGVUZXh0Q29sb3IgfHwgQ29uc3QuQlVUVE9OX1RFWFRfRElTQUJMRV9DT0xPUik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBlbmFibGUoKSB7XG4gICAgICAgIHRoaXMuaXNEaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5sYWJlbCkge1xuICAgICAgICAgICAgdmFyIGZvbnRDb2xvciA9IHRoaXMub3B0aW9ucy5mb250Q29sb3IgPyB0aGlzLm9wdGlvbnMuZm9udENvbG9yIDogQ29uc3QuV0hJVEU7XG4gICAgICAgICAgICB0aGlzLnNldEZvbnRDb2xvcihmb250Q29sb3IpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgc2V0VGV4dCh0ZXh0KSB7XG4gICAgICAgIHRoaXMubGFiZWwuc2V0U3RyaW5nKHRleHQpO1xuICAgIH0sXG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIHNldFdpZHRoKHdpZHRoKSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5sYWJlbC5zZXRQb3NpdGlvbihjYy5wKHRoaXMud2lkdGgvMiwgdGhpcy5oZWlnaHQvMikpO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2NhbGU5U3ByaXRlQnV0dG9uOyIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBUaWxlICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vVGlsZVwiKTtcbmNvbnN0IENvbnN0ICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi8uLi9Db25zdFwiKTtcbmNvbnN0IEJvbWJBY3Rpb25TdHJhdGVneSA9IHJlcXVpcmUoXCIuLi8uLi9BY3Rpb25TdHJhdGVneS9Cb21iQWN0aW9uU3RyYXRlZ3kvQm9tYkFjdGlvblN0cmF0ZWd5XCIpO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmNsYXNzIEJvbWJUaWxlIGV4dGVuZHMgVGlsZSB7XG5cbiAgICAvKlxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuICAgICovXG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGNyZWF0ZUFjdGlvblN0cmF0ZWd5KGZpZWxkLCBmaWVsZFZpZXcpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIkJvbWJUaWxlLmNyZWF0ZUFjdGlvblN0cmF0ZWd5XCIpO1xuICAgICAgICByZXR1cm4gbmV3IEJvbWJBY3Rpb25TdHJhdGVneShmaWVsZCwgZmllbGRWaWV3KTtcbiAgICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCb21iVGlsZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgVGlsZSAgICAgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4uL1RpbGVcIik7XG5jb25zdCBDb25zdCAgICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vLi4vQ29uc3RcIik7XG5jb25zdCBSZWd1bGFyQWN0aW9uU3RyYXRlZ3kgPSByZXF1aXJlKFwiLi4vLi4vQWN0aW9uU3RyYXRlZ3kvUmVndWxhckFjdGlvblN0cmF0ZWd5L1JlZ3VsYXJBY3Rpb25TdHJhdGVneVwiKTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5jbGFzcyBSZWd1bGFyVGlsZSBleHRlbmRzIFRpbGUge1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBjb25zdHJ1Y3Rvcihjb2xvckluZGV4KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuY29sb3JJbmRleCA9IGNvbG9ySW5kZXg7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBjcmVhdGVBY3Rpb25TdHJhdGVneShmaWVsZCwgZmllbGRWaWV3KSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coXCJSZWd1bGFyVGlsZS5jcmVhdGVBY3Rpb25TdHJhdGVneVwiKTtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWd1bGFyQWN0aW9uU3RyYXRlZ3koZmllbGQsIGZpZWxkVmlldyk7XG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVndWxhclRpbGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuY2xhc3MgVGlsZSB7XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGNyZWF0ZUFjdGlvblN0cmF0ZWd5KGZpZWxkLCBmaWVsZFZpZXcpIHtcblxuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRpbGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmxldCBvblN0YXJ0Q2FsbGVkID0gZmFsc2U7XG5jYy5nYW1lLm9uU3RhcnQgPSAoKSA9PiB7XG4gICAgaWYgKG9uU3RhcnRDYWxsZWQpIHJldHVybjsgb25TdGFydENhbGxlZCA9IHRydWU7XG4gICAgY29uc29sZS5sb2coXCJjYy5nYW1lLm9uU3RhcnRcIik7XG4gICAgY29uc3QgQXBwbGljYXRpb24gPSByZXF1aXJlKFwiLi9BcHBsaWNhdGlvblwiKTtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBhcHAgPSBuZXcgQXBwbGljYXRpb24oKTtcbiAgICAgICAgYXBwLmluaXQoKTtcbiAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcblxuICAgICAgICBhcHAubG9hZCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYGFwcCBsb2FkZWQ6ICR7RGF0ZS5ub3coKSAtIG5vd31tc2ApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhcHAucnVuKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiYXBwIHJ1biBlcnJvcjpcIiwgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7ICAgICAgICBcbiAgICAgICAgY29uc29sZS5lcnJvcihcIm9uU3RhcnQgZXJyb3I6XCIsIGVycik7XG4gICAgfVxufTtcbmNjLmdhbWUucnVuKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgLy8gY29sb3JcbiAgICBjb2xvcldoaXRlOiBcInJlcy9jb2xvci93aGl0ZS5wbmdcIixcblxuICAgIC8vIGJsb2NrXG4gICAgdGlsZSA6IFwicmVzL3RpbGUucG5nXCIsXG4gICAgZmllbGQ6IFwicmVzL2ZpZWxkLnBuZ1wiLFxuICAgIGJvbWIgOiBcInJlcy9ib21iLnBuZ1wiLFxuICAgIGJhY2sgOiBcInJlcy9iYWNrLnBuZ1wiLFxuXG4gICAgLy8gc291bmRcbiAgICBzb3VuZEJ1cm4gOiAncmVzL3NvdW5kL2J1cm4ubXAzJyxcbiAgICBzb3VuZFdyb25nOiAncmVzL3NvdW5kL3dyb25nLm1wMycsXG5cbiAgICAvLyBmb250XG4gICAgQW1lcmljYW5DYXB0YWluICA6IHt0eXBlOiBcImZvbnRcIiwgbmFtZTogXCJBbWVyaWNhbkNhcHRhaW5cIiAgLCBzcmNzOiBbXCJyZXMvZm9udHMvQW1lcmljYW5DYXB0YWluLnR0ZlwiXX0sICAgICAvLyB0aXRsZVxufTsiXX0=
