import {
  assert,
  describe,
  test,
  clearStore,
  afterEach
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { handleYieldDistributed, handleBreadHolderVoted } from "../src/yield-distributor"
import {
  createYieldDistributedEvent,
  createBreadHolderVotedEvent
} from "./yield-distributor-utils"
import {
  PROJECT_ADDRESSES_1,
  PROJECT_ADDRESSES_2,
  PROJECT_ADDRESSES_3
} from "../src/constants"

// Default mock event address used by newMockEvent()
const MOCK_ADDRESS = "0xa16081f360e3847006db660bae1c6d1b2e17ec2a"

describe("handleYieldDistributed", () => {
  afterEach(() => {
    clearStore()
  })

  test("creates entity with correct fields", () => {
    let distributions = [
      BigInt.fromI32(100),
      BigInt.fromI32(200),
      BigInt.fromI32(300),
      BigInt.fromI32(400),
      BigInt.fromI32(500),
      BigInt.fromI32(600),
      BigInt.fromI32(700)
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
      [BigInt.fromI32(100), BigInt.fromI32(200), BigInt.fromI32(300), BigInt.fromI32(400), BigInt.fromI32(500), BigInt.fromI32(600), BigInt.fromI32(700)]
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
      BigInt.fromI32(30),
      BigInt.fromI32(40),
      BigInt.fromI32(50),
      BigInt.fromI32(60),
      BigInt.fromI32(70)
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
      "[10, 20, 30, 40, 50, 60, 70]"
    )
  })

  test("uses PROJECT_ADDRESSES_1 for early blocks", () => {
    let distributions: BigInt[] = []
    for (let i = 0; i < PROJECT_ADDRESSES_1.length; i++) {
      distributions.push(BigInt.fromI32((i + 1) * 100))
    }
    let event = createYieldDistributedEvent(
      BigInt.fromI32(1000),
      BigInt.fromI32(5000),
      distributions
    )
    // Default block number from newMockEvent() is 1, which is < 42089498
    // so it should use PROJECT_ADDRESSES_1

    handleYieldDistributed(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    // PROJECT_ADDRESSES_1 has 7 addresses
    let expectedAddresses: string[] = []
    for (let i = 0; i < PROJECT_ADDRESSES_1.length; i++) {
      expectedAddresses.push(Bytes.fromHexString(PROJECT_ADDRESSES_1[i]).toHexString())
    }
    assert.fieldEquals(
      "YieldDistributed",
      entityId,
      "projectAddresses",
      "[" + expectedAddresses.join(", ") + "]"
    )
  })

  test("uses PROJECT_ADDRESSES_2 for blocks after 15th distribution", () => {
    let distributions: BigInt[] = []
    for (let i = 0; i < PROJECT_ADDRESSES_2.length; i++) {
      distributions.push(BigInt.fromI32((i + 1) * 100))
    }
    let event = createYieldDistributedEvent(
      BigInt.fromI32(1000),
      BigInt.fromI32(5000),
      distributions
    )
    // Set block number to just after the 15th distribution block
    event.block.number = BigInt.fromI32(42089499)

    handleYieldDistributed(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    let expectedAddresses: string[] = []
    for (let i = 0; i < PROJECT_ADDRESSES_2.length; i++) {
      expectedAddresses.push(Bytes.fromHexString(PROJECT_ADDRESSES_2[i]).toHexString())
    }
    assert.fieldEquals(
      "YieldDistributed",
      entityId,
      "projectAddresses",
      "[" + expectedAddresses.join(", ") + "]"
    )
  })

  test("uses PROJECT_ADDRESSES_3 for blocks after 16th distribution", () => {
    let distributions: BigInt[] = []
    for (let i = 0; i < PROJECT_ADDRESSES_3.length; i++) {
      distributions.push(BigInt.fromI32((i + 1) * 100))
    }
    let event = createYieldDistributedEvent(
      BigInt.fromI32(1000),
      BigInt.fromI32(5000),
      distributions
    )
    // Set block number to after the 16th distribution block
    event.block.number = BigInt.fromI32(42622527)

    handleYieldDistributed(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    let expectedAddresses: string[] = []
    for (let i = 0; i < PROJECT_ADDRESSES_3.length; i++) {
      expectedAddresses.push(Bytes.fromHexString(PROJECT_ADDRESSES_3[i]).toHexString())
    }
    assert.fieldEquals(
      "YieldDistributed",
      entityId,
      "projectAddresses",
      "[" + expectedAddresses.join(", ") + "]"
    )
  })

  test("handles multiple events with unique ids", () => {
    let event1 = createYieldDistributedEvent(
      BigInt.fromI32(100),
      BigInt.fromI32(500),
      [BigInt.fromI32(10), BigInt.fromI32(20), BigInt.fromI32(30), BigInt.fromI32(40), BigInt.fromI32(50), BigInt.fromI32(60), BigInt.fromI32(70)]
    )
    let event2 = createYieldDistributedEvent(
      BigInt.fromI32(200),
      BigInt.fromI32(1000),
      [BigInt.fromI32(15), BigInt.fromI32(25), BigInt.fromI32(35), BigInt.fromI32(45), BigInt.fromI32(55), BigInt.fromI32(65), BigInt.fromI32(75)]
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

    // The handler converts Address[] to Bytes[] via Bytes.fromHexString(address.toHexString())
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

  test("handles multiple vote events", () => {
    let voter1 = Address.fromString("0x1111111111111111111111111111111111111111")
    let voter2 = Address.fromString("0x2222222222222222222222222222222222222222")
    let projects = [
      Address.fromString("0x5405e2D4D12AAdB57579E780458c9a1151b560F1")
    ]

    let event1 = createBreadHolderVotedEvent(voter1, [BigInt.fromI32(100)], projects)
    let event2 = createBreadHolderVotedEvent(voter2, [BigInt.fromI32(100)], projects)
    event2.logIndex = BigInt.fromI32(2)

    handleBreadHolderVoted(event1)
    handleBreadHolderVoted(event2)

    assert.entityCount("BreadHolderVoted", 2)
  })
})
