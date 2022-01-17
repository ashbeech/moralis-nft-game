const Character = artifacts.require("Character");
module.exports = async function (deployer) {
  await deployer.deploy(Character);
  let charInstance = await Character.deployed();
  // mint test char
  await charInstance.mintToken(
    1,
    100,
    99,
    1000,
    "https://ipfs.moralis.io:2053/ipfs/QmYoAMgsbmRb4NDrfiKgcdM8mzGnhRsqMBsnd84mFMiB17/metadata/0000000000000000000000000000000000000000000000000000000000000004.json"
  ); // Token id 1
  let character = await charInstance.getTokenDetails(1);
  console.log(character);
};
