import { logStore } from "matchstick-as/assembly/store";

import { assert, describe, test } from "matchstick-as/assembly/index";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { Account, Token } from "../generated/schema";

import { handleTransferEvent } from "../src/contract";
import { FROM_ADDRESS, TO_ADDRESS, createTransferEvent } from "./test-utils";
import { CONTRACT_ADDRESS } from "../src/constants";
import { createSnapshotID } from "../src/modules/Token";

/**
 * Events
 *
 *
  Approval
  Burned
  ClaimedRewards
  ClaimedYield
  Minted
  OwnershipTransferred
  Transfer

  */

//  TODO assert for relevant things after full transfer event

// 1. create token
// 2. create to/from accounts
// 2. create to/from balances
// 2. create to/from daily snapshots
describe("Transfer Event", () => {
  test("handle transfer event", () => {
    const value = "80000000000000000000";

    let event = createTransferEvent(
      Address.fromString(TO_ADDRESS),
      Address.fromString(FROM_ADDRESS),
      BigInt.fromString(value)
    );

    assert.addressEquals(Address.fromString(CONTRACT_ADDRESS), event.address);

    let id = event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .toHexString();

    assert.entityCount("Transfer", 0);
    assert.entityCount("Token", 0);

    handleTransferEvent(event);

    assert.entityCount("Token", 1);
    assert.entityCount("Transfer", 1);

    // should have 2 of everything now
    assert.entityCount("Account", 2);
    assert.entityCount("AccountBalance", 2);

    // logStore();

    return;
  });
});
