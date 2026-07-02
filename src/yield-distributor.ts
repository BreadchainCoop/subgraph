// This file can be used to format or resolve data using AssemblyScript

import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  YieldDistributed,
  BreadHolderVoted,
  ProjectAdded,
  ProjectRemoved,
  YieldDistributor,
} from "../generated/YieldDistributor/YieldDistributor";
import {
  YieldDistributed as YieldDistributedEntity,
  BreadHolderVoted as BreadHolderVotedEntity,
  Project,
} from "../generated/schema";
import { getProjectAddressesForBlock } from "./constants";

// Stable id for a project entity: the lowercased address bytes.
function projectId(project: Address): Bytes {
  return Bytes.fromHexString(project.toHexString());
}

// Upsert a project as ACTIVE. Used both by the ProjectAdded handler and by the
// distribution handler's seed (the founding projects have no ProjectAdded
// event, so the seed from getCurrentVotingDistribution() is what records them).
function markProjectActive(
  project: Address,
  blockNumber: BigInt,
  timestamp: BigInt
): void {
  let id = projectId(project);
  let entity = Project.load(id);
  if (entity == null) {
    entity = new Project(id);
    entity.addedAtBlock = blockNumber;
    entity.addedAtTimestamp = timestamp;
  }
  entity.active = true;
  entity.removedAtBlock = null;
  entity.removedAtTimestamp = null;
  entity.lastSeenBlock = blockNumber;
  entity.save();
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

  let projectAddresses: Bytes[] = [];

  // Authoritative source: ask the contract for the ordered project list at this
  // block, so the positional mapping of projectDistributions is always correct
  // and NEW projects need no code change. Only fall back to the historical
  // constant eras if the view reverts (e.g. very old blocks before it existed).
  let contract = YieldDistributor.bind(event.address);
  let dist = contract.try_getCurrentVotingDistribution();
  if (!dist.reverted) {
    let addresses = dist.value.value0;
    for (let i = 0; i < addresses.length; i++) {
      projectAddresses.push(Bytes.fromHexString(addresses[i].toHexString()));
      // Seed / refresh the queryable registry from the authoritative set.
      markProjectActive(addresses[i], event.block.number, event.block.timestamp);
    }
  } else {
    let addressesForBlock = getProjectAddressesForBlock(
      event.block.number.toI32()
    );
    for (let i = 0; i < addressesForBlock.length; i++) {
      projectAddresses.push(Bytes.fromHexString(addressesForBlock[i]));
    }
  }

  entity.projectAddresses = projectAddresses;
  entity.save();
}

export function handleProjectAdded(event: ProjectAdded): void {
  markProjectActive(
    event.params.project,
    event.block.number,
    event.block.timestamp
  );
}

export function handleProjectRemoved(event: ProjectRemoved): void {
  let id = projectId(event.params.project);
  let entity = Project.load(id);
  if (entity == null) {
    // Removed before we ever recorded it (e.g. a founding project seeded only
    // via a later distribution). Create it so the removal is still captured.
    entity = new Project(id);
    entity.addedAtBlock = event.block.number;
    entity.addedAtTimestamp = event.block.timestamp;
  }
  entity.active = false;
  entity.removedAtBlock = event.block.number;
  entity.removedAtTimestamp = event.block.timestamp;
  entity.lastSeenBlock = event.block.number;
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
