import { logStore } from "matchstick-as/assembly/store";

import {
  assert,
  beforeAll,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { CONTRACT_ADDRESS } from "../../src/constants";
import { store } from "@graphprotocol/graph-ts";

// beforeAll(() => {
//   store.remove("Token");
// });

// describe("Token", () => {
//   test("getOrCreateToken", () => {});
//   test("getOrCreateTokenDailySnapshot", () => {
//     // createSnapshotIDHash()
//   });
//   test("getOrCreateTokenWeeklySnapshot", () => {});
// });
