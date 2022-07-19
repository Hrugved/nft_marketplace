//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"

error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__NotApprovedForMarketplace();
error NftMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotOwner();
error NftMarketplace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);

contract NftMarketplace is ReentrancyGuard  {
  struct Listing {
    uint256 price;
    address seller;
  }

  event ItemListed(
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
  );

  event ItemBought (
    address indexed buyer,
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
  );

  // NFT contract address => NFT TokenID => Listing
  mapping(address => mapping(uint256 => Listing)) private s_listings;
  // Seller address => amount earned
  mapping(address => uint256) private s_proceeds;

  modifier notListed(address nftAddress, uint256 tokenId, address owner) {
    Listing memory listing = s_listings[nftAddress][tokenId];
    if(listing.price>0) {
      revert NftMarketplace__AlreadyListed(nftAddress,tokenId);
    }
    _;
  }

  modifier isOwner(address nftAddress,uint256 tokenId,address spender) {
    IERC721 nft = IERC721(nftAddress);
    address owner = nft.ownerOf(tokenId);
    if(spender!=owner) {
      revert NftMarketplace__NotOwner();
    }
    _;
  }

  modifier isListed(address nftAddress, uint256 tokenId) {
    Listing memory listing = s_listings[nftAddress][tokenId];
    if(listing.price<=0) {
      revert NftMarketplace__NotListed(nftAddress,tokenId);
    }
    _;
  }

  /*
   * @notice Method used by users to list their NFT on the marketplace
   * @param nftAddress: Address of the NFT
   * @param tokenId: The Token ID of the NFT
   * @param price: sale price of the listed NFT
  */
  function listItem(
    address nftAddress,
    uint256 tokenId,
    uint256 price
  ) external notListed(nftAddress,tokenId,msg.sender) isOwner(nftAddress,tokenId,msg.sender) {
    if (price <= 0) {
      revert NftMarketplace__PriceMustBeAboveZero();
    }
    IERC721 nft = IERC721(nftAddress);
    if (nft.getApproved(tokenId) != address(this)) {
      revert NftMarketplace__NotApprovedForMarketplace();
    }
    s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
    emit ItemListed(msg.sender, nftAddress, tokenId, price);
  }

  /*
   * @notice Method used by users to list their NFT on the marketplace
   * @param nftAddress: Address of the NFT
   * @param tokenId: The Token ID of the NFT
   * @param price: sale price of the listed NFT
  */
  function buyItem(
    address nftAddress,
    uint256 tokenId
  ) external payable nonReentrant isListed(nftAddress,tokenId) {
    Listing memory listedItem = s_listings[nftAddress][tokenId];
    if(msg.value<listedItem.price) {
      revert NftMarketplace__PriceNotMet(nftAddress, tokenId, listedItem.price);
    }
    s_proceeds[listedItem.seller] = s_proceeds[listedItem.seller]+msg.value;
    delete (s_listings[nftAddress][tokenId]);
    IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);
    emit ItemBought(msg.sender,nftAddress,tokenId,listedItem.price);
  }



}
