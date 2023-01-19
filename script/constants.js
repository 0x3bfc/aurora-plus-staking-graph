const STAKING_CONTRACT = {
  ABI: [
    'function getTotalAmountOfStakedAurora() view returns (uint)',
    'function totalAuroraShares() view returns (uint)',
    'function getStreamClaimableAmount(uint streamId, address account) view returns (uint)'
  ],
  ADDRESS: '0xccc2b1aD21666A5847A804a73a41F904C4a4A0Ec'
}

const GRAPH_API_URL = 'https://api.thegraph.com/subgraphs/name/paouvrard/aurora-plus-staking'
const RPC_URL = 'https://mainnet.aurora.dev'
const STREAMS_COUNT = 5

module.exports = { STAKING_CONTRACT, GRAPH_API_URL, RPC_URL, STREAMS_COUNT }
