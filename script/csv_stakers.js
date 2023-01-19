const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args))
const { GRAPH_API_URL, RPC_URL, STAKING_CONTRACT } = require('./constants')
const { createClient } = require('@urql/core')
const ethers = require('ethers')
const fs = require('fs')

const client = createClient({
  url: GRAPH_API_URL,
  fetch
})

async function main () {
  const voteStreamId = 5
  const auroraDecimals = 18
  const voteDecimals = 18
  const provider = new ethers.providers.JsonRpcBatchProvider(
    RPC_URL
  )
  const staking = new ethers.Contract(
    STAKING_CONTRACT.ADDRESS,
    STAKING_CONTRACT.ABI,
    provider
  )
  const totalStaked = await staking.getTotalAmountOfStakedAurora()
  const totalShares = await staking.totalAuroraShares()
  console.log(
    `Total shares: ${totalShares}, total shares value: ${ethers.utils.formatUnits(
      totalStaked,
      auroraDecimals
    )} $AURORA`
  )
  const maxItems = 6000 // skip must be <= 5000
  const pageSize = 1000
  let itemsCount = 0
  const allStakers = []
  while (true) {
    const stakersQuery = `
      query {
        stakerBalances(
          first: ${pageSize},
          skip: ${itemsCount},
          orderBy: shares,
          orderDirection: desc,
          where: { amount_gt: ${ethers.utils.parseUnits('1.0', 18)} }
        ) {
          user
          amount
          shares
          streamShares
          withdrawnVote
          claimedVote
        }
      }
    `
    const { data, error } = await client.query(stakersQuery).toPromise()
    if (error) {
      console.error(error)
      return
    }
    const { stakerBalances } = data || {}
    const claimableVoteTokens = await Promise.all(
      stakerBalances.map(async ({ user }) =>
        staking.getStreamClaimableAmount(voteStreamId, user)
      )
    )
    const prettyStaker = stakerBalances.map((s, i) => ({
      user: s.user,
      auroraAmountStaked: ethers.utils.formatUnits(s.amount, auroraDecimals),
      sharesCount: s.shares,
      sharesAuroraValue: ethers.utils.formatUnits(
        totalStaked
          .mul(s.shares)
          .div(totalShares)
          .toString(),
        auroraDecimals
      ),
      streamSharesCount: s.streamShares,
      voteTokens: ethers.utils.formatUnits(
        claimableVoteTokens[i].add(s.claimedVote).add(s.withdrawnVote),
        voteDecimals
      )
    }))
    itemsCount += pageSize
    allStakers.push(...prettyStaker)
    if (itemsCount >= maxItems) break
  }

  const csvString = [
    [
      'Address',
      'Amount Staked ($AURORA)',
      'Shares Count',
      'Shares Value ($AURORA)',
      'Stream Shares Count',
      'VOTE Tokens'
    ],
    ...allStakers.map((s) => [
      s.user,
      s.auroraAmountStaked,
      s.sharesCount,
      s.sharesAuroraValue,
      s.streamSharesCount,
      s.voteTokens
    ])
  ]
    .map((e) => e.join(','))
    .join('\n')

  fs.writeFileSync('stakers.csv', csvString)
  console.log(`${allStakers.length} stakers have staked more than 1 $AURORA`)
  console.log('> stakers.csv')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
