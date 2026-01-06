"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.ZegoExpressEngineImpl = void 0;
var zego_express_engine_inner_1 = require("./ZegoExpressEngineInner");
// FIX: Initialize global.__ZEGO__ if it doesn't exist
if (typeof global !== 'undefined') {
    if (!global.__ZEGO__) {
        global.__ZEGO__ = { prefix: '' };
    } else if (!global.__ZEGO__.prefix) {
        global.__ZEGO__.prefix = '';
    }
}
var prefix = global.__ZEGO__?.prefix;
var ZegoExpressEngineImpl = /** @class */ (function () {
    function ZegoExpressEngineImpl() {
    }
    ZegoExpressEngineImpl.prototype.getVersion = function () {
        return zego_express_engine_inner_1.ZegoExpressEngineInner.getInstance().getVersion();
    };
    ZegoExpressEngineImpl.prototype.createEngine = function (profile) {
        zego_express_engine_inner_1.ZegoExpressEngineInner.createEngineWithProfile(profile, prefix);
        return zego_express_engine_inner_1.ZegoExpressEngineInner.getInstance();
    };
    ZegoExpressEngineImpl.prototype.createEngineWithAgent = function (profile, agent) {
        zego_express_engine_inner_1.ZegoExpressEngineInner.createEngineWithProfile(profile, prefix, agent);
        return zego_express_engine_inner_1.ZegoExpressEngineInner.getInstance();
    };
    ZegoExpressEngineImpl.prototype.destroyEngine = function (engine) {
        zego_express_engine_inner_1.ZegoExpressEngineInner.destroyEngine();
    };
    return ZegoExpressEngineImpl;
}());
exports.ZegoExpressEngineImpl = ZegoExpressEngineImpl;
