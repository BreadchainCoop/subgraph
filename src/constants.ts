// Project wallet addresses configurations
// In the event a project is added or removed from the YieldDistributor contract,
//   a new configuration should be added here to ensure the correct project addresses are used

// Block numbers for yield distributions can be found from https://gnosisscan.io/address/0xeE95A62b749d8a2520E0128D9b3aCa241269024b
const fifteenthDistributionBlock = 42089498;
const sixteenthDistributionBlock = 42622526;

// The first part of what is returned from the following provides the list of ordered addresses in the YieldDistributor contract
// cast call 0xeE95A62b749d8a2520E0128D9b3aCa241269024b \
//   "getCurrentVotingDistribution()(address[],uint256[])" \
//   --rpc-url https://rpc.gnosis.gateway.fm

const laborDao = "0x7E1367998e1fe8Fab8f0bbF41e97cD6E0C891B64";
const symbiota = "0x5405e2D4D12AAdB57579E780458c9a1151b560F1";
const cryptoCommonsAssociation = "0x5c22B3F03b3d8FFf56C9B2e90151512Cb3F3dE0F";
const citizenWallet = "0xA232F16aB37C9a646f91Ba901E92Ed1Ba4B7b544"; // 5
const breadCore = "0x918dEf5d593F46735f74F9E2B280Fe51AF3A99ad";
const breadTreasury = "0x6A148b997e6651237F2fCfc9E30330a6480519f0";
const refiDao = "0x68060388C7D97B4bF779a2Ead46c86e5588F073f"; // 4
const gardens = "0x1bd2212c9aa332d22d61a0be6bcc55b2a1de6c63";
const regenCoordination = "0xFCb81c1B0e0D4FEa01e5A0fbf0aebb91e78A67E1";

// All project address arrays
export const PROJECT_ADDRESSES_1: string[] = [
  laborDao,
  symbiota,
  cryptoCommonsAssociation,
  breadTreasury,
  breadCore,
  refiDao,
  citizenWallet,
];

export const PROJECT_ADDRESSES_2: string[] = [
  symbiota,
  cryptoCommonsAssociation,
  breadTreasury,
  breadCore,
  refiDao,
  citizenWallet,
];

export const PROJECT_ADDRESSES_3: string[] = [
  symbiota,
  cryptoCommonsAssociation,
  breadTreasury,
  breadCore,
  citizenWallet,
  regenCoordination,
  gardens,
];

// Future configurations (uncomment and modify when needed)
// export const PROJECT_ADDRESSES_3: string[] = [
//   "0x...", // Add new addresses here
//   "0x...",
// ];

// Function to get project addresses for a specific block number
export function getProjectAddressesForBlock(blockNumber: i32): string[] {
  // Find the appropriate configuration based on block number
  // Add more conditions here for future configurations
  // if (blockNumber >= 99999999) {
  //   return PROJECT_ADDRESSES_3;
  // }
  if (blockNumber > sixteenthDistributionBlock) {
    return PROJECT_ADDRESSES_3;
  }
  if (blockNumber > fifteenthDistributionBlock) {
    return PROJECT_ADDRESSES_2;
  }

  // Default to configuration 1
  return PROJECT_ADDRESSES_1;
}
