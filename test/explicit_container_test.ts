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
    let container = new ExplicitContainer<TestState, TestModel>(stateObj);

    container.addCreateListener('propA', (data) => {
      assert.equal(data.name, 'a');
      ctr++;
    })

    container.addCreateListener('propB', (data) => {
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

    let container = new ExplicitContainer<TestState, TestModel>(stateObj);

    container.addRemoveListener('propA', (data) => {
      assert.equal(data.name, 'a');
      ctr++;
    });

    container.addRemoveListener('propB', (data) => {
      assert.equal(data.name, 'b');
      ctr++;
    });

    container.set({
      propA: {},
      propB: {}
    });

    assert.equal(ctr, 4);


  })


})