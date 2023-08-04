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

describe("createAccountBalanceSnapshotId", () => {
  test("doesn't create new id if block timestamp is on same day", () => {
    let initialTimestamp = 1690984985965;
    let initialTimestampStr = "1690984985965";

    let event = createTransferEvent(
      Address.fromString(TO_ADDRESS),
      Address.fromString(FROM_ADDRESS),
      BigInt.fromString("2000000000000000000000")
    );

    event.block.timestamp = BigInt.fromString(initialTimestampStr);

    let accountId = TO_ADDRESS;

    let snapshotIdBefore = createAccountBalanceSnapshotId(
      event.block,
      accountId
    );

    event.block.timestamp = BigInt.fromI64(
      initialTimestamp + 1000 * 60 * 60 * 4
    );

    let snapshotIdAfter = createAccountBalanceSnapshotId(
      event.block,
      accountId
    );

    assert.stringEquals(snapshotIdBefore, snapshotIdAfter);
  });

  test("does create new id if block timestamp is on different day", () => {
    let initialTimestamp = 1691142903237; // 10:55 4/8/2023 minus 1 hour for daylight saving
    let initialTimestampStr = initialTimestamp.toString();

    let event = createTransferEvent(
      Address.fromString(TO_ADDRESS),
      Address.fromString(FROM_ADDRESS),
      BigInt.fromString("2000000000000000000000")
    );

    event.block.timestamp = BigInt.fromString(initialTimestampStr);

    let accountId = TO_ADDRESS;

    let snapshotIdBefore = createAccountBalanceSnapshotId(
      event.block,
      accountId
    );

    // next event

    let event2 = createTransferEvent(
      Address.fromString(TO_ADDRESS),
      Address.fromString(FROM_ADDRESS),
      BigInt.fromString("2000000000000000000000")
    );

    const FIFTEEN_HOURS = 1000 * 60 * 60 * 15;
    let nextDayTimestamp = initialTimestamp + FIFTEEN_HOURS; // 00:55 5/8 taking dst into account
    let nextDayTimestampStr = nextDayTimestamp.toString();

    event2.block.timestamp = BigInt.fromString(nextDayTimestampStr);

    let snapshotIdAfter = createAccountBalanceSnapshotId(
      event2.block,
      accountId
    );

    assert.assertTrue(snapshotIdBefore !== snapshotIdAfter);
  });
});

describe("getOrCreateAccountBalanceDailySnapshot()", () => {
  test("create new snapshot", () => {
    // check no snapshot yet

    let event = createTransferEvent(
      Address.fromString(TO_ADDRESS),
      Address.fromString(FROM_ADDRESS),
      BigInt.fromString("2000000000000000000000")
    );

    let balanceId = TO_ADDRESS;
    let tokenId = CONTRACT_ADDRESS;
    let accountId = CONTRACT_ADDRESS + TO_ADDRESS;

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

    let snapshotId = createAccountBalanceSnapshotId(event.block, TO_ADDRESS);

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
      FROM_ADDRESS,
      BigInt.fromString(NEW_BALANCE),
      balanceId,
      tokenId
    );

    let snapshotId = createAccountBalanceSnapshotId(event.block, accountId);

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
      FROM_ADDRESS,
      BigInt.fromString(NEW_BALANCE),
      balanceId,
      tokenId
    );

    let snapshotId = createAccountBalanceSnapshotId(event.block, accountId);

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

  test("creates new snapshot for same account with new timestamp 2 days later", () => {
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
      FROM_ADDRESS,
      BigInt.fromString(NEW_BALANCE),
      balanceId,
      tokenId
    );

    assert.entityCount("AccountBalanceDailySnapshot", 2);

    let snapshotId = createAccountBalanceSnapshotId(event.block, accountId);

    // with new balance again
    assert.fieldEquals(
      "AccountBalanceDailySnapshot",
      snapshotId,
      "amount",
      NEW_BALANCE
    );
  });
});

test("snapshot balance is updated if another transfer event occurs within same day", () => {
  let NEW_BALANCE = "333000000000000000000";

  assert.entityCount("AccountBalanceDailySnapshot", 2);

  let event = createTransferEvent(
    Address.fromString(FROM_ADDRESS),
    Address.fromString(TO_ADDRESS),
    BigInt.fromString("1000000000000000000000")
  );

  event.block.timestamp = BigInt.fromString("1690984985965");

  let balanceId = TO_ADDRESS;
  let accountId = TO_ADDRESS;
  let tokenId = CONTRACT_ADDRESS;

  let snapshotIdBefore = createAccountBalanceSnapshotId(event.block, accountId);

  // 10 minute later
  const newTimestamp = event.block.timestamp.plus(
    BigInt.fromU64(1000 * 60 * 10)
  );

  event.block.timestamp = newTimestamp;

  //
  // test function
  updateAccountBalanceDailySnapshot(
    event.block,
    FROM_ADDRESS,
    BigInt.fromString(NEW_BALANCE),
    balanceId,
    tokenId
  );

  // assert.entityCount("AccountBalanceDailySnapshot", 2);

  // with new balance again
  // assert.fieldEquals(
  //   "AccountBalanceDailySnapshot",
  //   snapshotId,
  //   "amount",
  //   NEW_BALANCE
  // );
});
