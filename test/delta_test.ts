import { assert, expect } from "chai";
import { DeltaContainer, PatchOperation } from "../src";

function clone(data: any) {
    return JSON.parse(JSON.stringify(data));
}

describe("DeltaContainer", () => {
    let container: DeltaContainer<any>;
    let data: any;

    beforeEach(() => {
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
        container = new DeltaContainer<any>(clone(data));
    });

    it("should listen to 'add' operation", (ok) => {
        container.listen("players", "add", assert.fail);
        container.listen("players/:string/:string", "add", assert.fail);
        container.listen("players/:string", "add", (player: string, value: number) => {
            assert.equal(value, 3);
            ok();
        });

        data.players.three = 3;
        container.set(data);
    });

    it("should listen to 'remove' operation", (ok) => {
        container.listen("players/:string", "remove", (value: string) => {
            assert.equal(value, "two");
            ok();
        });

        delete data.players.two;
        container.set(data);
    });

    it("should allow multiple callbacks for the same operation", (ok) => {
        let i = 0;
        function accept() {
            i++;
            if (i === 3) {
                ok();
            }
        }

        container.listen("players/:string/:string", "add", assert.fail);
        container.listen("players/:string", "add", accept);
        container.listen("players/:string", "add", accept);
        container.listen("players/:string", "add", accept);

        data.players.three = 3;
        container.set(data);
    });

    it("should fill multiple variables on listen", (ok) => {
        let assertCount = 0;

        container.listen("entities/:id/:attribute", "replace", (id: string, attribute: string, value: any) => {
            if (id === "one") {
                assert.equal(attribute, "x");
                assert.equal(value, 20);

            } else if (id === "two") {
                assert.equal(attribute, "y");
                assert.equal(value, 40);
            }

            assertCount++;
        });

        data.entities.one.x = 20;
        data.entities.two.y = 40;

        container.set(data);

        setTimeout(() => {
            assert.equal(assertCount, 2);
            ok();
        }, 1);
    });

    it("should create custom placeholder ", (ok) => {
        let assertCount = 0;

        container.registerPlaceholder(":xyz", /([xyz])/);

        container.listen("entity/:xyz", "replace", (axis: string, value: number) => {
            assertCount++;
            if (axis === "x") assert.equal(value, 1);
            else if (axis === "y") assert.equal(value, 2);
            else if (axis === "z") assert.equal(value, 3);
            else assert.fail();
        });

        data.entity.x = 1;
        data.entity.y = 2;
        data.entity.z = 3;
        data.entity.rotation = 90;
        container.set(data);

        setTimeout(() => {
            assert.equal(assertCount, 3);
            ok();
        }, 1)
    });

    it("should remove specific listener", () => {
        container.listen("players", "add", (value: any) => {
            assert.equal(value.ten, 10);
        });

        let listener = container.listen("players", "add", assert.fail);
        container.removeListener(listener);

        data.players.ten = { ten: 10 };
        container.set(data);
    });

    it("should remove all listeners", () => {
        container.listen("players", "add", assert.fail);
        container.listen("players", "remove", assert.fail);
        container.listen("entity/:attribute", "replace", assert.fail);
        container.removeAllListeners();

        delete data.players['one'];
        data.entity.x = 100;
        data.players.ten = { ten: 10 };

        container.set(data);
    });

    it("should trigger default listener as fallback", (ok) => {
        let assertCount = 0;

        container.listen("players/:string", "add", (player: string, value: number) => {
            assertCount++;
            assert.equal(value, 3);
        });

        container.listen((segments: string[], op: PatchOperation, value?: any) => {
            assertCount++;
            if (op === "replace") {
                assert.deepEqual(segments, ["entity", "rotation"]);
                assert.equal(op, "replace");
                assert.equal(value, 90);

            } else {
                assert.deepEqual(segments, ["players", "two"]);
                assert.equal(op, "remove");
            }
        });

        data.players.three = 3;
        delete data.players.two;
        data.entity.rotation = 90;
        container.set(data);

        setTimeout(() => {
            assert.equal(assertCount, 3);
            ok();
        }, 1)
    });

    it('should listen for changes on parent objects', done => {
        let dataCopy = clone(data);
        let assertCount = 0;

        container.listen("entities/:name", "replace", (player: string, value: number) => {
            assertCount++;
        });

        container.listen("entities/:name/:attribute", "replace", (id: string, attribute: string, value: any) => {
            assertCount++;
        });



        dataCopy.entities.one.x = 33;
        dataCopy.entities.one.y = 99;

        dataCopy.entities.two.x = 55;
        dataCopy.entities.two.y = 77;

        container.set(dataCopy);

        let secondCopy = clone(dataCopy);

        assert.equal(assertCount, 6);

        container.listen("entities/:name", "add", (id: string, value: any) => {
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

        assert.equal(assertCount, 8);

        done();
    })

    it('should listen for changes on parent objects, but get nothing', done => {

        let cloned = clone(data);
        container.listen("entities/:name", "replace", (player: string, value: number) => {
            assert.fail(); // shouldn't be invoked
        });

        container.listen("entities/:name/:attribute", "replace", (id: string, attribute: string, value: any) => {
            assert.fail(); // shouldn't be invoked
        });

        container.set(cloned);
        done();
    })

})
