const { ethers, network } = require("hardhat")
const { moveBlocks, sleep } = require("../utils/move-block")

const TOKEN_ID = 5

buyItem = async () => {
  const nftMarketplace = await ethers.getContract("NftMarketplace")
  const basicNft = await ethers.getContract("BasicNft")
  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
  const price = listing.price.toString()
  const tx = await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: price })
  await tx.wait(1)
  console.log("Bought NFT!")
  if (network.config.chainId == "31337") {
    await moveBlocks(2, (sleepAmount = 1000))
  }
}

buyItem()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
