const Character = artifacts.require("Character");
module.exports = async function (deployer) {
  await deployer.deploy(Character);
  let charInstance = await Character.deployed();
  // mint test char
  /*
  uint256 _mintAmount,
  uint8 _damage,
  uint8 _power,
  uint256 _endurance,
  string memory _tokenURI
  */

  await charInstance.mintToken(
    1,
    "ipfs://QmctH9PvqE2nApQppW25BWm4GZcYL5dEmWQHt1zsoFBhQu/0000000000000000000000000000000000000000000000000000000000000001.json",
  ); // Token id 1
  let character = await charInstance.getTokenDetails(1);
  console.log(character);
};
