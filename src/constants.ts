// Event-sourced project list configuration.
//
// The YieldDistributor maintains an ordered `projects` array on-chain and emits
// `ProjectAdded` / `ProjectRemoved` whenever it changes (see
// `_updateBreadchainProjects()` in BreadchainCoop/solidarity-fund). This subgraph
// reconstructs that exact ordered list by indexing those events, so adding or
// removing a member project no longer requires editing this file — the only
// thing hardcoded here is the genesis set that existed at the subgraph's start
// block (it predates any event we can observe).
//
// Genesis set: the `_projects` array passed to `initialize()`, in on-chain order.
// Verified against the chain: replaying every ProjectAdded/ProjectRemoved on top
// of this seed reproduces the live `getCurrentVotingDistribution()` ordering
// exactly. Do NOT reorder.
export const GENESIS_PROJECT_ADDRESSES: string[] = [
  "0x7e1367998e1fe8fab8f0bbf41e97cd6e0c891b64", // Labor DAO
  "0x5405e2d4d12aadb57579e780458c9a1151b560f1", // Symbiota
  "0x5c22b3f03b3d8fff56c9b2e90151512cb3f3de0f", // Crypto Commons Association
  "0x6a148b997e6651237f2fcfc9e30330a6480519f0", // Bread Treasury
  "0x918def5d593f46735f74f9e2b280fe51af3a99ad", // Bread Core
];

// The ProjectRegistry singleton id.
export const REGISTRY_ID = "current";
