import { Bytes } from "@graphprotocol/graph-ts/common/collections";
import {
  Approval as ApprovalEvent,
  Burned as BurnedEvent,
  ClaimedRewards as ClaimedRewardsEvent,
  ClaimedYield as ClaimedYieldEvent,
  Minted as MintedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Transfer as TransferEvent,
} from "../generated/Contract/Contract";
import {
  Approval,
  Burned,
  ClaimedRewards,
  ClaimedYield,
  Minted,
  OwnershipTransferred,
  Transfer,
} from "../generated/schema";
import { BIGINT_ZERO, CONTRACT_ADDRESS, GENESIS_ADDRESS } from "./constants";

import {
  decreaseTokenSupply,
  getOrCreateToken,
  increaseTokenSupply,
  updateTokenWeeklySnapshot,
} from "./modules/Token";
import {
  decreaseAccountBalance,
  getOrCreateAccountBalance,
  increaseAccountBalance,
} from "./modules/AccountBalance";
import { updateAccountBalanceDailySnapshot } from "./modules/AccountBalanceDailySnapshot";
import { getOrCreateAccount } from "./modules/Account";
import { log } from "matchstick-as";

export function handleApproval(event: ApprovalEvent): void {
  let approval = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  approval.owner = event.params.owner;
  approval.spender = event.params.spender;
  approval.value = event.params.value;

  approval.blockNumber = event.block.number;
  approval.blockTimestamp = event.block.timestamp;
  approval.transactionHash = event.transaction.hash;

  approval.save();
}

export function handleBurned(event: BurnedEvent): void {
  let burned = new Burned(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  burned.receiver = event.params.receiver;
  burned.amount = event.params.amount;

  burned.blockNumber = event.block.number;
  burned.blockTimestamp = event.block.timestamp;
  burned.transactionHash = event.transaction.hash;

  burned.save();
}

export function handleClaimedRewards(event: ClaimedRewardsEvent): void {
  let entity = new ClaimedRewards(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );

  entity.rewardsList = event.params.rewardsList.map<Bytes>((reward) =>
    Bytes.fromHexString(reward.toHexString())
  );

  entity.claimedAmounts = event.params.claimedAmounts;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleClaimedYield(event: ClaimedYieldEvent): void {
  let entity = new ClaimedYield(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMinted(event: MintedEvent): void {
  let minted = new Minted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  minted.receiver = event.params.receiver;
  minted.amount = event.params.amount;

  minted.blockNumber = event.block.number;
  minted.blockTimestamp = event.block.timestamp;
  minted.transactionHash = event.transaction.hash;

  minted.save();
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.previousOwner = event.params.previousOwner;
  entity.newOwner = event.params.newOwner;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function createTransferIDHash(event: TransferEvent): Bytes {
  return event.transaction.hash.concatI32(event.logIndex.toI32());
}

export function handleTransfer(event: TransferEvent): void {
  let transfer = new Transfer(createTransferIDHash(event));

  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.value = event.params.value;
  transfer.blockNumber = event.block.number;
  transfer.blockTimestamp = event.block.timestamp;
  transfer.transactionHash = event.transaction.hash;

  transfer.save();

  let amount = event.params.value;

  if (amount == BIGINT_ZERO) {
    return;
  }

  const toAddress = event.params.to.toHexString();
  const fromAddress = event.params.from.toHexString();

  let isBurn = toAddress == GENESIS_ADDRESS;
  let isMint = fromAddress == GENESIS_ADDRESS;
  let isTransfer = !isBurn && !isMint;

  let token = getOrCreateToken(event.address);

  let toAccount = getOrCreateAccount(event.params.to);
  let fromAccount = getOrCreateAccount(event.params.from);

  let toBalance = getOrCreateAccountBalance(toAccount.id, token.id);
  let fromBalance = getOrCreateAccountBalance(fromAccount.id, token.id);

  let blockNumber = event.block.number;
  let timestamp = event.block.timestamp;

  fromBalance.blockNumber = blockNumber;
  fromBalance.timestamp = timestamp;

  toBalance.blockNumber = blockNumber;
  toBalance.timestamp = timestamp;

  // updateTokenDailySnapshot(token, event.block, amount);
  updateTokenWeeklySnapshot(token, event.block, amount);

  if (isMint) {
    increaseTokenSupply(token, amount);
    let newBalanceAmount = increaseAccountBalance(fromBalance, amount);
    updateAccountBalanceDailySnapshot(
      event.block,
      newBalanceAmount,
      CONTRACT_ADDRESS,
      fromBalance.id,
      fromAccount.id
    );

    return;
  }
  if (isBurn) {
    decreaseTokenSupply(token, amount);
    let newBalanceAmount = decreaseAccountBalance(fromBalance, amount);
    updateAccountBalanceDailySnapshot(
      event.block,
      newBalanceAmount,
      toAccount.id,
      toBalance.id,
      CONTRACT_ADDRESS
    );

    return;
  }
  if (isTransfer) {
    let newToBalance = increaseAccountBalance(toBalance, amount);
    updateAccountBalanceDailySnapshot(
      event.block,
      newToBalance,
      toAccount.id,
      toBalance.id,
      CONTRACT_ADDRESS
    );

    let newFromBalance = decreaseAccountBalance(fromBalance, amount);
    updateAccountBalanceDailySnapshot(
      event.block,
      newFromBalance,
      fromAccount.id,
      fromBalance.id,
      CONTRACT_ADDRESS
    );

    return;
  }

  log.error("Shouldn't hit this block !", []);
}
