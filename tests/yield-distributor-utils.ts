import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  YieldDistributed,
  BreadHolderVoted,
  ProjectAdded,
  ProjectRemoved
} from "../generated/YieldDistributor/YieldDistributor"

export function createYieldDistributedEvent(
  yieldAmount: BigInt,
  totalVotes: BigInt,
  projectDistributions: BigInt[]
): YieldDistributed {
  let event = changetype<YieldDistributed>(newMockEvent())

  event.parameters = new Array()

  event.parameters.push(
    new ethereum.EventParam(
      "yield_",
      ethereum.Value.fromUnsignedBigInt(yieldAmount)
    )
  )
  event.parameters.push(
    new ethereum.EventParam(
      "totalVotes",
      ethereum.Value.fromUnsignedBigInt(totalVotes)
    )
  )
  event.parameters.push(
    new ethereum.EventParam(
      "projectDistributions",
      ethereum.Value.fromUnsignedBigIntArray(projectDistributions)
    )
  )

  return event
}

export function createBreadHolderVotedEvent(
  account: Address,
  points: BigInt[],
  projects: Address[]
): BreadHolderVoted {
  let event = changetype<BreadHolderVoted>(newMockEvent())

  event.parameters = new Array()

  event.parameters.push(
    new ethereum.EventParam(
      "account",
      ethereum.Value.fromAddress(account)
    )
  )
  event.parameters.push(
    new ethereum.EventParam(
      "points",
      ethereum.Value.fromUnsignedBigIntArray(points)
    )
  )
  event.parameters.push(
    new ethereum.EventParam(
      "projects",
      ethereum.Value.fromAddressArray(projects)
    )
  )

  return event
}

export function createProjectAddedEvent(project: Address): ProjectAdded {
  let event = changetype<ProjectAdded>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("project", ethereum.Value.fromAddress(project))
  )

  return event
}

export function createProjectRemovedEvent(project: Address): ProjectRemoved {
  let event = changetype<ProjectRemoved>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("project", ethereum.Value.fromAddress(project))
  )

  return event
}
