"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ExplicitContainer = (function () {
    function ExplicitContainer(data) {
        this.stateListeners = {};
        this.createListeners = {};
        this.removeListeners = {};
        this._data = data;
        this.propKeys = Object.keys(data);
        this.propLength = this.propKeys.length;
    }
    Object.defineProperty(ExplicitContainer.prototype, "data", {
        get: function () { return this._data; },
        enumerable: true,
        configurable: true
    });
    ExplicitContainer.prototype.addStateListener = function (propName, callback) {
        this.stateListeners[propName] = callback;
    };
    ExplicitContainer.prototype.addCreateListener = function (propName, callback) {
        this.createListeners[propName] = callback;
    };
    ExplicitContainer.prototype.addRemoveListener = function (propName, callback) {
        this.removeListeners[propName] = callback;
    };
    ExplicitContainer.prototype.removeAllListeners = function () {
        this.stateListeners = {};
        this.createListeners = {};
        this.removeListeners = {};
    };
    ExplicitContainer.prototype.set = function (newData) {
        for (var i = this.propLength - 1; i >= 0; i--) {
            var latestObjKeys = Object.keys(newData[this.propKeys[i]]);
            var priorObjKeys = Object.keys(this._data[this.propKeys[i]]);
            var foundNew = false;
            if (this.stateListeners[this.propKeys[i]]) {
                this.stateListeners[this.propKeys[i]](newData[this.propKeys[i]]);
            }
            newLoop: for (var j = latestObjKeys.length - 1; j >= 0; j--) {
                for (var k = priorObjKeys.length - 1; k >= 0; k--) {
                    if (latestObjKeys[j] === priorObjKeys[k])
                        continue newLoop; // we know this object
                }
                foundNew = true;
                if (this.createListeners[this.propKeys[i]]) {
                    this.createListeners[this.propKeys[i]](latestObjKeys[j], newData[this.propKeys[i]][latestObjKeys[j]]);
                }
            }
            if (!foundNew && latestObjKeys.length === priorObjKeys.length)
                continue; // if nothing was added and lengths match, save a iteration
            removeLoop: for (var j = priorObjKeys.length - 1; j >= 0; j--) {
                for (var k = latestObjKeys.length - 1; k >= 0; k--) {
                    if (priorObjKeys[j] === latestObjKeys[k])
                        continue removeLoop; // we know this object
                }
                if (this.removeListeners[this.propKeys[i]]) {
                    this.removeListeners[this.propKeys[i]](priorObjKeys[j], this._data[this.propKeys[i]][priorObjKeys[i]]);
                }
            }
        }
        this._data = newData;
    };
    return ExplicitContainer;
}());
exports.ExplicitContainer = ExplicitContainer;
//# sourceMappingURL=ExplicitContainer.js.map