const Object = artifacts.require("Object");
module.exports = async function (deployer) {
  await deployer.deploy(Object);
  let objInstance = await Object.deployed();
  let objMetaInstance = await Object.deployed();

  // mint test obj
  // 1155
  /*
  uint256 _amount,
  uint8 _damage,
  uint8 _power,
  uint256 _endurance
  */
  await objInstance.mintToken(1, 1); // Token id 1
  let obj = await objInstance.getTokenDetails(0);
  console.log(obj);
  let objMeta = await objMetaInstance.uri(1);
  console.log(objMeta);
};
