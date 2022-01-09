import React, { useState, useEffect } from "react";
import { useWeb3ExecuteFunction } from "react-moralis";
import { abi as contractAbi } from "../constants/abis/Token.json";
import { Text, VStack, Button, Box } from "@chakra-ui/react";

export default function QuickStart({ isServerInfo }) {
  const contractAddress = "0x072991514eB62CF5bB7202bfcA9AE87a5c6A2794";

  const contractProcessor = useWeb3ExecuteFunction();
  const { data, error, fetch, isFetching } = useWeb3ExecuteFunction();

  let [petId, setPetId] = useState(null);
  let [petData, setPet] = useState(null);
  let [mounted, setMount] = useState(false);

  //will run on componentDidMount
  useEffect(() => {
    setMount(true);
  }, []);

  async function feedData(_id) {
    const options = {
      abi: contractAbi,
      contractAddress,
      functionName: "feed",
      params: {
        tokenId: _id,
      },
    };

    await fetch({
      params: options,
      onSuccess: () => console.log("Pet fed"),
      onError: () => console.log(error),
    });
  }

  async function fetchData(_id) {
    if (mounted && isServerInfo) {
      const options = {
        abi: contractAbi,
        contractAddress,
        functionName: "getTokenDetails",
        params: {
          tokenId: _id,
        },
      };

      await contractProcessor.fetch({
        params: options,
        onSuccess: () => console.log("Pet loaded"),
        onError: (error) => console.log(error),
      });
    }
  }

  useEffect(() => {
    // updates the display after feeding
    if (petId) {
      fetchData(petId);
    }
  }, [petId, data]); // <-- the above updates on these changing

  useEffect(() => {
    // updates the pet's state
    setPet(contractProcessor.data);
  }, [contractProcessor.data]); // <-- the above updates on this changing

  // date formatting
  function addLeadingZeros(n) {
    if (n <= 9) {
      return "0" + n;
    }
    return n;
  }

  function deathTimeRender(_deathTime) {
    return (
      addLeadingZeros(_deathTime.getDate()) +
      "/" +
      addLeadingZeros(_deathTime.getMonth() + 1) +
      "/" +
      _deathTime.getFullYear() +
      " " +
      addLeadingZeros(_deathTime.getHours()) +
      ":" +
      addLeadingZeros(_deathTime.getMinutes()) +
      ":" +
      addLeadingZeros(_deathTime.getSeconds())
    );
  }

  function gameRendered(_data) {
    // Debug
    //console.log("RENDER DISPLAY");

    if (!petData) {
      return (
        <VStack>
          <Text>Nothing Loaded</Text>
        </VStack>
      );
    } else {
      let now = new Date();
      let deathStatus = "ALIVE";

      let deathTime = null;
      if (petData != null) {
        deathTime = new Date(
          (parseInt(petData.lastMeal) + parseInt(petData.endurance)) * 1000
        );
      }
      if (now > deathTime) {
        deathStatus = "DEAD";
      }

      return (
        <VStack>
          <Box>
            <Text>Status: {deathStatus}</Text>
          </Box>
          <Box>
            <Text>Deathtime: {deathTimeRender(deathTime)}</Text>
          </Box>
          <Box>
            <Text>Damage: {petData.damage}</Text>
          </Box>
          <Box>
            <Text>Power: {petData.power}</Text>
          </Box>
          <Box>
            <Text>Endurance: {petData.endurance}</Text>
          </Box>
        </VStack>
      );
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    setPetId(e.target.attributes["data-pet-id"].value);
  }
  function onFeed(e) {
    e.preventDefault();
    feedData(e.target.attributes["data-pet-id"].value);
  }

  return (
    <Box style={{ display: "flex", gap: "10px" }}>
      <Box>
        <VStack>
          <Button
            name="fetch"
            onClick={onSubmit}
            disabled={
              petData === null && contractProcessor.isFetching === false
                ? false
                : true
            }
            colorScheme="green"
            size="lg"
            variant="solid"
            data-pet-id={0}
            leftIcon={"👨‍🚀"}
          >
            {"Fetch"}
          </Button>
          <Button
            name="feed"
            onClick={onFeed}
            disabled={petData !== null || isFetching ? false : true}
            colorScheme="purple"
            size="lg"
            variant="solid"
            leftIcon={"🌮"}
            data-pet-id={0}
          >
            {"Feed"}
          </Button>
        </VStack>
        <>{gameRendered(petData)}</>
      </Box>
    </Box>
  );
}
