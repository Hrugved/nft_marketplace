const { ethers, network } = require("hardhat")
const { moveBlocks, sleep } = require("../utils/move-block")

const PRICE = ethers.utils.parseEther("0.1")

const TOKEN_ID = 6

cancelItem = async () => {
  const nftMarketplace = await ethers.getContract("NftMarketplace")
  const basicNft = await ethers.getContract("BasicNft")
  const tx = await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
  await tx.wait(1)
  console.log("NFT Cancelled!")
  if (network.config.chainId == "31337") {
    await moveBlocks(2, (sleepAmount = 1000))
  }
}

cancelItem()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
