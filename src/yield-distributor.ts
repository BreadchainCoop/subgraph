// This file can be used to format or resolve data using AssemblyScript

import { YieldDistributed } from "../generated/YieldDistributor/YieldDistributor";
import { YieldDistributed as YieldDistributedEntity } from "../generated/schema";

export function handleYieldDistributed(event: YieldDistributed): void {
  let entity = new YieldDistributedEntity(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.yield_ = event.params.yield_;
  entity.totalVotes = event.params.totalVotes;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.projectDistributions = event.params.projectDistributions;

  entity.save();
}
