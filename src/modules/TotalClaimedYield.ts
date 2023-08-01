import { ethereum, BigInt } from "@graphprotocol/graph-ts";
import { TotalClaimedYield } from "../../generated/schema";

export function createTotalClaimedYieldId(
  block: ethereum.Block,
  tokenId: string
): string {
  return tokenId;
}

export function getOrCreateTotalClaimedYield(
  block: ethereum.Block,
  tokenId: string
): TotalClaimedYield {
  let totalYieldId = createTotalClaimedYieldId(block, tokenId);
  let previoustotalYield = TotalClaimedYield.load(totalYieldId);

  if (previoustotalYield != null) {
    return previoustotalYield as TotalClaimedYield;
  }

  let totalYield = new TotalClaimedYield(totalYieldId);

  totalYield.amount = BigInt.fromString("0");

  return totalYield;
}
