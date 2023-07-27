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

describe("getOrCreateAccountBalanceDailySnapshot()", () => {
  test("create new snapshot", () => {
    // check no snapshot yet

    let event = createTransferEvent(
      Address.fromString(TO_ADDRESS),
      Address.fromString(FROM_ADDRESS),
      BigInt.fromString("2000000000000000000000")
    );

    let balanceId = TO_ADDRESS;
    let accountId = TO_ADDRESS;
    let tokenId = CONTRACT_ADDRESS;

    assert.entityCount("AccountBalanceDailySnapshot", 0);

    // test function
    let snapshot = getOrCreateAccountBalanceDailySnapshot(
      event.block,
      accountId,
      balanceId,
      tokenId
    );

    // adding this meta data to save entity and assert against the store
    snapshot.amount = BigInt.fromString("50000");
    snapshot.blockNumber = event.block.number;
    snapshot.timestamp = event.block.timestamp;
    snapshot.save();

    assert.entityCount("AccountBalanceDailySnapshot", 1);

    let snapshotId = createAccountBalanceSnapshotId(
      event.block,
      TO_ADDRESS,
      CONTRACT_ADDRESS
    );

    assert.stringEquals(snapshotId, snapshot.id);

    assert.fieldEquals(
      "AccountBalanceDailySnapshot",
      snapshotId,
      "amount",
      "50000"
    );

    store.remove("AccountBalanceDailySnapshot", snapshotId);
  });
});

describe("updateAccountBalanceDailySnapshot()", () => {
  test("creates new AccountBalanceDailySnapshot", () => {
    const NEW_BALANCE = "70000000000000000000";

    let event = createTransferEvent(
      Address.fromString(TO_ADDRESS),
      Address.fromString(FROM_ADDRESS),
      BigInt.fromString("2000000000000000000000")
    );
    let balanceId = TO_ADDRESS;
    let accountId = TO_ADDRESS;
    let tokenId = CONTRACT_ADDRESS;

    assert.entityCount("AccountBalanceDailySnapshot", 0);

    //
    // test function
    updateAccountBalanceDailySnapshot(
      event.block,
      BigInt.fromString(NEW_BALANCE),
      FROM_ADDRESS,
      balanceId,
      tokenId
    );

    let snapshotId = createAccountBalanceSnapshotId(
      event.block,
      accountId,
      CONTRACT_ADDRESS
    );

    assert.entityCount("AccountBalanceDailySnapshot", 1);
    assert.fieldEquals(
      "AccountBalanceDailySnapshot",
      snapshotId,
      "amount",
      NEW_BALANCE
    );
  });

  test("updates existing AccountBalanceDailySnapshot", () => {
    const NEW_BALANCE = "90000000000000000000";
    // check no snapshot yet
    assert.entityCount("AccountBalanceDailySnapshot", 1);

    let event = createTransferEvent(
      Address.fromString(TO_ADDRESS),
      Address.fromString(FROM_ADDRESS),
      BigInt.fromString("2000000000000000000000")
    );

    let balanceId = TO_ADDRESS;
    let accountId = TO_ADDRESS;
    let tokenId = CONTRACT_ADDRESS;

    //
    // test function
    updateAccountBalanceDailySnapshot(
      event.block,
      BigInt.fromString(NEW_BALANCE),
      FROM_ADDRESS,
      balanceId,
      tokenId
    );

    let snapshotId = createAccountBalanceSnapshotId(
      event.block,
      accountId,
      CONTRACT_ADDRESS
    );

    // should still be 1 entity
    assert.entityCount("AccountBalanceDailySnapshot", 1);
    // with new balance again
    assert.fieldEquals(
      "AccountBalanceDailySnapshot",
      snapshotId,
      "amount",
      NEW_BALANCE
    );

    // one more event after increasing the timestamp
  });

  test("creates new snapshot for same account with new timestamp", () => {
    let NEW_BALANCE = "333000000000000000000";

    assert.entityCount("AccountBalanceDailySnapshot", 1);

    let event = createTransferEvent(
      Address.fromString(TO_ADDRESS),
      Address.fromString(FROM_ADDRESS),
      BigInt.fromString("2000000000000000000000")
    );

    let balanceId = TO_ADDRESS;
    let accountId = TO_ADDRESS;
    let tokenId = CONTRACT_ADDRESS;

    const newTimestamp = event.block.timestamp.plus(
      BigInt.fromU64(MILLISECONDS_PER_DAY * 2)
    );

    event.block.timestamp = newTimestamp;

    //
    // test function
    updateAccountBalanceDailySnapshot(
      event.block,
      BigInt.fromString(NEW_BALANCE),
      FROM_ADDRESS,
      balanceId,
      tokenId
    );

    assert.entityCount("AccountBalanceDailySnapshot", 2);

    let snapshotId = createAccountBalanceSnapshotId(
      event.block,
      accountId,
      CONTRACT_ADDRESS
    );

    // with new balance again
    assert.fieldEquals(
      "AccountBalanceDailySnapshot",
      snapshotId,
      "amount",
      NEW_BALANCE
    );
  });
});
