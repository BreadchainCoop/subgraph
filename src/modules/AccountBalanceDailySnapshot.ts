import { ethereum, BigInt, log } from "@graphprotocol/graph-ts";

import {
  AccountBalance,
  AccountBalanceDailySnapshot,
} from "../../generated/schema";
import { SECONDS_PER_DAY } from "../constants";

export function createAccountBalanceSnapshotId(
  block: ethereum.Block,
  accountId: string
): string {
  let date = new Date(block.timestamp.toI64() * 1000);

  let day = date.getUTCDate().toString();
  let month = date.getUTCMonth().toString();
  let year = date.getUTCFullYear().toString();

  let datestring = day + "-" + month + "-" + year;

  return accountId + "-" + datestring;
}

export function getOrCreateAccountBalanceDailySnapshot(
  block: ethereum.Block,
  accountId: string,
  balanceId: string,
  tokenId: string
): AccountBalanceDailySnapshot {
  let snapshotId = createAccountBalanceSnapshotId(block, balanceId);
  let previousSnapshot = AccountBalanceDailySnapshot.load(snapshotId);

  if (previousSnapshot != null) {
    return previousSnapshot as AccountBalanceDailySnapshot;
  }

  let newSnapshot = new AccountBalanceDailySnapshot(snapshotId);
  newSnapshot.account = accountId;
  newSnapshot.balance = balanceId;
  newSnapshot.token = tokenId;

  return newSnapshot;
}

export function updateAccountBalanceDailySnapshot(
  block: ethereum.Block,
  accountId: string,
  amount: BigInt,
  balanceId: string,
  tokenId: string
): void {
  let snapshot = getOrCreateAccountBalanceDailySnapshot(
    block,
    accountId,
    balanceId,
    tokenId
  );

  snapshot.amount = amount;
  snapshot.blockNumber = block.number;
  snapshot.timestamp = block.timestamp;

  snapshot.save();
}
