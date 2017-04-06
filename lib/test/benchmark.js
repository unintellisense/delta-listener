"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../src");
var jsonpatch = require("fast-json-patch");
var Benchmark = require("benchmark");
var suite = new Benchmark.Suite();
var obj1 = {
    players: {
        one: 1,
        two: 1
    },
    entity: {
        x: 0, y: 0, z: 0,
        rotation: 10
    },
    entities: {
        one: { x: 10, y: 0 },
        two: { x: 0, y: 0 },
    }
};
var obj2 = {
    players: {
        one: 10,
        two: 1
    },
    entity: {
        x: 0, y: 0, z: 0,
        rotation: 10,
        hp: 100
    },
    entities: {
        one: { x: 10, y: 0 },
    }
};
suite.add('fast-json-patch + if / else', function () {
    var container = new src_1.DeltaContainer(obj1);
    var patches = jsonpatch.compare(container.data, obj2);
    var removal = "";
    var addition = "";
    var replacement = "";
    for (var i = 0, len = patches.length; i < len; i++) {
        var patch = patches[i];
        if (patch.path.indexOf("/entities") === 0 && patch.op === "remove") {
            var _a = patch.path.match(/\/entities\/(.*)/), _ = _a[0], entityId = _a[1];
            removal = entityId;
        }
        else if (patch.path.indexOf("/players") === 0 && patch.op === "replace") {
            var _b = patch.path.match(/\/players\/([^\/]+)/), _ = _b[0], entityId = _b[1];
            replacement = entityId;
        }
        else if (patch.path.indexOf("/entity") === 0 && patch.op === "add") {
            var _c = patch.path.match(/\/entity\/([^\/]+)/), _ = _c[0], property = _c[1];
            addition = property;
        }
    }
    if (removal !== "two" && replacement !== "one" && addition !== "hp") {
        throw new Error("mismatch!");
    }
});
var removal = "";
var addition = "";
var replacement = "";
var tmpContainer = new src_1.DeltaContainer(obj1);
tmpContainer.listen("entities/:id", "remove", function (entityId) {
    removal = entityId;
});
tmpContainer.listen("players/:id", "replace", function (entityId, value) {
    replacement = entityId;
});
tmpContainer.listen("entity/:property", "add", function (property, value) {
    replacement = property;
});
suite.add('delta-listener', function () {
    var container = new src_1.DeltaContainer(obj1);
    container.listeners = tmpContainer.listeners;
    container.set(obj2);
    if (removal !== "two" && replacement !== "one" && addition !== "hp") {
        throw new Error("mismatch!");
    }
});
suite.on('cycle', function (event) {
    console.log(String(event.target));
});
suite.run();
//# sourceMappingURL=benchmark.js.map