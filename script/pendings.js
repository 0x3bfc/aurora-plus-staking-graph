const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args))
const { GRAPH_API_URL, STREAMS_COUNT } = require('./constants')
const { createClient } = require('@urql/core')
const ethers = require('ethers')
const fs = require('fs')

const client = createClient({
  url: GRAPH_API_URL,
  fetch
})

async function main () {
  const args = process.argv
  let streamId = 0
  if (!isNaN(args[2]) && args[2] <= STREAMS_COUNT) {
    streamId = args[2]
    console.log(`Calculating total pending withdrawl for stream ${streamId}`)
  } else {
    console.error('Invalid stream Id! Valid stream Ids: [0 - 5]')
    return
  }
  const auroraDecimals = 18
  const maxItems = 6000 // skip must be <= 5000
  const pageSize = 1000
  let itemsCount = 0
  const allStakers = []
  while (true) {
    const pendingsQuery = `
    query {
        pendings(
            first: ${pageSize},
            skip: ${itemsCount},
            orderedBy: amount,
            orderDirection: desc,
            where: { streamId: ${streamId}, amount_gt: ${ethers.utils.parseUnits('1.0', 18)}}
            ) {
            user
            streamId,
            amount
            }
    }
    `
    const { data, error } = await client.query(pendingsQuery).toPromise()
    if (error) {
      console.error(error)
      return
    }
    const { pendings } = data || {}
    const prettyStaker = pendings.map((p) => ({
      user: p.user,
      stream: p.streamId,
      auroraPending: Math.floor(ethers.utils.formatUnits(p.amount, auroraDecimals))
    }))
    itemsCount += pageSize
    allStakers.push(...prettyStaker)
    if (itemsCount >= maxItems) break
  }
  const totalStreamPending = allStakers
    .map(p => p.auroraPending)
    .reduce((total, a) => total + a)

  console.log(`total pending amount: ${totalStreamPending}`)

  const csvString = [
    [
      'User Address',
      'Stream Id',
      'Aurora Pending Rewards'
    ],
    ...allStakers.map((s) => [
      s.user,
      s.stream,
      s.auroraPending
    ])
  ]
    .map((e) => e.join(','))
    .join('\n')
  const currentTime = new Date(Math.floor(Date.now() / 1000) * 1000)
    .toLocaleString()
    .replace(' ', '_')
    .replace('/', '_')
    .replace('/', '_')
    .replace(',', '')
    .replace(':', '_')
  const fileName = `pendings_streamId_${streamId}_at_${currentTime}.csv`
  fs.writeFileSync(fileName, csvString)
  console.log(`> ${fileName}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
