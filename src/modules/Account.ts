import { Bytes, ethereum, BigInt, Address } from "@graphprotocol/graph-ts";

import { Account } from "../../generated/schema";

import { getOrCreateAccountBalanceDailySnapshot } from "./AccountBalanceDailySnapshot";

// export function isNewAccount(accountAddress: Bytes): boolean {
//   let accountId = accountAddress.toHex();
//   let existingAccount = Account.load(accountId);

//   if (existingAccount != null) {
//     return false;
//   }

//   return true;
// }

export function getOrCreateAccount(accountAddress: Address): Account {
  let account = Account.load(accountAddress.toHexString());

  if (account != null) {
    return account;
  }

  account = new Account(accountAddress.toHexString());

  return account;
}

// export function getOrCreateAccount(accountAddress: Bytes): Account {
//   let accountId = accountAddress.toHex();
//   let existingAccount = Account.load(accountId);

//   if (existingAccount != null) {
//     return existingAccount as Account;
//   }

//   let newAccount = new Account(accountId);

//   return newAccount;
// }
