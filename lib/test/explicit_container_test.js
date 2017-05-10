"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var src_1 = require("../src");
describe("ExplicitDeltaContainer", function () {
    var stateObj;
    before(function () {
        stateObj = { propA: {}, propB: {} };
    });
    it('basic test', function () {
        var ctr = 0;
        var container = new src_1.ExplicitContainer(stateObj);
        container.addCreateListener('propA', function (data) {
            chai_1.assert.equal(data.name, 'a');
            ctr++;
        });
        container.addCreateListener('propB', function (data) {
            chai_1.assert.equal(data.name, 'b');
            ctr++;
        });
        container.set({
            propA: {
                123: {
                    name: 'a',
                    x: 1, y: 2, z: 3
                }
            },
            propB: {
                456: {
                    name: 'b',
                    x: 1, y: 2, z: 3
                }
            }
        });
        chai_1.assert.equal(ctr, 2);
    });
});
//# sourceMappingURL=explicit_container_test.js.map