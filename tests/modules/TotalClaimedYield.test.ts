import { logStore } from "matchstick-as/assembly/store";

import { assert, describe, test } from "matchstick-as/assembly/index";
import { Address, BigInt, log, store } from "@graphprotocol/graph-ts";
import { createClaimedYieldEvent } from "../test-utils";
import { handleClaimedYield } from "../../src/contract";
import { CONTRACT_ADDRESS } from "../../src/constants";

describe("woof woof", () => {
  test("create initial TotalClaimedYield", () => {
    assert.entityCount("TotalClaimedYield", 0);

    let amount = BigInt.fromString("200000000000000000000");
    // new event
    const event = createClaimedYieldEvent(amount);

    // test function
    handleClaimedYield(event);

    // asserts

    assert.entityCount("TotalClaimedYield", 1);

    assert.fieldEquals(
      "TotalClaimedYield",
      CONTRACT_ADDRESS,
      "amount",
      "200000000000000000000"
    );

    store.remove("TotalClaimedYield", CONTRACT_ADDRESS);
  });

  test("increase existing TotalClaimedYield", () => {
    assert.entityCount("TotalClaimedYield", 0);
    // new events
    const event = createClaimedYieldEvent(
      BigInt.fromString("200000000000000000000")
    );
    const anotherEvent = createClaimedYieldEvent(
      BigInt.fromString("500000000000000000000")
    );

    // test functions
    handleClaimedYield(event);
    handleClaimedYield(anotherEvent);

    // should only have one record
    assert.entityCount("TotalClaimedYield", 1);

    assert.fieldEquals(
      "TotalClaimedYield",
      CONTRACT_ADDRESS,
      "amount",
      "700000000000000000000"
    );
  });
});
