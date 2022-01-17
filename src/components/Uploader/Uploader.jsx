import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useDropzone } from "react-dropzone";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Box,
  Center,
  Button,
  InputGroup,
  Input,
  Heading,
  Link,
  FormControl,
  FormErrorMessage,
  FormLabel,
} from "@chakra-ui/react";
import { Formik, Field, Form } from "formik";
import { ExternalLinkIcon } from "@chakra-ui/icons";
//import { Moralis } from "moralis";
import { useWeb3ExecuteFunction } from "react-moralis";
//import { abi as objContractAbi } from "../../constants/abis/Token.json";
import { abi as charContractAbi } from "../../constants/abis/Character.json";
//import { useMoralis } from "react-moralis";
//import { axios } from "axios";
const { default: axios } = require("axios");
//const request = require("request");

// consts i.e. connections to Moralis server
// funcs for single image upload:
// - compile image/upload image from UI
// - upload to IPFS and receive back CID
// - compile metadata: image (IPFS link/CID), text attributes, etc
// - save metadata: locally and IPFS
// - load result

// Moralis creds
// (NOTE: should attempt using integrated `moralis-react` or existing eth-boilerplate calls i.e. `useMoralisFile()`)
//const SERVER_URL = process.env.REACT_APP_MORALIS_SERVER_URL;
//onst APP_ID = process.env.REACT_APP_MORALIS_APPLICATION_ID;
//const MSTRKEY = process.env.REACT_APP_MASTER_KEY;
const API_URL = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY; // <-- xAPIKey available here: https://deep-index.moralis.io/api-docs/#/storage/uploadFolder
const CHAR_CONTRACT = process.env.REACT_APP_CHAR_CONTRACT;

let ipfsArray = []; // holds all IPFS data
let metadataList = []; // holds metadata for all NFTs (could be a session store of data)
let promiseArray = []; // array of promises so that only if finished, will next promise be initiated

const baseStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  backgroundColor: "#fafafa",
  color: "#bdbdbd",
  transition: "border .3s ease-in-out",
};

const activeStyle = {
  borderColor: "#2196f3",
};

const acceptStyle = {
  borderColor: "#00e676",
};

const rejectStyle = {
  borderColor: "#ff1744",
};

export default function Uploader(_isAuthenticated) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMessage, setMessage] = useState(false);
  const [showErrorMessage, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [IPFSLinkImage, setIPFSLinkImage] = useState("");
  const [initialFormValues, setInitialFormValues] = useState({
    name: "",
    damage: "",
    power: "",
    endurance: "",
  });

  /*
  let IPFSLinks = {
    image: "",
    metadata: "",
  };
  */

  const form = useRef();
  const maxSize = 1048576;
  let totalFiles = 0;

  // clean up file preview
  useEffect(
    () => () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    },
    [files]
  );

  // authetication check; we don't want uploads if not logged-in
  useEffect(() => {
    if (!_isAuthenticated.isAuthenticated) resetAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_isAuthenticated]);

  // web3 interface
  const { fetch } = useWeb3ExecuteFunction();

  // track total circulation
  let _tokensAvailable = 0;

  // simple demo contract interaction
  const tokensAvailable = async () => {
    const options = {
      abi: charContractAbi,
      contractAddress: CHAR_CONTRACT,
      functionName: "getTokenCirculations",
    };

    await fetch({
      params: options,
      onSuccess: (response) => (_tokensAvailable = parseInt(response)),
      onComplete: () =>
        console.log("NEXT TOKEN:", parseInt(_tokensAvailable + 1)),
      onError: (error) => console.log("ERROR:", error),
    });
  };

  /* 
  // fetch Hastro token (NFT)
  async function fetchData(_id) {
    const options = {
      abi: charContractAbi,
      contractAddress: CHAR_CONTRACT,
      functionName: "getTokenDetails",
      params: {
        _id: _id,
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

  /*
  const getURI = async (_id) => {
    const options = {
      abi: objContractAbi,
      contractAddress: objContractAddress,
      functionName: "uri",
      params: {
        _id: _id,
      },
    };

    await fetch({
      params: options,
      onSuccess: (response) => console.log("URI:", response),
      onComplete: () => console.log("URI Done"),
      onError: (error) => console.log("Error", error),
    });
  };
  */

  // after token mint
  const setInteractionData = async (_response) => {
    // confirm token was minted; that total circulation increased
    console.log("RESPONSE POST-MINT:", _response);
    resetAll(true);
  };

  const mintCharacter = async (_metaCID, _id, _formValues) => {
    // could be _mintAmount instead(?) i.e. 1 is just temp hardcoded
    let _url = "";
    let paddedHex = (
      "0000000000000000000000000000000000000000000000000000000000000000" + _id
    ).slice(-64);
    _url = `https://ipfs.moralis.io:2053/ipfs/${_metaCID}/metadata/${paddedHex}.json`;

    // set link for verifibility at end of upload -> mint process
    setIPFSLinkImage(_url);

    const options = {
      abi: charContractAbi,
      contractAddress: CHAR_CONTRACT,
      functionName: "mintToken",
      params: {
        _mintAmount: 1,
        _damage: _formValues.damage,
        _power: _formValues.power,
        _endurance: _formValues.endurance,
        _tokenURI: _url,
      },
    };

    console.log("META DATA URL:", _url);

    await fetch({
      params: options,
      onSuccess: (response) => setInteractionData(response),
      onComplete: () => console.log("MINT COMPLETE"),
      onError: (error) => console.log("ERROR", error),
    });
  };

  const handleSubmit = async (e, a) => {
    console.log("FORM INPUT:", e);
    // stop interactions with buttons
    setLoading(true);
    // get how many tokens already circulate before minting next for ref
    await tokensAvailable();
    // trigger upload from files via useState
    console.log("TOKENS IN CIRCULATION:", _tokensAvailable);

    uploadIPFS(files, {
      name: e.name,
      damage: parseInt(e.damage),
      power: parseInt(e.power),
      endurance: parseInt(e.endurance),
    });
  };

  const messageMarkup = (
    <Box>
      <Alert status="success">
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription display="block">
            IPFS upload and mint complete.
            <Box>
              <Link href={IPFSLinkImage} isExternal>
                Verify metadata here <ExternalLinkIcon mx="2px" />
              </Link>
            </Box>
          </AlertDescription>
        </Box>
        <CloseButton
          position="absolute"
          right="8px"
          top="8px"
          onClick={() => setMessage(false)}
        />
      </Alert>
    </Box>
  );
  const errorMarkup = (_error) => {
    return (
      <Box>
        <Alert status="error">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription display="block">{_error}.</AlertDescription>
          </Box>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => setError(false)}
          />
        </Alert>
      </Box>
    );
  };

  // reset all
  // _status = should show message on reset?
  const resetAll = (_status) => {
    setFiles([]);
    setLoading(false);
    if (_status) {
      setMessage(true);
    }
    //a.resetForm(initialFormValues);

    ipfsArray = []; // holds all IPFS data
    metadataList = []; // holds metadata for all NFTs (could be a session store of data)
    promiseArray = []; // array of promises so that only if finished, will next promise be initiated
  };

  /*
  // upload ref to database
  const saveToDb = async (metaHash, imageHash, _editionSize) => {
    for (let i = 1; i < _editionSize + 1; i++) {
      let id = parseInt(_tokensAvailable + 1).toString(); //i.toString(); <-- TEMP
      let paddedHex = (
        "0000000000000000000000000000000000000000000000000000000000000000" + id
      ).slice(-64);
      let url = `https://ipfs.moralis.io:2053/ipfs/${metaHash}/metadata/${paddedHex}.json`;
      let options = { json: true };

      IPFSLinks.image = `https://ipfs.moralis.io:2053/ipfs/${imageHash}/metadata/${paddedHex}.png`;
      IPFSLinks.metadata = url;

      request(url, options, (error, res, body) => {
        if (error) {
          setLoading(false);
          setError(true);
          setErrorMessage(error);
          return console.log(error);
        }

        if (!error && res.statusCode === 200) {
          // save file reference to Moralis
          const FileDatabase = new Moralis.Object("Metadata");
          FileDatabase.set("id", body.id);
          FileDatabase.set("name", body.name);
          FileDatabase.set("image", body.image);
          FileDatabase.set("attributes", body.attributes);
          FileDatabase.set("meta_hash", metaHash);
          FileDatabase.set("image_hash", imageHash);
          FileDatabase.save();

          console.log(IPFSLinks.image);
          console.log(IPFSLinks.metadata);
          console.log("ALL DONE");
        }
      });
    }
  };
  */

  const onDrop = useCallback((acceptedFiles) => {
    //console.log(acceptedFiles);
    //console.log(getInputProps);

    setFiles(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      )
    );
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    acceptedFiles,
    fileRejections,
  } = useDropzone({
    onDrop,
    disabled:
      _isAuthenticated.isAuthenticated && loading
        ? true
        : _isAuthenticated.isAuthenticated
        ? false
        : true,
    accept: "image/jpeg, image/png",
    minSize: 0,
    maxSize,
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

  const isFileTooLarge =
    fileRejections?.length > 0 && fileRejections[0]?.size > maxSize;

  const thumbs = files.map((file) => (
    <div key={file.name}>
      <img src={file.preview} alt={file.name} />
    </div>
  ));

  // once file is uploaded to IPFS we can use the CID to reference in the metadata
  const generateMetadata = (_id, _path, _values) => {
    let dateTime = Date.now();
    let tempMetadata = {
      //dna: dna.join(""),
      name: _values.name ? _values.name : `#${_id}`,
      image: _path,
      id: _id,
      date: dateTime,
      attributes: {
        damage: _values.damage ? _values.damage : 0,
        power: _values.power ? _values.power : 0,
        endurance: _values.endurance ? _values.endurance : 0,
      },
    };
    return tempMetadata;
  };

  // upload metadata
  const uploadMetadata = async (
    apiUrl,
    xAPIKey,
    imageCID,
    _totalFiles,
    _formValues
  ) => {
    let fileDataArray = [];
    ipfsArray = []; // holds all IPFS data
    metadataList = []; // holds metadata for all NFTs (could be a session store of data)
    promiseArray = []; // array of promises so that only if finished, will next promise be initiated

    // iterate through total number of files uploaded
    for (let i = 1; i < _totalFiles + 1; i++) {
      let id = parseInt(_tokensAvailable + 1).toString(); //i.toString(); <-- TEMP
      let paddedHex = (
        "0000000000000000000000000000000000000000000000000000000000000000" + id
      ).slice(-64);

      // create filepath to reference image uploaded
      fileDataArray[i] = {
        filePath: `https://ipfs.moralis.io:2053/ipfs/${imageCID}/images/${paddedHex}.png`,
      };
      console.log("MEDIA FILE DATA:", fileDataArray[i].filePath);

      // assign input to metadata
      let nftMetadata = generateMetadata(
        id,
        fileDataArray[i].filePath,
        _formValues
      );
      metadataList.push(nftMetadata);

      let base64String = Buffer.from(JSON.stringify(metadataList)).toString(
        "base64"
      );

      // event.target.result contains base64 encoded image
      // reads output folder for json files and then adds to IPFS object array
      promiseArray.push(
        new Promise((res, rej) => {
          ipfsArray.push({
            path: `metadata/${paddedHex}.json`,
            content: base64String,
          });
          console.log("IPFS ARRAY:", ipfsArray);

          // once all promises back then save to IPFS and Moralis database
          Promise.all(promiseArray).then(() => {
            axios
              .post(apiUrl, ipfsArray, {
                headers: {
                  "X-API-Key": xAPIKey,
                  "content-type": "application/json",
                  accept: "application/json",
                },
              })
              .then((res) => {
                // successfully uploaded metadata to IPFS
                let metaCID = res.data[0].path.split("/")[4];
                console.log("META DATA FILE PATHS:", res.data);

                // step 3. transfer reference to metadata on-chain and to db (optional)
                // on-chain: interface with smart contract; mint uploaded asset as NFT
                mintCharacter(metaCID, id, _formValues); // <-- '+1' or 'amount' to be minted, currently minting one at a time
                // moralis db: save ref to IPFS metadata file
                //saveToDb(metaCID, imageCID, _totalFiles);
              })
              .catch((err) => {
                setLoading(false);
                setError(true);
                setErrorMessage(err);
                console.log(err);
              });
          });
        })
      );
    }
  };

  function uploadIPFS(_files, _formValues) {
    totalFiles = _files.length;

    // currently only single file upload
    for (let i = 1; i < totalFiles + 1; i++) {
      let id = parseInt(_tokensAvailable + 1).toString(); //i.toString(); <-- TEMP
      let paddedHex = (
        "0000000000000000000000000000000000000000000000000000000000000000" + id
      ).slice(-64);

      let reader = new FileReader();
      let base64String = "";
      reader.onload = function (event) {
        // event.target.result contains base64 encoded image
        base64String = event.target.result;
        // reads output folder for images and adds to IPFS object metadata array (within promise array)
        promiseArray.push(
          new Promise((res, rej) => {
            ipfsArray.push({
              path: `images/${paddedHex}.png`,
              //content: base64String,
              content: base64String.toString("base64"),
            });
            console.log("IPFS ARRAY:", ipfsArray);
            // once all promises then upload IPFS object metadata array
            Promise.all(promiseArray).then(() => {
              axios
                .post(API_URL, ipfsArray, {
                  headers: {
                    "X-API-Key": API_KEY,
                    "content-type": "application/json",
                    accept: "application/json",
                  },
                })
                .then((res) => {
                  // successfully uploaded file to IPFS
                  console.log("MEDIA FILE PATHS:", res.data);
                  let imageCID = res.data[0].path.split("/")[4];
                  console.log("MEDIA CID:", imageCID);
                  // pass folder CID to meta data
                  uploadMetadata(
                    API_URL,
                    API_KEY,
                    imageCID,
                    totalFiles,
                    _formValues
                  );
                })
                .catch((err) => {
                  setLoading(false);
                  setError(true);
                  setErrorMessage(err);
                  console.log(err);
                });
            });
          })
        );
      };
      reader.readAsDataURL(_files[0]);
    }
  }

  return (
    <Box className="container text-center mt-5">
      <Heading className="h1" mb={2}>
        NFT Character Generator
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
            <Box mb={2}>
              {showMessage && !files[0] ? messageMarkup : ""}
              {showErrorMessage ? errorMarkup(errorMessage) : ""}
            </Box>
            <Field name="name">
              {({ field, form }) => (
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    id="name"
                    className="first"
                    placeholder="Character Name"
                    mb={2}
                    borderRadius={1}
                    variant="outline"
                    borderColor="teal"
                    borderStyle="solid"
                    lineHeight={0.2}
                    isDisabled={files[0] ? false : true}
                    isRequired
                  />
                  <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="power">
              {({ field, form }) => (
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    type="number"
                    id="power"
                    placeholder="Power Level"
                    mb={2}
                    borderRadius={1}
                    variant="outline"
                    borderColor="teal"
                    borderStyle="solid"
                    lineHeight={0.2}
                    isDisabled={files[0] ? false : true}
                    isRequired
                  />
                  <FormErrorMessage>{form.errors.power}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="damage">
              {({ field, form }) => (
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    type="number"
                    id="damage"
                    placeholder="Damage Level"
                    mb={2}
                    borderRadius={1}
                    variant="outline"
                    borderColor="teal"
                    borderStyle="solid"
                    lineHeight={0.2}
                    isDisabled={files[0] ? false : true}
                    isRequired
                  />
                  <FormErrorMessage>{form.errors.damage}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="endurance">
              {({ field, form }) => (
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    type="number"
                    id="endurance"
                    placeholder="Endurance Level"
                    mb={2}
                    borderRadius={1}
                    variant="outline"
                    borderColor="teal"
                    borderStyle="solid"
                    lineHeight={0.2}
                    isDisabled={files[0] ? false : true}
                    isRequired
                  />
                  <FormErrorMessage>{form.errors.endurance}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Box {...getRootProps({ style })} mb={2}>
              <InputGroup size="md">
                <FormLabel htmlFor="name">Character Image</FormLabel>
                <Input {...getInputProps()} />
              </InputGroup>
              {!isDragActive && "Click here or drop a file to upload!"}
              {isDragActive && !isDragReject && "Drop it like it's hot!"}
              {isDragReject && "File type not accepted, sorry!"}
              {isFileTooLarge && (
                <Box className="text-danger mt-2">File is too large.</Box>
              )}
            </Box>
            <Center mb={2}>
              <aside>{thumbs}</aside>
            </Center>
            <Button
              id="files"
              colorScheme="teal"
              isFullWidth={true}
              isLoading={loading}
              isDisabled={files[0] ? false : true}
              data-file={files}
              type="submit"
              textAlign="center"
            >
              Upload
            </Button>
          </Form>
        )}
      </Formik>
    </Box>
  );
}
