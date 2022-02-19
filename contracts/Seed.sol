// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12 <0.9.0;

//imports for 1155 token contract from Openzeppelin
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Seed is ERC1155, Ownable {
  using Counters for Counters.Counter;
  using SafeMath for uint256;
  using Strings for string;
  Counters.Counter private _tokenIDS;

  uint256 public maxSupply = 10000000;

  // Seed struct can be used within arrays and mappings
  struct Seedling {
    uint256 id;
    uint8 status;
    string tokenURI;
  }
  // mapping that reference each Seed by their token id
  mapping(uint256 => Seedling) private _tokenDetails; // 0 -> however many get created
  string public notRevealedUri =
    "ipfs://QmPJvYnCSeZUyqdiNpEgv6KWBVWK1SEh2Y8X1uScXWCCYg/seeds-hidden.json";
  bool public paused = false;

  string public name;
  string public symbol;
  uint256 public tokensInCirculation;

  constructor()
    ERC1155("ipfs://QmPJvYnCSeZUyqdiNpEgv6KWBVWK1SEh2Y8X1uScXWCCYg/{id}.json")
  {
    name = "Seedling";
    symbol = "SEED";
    tokensInCirculation = 0;
  }

  // READ FUNCS

  // func to get tokenURI
  function uri(uint256 _id) public view override returns (string memory) {
    return _tokenDetails[_id].tokenURI;
  }

  // WRITE FUNCS

  // single mint
  function spawn(
    address _to,
    uint256 _id,
    uint256 _amount
  ) external onlyOwner {
    _mint(_to, _id, _amount, "");
    tokensInCirculation++;
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
        // iterate circulating tokens by minted amount above
        tokensInCirculation++;
      }
    }
  }

  /** onlyOwner (contractOwner address) funcs
   */
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

  function burn(uint256 _id, uint256 _amount) external {
    _burn(msg.sender, _id, _amount);
  }

  function burnBatch(uint256[] memory _ids, uint256[] memory _amounts)
    external
  {
    _burnBatch(msg.sender, _ids, _amounts);
  }

  /*
   * metadata versioning
   *  - update _tokenURI to metadata (previous version of metadata remains accessible)
   *  - only contract owner can execute func
   */
  function updateMetadata(
    uint256 _id,
    string memory _uri,
    uint8 _status
  ) external onlyOwner {
    Seedling storage seed = _tokenDetails[_id];
    seed.tokenURI = _uri;
    emit URI(_uri, _id);
    // status update
    if (_status > 0) {
      seed.status = _status;
    }
  }
}
