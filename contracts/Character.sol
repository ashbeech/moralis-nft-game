// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract Character is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    Counters.Counter private _tokenIDS;

    bool public paused = false;
    bool public revealed = false;
    uint256 public maxSupply = 10000;
    uint256 public maxMintAmountPerTx = 1;
    uint256 public nftPerAddressLimit = 100;

    // Mapping char to token count
    mapping(uint256 => CharData) public _tokenDetails; // 0 -> however many get created
    mapping(address => uint256) public addressMintedBalance;

    struct CharData {
        uint256 id;
        uint8 damage;
        uint8 power;
        uint256 lastMeal;
        uint256 endurance;
        string tokenURI;
    }

    constructor() ERC721("Character", "CHAR") {}

    function getTokenDetails(uint256 _id)
        public
        view
        returns (CharData memory)
    {
        return _tokenDetails[_id];
    }

    function feed(uint256 _id) public {
        CharData storage char = _tokenDetails[_id];
        require(char.lastMeal + char.endurance > block.timestamp); // must not have died of starvation; Hashtro is still alive
        _tokenDetails[_id].lastMeal = block.timestamp; // update when hashtro character was last fed according to block time
    }

    function getTokenCirculations() public view returns (uint256) {
        return _tokenIDS.current();
    }

    modifier mintCompliance(uint256 _mintAmount) {
        require(!paused, "The contract is paused!");

        //require(msg.value > 0);
        require(msg.value <= msg.sender.balance, "Insufficient balance.");

        // condition: minting at least 1 or more
        require(
            _mintAmount > 0 && _mintAmount <= maxMintAmountPerTx,
            "Invalid mint amount!"
        );

        // condition: total minted + this potential tx is under maxsupply
        require(
            _tokenIDS.current() + _mintAmount <= maxSupply,
            "Max supply exceeded!"
        );

        uint256 ownerMintedCount = addressMintedBalance[msg.sender];
        // condition: minting limit per address
        require(
            ownerMintedCount + _mintAmount <= nftPerAddressLimit,
            "max NFT per address exceeded"
        );
        _;
    }

    function mintToken(
        uint256 _mintAmount,
        uint8 _damage,
        uint8 _power,
        uint256 _endurance,
        string memory _tokenURI
    ) public payable onlyOwner mintCompliance(_mintAmount) returns (uint256) {
        _tokenIDS.increment();

        uint256 newCharID = _tokenIDS.current();
        _tokenDetails[newCharID] = CharData(
            newCharID,
            _damage,
            _power,
            block.timestamp,
            _endurance,
            _tokenURI
        );

        for (uint256 i = 1; i <= _mintAmount; i++) {
            addressMintedBalance[msg.sender]++;
        }

        _safeMint(msg.sender, newCharID);
        _setTokenURI(newCharID, _tokenURI);

        return newCharID;
    }
}
