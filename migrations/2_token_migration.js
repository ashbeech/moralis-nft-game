const Token = artifacts.require("Token");
module.exports = async function (deployer) {
  await deployer.deploy(Token);
  let tokenInstance = await Token.deployed();
  await tokenInstance.mint(1, 1, 100, 200, 100000); // Token id 0
  let hashtro = await tokenInstance.getTokenDetails(0);
  console.log(hashtro);
};
