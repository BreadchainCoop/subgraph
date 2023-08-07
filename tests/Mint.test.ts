import { logStore } from "matchstick-as/assembly/store";
import { assert, describe, test } from "matchstick-as/assembly/index";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import { Account, Token } from "../generated/schema";

import { handleTransferEvent } from "../src/contract";
import { FROM_ADDRESS, TO_ADDRESS, createTransferEvent } from "./test-utils";
import { CONTRACT_ADDRESS, GENESIS_ADDRESS } from "../src/constants";
import { createSnapshotID } from "../src/modules/Token";
import { createAccountBalanceId } from "../src/modules/AccountBalance";

describe("Mint Event", () => {
  test("handleTransferEvent", () => {
    const value = 80000000000000000000;

    let event = createTransferEvent(
      Address.fromString(GENESIS_ADDRESS),
      Address.fromString(TO_ADDRESS),
      BigInt.fromU64(value)
    );

    assert.entityCount("Transfer", 0);
    assert.entityCount("Token", 0);

    handleTransferEvent(event);

    // assert.entityCount("Token", 1);
    assert.entityCount("Transfer", 1);

    // to account should exist
    let toAccount = Account.load(TO_ADDRESS);

    // assert.assertNotNull(toAccount);

    // should have 1 each as don't track genesis address account/balances
    assert.entityCount("Account", 1);
    assert.entityCount("AccountBalance", 1);
    // assert.fieldEquals(
    //   "AccountBalance",
    //   createAccountBalanceId(TO_ADDRESS, CONTRACT_ADDRESS),
    //   "amount",
    //   value.toString()
    // );

    logStore();

    return;
  });
});
