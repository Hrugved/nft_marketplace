const { ethers, network } = require("hardhat")
const { moveBlocks, sleep } = require("./move-block")

const PRICE = ethers.utils.parseEther('0.1')

mintAndList = async () => {
  const nftMarketplace = await ethers.getContract("NftMarketplace")
  const basicNft = await ethers.getContract("BasicNft")
  console.log("Minting...")
  const mintTx = await basicNft.mintNft()
  const mintTxReceipt = await mintTx.wait(1)
  const tokenId = mintTxReceipt.events[0].args.tokenId
  console.log("Approving Nft...")
  const approvalTx = await basicNft.approve(nftMarketplace.address, tokenId)
  await approvalTx.wait(1)
  console.log("Listing NFT...")
  const tx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
  await tx.wait(1)
  if(network.config.chainId==31337) {
    await moveBlocks(1,(sleepAmount=1000))
  }
}

mintAndList()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
