import { BigInt } from "@graphprotocol/graph-ts";

import { Account, AccountBalance, Token } from "../../generated/schema";
import { BIGINT_ZERO } from "../constants";

export function createAccountBalanceId(
  accountId: string,
  tokenId: string
): string {
  return accountId + "-" + tokenId;
}

export function getOrCreateAccountBalance(
  tokenId: string,
  accountId: string
): AccountBalance {
  let balanceId = createAccountBalanceId(accountId, tokenId);
  let previousBalance = AccountBalance.load(balanceId);

  if (previousBalance != null) {
    return previousBalance as AccountBalance;
  }

  let newBalance = new AccountBalance(balanceId);

  newBalance.account = accountId;
  newBalance.token = tokenId;
  newBalance.amount = BIGINT_ZERO;

  return newBalance;
}

export function increaseAccountBalance(
  balance: AccountBalance,
  amount: BigInt
): BigInt {
  balance.amount = balance.amount.plus(amount);
  balance.save();
  return balance.amount;
}

export function decreaseAccountBalance(
  balance: AccountBalance,
  amount: BigInt
): BigInt {
  balance.amount = balance.amount.minus(amount);
  if (balance.amount < BIGINT_ZERO) {
    balance.amount = BIGINT_ZERO;
  }
  balance.save();
  return balance.amount;
}
