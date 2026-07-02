import {
  assert,
  describe,
  test,
  clearStore,
  afterEach,
  createMockedFunction
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts"
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
import {
  PROJECT_ADDRESSES_1,
  PROJECT_ADDRESSES_2,
  PROJECT_ADDRESSES_3
} from "../src/constants"

// Default mock event address used by newMockEvent()
const MOCK_ADDRESS = "0xa16081f360e3847006db660bae1c6d1b2e17ec2a"

// Mock the contract's getCurrentVotingDistribution() -> (address[], uint256[]).
// In matchstick an unmocked try_ call ERRORS (it does not auto-revert), so every
// test that drives handleYieldDistributed must set this up.
function mockVotingDistribution(addresses: Address[]): void {
  let votes: BigInt[] = []
  for (let i = 0; i < addresses.length; i++) {
    votes.push(BigInt.fromI32(1))
  }
  createMockedFunction(
    Address.fromString(MOCK_ADDRESS),
    "getCurrentVotingDistribution",
    "getCurrentVotingDistribution():(address[],uint256[])"
  ).returns([
    ethereum.Value.fromAddressArray(addresses),
    ethereum.Value.fromUnsignedBigIntArray(votes)
  ])
}

function mockVotingDistributionReverts(): void {
  createMockedFunction(
    Address.fromString(MOCK_ADDRESS),
    "getCurrentVotingDistribution",
    "getCurrentVotingDistribution():(address[],uint256[])"
  ).reverts()
}

function sevenAddresses(): Address[] {
  return [
    Address.fromString("0x0000000000000000000000000000000000000001"),
    Address.fromString("0x0000000000000000000000000000000000000002"),
    Address.fromString("0x0000000000000000000000000000000000000003"),
    Address.fromString("0x0000000000000000000000000000000000000004"),
    Address.fromString("0x0000000000000000000000000000000000000005"),
    Address.fromString("0x0000000000000000000000000000000000000006"),
    Address.fromString("0x0000000000000000000000000000000000000007")
  ]
}

function expectedBytesList(addresses: Address[]): string {
  let out: string[] = []
  for (let i = 0; i < addresses.length; i++) {
    out.push(Bytes.fromHexString(addresses[i].toHexString()).toHexString())
  }
  return "[" + out.join(", ") + "]"
}

function expectedBytesListFromStrings(addresses: string[]): string {
  let out: string[] = []
  for (let i = 0; i < addresses.length; i++) {
    out.push(Bytes.fromHexString(addresses[i]).toHexString())
  }
  return "[" + out.join(", ") + "]"
}

describe("handleYieldDistributed", () => {
  afterEach(() => {
    clearStore()
  })

  test("creates entity with correct fields", () => {
    mockVotingDistribution(sevenAddresses())
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
    mockVotingDistribution(sevenAddresses())
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
    mockVotingDistribution(sevenAddresses())
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

  test("maps projectAddresses from the contract getCurrentVotingDistribution", () => {
    let addresses = [
      Address.fromString("0x00000000000000000000000000000000000000aa"),
      Address.fromString("0x00000000000000000000000000000000000000bb"),
      Address.fromString("0x00000000000000000000000000000000000000cc")
    ]
    mockVotingDistribution(addresses)
    let event = createYieldDistributedEvent(
      BigInt.fromI32(1000),
      BigInt.fromI32(5000),
      [BigInt.fromI32(100), BigInt.fromI32(200), BigInt.fromI32(300)]
    )

    handleYieldDistributed(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    assert.fieldEquals(
      "YieldDistributed",
      entityId,
      "projectAddresses",
      expectedBytesList(addresses)
    )
  })

  test("seeds the Project registry as active from the distribution", () => {
    let addresses = [
      Address.fromString("0x00000000000000000000000000000000000000aa"),
      Address.fromString("0x00000000000000000000000000000000000000bb")
    ]
    mockVotingDistribution(addresses)
    let event = createYieldDistributedEvent(
      BigInt.fromI32(1),
      BigInt.fromI32(1),
      [BigInt.fromI32(1), BigInt.fromI32(2)]
    )

    handleYieldDistributed(event)

    assert.entityCount("Project", 2)
    assert.fieldEquals("Project", addresses[0].toHexString(), "active", "true")
    assert.fieldEquals("Project", addresses[1].toHexString(), "active", "true")
  })

  test("falls back to PROJECT_ADDRESSES_1 for early blocks when the view reverts", () => {
    mockVotingDistributionReverts()
    let distributions: BigInt[] = []
    for (let i = 0; i < PROJECT_ADDRESSES_1.length; i++) {
      distributions.push(BigInt.fromI32((i + 1) * 100))
    }
    let event = createYieldDistributedEvent(
      BigInt.fromI32(1000),
      BigInt.fromI32(5000),
      distributions
    )
    // Default block number from newMockEvent() is 1 (< 42089498) -> PROJECT_ADDRESSES_1

    handleYieldDistributed(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    assert.fieldEquals(
      "YieldDistributed",
      entityId,
      "projectAddresses",
      expectedBytesListFromStrings(PROJECT_ADDRESSES_1)
    )
  })

  test("falls back to PROJECT_ADDRESSES_2 after the 15th distribution when the view reverts", () => {
    mockVotingDistributionReverts()
    let distributions: BigInt[] = []
    for (let i = 0; i < PROJECT_ADDRESSES_2.length; i++) {
      distributions.push(BigInt.fromI32((i + 1) * 100))
    }
    let event = createYieldDistributedEvent(
      BigInt.fromI32(1000),
      BigInt.fromI32(5000),
      distributions
    )
    event.block.number = BigInt.fromI32(42089499)

    handleYieldDistributed(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    assert.fieldEquals(
      "YieldDistributed",
      entityId,
      "projectAddresses",
      expectedBytesListFromStrings(PROJECT_ADDRESSES_2)
    )
  })

  test("falls back to PROJECT_ADDRESSES_3 after the 16th distribution when the view reverts", () => {
    mockVotingDistributionReverts()
    let distributions: BigInt[] = []
    for (let i = 0; i < PROJECT_ADDRESSES_3.length; i++) {
      distributions.push(BigInt.fromI32((i + 1) * 100))
    }
    let event = createYieldDistributedEvent(
      BigInt.fromI32(1000),
      BigInt.fromI32(5000),
      distributions
    )
    event.block.number = BigInt.fromI32(42622527)

    handleYieldDistributed(event)

    let entityId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

    assert.fieldEquals(
      "YieldDistributed",
      entityId,
      "projectAddresses",
      expectedBytesListFromStrings(PROJECT_ADDRESSES_3)
    )
  })

  test("handles multiple events with unique ids", () => {
    mockVotingDistribution(sevenAddresses())
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
    event2.logIndex = BigInt.fromI32(2)

    handleYieldDistributed(event1)
    handleYieldDistributed(event2)

    assert.entityCount("YieldDistributed", 2)
  })
})

describe("Project registry", () => {
  afterEach(() => {
    clearStore()
  })

  test("handleProjectAdded creates an active project", () => {
    let project = Address.fromString("0x00000000000000000000000000000000000000dd")
    handleProjectAdded(createProjectAddedEvent(project))
    assert.entityCount("Project", 1)
    assert.fieldEquals("Project", project.toHexString(), "active", "true")
  })

  test("handleProjectRemoved marks a project inactive", () => {
    let project = Address.fromString("0x00000000000000000000000000000000000000ee")
    handleProjectAdded(createProjectAddedEvent(project))
    handleProjectRemoved(createProjectRemovedEvent(project))
    assert.entityCount("Project", 1)
    assert.fieldEquals("Project", project.toHexString(), "active", "false")
  })

  test("handleProjectRemoved records a removal even if never added", () => {
    let project = Address.fromString("0x00000000000000000000000000000000000000ff")
    handleProjectRemoved(createProjectRemovedEvent(project))
    assert.entityCount("Project", 1)
    assert.fieldEquals("Project", project.toHexString(), "active", "false")
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
