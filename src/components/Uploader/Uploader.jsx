import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Box,
  Button,
  InputGroup,
  Input,
  VStack,
  Link,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Moralis } from "moralis";
//import { useMoralis } from "react-moralis";

//import { axios } from "axios";
const { default: axios } = require("axios");
const request = require("request");

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
//const MSTRKEY = process.env.MASTER_KEY;
const API_URL = "https://deep-index.moralis.io/api/v2/ipfs/uploadFolder"; //process.env.API_URL;
// xAPIKey available here: https://deep-index.moralis.io/api-docs/#/storage/uploadFolder
const API_KEY =
  "ZxAdOjknRMLOLF32VVigHMfeIe4VROiJUZeryjUnILgYyhGjEdbJCdjHLrQd0lSX"; //process.env.API_KEY;

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
  let IPFSLinks = {
    image: "",
    metadata: "",
  };
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

  const messageMarkup = (
    <Box>
      <Alert status="success">
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription display="block">
            Media and metadata uploaded to IPFS.
            <VStack>
              <Link href={IPFSLinkImage} isExternal>
                See image here <ExternalLinkIcon mx="2px" />
              </Link>
              <Link href={IPFSLinks.metadata} isExternal>
                See metadata here <ExternalLinkIcon mx="2px" />
              </Link>
            </VStack>
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
    ipfsArray = []; // holds all IPFS data
    metadataList = []; // holds metadata for all NFTs (could be a session store of data)
    promiseArray = []; // array of promises so that only if finished, will next promise be initiated
  };

  // upload ref to database
  const saveToDb = async (metaHash, imageHash, _editionSize) => {
    for (let i = 1; i < _editionSize + 1; i++) {
      let id = i.toString();
      let paddedHex = (
        "0000000000000000000000000000000000000000000000000000000000000000" + id
      ).slice(-64);
      let url = `https://ipfs.moralis.io:2053/ipfs/${metaHash}/metadata/${paddedHex}.json`;
      let options = { json: true };

      setIPFSLinkImage(url);
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
          FileDatabase.set("edition", body.edition);
          //FileDatabase.set("name", body.name);
          //FileDatabase.set("dna", body.dna);
          FileDatabase.set("image", body.image);
          //FileDatabase.set("attributes", body.attributes);
          FileDatabase.set("meta_hash", metaHash);
          FileDatabase.set("image_hash", imageHash);
          FileDatabase.save();

          console.log(IPFSLinks.image);
          console.log(IPFSLinks.metadata);
          console.log("ALL DONE");
          resetAll(true);
        }
      });
    }
  };

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
  const generateMetadata = (edition, path) => {
    let dateTime = Date.now();
    let tempMetadata = {
      //dna: dna.join(""),
      name: `#${edition}`,
      //description: description,
      image: path,
      edition: edition,
      date: dateTime,
      //attributes: attributesList
    };
    return tempMetadata;
  };

  // upload metadata
  const uploadMetadata = async (
    apiUrl,
    xAPIKey,
    imageCID,
    _totalFiles
    //_fileDataArray
  ) => {
    let fileDataArray = [];
    ipfsArray = []; // holds all IPFS data
    metadataList = []; // holds metadata for all NFTs (could be a session store of data)
    promiseArray = []; // array of promises so that only if finished, will next promise be initiated

    console.log(_totalFiles);

    // iterate through total number of files uploaded
    for (let i = 1; i < _totalFiles + 1; i++) {
      let id = i.toString();
      let paddedHex = (
        "0000000000000000000000000000000000000000000000000000000000000000" + id
      ).slice(-64);

      // create filepath to reference image uploaded
      fileDataArray[i] = {
        filePath: `https://ipfs.moralis.io:2053/ipfs/${imageCID}/images/${paddedHex}.png`,
      };
      console.log(fileDataArray[i].filePath);
      // do something else here after firstFunction completes
      let nftMetadata = generateMetadata(id, fileDataArray[i].filePath);
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
          console.log(ipfsArray);

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
                console.log("META FILE PATHS:", res.data);
                // save ref to IPFS
                saveToDb(metaCID, imageCID, _totalFiles);
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

  function uploadIPFS(_files) {
    totalFiles = _files.length;

    for (let i = 1; i < totalFiles + 1; i++) {
      let id = i.toString();
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
            console.log(ipfsArray);
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
                  console.log("IMAGE FILE PATHS:", res.data);
                  let imageCID = res.data[0].path.split("/")[4];
                  console.log("IMAGE CID:", imageCID);
                  // pass folder CID to meta data
                  uploadMetadata(
                    API_URL,
                    API_KEY,
                    imageCID,
                    totalFiles
                    //fileDataArray
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

  const handleSubmit = async (e) => {
    // stop interactions with buttons
    setLoading(true);
    // trigger upload from files via useState
    uploadIPFS(files);
  };

  /*   _isAuthenticated.isAuthenticated && loading
  ? true
  : _isAuthenticated.isAuthenticated
  ? false
  : true */

  return (
    <Box className="container text-center mt-5">
      {/*JSON.stringify(files)*/}
      {showMessage && !files[0] ? messageMarkup : ""}
      {showErrorMessage ? errorMarkup(errorMessage) : ""}
      <Box {...getRootProps({ style })}>
        <InputGroup size="md">
          <Input {...getInputProps()} />
        </InputGroup>
        {!isDragActive && "Click here or drop a file to upload!"}
        {isDragActive && !isDragReject && "Drop it like it's hot!"}
        {isDragReject && "File type not accepted, sorry!"}
        {isFileTooLarge && (
          <Box className="text-danger mt-2">File is too large.</Box>
        )}
      </Box>
      <aside>{thumbs}</aside>
      <Button
        id="files"
        colorScheme="teal"
        isFullWidth={true}
        onClick={handleSubmit}
        isLoading={loading}
        isDisabled={files[0] ? false : true}
        data-file={files}
        type="submit"
        textAlign="center"
      >
        Upload
      </Button>
    </Box>
  );
}
