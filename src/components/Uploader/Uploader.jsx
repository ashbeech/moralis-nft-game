import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Button, InputGroup, Input } from "@chakra-ui/react";
import { Moralis } from "moralis";

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

const ipfsArray = []; // holds all IPFS data
const metadataList = []; // holds metadata for all NFTs (could be a session store of data)
const promiseArray = []; // array of promises so that only if finished, will next promise be initiated

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

export default function Uploader() {
  const [files, setFiles] = useState([]);
  const maxSize = 1048576;
  let totalFiles = 0;

  // upload to database
  const saveToDb = async (metaHash, imageHash, _editionSize) => {
    for (let i = 1; i < _editionSize + 1; i++) {
      let id = i.toString();
      let paddedHex = (
        "0000000000000000000000000000000000000000000000000000000000000000" + id
      ).slice(-64);
      let url = `https://ipfs.moralis.io:2053/ipfs/${metaHash}/metadata/${paddedHex}.json`;
      let options = { json: true };

      request(url, options, (error, res, body) => {
        if (error) {
          return console.log(error);
        }

        if (!error && res.statusCode == 200) {
          // Save file reference to Moralis
          const FileDatabase = new Moralis.Object("Metadata");
          FileDatabase.set("edition", body.edition);
          //FileDatabase.set("name", body.name);
          //FileDatabase.set("dna", body.dna);
          FileDatabase.set("image", body.image);
          //FileDatabase.set("attributes", body.attributes);
          FileDatabase.set("meta_hash", metaHash);
          FileDatabase.set("image_hash", imageHash);
          FileDatabase.save();
        }
      });
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    console.log(acceptedFiles);
    console.log(getInputProps);

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

  // clean up
  useEffect(
    () => () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    },
    [files]
  );

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
    const ipfsArray = []; // holds all IPFS data
    const fileDataArray = [];
    const metadataList = []; // holds metadata for all NFTs (could be a session store of data)
    const promiseArray = []; // array of promises so that only if finished, will next promise be initiated

    console.log(_totalFiles);

    for (let i = 1; i < _totalFiles + 1; i++) {
      let id = i.toString();
      let paddedHex = (
        "0000000000000000000000000000000000000000000000000000000000000000" + id
      ).slice(-64);

      //fileDataArray[i].push;
      fileDataArray[i] = {
        filePath: `https://ipfs.moralis.io:2053/ipfs/${imageCID}/images/${paddedHex}.png`,
      };
      console.log(fileDataArray[i].filePath);
      // do something else here after firstFunction completes
      let nftMetadata = generateMetadata(
        /*
        fileDataArray[i].newDna,
        fileDataArray[i].editionCount,
        fileDataArray[i].attributesList,
        */
        id,
        fileDataArray[i].filePath
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
                let metaCID = res.data[0].path.split("/")[4];
                console.log("META FILE PATHS:", res.data);
                saveToDb(metaCID, imageCID, _totalFiles);
                //writeMetaData(base64String);
              })
              .catch((err) => {
                console.log(err);
              });
          });
        })
      );

      console.log("COMPLETED");
    }
  };

  function uploadIPFS(_files) {
    //ipfsArray = [];
    //promiseArray = [];

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
                  console.log(err);
                });
            });
          })
        );
        //let fileName = _files.name
        //handlePictureDropUpload(base64String, "TEST IMAGE");
      };
      reader.readAsDataURL(_files[0]);
    }
  }

  const handleSubmit = async (e) => {
    // take files passed to upload button, but could just useState version
    //uploadIPFS(e.target.attributes["data-file"].value);
    uploadIPFS(files);
  };

  return (
    <Box className="container text-center mt-5">
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
        //isLoading={loading}
        //spinner={<MoonLoader />}
        isDisabled={files[0] ? false : true}
        data-file={files}
        type="submit"
        textAlign="center"
      >
        Upload
      </Button>
    </Box>
  );

  // UI
  /*   return (
    <Box style={{ display: "flex", gap: "10px" }}>
      <Dropzone />
    </Box>
  ); */
}
