import { logStore } from "matchstick-as/assembly/store";

import { assert, describe, test } from "matchstick-as/assembly/index";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { Account, Token } from "../generated/schema";

import { handleTransferEvent } from "../src/contract";
import { FROM_ADDRESS, TO_ADDRESS, createTransferEvent } from "./test-utils";
import { CONTRACT_ADDRESS } from "../src/constants";
import { createSnapshotID } from "../src/modules/Token";

/**
 * Events
 *
 *
  Approval
  Burned
  ClaimedRewards
  ClaimedYield
  Minted
  OwnershipTransferred
  Transfer

  */

//  TODO assert for relevant things after full transfer event
// describe("Transfer Event", () => {
//   test("creates Transfer entity in store", () => {
//     const value = "80000000000000000000";
//     const value2 = "30000000000000000000";
//     let event = createTransferEvent(
//       Address.fromString(TO_ADDRESS),
//       Address.fromString(FROM_ADDRESS),
//       BigInt.fromString(value)
//     );

//     event.address = Address.fromString(CONTRACT_ADDRESS);

//     let hash = event.transaction.hash.toHexString();

//     assert.addressEquals(Address.fromString(CONTRACT_ADDRESS), event.address);

//     let id = event.transaction.hash
//       .concatI32(event.logIndex.toI32())
//       .toHexString();

//     handleTransferEvent(event);

//     // to account should exist
//     let toAccount = Account.load(TO_ADDRESS);
//     if (toAccount) {
//       log.debug("toAccountId", []);
//       log.debug(toAccount.id, []);
//       assert.stringEquals(toAccount.id, TO_ADDRESS);
//     }

//     // from account should exist
//     let fromAccount = Account.load(FROM_ADDRESS);
//     if (fromAccount) {
//       log.debug("fromAccountId", []);
//       log.debug(fromAccount.id, []);
//     }

//     if (fromAccount && toAccount) {
//       let balanceId = fromAccount.id + "-" + toAccount.id;
//       log.debug("balanceId", []);
//       log.debug(balanceId, []);
//     }

//     // balance id is account id + token id
//     let balanceId = id + CONTRACT_ADDRESS;

//     assert.fieldEquals("Transfer", id, "id", id);
//     assert.fieldEquals("Transfer", id, "value", value.toString());

//     // SECOND EVENT

//     let event2 = createTransferEvent(
//       Address.fromString(FROM_ADDRESS),
//       Address.fromString(TO_ADDRESS),
//       BigInt.fromString(value2)
//     );
//     event2.address = Address.fromString(CONTRACT_ADDRESS);

//     handleTransferEvent(event2);

//     // logStore();

//     return;
//   });
// });
