// This file can be used to format or resolve data using AssemblyScript

import { Bytes } from "@graphprotocol/graph-ts";
import {
  YieldDistributed,
  BreadHolderVoted,
} from "../generated/YieldDistributor/YieldDistributor";
import {
  YieldDistributed as YieldDistributedEntity,
  BreadHolderVoted as BreadHolderVotedEntity,
} from "../generated/schema";

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

export function handleBreadHolderVoted(event: BreadHolderVoted): void {
  let entity = new BreadHolderVotedEntity(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.account = event.params.account;
  entity.points = event.params.points;

  // Convert Address array to Bytes array
  let projectsBytes: Bytes[] = [];
  for (let i = 0; i < event.params.projects.length; i++) {
    projectsBytes.push(
      Bytes.fromHexString(event.params.projects[i].toHexString())
    );
  }
  entity.projects = projectsBytes;

  entity.timestamp = event.block.timestamp;
  entity.blockNumber = event.block.number;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
