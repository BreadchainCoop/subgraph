import { ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  AccountBalance,
  AccountBalanceDailySnapshot,
} from "../../generated/schema";
import { SECONDS_PER_DAY } from "../constants";

export function createAccountBalanceSnapshotId(
  block: ethereum.Block,
  accountId: string,
  tokenId: string
): string {
  return (
    accountId +
    "-" +
    tokenId +
    "-" +
    (block.timestamp.toI64() / SECONDS_PER_DAY).toString()
  );
}

export function getOrCreateAccountBalanceDailySnapshot(
  block: ethereum.Block,
  accountId: string,
  balanceId: string,
  tokenId: string
): AccountBalanceDailySnapshot {
  let snapshotId = createAccountBalanceSnapshotId(block, balanceId, tokenId);
  let previousSnapshot = AccountBalanceDailySnapshot.load(snapshotId);

  if (previousSnapshot != null) {
    return previousSnapshot as AccountBalanceDailySnapshot;
  }

  let newSnapshot = new AccountBalanceDailySnapshot(snapshotId);
  newSnapshot.account = accountId;
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
