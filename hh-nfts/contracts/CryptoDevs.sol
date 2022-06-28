  // SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {

    // base for tokenURI
    string _baseTokenURI;

    // price to mint one Crypto Dev NFT
    uint256 public _price = 0.01 ether;
    

    // Pause is used in case of an emergency with the contract being
    bool public _paused;

    // Max number of CryptoDev NFTs to be minted
    uint256 public maxTokenIds = 20;

    // Total number of NFTs minted
    uint256 public tokenIds;

    // Whitelist contract
    IWhitelist whitelist;

    // tracking when pre-sale starts 
    bool public presaleStarted;

    // timestamp for when pre-sale ends
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paused");
        _;
    }

    constructor(string memory baseURI, address whitelistContract) ERC721("Crypto Devs", "CD") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    // starts presale for whitelisted addresses
    function startPresale() public onlyOwner {
        presaleStarted = true;
        
        // set presale ended to block.timestamp + 5 minutes
        presaleEnded = block.timestamp + 5 minutes;
    }

    // Allows users to mint 1 NFT per transaction during presale
    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
        require(whitelist.whitelistedAddresses(msg.sender),"You are not whitelisted");
        require(tokenIds < maxTokenIds, "Max supply of NFTs has ran out");
        require(msg.value >= _price, "Incorrect eth sent");
        tokenIds += 1;

        _safeMint(msg.sender, tokenIds);
    }

    // Allows users to mint 1 NFT per transaction after presale has ended

    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >= presaleEnded, "Presale has not yet ended");
        require(tokenIds < maxTokenIds, "Max supply of NFTs has ran out");
        require(msg.value >= _price, "Incorrect eth sent");

        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    // Overrider OZ's baseURI
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    // Pause the contract
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");

    }

    receive() external payable {}

    fallback() external payable {}



}