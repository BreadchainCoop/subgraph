import { Transfer as TransferEvent } from "../../generated/Contract/Contract";

import {
  decreaseAccountBalance,
  getOrCreateAccountBalance,
  increaseAccountBalance,
} from "./AccountBalance";
import { updateAccountBalanceDailySnapshot } from "./AccountBalanceDailySnapshot";
import { getOrCreateToken, increaseTokenSupply } from "./Token";
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

  let updatedToken = increaseTokenSupply(token, amount);
  // add mint numbers

  let newBalance = increaseAccountBalance(balance, amount);
  updateAccountBalanceDailySnapshot(
    event.block,
    account.id,
    amount,
    newBalance.id,
    token.id
  );

  updatedToken.save();
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

  let updatedToken = increaseTokenSupply(token, amount);
  // add burn numbers

  let newBalance = decreaseAccountBalance(balance, amount);
  updateAccountBalanceDailySnapshot(
    event.block,
    account.id,
    amount,
    newBalance.id,
    token.id
  );

  updatedToken.save();
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
