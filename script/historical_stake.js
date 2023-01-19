const ethers = require('ethers')
const { RPC_URL, STAKING_CONTRACT } = require('./constants')

async function main () {
  const provider = new ethers.providers.JsonRpcProvider(
    RPC_URL
  )
  // https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html
  // `totalAmountOfStakedAurora` is stored in slot 252 (C3-linearization)
  const storagePosition = ethers.utils.hexlify(252)
  const block = 75575610 // from contract deployment block 65575610 to "latest"
  const totalAmountOfStakedAurora = await provider.getStorageAt(
    STAKING_CONTRACT.ADDRESS,
    storagePosition,
    block
  )
  const totalAuroraShares = await provider.getStorageAt(
    STAKING_CONTRACT.ADDRESS,
    ethers.utils.hexlify(254),
    block
  )
  const totalStreamShares = await provider.getStorageAt(
    STAKING_CONTRACT.ADDRESS,
    ethers.utils.hexlify(255),
    block
  )
  console.log(
    `Total $AURORA staked at block ${block}: ${ethers.utils.formatUnits(
      totalAmountOfStakedAurora,
      18
    )}`
  )
  console.log(
    `Total shares at block ${block}: ${ethers.BigNumber.from(
      totalAuroraShares
    ).toString()}`
  )
  console.log(
    `Total stream shares at block ${block}: ${ethers.BigNumber.from(
      totalStreamShares
    ).toString()}`
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
