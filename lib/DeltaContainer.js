"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DeltaContainer = (function () {
    function DeltaContainer(data) {
        this.listeners = [];
        this.matcherPlaceholders = {
            ":id": /^([a-zA-Z0-9\-_]+)$/,
            ":number": /^([0-9]+)$/,
            ":string": /^(\w+)$/,
            ":axis": /^([xyz])$/,
            ":*": /(.*)/,
        };
        this.data = data;
        this.reset();
    }
    DeltaContainer.prototype.set = function (newData) {
        var patches = this.compare(newData);
        this.checkPatches(patches);
        this.data = newData;
        return;
    };
    DeltaContainer.prototype.registerPlaceholder = function (placeholder, matcher) {
        this.matcherPlaceholders[placeholder] = matcher;
    };
    DeltaContainer.prototype.listen = function (segments, callback, operation) {
        var _this = this;
        var rules;
        if (typeof (segments) === "function") {
            rules = [];
            callback = segments;
        }
        else {
            rules = segments.split("/");
        }
        var listener = {
            callback: callback,
            operation: operation,
            rawRules: rules,
            rules: rules.map(function (segment) {
                if (typeof (segment) === "string") {
                    // replace placeholder matchers
                    return (segment.indexOf(":") === 0)
                        ? _this.matcherPlaceholders[segment] || _this.matcherPlaceholders[":*"]
                        : new RegExp("^" + segment + "$");
                }
                else {
                    return segment;
                }
            })
        };
        if (rules.length === 0) {
            this.defaultListener = listener;
        }
        else {
            this.listeners.push(listener);
        }
        return listener;
    };
    DeltaContainer.prototype.removeListener = function (listener) {
        for (var i = this.listeners.length - 1; i >= 0; i--) {
            if (this.listeners[i] === listener) {
                this.listeners.splice(i, 1);
            }
        }
    };
    DeltaContainer.prototype.removeAllListeners = function () {
        this.reset();
    };
    DeltaContainer.prototype.checkPatches = function (patches) {
        for (var i = patches.length - 1; i >= 0; i--) {
            var matched = false;
            for (var j = 0, len = this.listeners.length; j < len; j++) {
                var listener = this.listeners[j];
                var pathVariables = this.getPathVariables(patches[i], listener);
                if (pathVariables) {
                    if (!listener.operation || listener.operation === patches[i].operation) {
                        listener.callback({
                            path: pathVariables,
                            operation: patches[i].operation,
                            value: patches[i].value
                        });
                        matched = true;
                    }
                }
            }
            // check for fallback listener
            if (!matched && this.defaultListener) {
                this.defaultListener.callback(patches[i]);
            }
        }
    };
    DeltaContainer.prototype.getPathVariables = function (patch, listener) {
        // skip if rules count differ from patch
        if (patch.path.length !== listener.rules.length) {
            return false;
        }
        var path = {};
        for (var i = 0, len = listener.rules.length; i < len; i++) {
            var matches = patch.path[i].match(listener.rules[i]);
            if (!matches || matches.length === 0 || matches.length > 2) {
                return false;
            }
            else if (listener.rawRules[i].substr(0, 1) === ":") {
                path[listener.rawRules[i].substr(1)] = matches[1];
            }
        }
        return path;
    };
    DeltaContainer.prototype.reset = function () {
        this.listeners = [];
    };
    DeltaContainer.prototype.compare = function (newData) {
        var patches = [];
        this.generate(this.data, newData, patches, []);
        return patches;
    };
    // Dirty check if obj is different from mirror, generate patches and update mirror
    DeltaContainer.prototype.generate = function (oldData, newData, patches, path) {
        var newKeys = objectKeys(newData);
        var oldKeys = objectKeys(oldData);
        var changed = false;
        var deleted = false;
        for (var t = oldKeys.length - 1; t >= 0; t--) {
            var prop = oldKeys[t];
            var oldVal = oldData[prop];
            if (newData.hasOwnProperty(prop) // property still on new data, and...
                && !(newData[prop] === undefined // new data doesnt have the property defined
                    && oldVal !== undefined // or old value for this property was defined
                    && Array.isArray(newData) === false) // or current NewData isn't a array
            ) {
                var newVal = newData[prop];
                if (typeof oldVal == "object" &&
                    oldVal != null &&
                    typeof newVal == "object" &&
                    newVal != null) {
                    // check replace listeners for object level listener
                    var newPath = path.concat(prop);
                    var match = this.checkObserveListeners(oldVal, newVal, newPath, patches);
                    if (!match) {
                        this.generate(oldVal, newVal, patches, newPath);
                    }
                }
                else {
                    if (oldVal !== newVal) {
                        changed = true;
                        patches.push({ operation: "replace", path: path.concat(prop), value: deepClone(newVal) });
                    }
                }
            }
            else {
                patches.push({ operation: "remove", path: path.concat(prop) });
                deleted = true; // property has been deleted
            }
        }
        if (!deleted && newKeys.length == oldKeys.length) {
            return;
        }
        for (var t = 0; t < newKeys.length; t++) {
            var prop = newKeys[t];
            if (!oldData.hasOwnProperty(prop) && newData[prop] !== undefined) {
                patches.push({ operation: "add", path: path.concat(prop), value: deepClone(newData[prop]) });
            }
        }
    };
    DeltaContainer.prototype.checkObserveListeners = function (oldVal, newVal, path, patches) {
        var rules;
        listenerLoop: for (var i = this.listeners.length - 1; i >= 0; i--) {
            if (this.listeners[i].operation !== '*')
                continue;
            rules = this.listeners[i].rules;
            if (rules.length !== path.length) {
                continue listenerLoop;
            }
            for (var i_1 = 0; i_1 < rules.length; i_1++) {
                if (!path[i_1] // if path isn't this long, or
                    || !path[i_1].match(rules[i_1])) {
                    continue listenerLoop;
                }
            }
            // if we got here then the listener matches. test shallow values
            var newKeys = objectKeys(newVal);
            // first just check if the number of properties changed
            if (objectKeys(oldVal).length !== newKeys.length) {
                patches.push({ operation: "*", path: path, value: deepClone(newVal) });
                return true;
            }
            //let oldKeys = objectKeys(oldVal);
            for (var i_2 = newKeys.length - 1; i_2 >= 0; i_2--) {
                if (oldVal[newKeys[i_2]] !== newVal[newKeys[i_2]]) {
                    patches.push({ operation: "*", path: path, value: deepClone(newVal) });
                    return true;
                }
            }
        }
        return false;
    };
    return DeltaContainer;
}());
exports.DeltaContainer = DeltaContainer;
function deepClone(obj) {
    switch (typeof obj) {
        case "object":
            return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5
        case "undefined":
            return null; //this is how JSON.stringify behaves for array items
        default:
            return obj; //no need to clone primitives
    }
}
function objectKeys(obj) {
    if (Array.isArray(obj)) {
        var keys = new Array(obj.length);
        for (var k = 0; k < keys.length; k++) {
            keys[k] = "" + k;
        }
        return keys;
    }
    return Object.keys(obj);
}
;
//# sourceMappingURL=DeltaContainer.js.map