// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

//import 1155 token contract from Openzeppelin
import "../node_modules/@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC1155, Ownable {
    using SafeMath for uint256;

    // Hashtro struct can be used within arrays and mappings
    struct Hashtro {
        uint256 id;
        uint8 damage;
        uint8 power;
        uint256 lastMeal;
        uint256 endurance; // 24 hours
    }
    // mapping that reference each Hashtro by their token id
    mapping(uint256 => Hashtro) private _tokenDetails; // 0 -> however many get created
    mapping(uint256 => string) public tokenURI;

    string public name;
    string public symbol;
    uint256 public tokensInCirculation;

    // parent ERC1155 constructor requires this
    // https://game.example/api/item/0000000000000000000000000000000000000000000000000000000000000001.json
    // "ipfs://QmdRfxFBzKPdjYy94hu3KvmWkNbRvL4QLkDSSyKZZcASb4/metadata/{id}"

    constructor() ERC1155("ipfs://f0{id}") {
        name = "Hashtros";
        symbol = "HASHTROS";
        tokensInCirculation = 0;
    }

    function getTokenDetails(uint256 _id) public view returns (Hashtro memory) {
        return _tokenDetails[_id];
    }

    function getTokenCirculations() public view returns (uint256) {
        return tokensInCirculation;
    }

    function feed(uint256 tokenId) public {
        Hashtro storage hashtro = _tokenDetails[tokenId];
        require(hashtro.lastMeal + hashtro.endurance > block.timestamp); // must not have died of starvation; Hashtro is still alive
        _tokenDetails[tokenId].lastMeal = block.timestamp; // update when hashtro was last fed according to block time
    }

    /*
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
        
    )   public virtual  {

        _mint(msg.sender, id, amount, data);
    }   
    */

    // mint is our publicly exposed func, _mint is parent contract's mint func
    function mint(
        uint256 _id,
        uint256 _amount,
        uint8 _damage,
        uint8 _power,
        uint256 _endurance
    ) public onlyOwner {
        for (uint256 i = 0; i < _amount; i++) {
            // only owner address can mint owner_address, token_id, bytecode
            _tokenDetails[tokensInCirculation] = Hashtro(
                _id,
                _damage,
                _power,
                block.timestamp,
                _endurance
            );
            _mint(msg.sender, tokensInCirculation, 1, ""); // <- '1' in 1155 = NFT
            // iterate circulating tokens by minted amount above
            tokensInCirculation++;
        }
    }

    function mintBatch(
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts
    ) external onlyOwner {
        _mintBatch(_to, _ids, _amounts, "");
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

    function _beforeTokenTransfer(
        address,
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) internal view override {
        // cannot be transferred IF dead.
        Hashtro storage hashtro = _tokenDetails[tokensInCirculation];
        require(hashtro.lastMeal + hashtro.endurance > block.timestamp); // must not have died of starvation; Hashtro is still alive
    }

    function setURI(uint256 _id, string memory _uri) external onlyOwner {
        tokenURI[_id] = _uri;
        emit URI(_uri, _id);
    }

    /*
    function uri(uint256 _tokenID)
        public
        pure
        override
        returns (string memory)
    {
        string memory hexstringtokenID;
        hexstringtokenID = uint2hexstr(_tokenID);

        return string(abi.encodePacked("ipfs://f0", hexstringtokenID));
    }
    */

    /*     function uri(uint256 _tokenID)
        public
        view
        override
        returns (string memory)
    {
        //return tokenURI[_tokenID];
        return _uri;
    }
    */
}
