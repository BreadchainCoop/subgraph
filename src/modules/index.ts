import { Transfer as TransferEvent } from "../../generated/Contract/Contract";

import {
  decreaseAccountBalance,
  getOrCreateAccountBalance,
  increaseAccountBalance,
} from "./AccountBalance";
import { updateAccountBalanceDailySnapshot } from "./AccountBalanceDailySnapshot";
import {
  decreaseTokenSupply,
  getOrCreateToken,
  increaseTokenSupply,
  updateTokenDailySnapshot,
} from "./Token";
import { Account, AccountBalance, Token } from "../../generated/schema";
import { CONTRACT_ADDRESS } from "../constants";
import { getOrCreateAccount } from "./Account";

export function handleMint(event: TransferEvent): void {
  let token = getOrCreateToken(event.address);
  let account = getOrCreateAccount(event.params.to);
  let balance = getOrCreateAccountBalance(account.id, token.id);

  let blockNumber = event.block.number;
  let timestamp = event.block.timestamp;
  let amount = event.params.value;

  balance.blockNumber = blockNumber;
  balance.timestamp = timestamp;

  token = increaseTokenSupply(token, amount);

  updateTokenDailySnapshot(event.block, token.id, token.supply, amount);

  let newBalance = increaseAccountBalance(balance, amount);
  updateAccountBalanceDailySnapshot(
    event.block,
    account.id,
    amount,
    newBalance.id,
    token.id
  );

  balance.save();
  token.save();
}

export function handleBurn(event: TransferEvent): void {
  let token = getOrCreateToken(event.address);
  let account = getOrCreateAccount(event.params.from);
  let balance = getOrCreateAccountBalance(account.id, token.id);

  let blockNumber = event.block.number;
  let timestamp = event.block.timestamp;
  let amount = event.params.value;

  balance.blockNumber = blockNumber;
  balance.timestamp = timestamp;

  token = decreaseTokenSupply(token, amount);
  updateTokenDailySnapshot(event.block, token.id, token.supply, amount);

  balance = decreaseAccountBalance(balance, amount);
  updateAccountBalanceDailySnapshot(
    event.block,
    account.id,
    amount,
    balance.id,
    token.id
  );

  balance.save();
  token.save();
}

export function handleTransfer(event: TransferEvent): void {
  let token = getOrCreateToken(event.address);

  let toAccount = getOrCreateAccount(event.params.to);
  let fromAccount = getOrCreateAccount(event.params.from);

  let toBalance = getOrCreateAccountBalance(toAccount.id, token.id);
  let fromBalance = getOrCreateAccountBalance(fromAccount.id, token.id);

  let blockNumber = event.block.number;
  let timestamp = event.block.timestamp;
  let amount = event.params.value;

  fromBalance.blockNumber = blockNumber;
  fromBalance.timestamp = timestamp;
  toBalance.blockNumber = blockNumber;
  toBalance.timestamp = timestamp;

  let newToBalance = increaseAccountBalance(toBalance, amount);
  updateAccountBalanceDailySnapshot(
    event.block,
    toAccount.id,
    amount,
    newToBalance.id,
    token.id
  );

  let newFromBalance = decreaseAccountBalance(fromBalance, amount);
  updateAccountBalanceDailySnapshot(
    event.block,
    fromAccount.id,
    amount,
    newFromBalance.id,
    token.id
  );

  toAccount.save();
  fromAccount.save();
  newToBalance.save();
  newFromBalance.save();
}
