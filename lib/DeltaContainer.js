"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var test = {
    type: 'Object',
    properties: {
        players: {
            type: 'Array',
            arrayType: {
                type: 'string'
            }
        }
    }
};
var DeltaContainer = (function () {
    function DeltaContainer(data) {
        this.matcherPlaceholders = {
            ":id": /^([a-zA-Z0-9\-_]+)$/,
            ":number": /^([0-9]+)$/,
            ":string": /^(\w+)$/,
            ":axis": /^([xyz])$/,
            "*": /(.*)/,
        };
        this.data = data;
        this.reset();
    }
    DeltaContainer.prototype.set = function (newData) {
        var patches = this.compare(this.data, newData);
        this.checkPatches(patches);
        this.data = newData;
        return patches;
    };
    DeltaContainer.prototype.registerPlaceholder = function (placeholder, matcher) {
        this.matcherPlaceholders[placeholder] = matcher;
    };
    DeltaContainer.prototype.listen = function (segments, operation, callback) {
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
            rules: rules.map(function (segment) {
                if (typeof (segment) === "string") {
                    // replace placeholder matchers
                    return (segment.indexOf(":") === 0)
                        ? _this.matcherPlaceholders[segment] || _this.matcherPlaceholders["*"]
                        : new RegExp(segment);
                }
                else {
                    return segment;
                }
            })
        };
        this.listeners[operation || ""].push(listener);
        return listener;
    };
    DeltaContainer.prototype.removeListener = function (listener) {
        for (var i = this.listeners[listener.operation].length - 1; i >= 0; i--) {
            if (this.listeners[listener.operation][i] === listener) {
                this.listeners[listener.operation].splice(i, 1);
            }
        }
    };
    DeltaContainer.prototype.removeAllListeners = function () {
        this.reset();
    };
    DeltaContainer.prototype.checkPatches = function (patches) {
        for (var i = patches.length - 1; i >= 0; i--) {
            var matched = false;
            var op = patches[i].op;
            for (var j_1 = 0, len_1 = this.listeners[op].length; j_1 < len_1; j_1++) {
                var listener = this.listeners[op][j_1];
                var matches = this.checkPatch(patches[i], listener);
                if (matches) {
                    listener.callback.apply(listener, matches.concat([patches[i].value]));
                    matched = true;
                }
            }
            // check for fallback listener
            if (!matched && this.listeners[""]) {
                for (var j = 0, len = this.listeners[""].length; j < len; j++) {
                    this.listeners[""][j].callback(patches[i].path, patches[i].op, patches[i].value);
                }
            }
        }
    };
    DeltaContainer.prototype.checkPatch = function (patch, listener) {
        // skip if rules count differ from patch
        if (patch.path.length !== listener.rules.length) {
            return false;
        }
        var pathVars = [];
        for (var i = 0, len = listener.rules.length; i < len; i++) {
            var matches = patch.path[i].match(listener.rules[i]);
            if (!matches || matches.length === 0 || matches.length > 2) {
                return false;
            }
            else {
                pathVars = pathVars.concat(matches.slice(1));
            }
        }
        return pathVars;
    };
    DeltaContainer.prototype.reset = function () {
        this.listeners = {
            "": [],
            "add": [],
            "remove": [],
            "replace": []
        };
    };
    DeltaContainer.prototype.compare = function (tree1, tree2) {
        var patches = [];
        this.generate(tree1, tree2, patches, []);
        return patches;
    };
    DeltaContainer.prototype.deepClone = function (obj) {
        switch (typeof obj) {
            case "object":
                return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5
            case "undefined":
                return null; //this is how JSON.stringify behaves for array items
            default:
                return obj; //no need to clone primitives
        }
    };
    DeltaContainer.prototype.objectKeys = function (obj) {
        if (Array.isArray(obj)) {
            var keys = new Array(obj.length);
            for (var k = 0; k < keys.length; k++) {
                keys[k] = "" + k;
            }
            return keys;
        }
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                keys.push(i);
            }
        }
        return keys;
    };
    ;
    // Dirty check if obj is different from mirror, generate patches and update mirror
    DeltaContainer.prototype.generate = function (mirror, obj, patches, path) {
        var newKeys = this.objectKeys(obj);
        var oldKeys = this.objectKeys(mirror);
        var changed = false;
        var deleted = false;
        for (var t = oldKeys.length - 1; t >= 0; t--) {
            var key = oldKeys[t];
            var oldVal = mirror[key];
            if (obj.hasOwnProperty(key) && !(obj[key] === undefined && oldVal !== undefined && Array.isArray(obj) === false)) {
                var newVal = obj[key];
                if (typeof oldVal == "object" && oldVal != null && typeof newVal == "object" && newVal != null) {
                    this.generate(oldVal, newVal, patches, path.concat(key));
                }
                else {
                    if (oldVal !== newVal) {
                        changed = true;
                        patches.push({ op: "replace", path: path.concat(key), value: this.deepClone(newVal) });
                    }
                }
            }
            else {
                patches.push({ op: "remove", path: path.concat(key) });
                deleted = true; // property has been deleted
            }
        }
        if (!deleted && newKeys.length == oldKeys.length) {
            return;
        }
        for (var t = 0; t < newKeys.length; t++) {
            var key = newKeys[t];
            if (!mirror.hasOwnProperty(key) && obj[key] !== undefined) {
                patches.push({ op: "add", path: path.concat(key), value: this.deepClone(obj[key]) });
            }
        }
    };
    return DeltaContainer;
}());
exports.DeltaContainer = DeltaContainer;
//# sourceMappingURL=DeltaContainer.js.map