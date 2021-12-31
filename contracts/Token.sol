pragma solidity >=0.7.0 <0.9.0;

//import 1155 token contract from Openzeppelin
import "../node_modules/@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC1155, Ownable {
    using SafeMath for uint256;

    struct Pet {
        uint8 damage;
        uint8 power;
        uint256 lastMeal;
        uint256 endurance; // 24 hours
    }
    mapping(uint256 => Pet) private _tokenDetails; // 0 -> however many get created */

    uint256 public tokensInCirculation;

    // https://token-cdn-domain/000000000000000000000000000000000000000000000000000000000004cce0.json
    constructor()
        ERC1155("ipfs://INSERT_YOUR_CID_METAHASH/metadata/{id}.json")
    {
        tokensInCirculation = 0;
    }

    function getTokenDetails(uint256 tokenId) public view returns (Pet memory) {
        return _tokenDetails[tokenId];
    }

    function mint(
        uint256 amount,
        uint8 damage,
        uint8 power,
        uint256 endurance
    ) public onlyOwner {
        for (uint256 i = 0; i < amount; i++) {
            // only owner address can mint owner_address, token_id, bytecode
            _tokenDetails[tokensInCirculation] = Pet(
                damage,
                power,
                block.timestamp,
                endurance
            );
            _mint(msg.sender, tokensInCirculation, 1, ""); // <- '1' in 1155 = NFT
            // iterate circulating tokens by minted amount above
            tokensInCirculation++;
        }
    }

    function feed(uint256 tokenId) public {
        Pet storage pet = _tokenDetails[tokenId];
        require(pet.lastMeal + pet.endurance > block.timestamp); // must not have died of starvation; Pet is still alive
        _tokenDetails[tokenId].lastMeal = block.timestamp;
    }

    // _beforeTokenTransfer(operator, from, address(0), ids, amounts, "");
    /*     function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        // cannot be transferred IF dead.
        Pet storage pet = _tokenDetails[tokensInCirculation];
        require(pet.lastMeal + pet.endurance > block.timestamp); // must not have died of starvation; Pet is still alive
    } */
}

/* 

//import "../node_modules/@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol";

contract Tokens is ERC1155PresetMinterPauser {
    uint256 public gameIDCounter;

    mapping(string => uint256) public idmap;
    mapping(uint256 => string) public lookupmap;

    constructor() ERC1155PresetMinterPauser("https://img.youtube.com/vi/") {
        // base URI
    }

    function addGameID(string memory gameID, uint256 initialSupply) external {
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "Tokens: must have minter role to mint."
        );
        require(idmap[gameID] == 0, "Tokens: This game already exists.");

        gameIDCounter = gameIDCounter + 1;
        idmap[gameID] = gameIDCounter;
        lookupmap[gameIDCounter] = gameID;

        _mint(msg.sender, gameIDCounter, initialSupply, "");
    }

    function uri(uint256 id)
        public
        view
        virtual
        override
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(super.uri(id), lookupmap[id], "/hqdefault.jpg")
            );
    }

    function getAllTokens(address account)
        public
        view
        returns (uint256[] memory)
    {
        uint256 numTokens = 0;
        for (uint256 i = 0; i <= gameIDCounter; i++) {
            if (balanceOf(account, i) > 0) {
                numTokens++;
            }
        }
        uint256[] memory ret = new uint256[](numTokens);
        uint256 counter = 0;
        for (uint256 i = 0; i <= gameIDCounter; i++) {
            if (balanceOf(account, i) > 0) {
                ret[counter] = i;
                counter++;
            }
        }
        return ret;
    }
} */

/* 
contract Token is ERC1155, Ownable {

    uint256 public constant ASTEROID = 0;

    struct Pet {
        uint8 damage;
        uint8 power;
        uint256 lastMeal;
        uint256 endurance; // 24 hours
    }

    mapping(uint256 => Pet) private _tokenDetails; // 0 -> however many get created */

/*     constructor(string memory name, string memory symbol)
        ERC1155(name, symbol)
        _mint(msg.sender, ASTEROID, 10**18, "");
    {} */
/*
function addAsteroidID(string memory asteroidID, uint256 initialSupply) external {
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "Tokens: must have minter role to mint."
        );
        require(idmap[gameID] == 0, "Tokens: This game already exists.");

        gameIDCounter = gameIDCounter + 1;
        idmap[gameID] = gameIDCounter;
        lookupmap[gameIDCounter] = gameID;

        _mint(msg.sender, gameIDCounter, initialSupply, "");
    }


}
 */
