const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-block")

const PRICE = ethers.utils.parseEther("0.1")

mint = async () => {
  const nftMarketplace = await ethers.getContract("NftMarketplace")
  const basicNft = await ethers.getContract("BasicNft")
  console.log("Minting...")
  const mintTx = await basicNft.mintNft()
  const mintTxReceipt = await mintTx.wait(1)
  const tokenId = mintTxReceipt.events[0].args.tokenId
  console.log(`TokenID: ${tokenId}`)
  console.log(`NFT address: ${basicNft.address}`)
  if (network.config.chainId == 31337) {
    await moveBlocks(1, (sleepAmount = 1000))
  }
}

mint()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
