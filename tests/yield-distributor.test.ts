import {
  assert,
  describe,
  test,
  clearStore,
  afterEach
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  handleYieldDistributed,
  handleBreadHolderVoted,
  handleProjectAdded,
  handleProjectRemoved
} from "../src/yield-distributor"
import {
  createYieldDistributedEvent,
  createBreadHolderVotedEvent,
  createProjectAddedEvent,
  createProjectRemovedEvent
} from "./yield-distributor-utils"

// Known on-chain addresses (lowercased), used to assert event-sourced ordering.
const LABOR = "0x7e1367998e1fe8fab8f0bbf41e97cd6e0c891b64"
const SYMBIOTA = "0x5405e2d4d12aadb57579e780458c9a1151b560f1"
const CCA = "0x5c22b3f03b3d8fff56c9b2e90151512cb3f3de0f"
const TREASURY = "0x6a148b997e6651237f2fcfc9e30330a6480519f0"
const CORE = "0x918def5d593f46735f74f9e2b280fe51af3a99ad"
const FORMER = "0x9c8c8513974d22e8ea9f74f2860833db107111e6"
const REFI_DAO = "0x68060388c7d97b4bf779a2ead46c86e5588f073f"
const CITIZEN_WALLET = "0xa232f16ab37c9a646f91ba901e92ed1ba4b7b544"
const REGEN = "0xfcb81c1b0e0d4fea01e5a0fbf0aebb91e78a67e1"
const GARDENS = "0x1bd2212c9aa332d22d61a0be6bcc55b2a1de6c63"
const TDF = "0xb3da7e85be62460c867e059d42c434e2a53f5498"

const GENESIS = [LABOR, SYMBIOTA, CCA, TREASURY, CORE]

let ydCounter = 0

// Renders the expected value of a `[Bytes!]!` field as matchstick stores it.
function addrField(addrs: string[]): string {
  let parts: string[] = []
  for (let i = 0; i < addrs.length; i++) {
    parts.push(Bytes.fromHexString(addrs[i]).toHexString())
  }
  return "[" + parts.join(", ") + "]"
}

// Simulates one YieldDistributed (with a unique id) at the given block and
// returns the created entity's id so it can be asserted against.
function runDistribution(blockNumber: i32): string {
  let event = createYieldDistributedEvent(
    BigInt.fromI32(100),
    BigInt.fromI32(500),
    [BigInt.fromI32(1)]
  )
  event.block.number = BigInt.fromI32(blockNumber)
  event.logIndex = BigInt.fromI32(ydCounter++)
  handleYieldDistributed(event)
  return event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()
}

function addProject(addr: string): void {
  handleProjectAdded(createProjectAddedEvent(Address.fromString(addr)))
}

function removeProject(addr: string): void {
  handleProjectRemoved(createProjectRemovedEvent(Address.fromString(addr)))
}

function projectId(addr: string): string {
  return Bytes.fromHexString(addr).toHexString()
}

describe("event-sourced project registry", () => {
  afterEach(() => {
    clearStore()
  })

  test("first distribution uses the genesis project set", () => {
    let id = runDistribution(34748613)

    assert.fieldEquals("YieldDistributed", id, "projectAddresses", addrField(GENESIS))
    // A Project entity is seeded for each genesis member.
    assert.entityCount("Project", 5)
    assert.fieldEquals("ProjectRegistry", "current", "addresses", addrField(GENESIS))
  })

  test("a project added during a distribution tx is excluded from that distribution but included in the next", () => {
    // The contract emits ProjectAdded in the same tx as the distribution it
    // rides along with (lower log index), but only applies it afterwards.
    addProject(FORMER)
    let included = runDistribution(35785419)
    assert.fieldEquals("YieldDistributed", included, "projectAddresses", addrField(GENESIS))

    // The next distribution sees the updated set, appended at the end.
    let next = runDistribution(36303826)
    assert.fieldEquals(
      "YieldDistributed",
      next,
      "projectAddresses",
      addrField([LABOR, SYMBIOTA, CCA, TREASURY, CORE, FORMER])
    )
  })

  test("removal preserves the order of the remaining projects", () => {
    // Remove a project from the middle/front of the list.
    removeProject(LABOR)
    let preUpdate = runDistribution(42089498)
    // The distribution carrying the removal still pays the pre-update set.
    assert.fieldEquals("YieldDistributed", preUpdate, "projectAddresses", addrField(GENESIS))

    let afterUpdate = runDistribution(43320181)
    assert.fieldEquals(
      "YieldDistributed",
      afterUpdate,
      "projectAddresses",
      addrField([SYMBIOTA, CCA, TREASURY, CORE])
    )
    // Project entity is marked inactive.
    assert.fieldEquals("Project", projectId(LABOR), "active", "false")
    assert.fieldEquals("Project", projectId(SYMBIOTA), "active", "true")
  })

  test("additions are appended before removals are filtered within one distribution", () => {
    // Build up state so REFI_DAO is a member, then in a single distribution
    // add REGEN + GARDENS and remove REFI_DAO (mirrors on-chain block 42622526).
    addProject(REFI_DAO)
    runDistribution(37859070)

    addProject(REGEN)
    addProject(GARDENS)
    removeProject(REFI_DAO)
    runDistribution(42622526)

    let result = runDistribution(43320181)
    assert.fieldEquals(
      "YieldDistributed",
      result,
      "projectAddresses",
      addrField([LABOR, SYMBIOTA, CCA, TREASURY, CORE, REGEN, GARDENS])
    )
  })

  test("replaying the full on-chain event sequence reproduces the live 8-project order", () => {
    // Genesis cycles.
    let genesisCycle = runDistribution(34748613)
    assert.fieldEquals("YieldDistributed", genesisCycle, "projectAddresses", addrField(GENESIS))
    runDistribution(35267016)

    // +FORMER
    addProject(FORMER)
    runDistribution(35785419)

    // +REFI_DAO  (pre-update set is genesis + FORMER)
    addProject(REFI_DAO)
    let afterFormer = runDistribution(37859070)
    assert.fieldEquals(
      "YieldDistributed",
      afterFormer,
      "projectAddresses",
      addrField([LABOR, SYMBIOTA, CCA, TREASURY, CORE, FORMER])
    )

    // +CITIZEN_WALLET, -FORMER
    addProject(CITIZEN_WALLET)
    removeProject(FORMER)
    runDistribution(38377518)

    runDistribution(41567822)

    // -LABOR
    removeProject(LABOR)
    runDistribution(42089498)

    // +REGEN, +GARDENS, -REFI_DAO
    addProject(REGEN)
    addProject(GARDENS)
    removeProject(REFI_DAO)
    runDistribution(42622526)

    // +TDF  (the cycle that added TDF still pays the pre-update 7-project set)
    addProject(TDF)
    let tdfCycle = runDistribution(45757757)
    assert.fieldEquals(
      "YieldDistributed",
      tdfCycle,
      "projectAddresses",
      addrField([SYMBIOTA, CCA, TREASURY, CORE, CITIZEN_WALLET, REGEN, GARDENS])
    )

    // Final cycle: the full 8-project set, in exact on-chain order.
    let finalCycle = runDistribution(46393177)
    assert.fieldEquals(
      "YieldDistributed",
      finalCycle,
      "projectAddresses",
      addrField([SYMBIOTA, CCA, TREASURY, CORE, CITIZEN_WALLET, REGEN, GARDENS, TDF])
    )

    // 11 projects were ever members; 3 were removed (LABOR, FORMER, REFI_DAO).
    assert.entityCount("Project", 11)
    assert.fieldEquals("Project", projectId(LABOR), "active", "false")
    assert.fieldEquals("Project", projectId(FORMER), "active", "false")
    assert.fieldEquals("Project", projectId(REFI_DAO), "active", "false")
    assert.fieldEquals("Project", projectId(TDF), "active", "true")
    assert.fieldEquals("Project", projectId(SYMBIOTA), "active", "true")
  })
})

describe("handleYieldDistributed", () => {
  afterEach(() => {
    clearStore()
  })

  test("creates entity with correct fields", () => {
    let distributions = [
      BigInt.fromI32(100),
      BigInt.fromI32(200),
      BigInt.fromI32(300)
    ]
    let event = createYieldDistributedEvent(
      BigInt.fromI32(1000),
      BigInt.fromI32(5000),
      distributions
    )

    handleYieldDistributed(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    assert.entityCount("YieldDistributed", 1)
    assert.fieldEquals("YieldDistributed", entityId, "yield", "1000")
    assert.fieldEquals("YieldDistributed", entityId, "totalVotes", "5000")
    assert.fieldEquals("YieldDistributed", entityId, "transactionHash", event.transaction.hash.toHexString())
  })

  test("maps block context correctly", () => {
    let event = createYieldDistributedEvent(
      BigInt.fromI32(500),
      BigInt.fromI32(2500),
      [BigInt.fromI32(100), BigInt.fromI32(200)]
    )

    handleYieldDistributed(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    assert.fieldEquals("YieldDistributed", entityId, "timestamp", event.block.timestamp.toString())
    assert.fieldEquals("YieldDistributed", entityId, "blockNumber", event.block.number.toString())
  })

  test("stores projectDistributions array", () => {
    let distributions = [
      BigInt.fromI32(10),
      BigInt.fromI32(20),
      BigInt.fromI32(30)
    ]
    let event = createYieldDistributedEvent(
      BigInt.fromI32(280),
      BigInt.fromI32(1000),
      distributions
    )

    handleYieldDistributed(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    assert.fieldEquals(
      "YieldDistributed",
      entityId,
      "projectDistributions",
      "[10, 20, 30]"
    )
  })

  test("handles multiple events with unique ids", () => {
    let event1 = createYieldDistributedEvent(
      BigInt.fromI32(100),
      BigInt.fromI32(500),
      [BigInt.fromI32(10), BigInt.fromI32(20)]
    )
    let event2 = createYieldDistributedEvent(
      BigInt.fromI32(200),
      BigInt.fromI32(1000),
      [BigInt.fromI32(15), BigInt.fromI32(25)]
    )
    // Give event2 a different logIndex so it gets a unique entity id
    event2.logIndex = BigInt.fromI32(2)

    handleYieldDistributed(event1)
    handleYieldDistributed(event2)

    assert.entityCount("YieldDistributed", 2)
  })
})

describe("handleBreadHolderVoted", () => {
  afterEach(() => {
    clearStore()
  })

  test("creates entity with correct fields", () => {
    let voter = Address.fromString("0x1234567890abcdef1234567890abcdef12345678")
    let points = [BigInt.fromI32(30), BigInt.fromI32(70)]
    let projects = [
      Address.fromString("0x5405e2D4D12AAdB57579E780458c9a1151b560F1"),
      Address.fromString("0x918dEf5d593F46735f74F9E2B280Fe51AF3A99ad")
    ]

    let event = createBreadHolderVotedEvent(voter, points, projects)

    handleBreadHolderVoted(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    assert.entityCount("BreadHolderVoted", 1)
    assert.fieldEquals("BreadHolderVoted", entityId, "account", voter.toHexString())
    assert.fieldEquals("BreadHolderVoted", entityId, "points", "[30, 70]")
  })

  test("converts project addresses to Bytes", () => {
    let voter = Address.fromString("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
    let points = [BigInt.fromI32(50), BigInt.fromI32(50)]
    let projects = [
      Address.fromString("0x5405e2D4D12AAdB57579E780458c9a1151b560F1"),
      Address.fromString("0x918dEf5d593F46735f74F9E2B280Fe51AF3A99ad")
    ]

    let event = createBreadHolderVotedEvent(voter, points, projects)

    handleBreadHolderVoted(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    let expectedProjects: string[] = []
    for (let i = 0; i < projects.length; i++) {
      expectedProjects.push(Bytes.fromHexString(projects[i].toHexString()).toHexString())
    }
    assert.fieldEquals(
      "BreadHolderVoted",
      entityId,
      "projects",
      "[" + expectedProjects.join(", ") + "]"
    )
  })

  test("maps block context correctly", () => {
    let voter = Address.fromString("0x1111111111111111111111111111111111111111")
    let points = [BigInt.fromI32(100)]
    let projects = [
      Address.fromString("0x5405e2D4D12AAdB57579E780458c9a1151b560F1")
    ]

    let event = createBreadHolderVotedEvent(voter, points, projects)

    handleBreadHolderVoted(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    assert.fieldEquals("BreadHolderVoted", entityId, "timestamp", event.block.timestamp.toString())
    assert.fieldEquals("BreadHolderVoted", entityId, "blockNumber", event.block.number.toString())
    assert.fieldEquals("BreadHolderVoted", entityId, "transactionHash", event.transaction.hash.toHexString())
  })
})
