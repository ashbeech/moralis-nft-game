// Moralis cloud functions:
// * call contract to level-up token
// * return response: success/error
// ---

const web3 = Moralis.web3ByChain("0x13881"); // Mumbai Testnet
//const web3 = new Moralis.Web3(new Moralis.Web3.providers.HttpProvider("https://speedy-nodes-nyc.moralis.io/2f9030e63c6503c12a1e7340/polygon/mumbai"));
const nft_market_place_address = "";
const coordinatorKey = "";
const nft_market_place_abi = [];
const marketPlace = new web3.eth.Contract(
  nft_market_place_abi,
  nft_market_place_address
);

Moralis.Cloud.define("placeOffering", async (request) => {
  const logger = Moralis.Cloud.getLogger();
  /* 
  async function levelUp(_id) {
    const options = {
      abi: charContractAbi,
      contractAddress: CHAR_CONTRACT,
      functionName: "levelUp",
      params: {
        _charId: _id,
      },
    };

    await fetch({
      params: options,
      onSuccess: (response) => console.log("TOKEN DATA:", response),
      onComplete: () => console.log("Fetched"),
      onError: (error) => console.log("Error", error),
    });
  }
 */

  const hostContract = request.params.hostContract;
  const offerer = request.params.offerer;
  const tokenId = request.params.tokenId;
  const price = request.params.price;
  const nonceOperator = web3.eth.getTransactionCount(
    "0x77Ef4472cAc1AAca6B4bB82EA2bc41A6cf876EAf"
  );
  const functionCall = marketPlace.methods
    .placeOffering(
      offerer,
      hostContract,
      tokenId,
      web3.utils.toWei(price, "ether")
    )
    .encodeABI();
  transactionBody = {
    to: nft_market_place_address,
    nonce: nonceOperator,
    data: functionCall,
    gas: 400000,
    gasPrice: web3.utils.toWei("1", "gwei"),
  };
  signedTransaction = await web3.eth.accounts.signTransaction(
    transactionBody,
    coordinatorKey
  );
  logger.info("-------------------------------");
  logger.info(JSON.stringify(signedTransaction));
  logger.info("------ Signed Tx ------");
  return signedTransaction;
});
