"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var src_1 = require("../src");
function clone(data) {
    return JSON.parse(JSON.stringify(data));
}
describe("DeltaContainer", function () {
    var container;
    var data;
    beforeEach(function () {
        data = {
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
        container = new src_1.DeltaContainer(clone(data));
    });
    it("should listen to 'add' operation", function (ok) {
        container.listen("players", "add", chai_1.assert.fail);
        container.listen("players/:string/:string", "add", chai_1.assert.fail);
        container.listen("players/:string", "add", function (player, value) {
            chai_1.assert.equal(value, 3);
            ok();
        });
        data.players.three = 3;
        container.set(data);
    });
    it("should listen to 'remove' operation", function (ok) {
        container.listen("players/:string", "remove", function (value) {
            chai_1.assert.equal(value, "two");
            ok();
        });
        delete data.players.two;
        container.set(data);
    });
    it("should allow multiple callbacks for the same operation", function (ok) {
        var i = 0;
        function accept() {
            i++;
            if (i === 3) {
                ok();
            }
        }
        container.listen("players/:string/:string", "add", chai_1.assert.fail);
        container.listen("players/:string", "add", accept);
        container.listen("players/:string", "add", accept);
        container.listen("players/:string", "add", accept);
        data.players.three = 3;
        container.set(data);
    });
    it("should fill multiple variables on listen", function (ok) {
        var assertCount = 0;
        container.listen("entities/:id/:attribute", "replace", function (id, attribute, value) {
            if (id === "one") {
                chai_1.assert.equal(attribute, "x");
                chai_1.assert.equal(value, 20);
            }
            else if (id === "two") {
                chai_1.assert.equal(attribute, "y");
                chai_1.assert.equal(value, 40);
            }
            assertCount++;
        });
        data.entities.one.x = 20;
        data.entities.two.y = 40;
        container.set(data);
        setTimeout(function () {
            chai_1.assert.equal(assertCount, 2);
            ok();
        }, 1);
    });
    it("should create custom placeholder ", function (ok) {
        var assertCount = 0;
        container.registerPlaceholder(":xyz", /([xyz])/);
        container.listen("entity/:xyz", "replace", function (axis, value) {
            assertCount++;
            if (axis === "x")
                chai_1.assert.equal(value, 1);
            else if (axis === "y")
                chai_1.assert.equal(value, 2);
            else if (axis === "z")
                chai_1.assert.equal(value, 3);
            else
                chai_1.assert.fail();
        });
        data.entity.x = 1;
        data.entity.y = 2;
        data.entity.z = 3;
        data.entity.rotation = 90;
        container.set(data);
        setTimeout(function () {
            chai_1.assert.equal(assertCount, 3);
            ok();
        }, 1);
    });
    it("should remove specific listener", function () {
        container.listen("players", "add", function (value) {
            chai_1.assert.equal(value.ten, 10);
        });
        var listener = container.listen("players", "add", chai_1.assert.fail);
        container.removeListener(listener);
        data.players.ten = { ten: 10 };
        container.set(data);
    });
    it("should remove all listeners", function () {
        container.listen("players", "add", chai_1.assert.fail);
        container.listen("players", "remove", chai_1.assert.fail);
        container.listen("entity/:attribute", "replace", chai_1.assert.fail);
        container.removeAllListeners();
        delete data.players['one'];
        data.entity.x = 100;
        data.players.ten = { ten: 10 };
        container.set(data);
    });
    it("should trigger default listener as fallback", function (ok) {
        var assertCount = 0;
        container.listen("players/:string", "add", function (player, value) {
            assertCount++;
            chai_1.assert.equal(value, 3);
        });
        container.listen(function (segments, op, value) {
            assertCount++;
            if (op === "replace") {
                chai_1.assert.deepEqual(segments, ["entity", "rotation"]);
                chai_1.assert.equal(op, "replace");
                chai_1.assert.equal(value, 90);
            }
            else {
                chai_1.assert.deepEqual(segments, ["players", "two"]);
                chai_1.assert.equal(op, "remove");
            }
        });
        data.players.three = 3;
        delete data.players.two;
        data.entity.rotation = 90;
        container.set(data);
        setTimeout(function () {
            chai_1.assert.equal(assertCount, 3);
            ok();
        }, 1);
    });
});
describe('array Delta Test', function () {
    var container;
    var data;
    beforeEach(function () {
        data = {
            player: [],
            dynamic: [{
                    position: {
                        x: 1,
                        y: 2,
                        z: 3
                    }
                }],
            static: [{
                    position: {
                        x: 5,
                        y: 4,
                        z: 3
                    }
                }]
        };
        container = new src_1.DeltaContainer(clone(data));
    });
    it("should tell that array was added and removed", function (done) {
        container.listen('dynamic/:idx', 'add', function (idx, val) {
            console.log("add idx: " + idx + ", value" + JSON.stringify(val));
        });
        container.listen('dynamic/:idx', 'remove', function (idx) {
            console.log("removeidx: " + idx);
        });
        data.dynamic.push({
            position: {
                x: 20, y: 30, z: 40
            }
        }); // add one to the end
        //data.dynamic.splice(0, 1); // delete the first
        container.set(data);
        setTimeout(function () {
            done();
        }, 500);
    });
});
//# sourceMappingURL=delta_test.js.map