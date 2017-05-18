import { assert, expect } from "chai";
import { ExplicitContainer, PatchOperation } from "../src";

type TestModel = {
  x: number
  y: number
  z: number
  name: string
}

type TestModelDict = {
  [id: string]: TestModel
}

type TestState = {
  propA: TestModelDict
  propB: TestModelDict
}

describe("ExplicitDeltaContainer", () => {

  let stateObj: TestState;

  beforeEach(() => {
    stateObj = { propA: {}, propB: {} }
  })

  it('add test', () => {
    let ctr = 0;
    let container = new ExplicitContainer<TestState>(stateObj);

    container.addCreateListener('propA', (id, data) => {
      assert.equal(data.name, 'a');
      ctr++;
    })

    container.addCreateListener('propB', (id, data) => {
      assert.equal(id, 'objOne');
      assert.equal(data.name, 'b');
      ctr++;
    })

    container.set({
      propA: {
        objOne: {
          name: 'a', x: 1, y: 2, z: 3
        },
        objTwo: {
          name: 'a', x: 1, y: 2, z: 3
        },
      },
      propB: {
        objOne: {
          name: 'b', x: 1, y: 2, z: 3
        }
      }
    });

    assert.equal(ctr, 3);

  })

  it('remove test', () => {
    let ctr = 0;
    stateObj.propA.objOne = { name: 'a', x: 1, y: 2, z: 3 };
    stateObj.propA.objTwo = { name: 'a', x: 1, y: 2, z: 3 };

    stateObj.propB.objOne = { name: 'b', x: 1, y: 2, z: 3 };
    stateObj.propB.objTwo = { name: 'b', x: 1, y: 2, z: 3 };

    let container = new ExplicitContainer<TestState>(stateObj);

    container.addRemoveListener('propA', (id, data) => {
      assert.equal(data.name, 'a');
      ctr++;
    });

    container.addRemoveListener('propB', (id, data) => {
      assert.equal(data.name, 'b');
      ctr++;
    });

    container.set({
      propA: {},
      propB: {}
    });

    assert.equal(ctr, 4);

  })

  it('simple state listener', () => {
    let ctr = 0;
    stateObj.propA.objOne = { name: 'a', x: 1, y: 2, z: 3 };
    stateObj.propA.objTwo = { name: 'a', x: 1, y: 2, z: 3 };

    stateObj.propB.objOne = { name: 'b', x: 1, y: 2, z: 3 };
    stateObj.propB.objTwo = { name: 'b', x: 1, y: 2, z: 3 };
    let stateObjCopy: typeof stateObj = JSON.parse(JSON.stringify(stateObj));

    stateObjCopy.propA.objOne.x = 11;
    stateObjCopy.propA.objOne.y = 22;
    stateObjCopy.propA.objOne.z = 33;

    stateObjCopy.propB.objOne.x = 11;
    stateObjCopy.propB.objOne.y = 22;
    stateObjCopy.propB.objOne.z = 33;


    let container = new ExplicitContainer<TestState>(stateObj);
    container.addStateListener('propA', (data) => {
      assert.equal(data.objOne.x, 11);
      assert.equal(data.objOne.y, 22);
      assert.equal(data.objOne.z, 33);

      assert.equal(data.objTwo.x, 1);
      assert.equal(data.objTwo.y, 2);
      assert.equal(data.objTwo.z, 3);
    })

    container.addStateListener('propB', (data) => {
      assert.equal(data.objOne.x, 11);
      assert.equal(data.objOne.y, 22);
      assert.equal(data.objOne.z, 33);

      assert.equal(data.objTwo.x, 1);
      assert.equal(data.objTwo.y, 2);
      assert.equal(data.objTwo.z, 3);
    })

    container.set(stateObjCopy);
    assert.equal(container.data.propA.objOne.x, 11);
    assert.equal(container.data.propA.objOne.y, 22);
    assert.equal(container.data.propA.objOne.z, 33);

    let anotherCopy: typeof stateObj = JSON.parse(JSON.stringify(stateObjCopy));

    anotherCopy.propA.objTwo.x = 111;
    anotherCopy.propA.objTwo.y = 222;
    anotherCopy.propA.objTwo.z = 333;

    container.addStateListener('propA', (data) => {
      assert.equal(data.objOne.x, 11);
      assert.equal(data.objOne.y, 22);
      assert.equal(data.objOne.z, 33);

      assert.equal(data.objTwo.x, 111);
      assert.equal(data.objTwo.y, 222);
      assert.equal(data.objTwo.z, 333);
    });

    container.addStateListener('propB', (data) => {
      assert.equal(data.objOne.x, 11);
      assert.equal(data.objOne.y, 22);
      assert.equal(data.objOne.z, 33);

      assert.equal(data.objTwo.x, 1);
      assert.equal(data.objTwo.y, 2);
      assert.equal(data.objTwo.z, 3);
    });

    container.set(anotherCopy);

  })


})