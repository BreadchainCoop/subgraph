import { logStore } from "matchstick-as/assembly/store";

import { assert, describe, test } from "matchstick-as/assembly/index";
import {
  createAccountBalanceSnapshotId,
  getOrCreateAccountBalanceDailySnapshot,
  updateAccountBalanceDailySnapshot,
} from "../../src/modules/AccountBalanceDailySnapshot";
import { FROM_ADDRESS, TO_ADDRESS, createTransferEvent } from "../test-utils";
import { Address, BigInt, log, store } from "@graphprotocol/graph-ts";
import { CONTRACT_ADDRESS, MILLISECONDS_PER_DAY } from "../../src/constants";
import {
  createAccountBalanceId,
  getOrCreateAccountBalance,
} from "../../src/modules/AccountBalance";

describe("getOrCreateBalance()", () => {
  test("create new AccountBalance", () => {
    // check no snapshot yet

    let event = createTransferEvent(
      Address.fromString(TO_ADDRESS),
      Address.fromString(FROM_ADDRESS),
      BigInt.fromString("2000000000000000000000")
    );

    assert.entityCount("AccountBalance", 0);

    let accountId = TO_ADDRESS;
    let tokenId = CONTRACT_ADDRESS;

    // test function
    let snapshot = getOrCreateAccountBalance(tokenId, accountId);
    snapshot.amount = BigInt.fromString("50000");
    snapshot.blockNumber = event.block.number;
    snapshot.timestamp = event.block.timestamp;
    snapshot.save();

    assert.entityCount("AccountBalance", 1);

    let balanceId = createAccountBalanceId(accountId, tokenId);
    assert.fieldEquals("AccountBalance", balanceId, "id", balanceId);

    // let snapshotId = createAccountBalanceSnapshotId(
    //   event.block,
    //   TO_ADDRESS,
    //   CONTRACT_ADDRESS
    // );

    // assert.stringEquals(snapshotId, snapshot.id);

    // assert.fieldEquals(
    //   "AccountBalanceDailySnapshot",
    //   snapshotId,
    //   "amount",
    //   "50000"
    // );

    // store.remove("AccountBalanceDailySnapshot", snapshotId);
  });
});

// describe("updateAccountBalanceDailySnapshot()", () => {
//   test("creates new AccountBalanceDailySnapshot", () => {
//     const NEW_BALANCE = "70000000000000000000";

//     let event = createTransferEvent(
//       Address.fromString(TO_ADDRESS),
//       Address.fromString(FROM_ADDRESS),
//       BigInt.fromString("2000000000000000000000")
//     );
//     let balanceId = TO_ADDRESS;
//     let accountId = TO_ADDRESS;
//     let tokenId = CONTRACT_ADDRESS;

//     assert.entityCount("AccountBalanceDailySnapshot", 0);

//     //
//     // test function
//     updateAccountBalanceDailySnapshot(
//       event.block,
//       BigInt.fromString(NEW_BALANCE),
//       FROM_ADDRESS,
//       balanceId,
//       tokenId
//     );

//     let snapshotId = createAccountBalanceSnapshotId(
//       event.block,
//       accountId,
//       CONTRACT_ADDRESS
//     );

//     assert.entityCount("AccountBalanceDailySnapshot", 1);
//     assert.fieldEquals(
//       "AccountBalanceDailySnapshot",
//       snapshotId,
//       "amount",
//       NEW_BALANCE
//     );
//   });

//   test("updates existing AccountBalanceDailySnapshot", () => {
//     const NEW_BALANCE = "90000000000000000000";
//     // check no snapshot yet
//     assert.entityCount("AccountBalanceDailySnapshot", 1);

//     let event = createTransferEvent(
//       Address.fromString(TO_ADDRESS),
//       Address.fromString(FROM_ADDRESS),
//       BigInt.fromString("2000000000000000000000")
//     );

//     let balanceId = TO_ADDRESS;
//     let accountId = TO_ADDRESS;
//     let tokenId = CONTRACT_ADDRESS;

//     //
//     // test function
//     updateAccountBalanceDailySnapshot(
//       event.block,
//       BigInt.fromString(NEW_BALANCE),
//       FROM_ADDRESS,
//       balanceId,
//       tokenId
//     );

//     let snapshotId = createAccountBalanceSnapshotId(
//       event.block,
//       accountId,
//       CONTRACT_ADDRESS
//     );

//     // should still be 1 entity
//     assert.entityCount("AccountBalanceDailySnapshot", 1);
//     // with new balance again
//     assert.fieldEquals(
//       "AccountBalanceDailySnapshot",
//       snapshotId,
//       "amount",
//       NEW_BALANCE
//     );

//     // one more event after increasing the timestamp
//   });
