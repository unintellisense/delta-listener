import { assert, expect } from "chai";
import { ExplicitContainer, PatchOperation } from "../src";

describe("ExplicitDeltaContainer", () => {
  it('works', () => {
    let container = new ExplicitContainer({
      propA: {},
      propB: {}
    });

    container.addStateListener('propA', (data) => { 
      
    })

  })


})