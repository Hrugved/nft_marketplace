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
        it("prohibits un-listed item", async () => {
          await expect(
            nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith(`NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`)
        })
        it("prohibits non-owners", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          await basicNft.approve(player.address, TOKEN_ID)
          await expect(
            nftMarketplace.connect(player).updateListing(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__NotOwner")
        })
        it("succesful update emits event and updates state correctly", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          const newPrice = ethers.utils.parseEther("0.2")
          expect(await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)).to.emit(
            `ItemListed(${deployer.address}, ${basicNft.address}, ${TOKEN_ID}, ${newPrice})`
          )
          const { price, seller } = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
          expect(price).to.equal(newPrice)
          expect(seller).to.equal(deployer.address)
        })
      })

      describe("cancelListing", () => {
        it("prohibits un-listed item", async () => {
          await expect(nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.be.revertedWith(
            `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
          )
        })
        it("prohibits non-owners", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          await basicNft.approve(player.address, TOKEN_ID)
          await expect(
            nftMarketplace.connect(player).cancelListing(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("NftMarketplace__NotOwner")
        })
        it("succesful cancel emits event and updates state correctly", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          expect(await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
            `ItemCancelled(${deployer.address}, ${basicNft.address}, ${TOKEN_ID})`
          )
          const { price, seller } = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
          expect(price).to.equal(0)
        })
      })

      describe("buyItem", () => {
        it("prohibits un-listed item", async () => {
          await expect(
            nftMarketplace.connect(player).buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
          ).to.be.revertedWith(`NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`)
        })
        it("prohibits lesser buy price", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          const buyPrice = ethers.utils.parseEther("0.09")
          await expect(
            nftMarketplace.connect(player).buyItem(basicNft.address, TOKEN_ID, { value: buyPrice })
          ).to.be.revertedWith(
            `NftMarketplace__PriceNotMet("${basicNft.address}", ${TOKEN_ID}, ${PRICE})`
          )
        })
        it("successful buy transfers ownership, emits event and update state correctly", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          // emits event
          expect(
            await nftMarketplace
              .connect(player)
              .buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
          ).to.emit(`ItemBought(${player.address}, ${basicNft.address}, ${TOKEN_ID}, ${PRICE})`)
          // unregistered from marketplace
          const { price, seller } = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
          expect(price).to.equal(0)
          // seller get proceeds
          expect(await nftMarketplace.getProceeds(deployer.address)).to.equal(PRICE)
          // ownership is transfered
          expect(await basicNft.ownerOf(TOKEN_ID)).to.equal(player.address)
        })
      })

      describe("withdrawProceeds", () => {
        it("prohibits for no proceeds", async () => {
          await expect(nftMarketplace.withdrawProceeds()).to.revertedWith(
            "NftMarketplace__NoProceeds"
          )
        })
        it("successful withdraw updates state and send money to withdrawer", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          await nftMarketplace.connect(player).buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
          nftMarketplace = await nftMarketplace.connect(deployer)
          const oldBalance = await deployer.getBalance()
          const txResponse = await nftMarketplace.withdrawProceeds()
          const { gasUsed, effectiveGasPrice } = await txResponse.wait(1)
          const newBalance = await deployer.getBalance()
          expect(oldBalance.add(PRICE)).to.equal(newBalance.add(gasUsed.mul(effectiveGasPrice)))
        })
      })
    })
