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
