import { Bytes, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { ProjectRegistry, Project } from "../generated/schema";
import { GENESIS_PROJECT_ADDRESSES, REGISTRY_ID } from "./constants";

// Loads the singleton project registry, seeding it with the genesis project set
// (and their Project entities) the first time it is touched. The genesis set
// predates the subgraph's start block, so it can't be observed via events and
// must be seeded; every subsequent change is event-sourced.
export function getOrCreateRegistry(block: ethereum.Block): ProjectRegistry {
  let registry = ProjectRegistry.load(REGISTRY_ID);
  if (registry != null) {
    return registry as ProjectRegistry;
  }

  registry = new ProjectRegistry(REGISTRY_ID);
  let seed: Bytes[] = [];
  for (let i = 0; i < GENESIS_PROJECT_ADDRESSES.length; i++) {
    let addr = Bytes.fromHexString(GENESIS_PROJECT_ADDRESSES[i]);
    seed.push(addr);
    // Seed a Project entity for each genesis member. addedAtBlock is the first
    // block we observe (the genesis set was actually established at deploy,
    // before indexing began).
    upsertProjectActive(addr, block);
  }
  registry.addresses = seed;
  registry.pendingAdditions = new Array<Bytes>(0);
  registry.pendingRemovals = new Array<Bytes>(0);
  registry.save();
  return registry;
}

// Buffers a project addition. The contract emits ProjectAdded inside the same
// transaction as the distribution it rides along with (lower log index), but
// only applies it to the active set *after* that distribution — so we stage it
// and drain it in the YieldDistributed handler.
export function recordProjectAdded(
  address: Bytes,
  block: ethereum.Block
): void {
  let registry = getOrCreateRegistry(block);
  let pending = registry.pendingAdditions;
  pending.push(address);
  registry.pendingAdditions = pending;
  registry.save();

  upsertProjectActive(address, block);
}

export function recordProjectRemoved(
  address: Bytes,
  block: ethereum.Block
): void {
  let registry = getOrCreateRegistry(block);
  let pending = registry.pendingRemovals;
  pending.push(address);
  registry.pendingRemovals = pending;
  registry.save();

  let project = Project.load(address);
  if (project != null) {
    project.active = false;
    project.removedAtBlock = block.number;
    project.removedTimestamp = block.timestamp;
    project.save();
  }
}

// Drains staged additions/removals into the committed list, mirroring the
// contract's `_updateBreadchainProjects()`: additions are appended (in order),
// then removals are applied as an order-preserving filter over the result.
// Returns nothing; mutates and saves the registry. Call this AFTER reading the
// pre-update list for the YieldDistributed entity.
export function applyPendingChanges(registry: ProjectRegistry): void {
  let additions = registry.pendingAdditions;
  let removals = registry.pendingRemovals;

  if (additions.length == 0 && removals.length == 0) {
    return;
  }

  let combined = registry.addresses.concat(additions);
  let next: Bytes[] = [];
  for (let i = 0; i < combined.length; i++) {
    let keep = true;
    for (let j = 0; j < removals.length; j++) {
      if (combined[i].toHexString() == removals[j].toHexString()) {
        keep = false;
        break;
      }
    }
    if (keep) {
      next.push(combined[i]);
    }
  }

  registry.addresses = next;
  registry.pendingAdditions = new Array<Bytes>(0);
  registry.pendingRemovals = new Array<Bytes>(0);
  registry.save();
}

function upsertProjectActive(address: Bytes, block: ethereum.Block): void {
  let project = Project.load(address);
  if (project == null) {
    project = new Project(address);
    project.address = address;
    project.addedAtBlock = block.number;
    project.addedTimestamp = block.timestamp;
  }
  project.active = true;
  project.removedAtBlock = null;
  project.removedTimestamp = null;
  project.save();
}
