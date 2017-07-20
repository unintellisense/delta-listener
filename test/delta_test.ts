import { assert, expect } from "chai";
import { DeltaContainer, DataChange } from "../src";

function clone(data: any) {
    return JSON.parse(JSON.stringify(data));
}

describe("DeltaContainer", () => {
    let container: DeltaContainer<any>;
    let data: any;
    let numCalls: number;

    function completeWhenCalled(n: number, done: Function) {
        numCalls++;
        if (numCalls === n) done();
    }

    beforeEach(() => {
        numCalls = 0;
        data = {
            players: {
                one: 1,
                two: 1
            },
            entity: {
                x: 0, y: 0, z: 0,
                xp: 100,
                rotation: 10
            },
            entities: {
                one: { x: 10, y: 0 },
                two: { x: 0, y: 0 },
            },
            chests: {
                one: { items: { one: 1, } },
                two: { items: { two: 1, } }
            }
        };
        container = new DeltaContainer<any>(clone(data));
    });

    it("should listen to 'add' operation", (done) => {
        container.listen("players", assert.fail);
        container.listen("players/:string/:string", assert.fail);
        container.listen("players/:string", (change: DataChange) => {
            assert.equal(change.path.string, "three");
            assert.equal(change.value, 3);
            done();
        });

        data.players.three = 3;
        container.set(data);
    });

    it("should match the full path", (done) => {

        container.listen(":name/x", (change: DataChange) => {
            assert.equal(change.path.name, "entity");
            assert.equal(change.value, 50);
            completeWhenCalled(2, done);
        });

        container.listen(":name/xp", (change: DataChange) => {
            assert.equal(change.path.name, "entity");
            assert.equal(change.value, 200);
            completeWhenCalled(2, done);
        });

        data.entity.x = 50;
        data.entity.xp = 200;

        container.set(data);
    });

    it("should listen to 'remove' operation", (done) => {
        container.listen("players/:name", (change: DataChange) => {
            assert.equal(change.path.name, "two");
            assert.equal(change.value, undefined);
            done();
        });

        delete data.players.two;
        container.set(data);
    });

    it("should allow multiple callbacks for the same operation", (done) => {
        let i = 0;
        function accept() {
            i++;
            if (i === 3) {
                done();
            }
        }

        container.listen("players/:string/:string", assert.fail);
        container.listen("players/:string", accept);
        container.listen("players/:string", accept);
        container.listen("players/:string", accept);

        data.players.three = 3;
        container.set(data);
    });

    it("should fill multiple variables on listen", (done) => {
        container.listen("entities/:id/:attribute", (change: DataChange) => {
            if (change.path.id === "one") {
                assert.equal(change.path.attribute, "x");
                assert.equal(change.value, 20);

            } else if (change.path.id === "two") {
                assert.equal(change.path.attribute, "y");
                assert.equal(change.value, 40);
            }

            completeWhenCalled(2, done);
        });

        data.entities.one.x = 20;
        data.entities.two.y = 40;

        container.set(data);
    });

    it("should create custom placeholder ", (done) => {
        container.registerPlaceholder(":xyz", /([xyz])/);

        container.listen("entity/:xyz", (change: DataChange) => {
            if (change.path.xyz === "x") assert.equal(change.value, 1);
            else if (change.path.xyz === "y") assert.equal(change.value, 2);
            else if (change.path.xyz === "z") assert.equal(change.value, 3);
            else assert.fail();
            completeWhenCalled(3, done);
        });

        data.entity.x = 1;
        data.entity.y = 2;
        data.entity.z = 3;
        data.entity.rotation = 90;
        container.set(data);
    });

    it("should remove specific listener", () => {
        container.listen("players", (change: DataChange) => {
            assert.equal(change.value.ten, 10);
        });

        let listener = container.listen("players", assert.fail);
        container.removeListener(listener);

        data.players.ten = { ten: 10 };
        container.set(data);
    });

    it("using the same placeholder multiple times in the path", (done) => {
        container.listen("chests/:id/items/:id", (change: DataChange) => {
            //
            // TODO: the current implementation only populates the last ":id" into `change.path.id`
            //
            assert.equal(change.path.id, "two");
            assert.equal(change.value, 2);
            done();
        });

        data.chests.one.items.two = 2;
        container.set(data);
    });

    it("should remove all listeners", () => {
        container.listen("players", assert.fail);
        container.listen("players", assert.fail);
        container.listen("entity/:attribute", assert.fail);
        container.removeAllListeners();

        delete data.players['one'];
        data.entity.x = 100;
        data.players.ten = { ten: 10 };

        container.set(data);
    });

    it("should trigger default listener as fallback", (done) => {
        let numCallbacksExpected = 3;

        container.listen("players/:string", (change: DataChange) => {
            if (change.operation === "add") {
                assert.equal(change.path.string, "three");
                assert.equal(change.value, 3);

            } else if (change.operation === "remove") {
                assert.equal(change.path.string, "two");
                assert.equal(change.value, undefined);
            }
            completeWhenCalled(numCallbacksExpected, done);
        });

        container.listen((change: DataChange) => {
            assert.deepEqual(change.path, ["entity", "rotation"]);
            assert.equal(change.operation, "replace");
            assert.equal(change.value, 90);
            completeWhenCalled(numCallbacksExpected, done);
        });

        data.players.three = 3;
        delete data.players.two;
        data.entity.rotation = 90;
        container.set(data);
    });

    it('should listen for changes on parent objects', done => {
        let dataCopy = clone(data);
        let assertCount = 0;

        container.listen("entities/:name", (change: DataChange) => {
            assertCount++;
        }, '*');

        dataCopy.entities.one.x = 33;
        dataCopy.entities.one.y = 99;

        dataCopy.entities.two.x = 55;
        dataCopy.entities.two.y = 77;

        container.set(dataCopy);

        let secondCopy = clone(dataCopy);

        assert.equal(assertCount, 2);

        container.listen("entities/:name", (change: DataChange) => {
            if (change.operation === 'add') {
                assertCount++;
            }
        }, 'add');

        secondCopy.entities.three = {
            x: 22,
            y: 55
        };

        secondCopy.entities.four = {
            x: 99,
            y: 21
        };

        container.set(secondCopy);

        assert.equal(assertCount, 4);

        done();
    })

    it('should listen for changes on parent objects, but get nothing', done => {

        let cloned = clone(data);
        container.listen("entities/:name", (change: DataChange) => {
            if (change.operation === 'replace') {
                assert.fail(); // shouldn't be invoked
            }
        });

        container.listen("entities/:name/:attribute", (change: DataChange) => {
            if (change.operation === 'replace') {
                assert.fail(); // shouldn't be invoked
            }
        });

        container.set(cloned);
        done();
    })

    it('should listen for changes on parent objects and trigger on new properties', done => {
        let assertCount = 0;
        let cloned = clone(data);
        container.listen("entities/:name", (change: DataChange) => {
            assertCount++;
        }, '*');
        // first set it with doing nothing, shouldn't trigger
        container.set(cloned);
        assert.equal(assertCount, 0);

        cloned = clone(data);
        // add a new property to existing entity
        cloned.entities.one.QQ = 456;
        container.set(cloned);
        assert.equal(assertCount, 1);
        done();
    })

    it('should listen for changes on parent objects and trigger on deleted properties', done => {
        let assertCount = 0;
        let cloned = clone(data);
        container.listen("entities/:name", (change: DataChange) => {
            assertCount++;
        }, '*');
        // first set it with doing nothing, shouldn't trigger
        container.set(cloned);
        assert.equal(assertCount, 0);

        cloned = clone(data);
        // add a new property to existing entity
        delete cloned.entities.one.y
        container.set(cloned);
        assert.equal(assertCount, 1);
        done();
    })

})
