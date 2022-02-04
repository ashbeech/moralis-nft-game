// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12 <0.9.0;

//import 1155 token contract from Openzeppelin
/* 
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
 */
//
import "../node_modules/@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/utils/Strings.sol";

contract Object is ERC1155, Ownable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    using Strings for string;
    Counters.Counter private _tokenIDS;

    //string baseURI;
    uint256 public cost = 0.05 ether;
    uint256 public maxSupply = 10000;
    uint256 public maxMintAmount = 20;
    uint256 public maxMintAmountPerTx = 100;
    uint256 public nftPerAddressLimit = 100;

    // Hashteroid struct can be used within arrays and mappings
    struct Hashteroid {
        uint256 id;
        uint256 detected;
    }
    // mapping that reference each Hashteroid by their token id
    mapping(address => uint256) public addressMintedBalance;
    mapping(uint256 => Hashteroid) private _tokenDetails; // 0 -> however many get created
    mapping(uint256 => string) public tokenURI;
    string public notRevealedUri =
        "ipfs://QmYjmj6AgVxGvWUck4ufmVCt8FSKPcyPRydAkqmZZA21T3/asteroids-hidden.json";
    bool public paused = false;
    bool public revealed = false;

    string public name;
    string public symbol;
    uint256 public tokensInCirculation;

    // parent ERC1155 constructor requires this
    // https://game.example/api/item/0000000000000000000000000000000000000000000000000000000000000001.json
    // "ipfs://QmdRfxFBzKPdjYy94hu3KvmWkNbRvL4QLkDSSyKZZcASb4/metadata/{id}.json"
    // 1. Upload all static metadata to IPFS
    // 2. This will give folder CID
    // 3. Insert folder CID below
    // 4. Token '{id}' will be returned as string, but marketplaces will look for 64 '0' paddeded hex.
    /*
    For token ID 2 and uri https://game.example/api/item/{id}.json clients would replace {id} with 0000000000000000000000000000000000000000000000000000000000000002 to retrieve JSON at https://game.example/api/item/0000000000000000000000000000000000000000000000000000000000000002.json.
    */

    constructor()
        ERC1155(
            "ipfs://QmPJvYnCSeZUyqdiNpEgv4KWBVWK1SEh2Y8X1uScXWCCYg/{id}.json"
        )
    {
        name = "Hashteroid";
        symbol = "HROID";
        tokensInCirculation = 0;
    }

    function getTokenDetails(uint256 _id)
        public
        view
        returns (Hashteroid memory)
    {
        return _tokenDetails[_id];
    }

    function getTokenCirculations() public view returns (uint256) {
        return tokensInCirculation;
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

    // mint is our publicly exposed func, _mint is parent contract's mint func
    function mintToken(uint256 _id, uint256 _amount) public onlyOwner {
        for (uint256 i = 0; i < _amount; i++) {
            // only owner address can mint owner_address, token_id, bytecode
            _tokenDetails[tokensInCirculation] = Hashteroid(
                _id,
                block.timestamp
            );
            _mint(msg.sender, tokensInCirculation, 1, ""); // <- '1' in 1155 = NFT
            // iterate circulating tokens by minted amount above
            tokensInCirculation++;
        }
    }

    // .mintBatch(addr1, [1, 2, 3, 4, 5], [1, 1, 1, 1, 1], ethers.utils.toUtf8Bytes(""));

    function mintBatch(
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts
    ) external onlyOwner {
        _mintBatch(_to, _ids, _amounts, "");
        // TODO:
        // add mintCompliance
        // increment token ids for counter to track supply (NOTE: won't have to do this if just fully batch minting in one go)
        /*
        if (_ids.length > 0) {
            for (uint256 i = tokensInCirculation; i < _ids.length; i++) {
                // only owner address can mint owner_address, token_id, bytecode
                _tokenDetails[tokensInCirculation] = Hashteroid(
                    i,
                    block.timestamp
                );
                // iterate circulating tokens by minted amount above
                tokensInCirculation++;
            }
        }*/
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
        //Hashteroid storage hashteroid = _tokenDetails[tokensInCirculation];
        //require(hashteroid.detected + hashteroid.endurance > block.timestamp); // must not have died of starvation; Hashteroid is still alive
    }

    //only contract owner

    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
    }

    function setmaxMintAmount(uint256 _newmaxMintAmount) public onlyOwner {
        maxMintAmount = _newmaxMintAmount;
    }

    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedUri = _notRevealedURI;
    }

    /** @dev Contract-level metadata for OpenSea. */
    // Update for collection-specific metadata.
    function contractURI() public pure returns (string memory) {
        return
            "ipfs://QmYjmj6AgVxGvWUck4ufmVCt8FSKPcyPRydAkqmZZA21T3/asteroids.json"; // Contract-level metadata
    }

    function reveal() public onlyOwner {
        if (revealed == true) {
            revealed = false;
        } else {
            revealed = true;
        }
    }

    /*
     * IMPORTANT TODO: Func must ONLY be called by game itself or wallet address uncontrolled by any player.
     * Must not be possible for user, malicious or otherwise, calling the setURI func; inserting a string into there
     */
    /*
    function setURI(uint256 _id, string memory _uri) external onlyOwner {
        tokenURI[_id] = _uri;
        emit URI(_uri, _id);
    }
    */
    /* 
    function uri(uint256 _id)
        external
        view
        virtual
        override(ERC1155)
        returns (string memory)
    {
        if (revealed == false) {
            return notRevealedUri;
        }
        return
            Strings.strConcat(
                ERC1155.uri(),
                Address.toAsciiString(address(this)),
                "/",
                Strings.uint2str(_id),
                ".json"
            );
    }
 */
}
