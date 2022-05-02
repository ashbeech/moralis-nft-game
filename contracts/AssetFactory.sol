// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//imports for 1155 token contract from Openzeppelin
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/*
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░            Asset Factory            ░░░░░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
*/

contract AssetFactory is ERC1155, AccessControl, Ownable {
  using SafeMath for uint256;
  using Strings for string;

  string public name; // Token name
  string public symbol; // Token symbol
  string public contractURI; // Token symbol
  uint256 public circulation; // Total circulating supply
  uint256 public cost; // Per token cost
  uint256 public expiry; // Whitelist expiry time i.e. 3600
  bool public paused = false; // Switch critical funcs to be paused

  // Whitelist data storage
  struct Whitelist {
    address buyer;
    uint256 timestamp;
    bool listed;
  }
  // Owner data storage
  struct Owners {
    address prev;
    address current;
    uint256 timestamp;
    uint256 total;
  }

  // Mapping each user to corresponding whitelist data
  mapping(uint256 => Whitelist) public whitelist;
  // Token owners
  mapping(uint256 => Owners) public owners;
  // Create role identifier for whitelisting
  bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE");

  event newOwner(address current, uint256 tokenId);

  event Whitelisted(
    uint256 indexed _tokenId,
    address _address,
    uint256 timestamp
  );

  /*
   * @dev
   *      One-time call on contract initialisation.
   * @params
   *      _root - Address of deafult admin
   *      _name - Short name
   *      _symbol - Max 4 digit capitalised
   *      _cost - wei amount per tx e.g. 10413000000000000
   *      _uri - Link to token-level metadata
   *      _cURI - Link to contract-level metadata
   */
  constructor(
    address _root,
    string memory _name,
    string memory _symbol,
    string memory _uri,
    string memory _cURI,
    uint256 _expiry,
    uint256 _cost
  ) ERC1155(_uri) {
    _setupRole(DEFAULT_ADMIN_ROLE, _root);
    _setupRole(WHITELISTER_ROLE, _root);

    name = _name;
    symbol = _symbol;
    cost = _cost;
    expiry = _expiry;
    circulation = 0;
    contractURI = _cURI;
  }

  /*
   * @dev
   *      See {IERC165-supportsInterface}.
   */
  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC1155, AccessControl)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  /*
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
    * MODS 
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
    */

  /*
   * @dev
   *      Restricted to members of the admin role.
   */
  modifier onlyAdmin() {
    require(isRole(DEFAULT_ADMIN_ROLE, msg.sender), "Restricted to admins.");
    _;
  }

  /*
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
    * ROLES 
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
    */

  /*
   * @dev
   *      Create a new role with the specified admin role.
   */
  function addAdmin(bytes32 roleId, bytes32 adminRoleId) external onlyAdmin {
    _setRoleAdmin(roleId, adminRoleId);
    //emit AdminRoleSet(roleId, adminRoleId);
  }

  /*
   * @dev
   *      Add role permissions to an account.
   */
  function addToRole(bytes32 roleId, address account) external onlyAdmin {
    grantRole(roleId, account);
  }

  /*
   * @dev
   *      Remove oneself from the admin role.
   */
  function renounceAdmin() external {
    renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  /*
   * @dev
   *      Return `true` if the account belongs to the role specified.
   */
  function isRole(bytes32 roleId, address account) public view returns (bool) {
    return hasRole(roleId, account);
  }

  /*
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
    * READ 
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
    */

  /*
   * @dev
   *      Collection-level metadata.
   */
  function getContractURI() public view returns (string memory) {
    return contractURI; // Contract-level metadata
  }

  /*
   * @dev
   *      Check is an account is on the whitelist.
   */
  function isWhitelisted(address _address, uint256 _tokenId)
    public
    view
    returns (bool)
  {
    bool userIsWhitelisted = false;
    if (whitelist[_tokenId].buyer == _address) {
      userIsWhitelisted = whitelist[_tokenId].listed;
    }
    return userIsWhitelisted;
  }

  /*
     * @dev
     *      Get cost of buying token. 
            Pegged to static fiat conversion i.e.
            $100 per token at any time.
     */
  function getCost() external view returns (uint256) {
    return cost;
  }

  /*
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
    * WRITE 
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
    * ADMIN: onlyOwner funcs (contract owner address) 
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
    */

  /*
   * @dev
   *      Batch mint tokens.
   * @params
   *      _to - Address tokens will be sent
   *      _tokenIds - Ids of tokens to be minted
   *      _amounts - Number of token under ids (1155 caters for fungible/non-fungible mix)
   */
  function batchMint(
    address _to,
    uint256[] memory _tokenIds,
    uint256[] memory _amounts
  ) external onlyAdmin {
    _mintBatch(_to, _tokenIds, _amounts, "");

    if (_tokenIds.length > 0) {
      for (uint256 i = 0; i < _tokenIds.length; i++) {
        uint256 tokenId = _tokenIds[i];
        owners[tokenId] = Owners(
          address(0), // prev
          address(this), // current
          block.timestamp, // timestamp
          0 // number of owners
        );
        circulation += _amounts[i]; // if amount is larger than 1 we need to make sure circulation is correctly incremented
      }
    }
  }

  /*
   * @dev
   *      Set URI for token metadata.
   * @params
   *      _uri - Updated link to JSON metadata per token
   */
  function setURI(string memory _uri) public onlyAdmin {
    _setURI(_uri);
  }

  /*
   * @dev
   *      Set expiry time for buying a token.
   */
  function setExpiry(uint256 _expiry) external onlyAdmin {
    expiry = _expiry;
  }

  /*
     * @dev
     *      Set cost of buying token. 
            Pegged to static fiat conversion i.e.
            $100 per token at any time.
     */
  function setCost(uint256 _newCost) external onlyAdmin {
    cost = _newCost;
  }

  /*
   * @dev
   *      Set critical contract functions to be paused.
   */
  function setPaused(bool _paused) external onlyAdmin {
    paused = _paused;
  }

  /*
     * @dev
     *      Buyer authorisation func to add addresses to whitelist.
            Access to buy 1 token 'per session'.
     * @params
     *      _address - Address to index tokens within whitelist
     *      _tokenId - Token identifier to add to whitelist
     */
  function addToWhitelist(uint256 _tokenId, address _address)
    external
    onlyRole(WHITELISTER_ROLE)
  {
    // Buyer address must not already own.
    require(
      owners[_tokenId].current != _address,
      "Address already owns this token."
    );
    // Listing created/updated against address.
    whitelist[_tokenId] = Whitelist(_address, block.timestamp, true);
    emit Whitelisted(_tokenId, _address, block.timestamp);
  }

  /*
   * @dev
   *      Remove addresses from whitelist, revoking access to buy.
   * @params
   *      _address - Address to index tokens within whitelist
   */
  function removeFromWhitelist(uint256 _tokenId)
    public
    onlyRole(WHITELISTER_ROLE)
  {
    require(whitelist[_tokenId].listed, "Address is not on the list.");
    delete whitelist[_tokenId];
  }

  /*
     * @dev
     *      Allow buyer to transfer token from owner wallet to theirs.
            Value transferred in tx is sent to owner address.
     * @params
     *      _tokenId - token to be transferred
     *      _buyer - Address fo buyer
     *      _amount - Number of tokens to be transferred (1 by default)
     *      _data - Aux byte data (not a requirment)
     */
  function buy(
    uint256 _tokenId,
    address _buyer,
    uint256 _amount,
    bytes memory _data
  ) external payable {
    require(!paused, "Contract is currently paused.");

    address owner = owner();
    uint256 available = balanceOf(owner, _tokenId);

    // Must be tokens remaining in owner balance.
    require(available >= _amount, "No tokens remaining.");

    if (isRole(DEFAULT_ADMIN_ROLE, _buyer) == true) {
      // Bypass payment if buyer is on excluded list.
      _safeTransferFrom(owner, _buyer, _tokenId, _amount, _data);
      return;
    }
    // Buyer address must not already own.
    require(
      owners[_tokenId].current != _buyer,
      "Address already owns this token."
    );
    // Buyer must be whitelisted for token id.
    require(
      whitelist[_tokenId].buyer == _buyer,
      "Address is not listed for this token."
    );
    // Buyer must be whitelisted.
    require(whitelist[_tokenId].listed, "Address is not on the list.");
    // Whitelist entry must not have expired.
    require(
      block.timestamp <= (whitelist[_tokenId].timestamp + expiry),
      "Whitelist entry expired."
    );
    // Amount paid must meet token value.
    require(msg.value == cost, "Value is not correct.");
    // Commence transfer.
    _safeTransferFrom(owner, _buyer, _tokenId, _amount, _data);
    // Transfer amount paid into previous token owner's address.
    payable(owner).transfer(msg.value);
  }

  /*
     * @dev 
     *      Hook that is called before any token transfer. This includes minting
            and burning, as well as batched variants.

     *      The same hook is called on both single and batched variants. For single
            transfers, the length of the `id` and `amount` arrays will be 1.
     */
  function _beforeTokenTransfer(
    address operator,
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
  ) internal virtual override {
    require(ids.length == amounts.length, "Mismatched params.");
    for (uint256 i = 0; i < ids.length; i++) {
      // Mark buyer address as owner.
      owners[ids[i]].prev = from;
      owners[ids[i]].current = to;
      owners[ids[i]].timestamp = block.timestamp;
      owners[ids[i]].total + 1;
      emit newOwner(to, ids[i]);
    }
    super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
  }

  // Fund withdrawal function.
  function withdraw() external payable onlyAdmin {
    // This will transfer the remaining contract balance to the owner address.
    (bool os, ) = payable(owner()).call{value: address(this).balance}("");
    require(os);
  }
}
