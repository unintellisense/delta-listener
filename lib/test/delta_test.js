"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var src_1 = require("../src");
var DeltaContainer_1 = require("../src/DeltaContainer");
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
    it('should listen for changes on parent objects', function (done) {
        var dataCopy = DeltaContainer_1.deepClone(data);
        var assertCount = 0;
        container.listen("entities/:name", "replace", function (player, value) {
            assertCount++;
        });
        container.listen("entities/:name/:attribute", "replace", function (id, attribute, value) {
            assertCount++;
        });
        dataCopy.entities.one.x = 33;
        dataCopy.entities.one.y = 99;
        dataCopy.entities.two.x = 55;
        dataCopy.entities.two.y = 77;
        container.set(dataCopy);
        var secondCopy = DeltaContainer_1.deepClone(dataCopy);
        chai_1.assert.equal(assertCount, 6);
        container.listen("entities/:name", "add", function (id, value) {
            assertCount++;
        });
        secondCopy.entities.three = {
            x: 22,
            y: 55
        };
        secondCopy.entities.four = {
            x: 99,
            y: 21
        };
        container.set(secondCopy);
        chai_1.assert.equal(assertCount, 8);
        done();
    });
    it('should listen for changes on parent objects, but get nothing', function (done) {
        var cloned = DeltaContainer_1.deepClone(data);
        container.listen("entities/:name", "replace", function (player, value) {
            chai_1.assert.fail(); // shouldn't be invoked
        });
        container.listen("entities/:name/:attribute", "replace", function (id, attribute, value) {
            chai_1.assert.fail(); // shouldn't be invoked
        });
        container.set(cloned);
        done();
    });
});
//# sourceMappingURL=delta_test.js.map