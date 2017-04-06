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

})

type Vec3 = {
    x: number
    y: number
    z: number
}

type ComplicatedExample = {
    player: {
        id: string
        name: string
    }[],
    static: {
        position: Vec3
    }[],
    dynamic: {
        position: Vec3
    }[]
}

describe('array Delta Test', () => {


    let container: DeltaContainer<ComplicatedExample>;
    let data: ComplicatedExample;

    beforeEach(() => {
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
        container = new DeltaContainer<any>(clone(data));
    })

    it("should tell that array was added and removed", done => {
        container.listen('dynamic/:idx', 'add', (idx: number, val: any) => {
            console.log(`add idx: ${idx}, value${JSON.stringify(val)}`);
        });

        container.listen('dynamic/:idx', 'remove', (idx: number) => {
            console.log(`removeidx: ${idx}`);
        });
        
        
        data.dynamic.push({
            position: {
                x: 20, y: 30, z: 40
            }
        }) // add one to the end

        //data.dynamic.splice(0, 1); // delete the first
        container.set(data);


        setTimeout(() => {
            done();
        }, 500);

    })
})
