import React, { useRef, useState } from "react";
import { Box, Button, Heading } from "@chakra-ui/react";
import { Formik, Form } from "formik";
//import { Moralis } from "moralis";
import { useWeb3ExecuteFunction } from "react-moralis";
//import { abi as objContractAbi } from "../../constants/abis/Token.json";
import { abi as charContractAbi } from "../../constants/abis/Character.json";
//import { useMoralis } from "react-moralis";
//const request = require("request");

// Moralis creds
//const SERVER_URL = process.env.REACT_APP_MORALIS_SERVER_URL;
//onst APP_ID = process.env.REACT_APP_MORALIS_APPLICATION_ID;
//const MSTRKEY = process.env.REACT_APP_MASTER_KEY;
const API_URL = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY; // <-- xAPIKey available here: https://deep-index.moralis.io/api-docs/#/storage/uploadFolder
const CHAR_CONTRACT = process.env.REACT_APP_CHAR_CONTRACT;

export default function Updater() {
  //const { fetch } = useWeb3ExecuteFunction();
  const [initialFormValues, setInitialFormValues] = useState({});

  const form = useRef();
  const handleSubmit = async (e, a) => {
    console.log("FORM INPUT:", e);
    //await levelUp(5);
  };
  /*
  // goal: level-up token_id (char: level 1 -> level 2) via cloud function 
  // 1/2 front-end calls cloud
  // 2/2 cloud functions call contract
      function placeOffering (address _offerer, address _hostContract, uint _tokenId, uint _price) external {
        require (msg.sender == operator, "Only operator dApp can create offerings");
        bytes32 offeringId = keccak256(abi.encodePacked(offeringNonce, _hostContract, _tokenId));
        offeringRegistry[offeringId].offerer = _offerer;
        offeringRegistry[offeringId].hostContract = _hostContract;
        offeringRegistry[offeringId].tokenId = _tokenId;
        offeringRegistry[offeringId].price = _price;
        offeringNonce += 1;
        ERC721 hostContract = ERC721(offeringRegistry[offeringId].hostContract);
        string memory uri = hostContract.tokenURI(_tokenId);
        emit  OfferingPlaced(offeringId, _hostContract, _offerer, _tokenId, _price, uri);
    }
  */

  return (
    <Box className="container text-center mt-5">
      <Heading className="h1" mb={2}>
        NFT Character Updater
      </Heading>
      <Formik
        initialValues={initialFormValues}
        validateOnMount={true}
        enableReinitialize={true}
        onSubmit={async (values, { resetForm }) => {
          handleSubmit(values, { resetForm });
        }}
      >
        {(props) => (
          <Form ref={form}>
            <Button
              colorScheme="teal"
              isFullWidth={true}
              type="submit"
              textAlign="center"
            >
              Level Up ⇧
            </Button>
          </Form>
        )}
      </Formik>
    </Box>
  );
}
