import {
  assert,
  beforeAll,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { CONTRACT_ADDRESS } from "../../src/constants";
import { Address, store, BigInt } from "@graphprotocol/graph-ts";
import { FROM_ADDRESS, TO_ADDRESS, createTransferEvent } from "../test-utils";
import { getOrCreateTokenDailySnapshot } from "../../src/modules/Token";

// beforeAll(() => {
//   store.remove("Token");
// });

describe("Token", () => {
  test("getOrCreateTokenDailySnapshot", () => {
    // let event = createTransferEvent(
    //   Address.fromString(TO_ADDRESS),
    //   Address.fromString(FROM_ADDRESS),
    //   BigInt.fromString("2000000000000000000000")
    // );
    // let balanceId = TO_ADDRESS;
    // let tokenId = CONTRACT_ADDRESS;
    // let accountId = CONTRACT_ADDRESS + TO_ADDRESS;
    // getOrCreateTokenDailySnapshot(event);
  });
  //   test("getOrCreateTokenWeeklySnapshot", () => {});
});
