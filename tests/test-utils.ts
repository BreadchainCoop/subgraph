import { newMockEvent } from "matchstick-as";
import { ethereum, Address, BigInt, Value, log } from "@graphprotocol/graph-ts";
import {
  Approval,
  Burned,
  ClaimedRewards,
  ClaimedYield,
  Minted,
  OwnershipTransferred,
  Transfer as TransferEvent,
} from "../generated/Contract/Contract";
import { Token } from "../generated/schema";
import { CONTRACT_ADDRESS } from "../src/constants";

export const TO_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
export const FROM_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

// export const Steve = {
//   address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
// };

// export const Dave = {
//   address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
// };

export const INITIAL_TIMESTAMP = 1690984985; // UTC string - Wed, 02 Aug 2023 14:03:05 GMT

export function createApprovalEvent(
  owner: Address,
  spender: Address,
  value: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent());

  approvalEvent.parameters = new Array();

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  );
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  );
  approvalEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  );

  return approvalEvent;
}

export function createBurnedEvent(receiver: Address, amount: BigInt): Burned {
  let burnedEvent = changetype<Burned>(newMockEvent());

  burnedEvent.parameters = new Array();

  burnedEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  );
  burnedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );

  return burnedEvent;
}

export function createClaimedRewardsEvent(
  rewardsList: Array<Address>,
  claimedAmounts: Array<BigInt>
): ClaimedRewards {
  let claimedRewardsEvent = changetype<ClaimedRewards>(newMockEvent());

  claimedRewardsEvent.parameters = new Array();

  claimedRewardsEvent.parameters.push(
    new ethereum.EventParam(
      "rewardsList",
      ethereum.Value.fromAddressArray(rewardsList)
    )
  );
  claimedRewardsEvent.parameters.push(
    new ethereum.EventParam(
      "claimedAmounts",
      ethereum.Value.fromUnsignedBigIntArray(claimedAmounts)
    )
  );

  return claimedRewardsEvent;
}

export function createClaimedYieldEvent(amount: BigInt): ClaimedYield {
  let claimedYieldEvent = changetype<ClaimedYield>(newMockEvent());

  claimedYieldEvent.parameters = new Array();

  claimedYieldEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );

  return claimedYieldEvent;
}

export function createMintedEvent(receiver: Address, amount: BigInt): Minted {
  let mintedEvent = changetype<Minted>(newMockEvent());

  mintedEvent.parameters = new Array();

  mintedEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  );
  mintedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );

  return mintedEvent;
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  );

  ownershipTransferredEvent.parameters = new Array();

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  );
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  );

  return ownershipTransferredEvent;
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt
): TransferEvent {
  let transferEvent = changetype<TransferEvent>(newMockEvent());

  /*
    public address: Address,
    public logIndex: BigInt,
    public transactionLogIndex: BigInt,
    public logType: string | null,
    public block: Block,
    public transaction: Transaction,
    public parameters: Array<EventParam>,
    public receipt: TransactionReceipt | null,
  */

  transferEvent.parameters = new Array();

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  );
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  );
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  );
  // transferEvent.parameters.push(
  //   new ethereum.EventParam(
  //     "address",
  //     ethereum.Value.fromAddress(Address.fromString(CONTRACT_ADDRESS))
  //   )
  // );

  transferEvent.address = Address.fromString(CONTRACT_ADDRESS);
  transferEvent.block.timestamp = BigInt.fromI64(INITIAL_TIMESTAMP);

  return transferEvent;
}

export function createNewTransferEvent(
  id: i32,
  to: string,
  from: string,
  value: string,
  address: Address
): TransferEvent {
  let newTransferEvent = changetype<TransferEvent>(newMockEvent());

  // newTransferEvent.params = new Array();

  let idParam = new ethereum.EventParam("id", ethereum.Value.fromI32(id));
  let toParam = new ethereum.EventParam(
    "to",
    ethereum.Value.fromAddress(Address.fromString(to))
  );
  let fromParam = new ethereum.EventParam(
    "from",
    ethereum.Value.fromAddress(Address.fromString(from))
  );
  let valueParam = new ethereum.EventParam(
    "value",
    ethereum.Value.fromAddress(Address.fromString(value))
  );
  let addressParam = new ethereum.EventParam(
    "address",
    ethereum.Value.fromAddress(address)
  );

  // to
  // from
  // Value
  // public address: Address,
  // public logIndex: BigInt,
  // public transactionLogIndex: BigInt,
  // public logType: string | null,
  // public block: Block,
  // public transaction: Transaction,
  // public parameters: Array<EventParam>,
  // public receipt: TransactionReceipt | null,

  newTransferEvent.parameters.push(idParam);
  newTransferEvent.parameters.push(toParam);
  newTransferEvent.parameters.push(fromParam);
  newTransferEvent.parameters.push(valueParam);
  newTransferEvent.parameters.push(addressParam);

  return newTransferEvent;
}
