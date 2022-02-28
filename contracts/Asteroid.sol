// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12 <0.9.0; //

//imports for 1155 token contract from Openzeppelin
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol"; //
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Object is ERC1155, Ownable {
  using Counters for Counters.Counter;
  using SafeMath for uint256;
  using Strings for string;
  Counters.Counter private _tokenIDS;

  uint256 public cost = 0.00 ether;
  uint256 public maxSupply = 10000;

  // Asteroid struct can be used within arrays and mappings
  struct Asteroid {
    uint256 id;
    uint256 detected;
    uint8 level;
    string tokenURI;
  }
  // mapping that reference each Asteroid by their token id
  mapping(uint256 => Asteroid) private _tokenDetails; // 0 -> however many get created
  string public notRevealedUri =
    "ipfs://QmYjmj6AgVxGvWUck4ufmVCt8FSKPcyPRydAkqmZZA21T3/asteroids-hidden.json";
  bool public paused = false;
  bool public revealed = false;

  string public name;
  string public symbol;
  uint256 public tokensInCirculation;

  constructor()
    ERC1155("ipfs://QmPJvYnCSeZUyqdiNpEgv4KWBVWK1SEh2Y8X1uScXWCCYg/{id}.json")
  {
    name = "Asteroid";
    symbol = "AROID";
    tokensInCirculation = 0;
  }

  /** func to apply conditions to token mint/creation
   *  - condition: contract paused/unpaused
   *  - condition: insufficient account balance
   *  - condition: minting at least 1 or more
   *  - condition: total minted + this potential tx is under maxsupply
   *  - condition: minting limit per address
   */
  modifier spawnCompliance(uint256 _mintAmount) {
    require(!paused, "The contract is paused!");
    // condition: total minted + this potential tx is under maxsupply
    require(
      _tokenIDS.current() + _mintAmount <= maxSupply,
      "Max supply exceeded!"
    );
    _;
  }

  // READ FUNCS

  // func to get tokenURI
  function uri(uint256 _id) public view override returns (string memory) {
    if (revealed == true) {
      return _tokenDetails[_id].tokenURI;
    } else {
      return notRevealedUri;
    }
  }

  /** func to get token details
   *  - token by id
   *  - returns array
   */
  function getTokenDetails(uint256 _id) public view returns (Asteroid memory) {
    return _tokenDetails[_id];
  }

  // func to get tokens in circulation
  function getTokenCirculations() public view returns (uint256) {
    return tokensInCirculation;
  }

  /** @dev Contract-level metadata for OpenSea. */
  // Update for collection-specific metadata.
  function contractURI() public pure returns (string memory) {
    return
      "ipfs://QmYjmj6AgVxGvWUck4ufmVCt8FSKPcyPRydAkqmZZA21T3/asteroids.json"; // Contract-level metadata
  }

  // WRITE FUNCS

  // single mint is our publicly exposed func, _mint is parent contract's mint func
  function spawn(uint256 _id, uint256 _amount) public onlyOwner {
    for (uint256 i = 0; i < _amount; i++) {
      // only owner address can mint owner_address, token_id, bytecode
      _tokenDetails[tokensInCirculation] = Asteroid(
        _id,
        block.timestamp,
        1,
        uri(_id)
      );
      _mint(msg.sender, tokensInCirculation, 1, ""); // <- '1' in 1155 = NFT
      // iterate circulating tokens by minted amount above
      tokensInCirculation++;
    }
  }

  // batch mint
  function spawnBatch(
    address _to,
    uint256[] memory _ids,
    uint256[] memory _amounts
  ) external onlyOwner {
    _mintBatch(_to, _ids, _amounts, "");
    if (_ids.length > 0) {
      for (uint256 i = tokensInCirculation; i < _ids.length; i++) {
        // only owner address can mint owner_address, token_id, bytecode
        _tokenDetails[tokensInCirculation] = Asteroid(
          i,
          block.timestamp,
          0,
          uri(i)
        );
        // iterate circulating tokens by minted amount above
        tokensInCirculation++;
      }
    }
  }

  function burn(uint256 _id, uint256 _amount) external {
    _burn(msg.sender, _id, _amount);
  }

  function burnBatch(uint256[] memory _ids, uint256[] memory _amounts)
    external
  {
    _burnBatch(msg.sender, _ids, _amounts);
  }

  function burnForMint(
    address _from,
    uint256[] memory _burnIds,
    uint256[] memory _burnAmounts,
    uint256[] memory _mintIds,
    uint256[] memory _mintAmounts
  ) external onlyOwner {
    _burnBatch(_from, _burnIds, _burnAmounts);
    _mintBatch(_from, _mintIds, _mintAmounts, "");
  }

  function setCost(uint256 _newCost) public onlyOwner {
    cost = _newCost;
  }

  /** onlyOwner (contractOwner address) funcs
   */
  // set hidden data
  function setNotHiddenURI(string memory _notRevealedURI) public onlyOwner {
    notRevealedUri = _notRevealedURI;
  }

  // reveal hidden data
  function reveal() public onlyOwner {
    if (revealed == true) {
      revealed = false;
    } else {
      revealed = true;
    }
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
