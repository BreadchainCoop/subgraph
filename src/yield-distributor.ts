// This file can be used to format or resolve data using AssemblyScript

import { Bytes } from "@graphprotocol/graph-ts";
import {
  YieldDistributed,
  BreadHolderVoted,
  ProjectAdded,
  ProjectRemoved,
} from "../generated/YieldDistributor/YieldDistributor";
import {
  YieldDistributed as YieldDistributedEntity,
  BreadHolderVoted as BreadHolderVotedEntity,
} from "../generated/schema";
import {
  getOrCreateRegistry,
  recordProjectAdded,
  recordProjectRemoved,
  applyPendingChanges,
} from "./projects";

export function handleProjectAdded(event: ProjectAdded): void {
  recordProjectAdded(
    Bytes.fromHexString(event.params.project.toHexString()),
    event.block
  );
}

export function handleProjectRemoved(event: ProjectRemoved): void {
  recordProjectRemoved(
    Bytes.fromHexString(event.params.project.toHexString()),
    event.block
  );
}

export function handleYieldDistributed(event: YieldDistributed): void {
  let entity = new YieldDistributedEntity(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.yield_ = event.params.yield_;
  entity.totalVotes = event.params.totalVotes;
  entity.timestamp = event.block.timestamp;
  entity.blockNumber = event.block.number;
  entity.transactionHash = event.transaction.hash;
  entity.projectDistributions = event.params.projectDistributions;

  // The active project set, event-sourced from ProjectAdded/ProjectRemoved.
  // We read the committed list *before* applying this distribution's staged
  // changes, because the contract distributes to the pre-update `projects`
  // array and only mutates it afterwards (see ProjectRegistry docs / the
  // contract's `_updateBreadchainProjects()`). This keeps projectAddresses
  // aligned with the positional projectDistributions array.
  let registry = getOrCreateRegistry(event.block);
  entity.projectAddresses = registry.addresses;
  entity.save();

  // Now fold in any additions/removals that rode along in this transaction so
  // the next distribution sees the updated set.
  applyPendingChanges(registry);
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
