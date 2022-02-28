// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0; // <-- version directive

// imports
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Character is ERC721URIStorage, Ownable {
  using Counters for Counters.Counter;
  using SafeMath for uint256;

  Counters.Counter private _tokenIds;

  // these are all optional params we might create for our characters
  uint256 fee = 0.00 ether; // <-- any fees we want to change on txs
  uint256 public constant maxSupply = 10000; // <-- max supply of tokens
  uint256 public maxMintAmountPerTx = 1; // <-- max mints per tx
  uint256 public perAddressLimit = 100; // <-- max
  string public notRevealedUri = "ipfs://INSERT_YOUR_CID/character-hidden.json"; // <-- link to metadata for e.g. hidden opensea listing of token
  bool public paused = false; // <-- stop interaction witb contract
  bool public revealed = true; // <-- is the collection revealled yet?
  address public contractOwner; // <-- game dev/studio wallet address

  // charcter traits (on-chain)
  // id, dna, level, rarity, evac, tokenURI
  struct Char {
    uint256 id;
    uint256 dna;
    uint8 level;
    uint8 rarity;
    uint256 evac;
    string tokenURI;
  }
  // mapping char to token count
  Char[maxSupply] public _tokenDetails;
  // set-up event for emitting once character minted to read out values
  event NewChar(address indexed owner, uint256 id, uint256 dna);
  mapping(address => uint256) public addressMintedBalance; // <-- used to check how many an account has minted for `maxMintAmountPerTx`

  // we begin constructing token: ERC721 standard
  constructor() ERC721("Character", "CHAR") {
    contractOwner = msg.sender; // <-- the game dev
  }

  // utils/helper funcs
  function _createRandomNum(uint256 _mod) internal view returns (uint256) {
    uint256 randomNum = uint256(
      keccak256(abi.encodePacked(block.timestamp, msg.sender))
    );
    return randomNum % _mod;
  }

  /** func to apply conditions to token mint/creation
   *  - condition: contract paused/unpaused
   *  - condition: insufficient account balance
   *  - condition: minting at least 1 or more
   *  - condition: total minted + this potential tx is under maxsupply
   *  - condition: minting limit per address
   */
  modifier mintCompliance(uint256 _mintAmount) {
    require(!paused, "The contract is paused.");

    // condition: insufficient account balance
    require(msg.value <= msg.sender.balance, "Insufficient balance.");

    // condition: minting at least 1 or more
    require(
      _mintAmount > 0 && _mintAmount <= maxMintAmountPerTx,
      "Invalid mint amount."
    );

    // condition: total minted + this potential tx is under maxsupply
    require(
      _tokenIds.current() + _mintAmount <= maxSupply,
      "Max supply exceeded."
    );

    // condition: value more than fee
    // TODO: opensea won't let list with fee(?)
    require(msg.value >= fee * _mintAmount, "Insufficient funds.");

    uint256 ownerMintedCount = addressMintedBalance[msg.sender];
    // condition: minting limit per address
    require(
      ownerMintedCount + _mintAmount <= perAddressLimit,
      "Max NFT per address exceeded."
    );
    _;
  }

  // READ FUNCS

  /** func to get token details
   *  - token by id
   *  - returns array
   */
  function getTokenDetails(uint256 _id) public view returns (Char memory) {
    return _tokenDetails[_id];
  }

  /** func to get total supply
   *
   */
  function getTokenCirculations() public view returns (uint256) {
    return _tokenIds.current();
  }

  /** func to link token to metadata
   *
   */
  function tokenURI(uint256 _id)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(_exists(_id), "ERC721Metadata: URI query for nonexistent token");
    if (revealed == true) {
      return _tokenDetails[_id].tokenURI;
    } else {
      return notRevealedUri;
    }
  }

  /** contract-level metadata for OpenSea.
   *  - update for collection-specific metadata.
   */
  function contractURI() public pure returns (string memory) {
    return "ipfs://INSERT_YOUR_CID/characters.json"; // Contract-level metadata
  }

  // WRITE FUNCS

  /**
   * func to mint/create token
   *  - amount to be minted/created
   *  - set link to token's metadata
   *  - emits array of new token's details
   */
  function mintToken(uint256 _mintAmount, string memory _tokenURI)
    public
    payable
    mintCompliance(_mintAmount)
  {
    _tokenIds.increment();
    uint256 newCharID = _tokenIds.current();

    _safeMint(msg.sender, newCharID);
    _setTokenURI(newCharID, _tokenURI);

    uint8 randRarity = uint8(_createRandomNum(100));
    uint256 randDna = _createRandomNum(10**16);

    // id, dna, level, rarity, evac, tokenURI
    Char memory newChar = Char(
      newCharID,
      randDna,
      1,
      randRarity,
      block.timestamp,
      _tokenURI
    );

    _tokenDetails[newCharID] = newChar;

    // check for addresses already minted
    for (uint256 i = 1; i <= _mintAmount; i++) {
      addressMintedBalance[msg.sender]++;
    }

    emit NewChar(msg.sender, newCharID, randDna);
  }

  /** onlyOwner and/or ownerOf
   * metadata versioning
   *  - update _tokenURI to metadata (previous version of metadata remains accessible)
   *  - only contract owner or token owner can execute func
   */
  function updateBio(uint256 _id, string memory _uri) public {
    require(_exists(_id), "ERC721URIStorage: URI set of nonexistent token");
    require(ownerOf(_id) == msg.sender || contractOwner == msg.sender);
    _tokenDetails[_id].tokenURI = _uri;
    _setTokenURI(_id, _uri);
  }

  /** onlyOwner (contractOwner address) funcs
    
   * metadata versioning
   *  - update _tokenURI to metadata (previous version of metadata remains accessible)
   *  - only contract owner can execute func
   */
  function updateMetadata(
    uint256 _id,
    string memory _uri,
    bool _levelUp
  ) public onlyOwner {
    require(_exists(_id), "ERC721URIStorage: URI set of nonexistent token");
    Char storage char = _tokenDetails[_id];
    char.tokenURI = _uri;
    _setTokenURI(_id, _uri);
    // level up
    if (_levelUp == true) {
      char.level++;
    }
  }

  function setMaxMintAmountPerTx(
    uint256 _newPerAddressLimit,
    uint256 _maxMintAmountPerTx
  ) public onlyOwner {
    perAddressLimit = _newPerAddressLimit;
    maxMintAmountPerTx = _maxMintAmountPerTx;
  }

  function reveal() public onlyOwner {
    revealed = true;
  }

  function updateFee(uint256 _fee) external onlyOwner {
    fee = _fee;
  }

  function withdraw() external payable onlyOwner {
    // This will transfer the remaining contract balance to the owner (contractOwner address).
    // Do not remove this otherwise you will not be able to withdraw the funds.
    // =============================================================================
    (bool os, ) = payable(owner()).call{value: address(this).balance}("");
    require(os);
    // =============================================================================
  }
}
