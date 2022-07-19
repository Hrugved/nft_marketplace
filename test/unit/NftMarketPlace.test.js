const { assert, expect } = require("chai")
const { network, ethers, deployments, getNamedAccounts } = require("hardhat")
const { devChains } = require("../../helper-hardhat-config")

!devChains.includes(network.name)
  ? describe.skip()
  : describe("NFT marketplace unit tests", () => {
      let basicNft, deployer, player, nftMarketplace
      const PRICE = ethers.utils.parseEther("0.1")
      const TOKEN_ID = 0
      beforeEach(async () => {
        deployer = (await ethers.getSigners())[0]
        player = (await ethers.getSigners())[1]
        await deployments.fixture(["all"])
        nftMarketplace = await ethers.getContract("NftMarketplace")
        basicNft = await ethers.getContract("BasicNft")
        await basicNft.mintNft()
        await basicNft.approve(nftMarketplace.address, TOKEN_ID)
      })

      describe("listItem", () => {
        it("prohibits duplicate listing of items", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith(`NftMarketplace__AlreadyListed("${basicNft.address}", ${TOKEN_ID})`)
        })
        it("prohibits non-owners", async () => {
          await basicNft.approve(player.address, TOKEN_ID)
          await expect(
            nftMarketplace.connect(player).listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__NotOwner")
        })
        it("prohibits zero price", async () => {
          await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)).to.be.revertedWith(
            "NftMarketplace__PriceMustBeAboveZero"
          )
        })
        it("prohibits un-approved items", async () => {
          await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__NotApprovedForMarketplace")
        })
        it("succesful listing emits event and updates state correctly", async () => {
          expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
            `ItemListed(${deployer.address}, ${basicNft.address}, ${TOKEN_ID}, ${PRICE})`
          )
          const { price, seller } = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
          expect(price).to.equal(PRICE)
          expect(seller).to.equal(deployer.address)
        })
      })

      describe("updateListing", () => {
        //it("", async () => {})
        //it("", async () => {})
        //it("", async () => {})
        //it("", async () => {})
      })

      describe("cancelListing", () => {
        //it("", async () => {})
        //it("", async () => {})
        //it("", async () => {})
        //it("", async () => {})
      })

      describe("buyItem", () => {
        //it("", async () => {})
        //it("", async () => {})
        //it("", async () => {})
        //it("", async () => {})
      })

      describe("withdrawProceeds", () => {
        //it("", async () => {})
        //it("", async () => {})
        //it("", async () => {})
        //it("", async () => {})
      })
    })
