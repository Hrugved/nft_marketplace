const { ethers, network } = require("hardhat")
const fs = require("fs")

const frontEndContractsFile = "../nft_marketplace_app-moralis/constants/networkMapping.json"
const frontEndAbiLocation = "../nft_marketplace_app-moralis/constants/"

module.exports = async function () {
  if (process.env.UPDATE_FRONT_END) {
    console.log("updating front end...")
    await updateContractAddresses()
    await updateAbi()
  }
}

async function updateAbi() {
  const nftMarketplace = await ethers.getContract('NftMarketplace')
  fs.writeFileSync(`${frontEndAbiLocation}NftMarketplace.json`,nftMarketplace.interface.format(ethers.utils.FormatTypes.json))

  const basicNft = await ethers.getContract('BasicNft')
  fs.writeFileSync(`${frontEndAbiLocation}BasicNft.json`,basicNft.interface.format(ethers.utils.FormatTypes.json))
}

async function updateContractAddresses() {
  const nftMarketplace = await ethers.getContract("NftMarketplace")
  const chainId = network.config.chainId.toString()
  const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
  if (chainId in contractAddresses) {
    if (!contractAddresses[chainId]["NftMarketplace"].includes(nftMarketplace.address)) {
      contractAddresses[chainId]["NftMarketplace"] = nftMarketplace.address
    }
  } else {
    contractAddresses[chainId] = { NftMarketplace: [nftMarketplace.address] }
  }
  fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

module.exports.tags = ["all", "frontend"]
