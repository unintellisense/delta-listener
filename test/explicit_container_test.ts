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

  before(() => {
    stateObj = { propA: {}, propB: {} }
  })

  it('basic test', () => {
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

    assert.equal(ctr, 2);

  })


})