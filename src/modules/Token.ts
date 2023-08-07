import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import { Token, TokenDailySnapshot } from "../../generated/schema";
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

// /**
//  * use block.timestamp.toI64 to get number
//  * @param id string
//  * @param timestamp number
//  * @returns id: string
//  */
// export function createSnapshotID(id: string, block: ethereum.Block): string {
//   return id + "-" + (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
// }

export function createSnapshotID(
  block: ethereum.Block,
  accountId: string
): string {
  //  block timestamp is in seconds!?!?!?
  let date = new Date(block.timestamp.toI64() * 1000);

  let day = date.getUTCDate().toString();
  let month = date.getUTCMonth().toString();
  let year = date.getUTCFullYear().toString();

  let datestring = day + "-" + month + "-" + year;
  // log.debug("generating snapshot id.....!\n", []);
  // log.debug("timestamp: " + block.timestamp.toString() + "\n", []);
  // log.debug("datestring: " + datestring + "\n", []);

  return accountId + "-" + datestring;
}

export function getOrCreateTokenDailySnapshot(
  block: ethereum.Block,
  tokenId: string,
  supply: BigInt
): TokenDailySnapshot {
  let snapshotId = createSnapshotID(block, tokenId);
  let previousSnapshot = TokenDailySnapshot.load(snapshotId);

  if (previousSnapshot != null) {
    return previousSnapshot as TokenDailySnapshot;
  }

  let newSnapshot = new TokenDailySnapshot(snapshotId);
  newSnapshot.token = tokenId;
  newSnapshot.dailyTotalSupply = supply;
  newSnapshot.dailyEventCount = 0;
  newSnapshot.dailyTransferCount = 0;
  newSnapshot.dailyTransferAmount = BIGINT_ZERO;

  return newSnapshot;
}

export function updateTokenDailySnapshot(
  block: ethereum.Block,
  tokenId: string,
  supply: BigInt,
  amount: BigInt
): void {
  let dailySnapshot = getOrCreateTokenDailySnapshot(block, tokenId, supply);
  dailySnapshot.dailyEventCount += 1;
  dailySnapshot.dailyTransferCount += 1;
  dailySnapshot.dailyTransferAmount = dailySnapshot.dailyTransferAmount.plus(
    amount
  );
  dailySnapshot.dailyTotalSupply = supply;
  dailySnapshot.blockNumber = block.number;
  dailySnapshot.timestamp = block.timestamp;

  dailySnapshot.save();
}
