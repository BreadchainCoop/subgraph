import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  Token,
  TokenDailySnapshot,
  TokenWeeklySnapshot,
} from "../../generated/schema";
import {
  BIGINT_ZERO,
  CONTRACT_ADDRESS,
  SECONDS_PER_DAY,
  SECONDS_PER_WEEK,
} from "../constants";

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());

  if (token != null) {
    return token;
  }

  if (tokenAddress.toHexString() != CONTRACT_ADDRESS) {
    throw new Error(`${tokenAddress} no same as ${CONTRACT_ADDRESS}   !!!`);
  }

  token = new Token(tokenAddress.toHexString());

  token.minted = BigInt.fromI32(0);
  token.burned = BigInt.fromI32(0);
  token.supply = BigInt.fromI32(0);
  token.transfers = BigInt.fromI32(0);

  return token;
}

export function increaseTokenSupply(token: Token, amount: BigInt): Token {
  token.minted = token.minted.plus(amount);
  token.supply = token.supply.plus(amount);
  return token;
}
export function decreaseTokenSupply(token: Token, amount: BigInt): Token {
  token.burned = token.burned.plus(amount);
  token.supply = token.supply.minus(amount);
  return token;
}

/**
 * use block.timestamp.toI64 to get number
 * @param id string
 * @param timestamp number
 * @returns id: string
 */
export function createSnapshotIDHash(id: string, timestamp: number): string {
  return id + "-" + (timestamp / SECONDS_PER_DAY).toString();
}

export function getOrCreateTokenDailySnapshot(
  token: Token,
  block: ethereum.Block
): TokenDailySnapshot {
  let snapshotId = createSnapshotIDHash(token.id, block.timestamp.toI64());
  let previousSnapshot = TokenDailySnapshot.load(snapshotId);

  if (previousSnapshot != null) {
    return previousSnapshot as TokenDailySnapshot;
  }

  let newSnapshot = new TokenDailySnapshot(snapshotId);
  newSnapshot.token = token.id;
  newSnapshot.dailyTotalSupply = token.supply;
  // newSnapshot.currentHolderCount = token.currentHolderCount;
  // newSnapshot.cumulativeHolderCount = token.cumulativeHolderCount;
  newSnapshot.dailyEventCount = 0;
  newSnapshot.dailyTransferCount = 0;
  newSnapshot.dailyTransferAmount = BIGINT_ZERO;
  newSnapshot.dailyMintCount = 0;
  newSnapshot.dailyMintAmount = BIGINT_ZERO;
  newSnapshot.dailyBurnCount = 0;
  newSnapshot.dailyBurnAmount = BIGINT_ZERO;

  return newSnapshot;
}

export function getOrCreateTokenWeeklySnapshot(
  token: Token,
  block: ethereum.Block
): TokenWeeklySnapshot {
  let snapshotId =
    token.id + "-" + (block.timestamp.toI64() / SECONDS_PER_WEEK).toString();
  let previousSnapshot = TokenWeeklySnapshot.load(snapshotId);

  if (previousSnapshot != null) {
    return previousSnapshot as TokenWeeklySnapshot;
  }

  let newSnapshot = new TokenWeeklySnapshot(snapshotId);
  newSnapshot.token = token.id;
  newSnapshot.weeklyTotalSupply = token.supply;
  // newSnapshot.currentHolderCount = token.currentHolderCount;
  // newSnapshot.cumulativeHolderCount = token.cumulativeHolderCount;
  newSnapshot.weeklyEventCount = 0;
  newSnapshot.weeklyTransferCount = 0;
  newSnapshot.weeklyTransferAmount = BIGINT_ZERO;
  newSnapshot.weeklyMintCount = 0;
  newSnapshot.weeklyMintAmount = BIGINT_ZERO;
  newSnapshot.weeklyBurnCount = 0;
  newSnapshot.weeklyBurnAmount = BIGINT_ZERO;

  return newSnapshot;
}

export function updateTokenWeeklySnapshot(
  token: Token,
  block: ethereum.Block,
  amount: BigInt
): void {
  let weeklySnapshot = getOrCreateTokenWeeklySnapshot(token, block);
  weeklySnapshot.weeklyEventCount += 1;
  weeklySnapshot.weeklyTransferCount += 1;
  weeklySnapshot.weeklyTransferAmount = weeklySnapshot.weeklyTransferAmount.plus(
    amount
  );
  weeklySnapshot.blockNumber = block.number;
  weeklySnapshot.timestamp = block.timestamp;

  weeklySnapshot.save();
}

// export function updateTokenDailySnapshot(
//   token: Token,
//   block: ethereum.Block,
//   amount: BigInt
// ) {
//   let dailySnapshot = getOrCreateTokenDailySnapshot(token, block);
//   dailySnapshot.dailyEventCount += 1;
//   dailySnapshot.dailyTransferCount += 1;
//   dailySnapshot.dailyTransferAmount = dailySnapshot.dailyTransferAmount.plus(
//     amount
//   );
//   dailySnapshot.blockNumber = block.number;
//   dailySnapshot.timestamp = block.timestamp;

//   dailySnapshot.save();
// }
