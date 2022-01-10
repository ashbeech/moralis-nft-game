import React, { useState, useEffect } from "react";
import { useWeb3ExecuteFunction } from "react-moralis";
import { abi as contractAbi } from "../constants/abis/Token.json";
import { Text, VStack, Button, Box } from "@chakra-ui/react";

export default function QuickStart({ isServerInfo }) {
  const contractAddress = "0x18b053c8CBBC1AaA584ad9c5e12E507C1a42F16a";

  const contractProcessor = useWeb3ExecuteFunction();
  const { data, error, fetch, isFetching } = useWeb3ExecuteFunction();

  let [mounted, setMount] = useState(false);
  let [hashtroId, setHashtroId] = useState(null);
  let [hashtroData, setHashtro] = useState(null);

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
      onSuccess: () => console.log("Hashtro fed"),
      onComplete: () => console.log("Completed", data),
      onError: () => console.log("Error", error),
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
        onSuccess: () => console.log("Hashtro loaded"),
        onComplete: () => console.log("Completed", contractProcessor.data),
        onError: (error) => console.log("Error", error),
      });
    }
  }

  useEffect(() => {
    // updates the display after feeding
    if (hashtroId) {
      fetchData(hashtroId);
    }
  }, [hashtroId, data]); // <-- the above updates on these changing

  useEffect(() => {
    // updates the hashtro's state
    setHashtro(contractProcessor.data);
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

  function gameRenderer(_data) {
    if (!hashtroData) {
      return (
        <VStack>
          <Text>Nothing Loaded</Text>
        </VStack>
      );
    } else {
      let now = new Date();
      let deathStatus = "ALIVE";

      let deathTime = null;
      if (hashtroData != null) {
        deathTime = new Date(
          (parseInt(hashtroData.lastMeal) + parseInt(hashtroData.endurance)) *
            1000
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
            <Text>Damage: {hashtroData.damage}</Text>
          </Box>
          <Box>
            <Text>Power: {hashtroData.power}</Text>
          </Box>
          <Box>
            <Text>Endurance: {hashtroData.endurance}</Text>
          </Box>
        </VStack>
      );
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    setHashtroId(e.target.attributes["data-hashtro-id"].value);
  }
  function onFeed(e) {
    e.preventDefault();
    feedData(e.target.attributes["data-hashtro-id"].value);
  }

  return (
    <Box style={{ display: "flex", gap: "10px" }}>
      <Box>
        <VStack>
          <Button
            name="fetch"
            onClick={onSubmit}
            disabled={
              hashtroData === null && contractProcessor.isFetching === false
                ? false
                : true
            }
            colorScheme="green"
            size="lg"
            variant="solid"
            data-hashtro-id={0}
            leftIcon={"👨‍🚀"}
          >
            {"Fetch"}
          </Button>
          <Button
            name="feed"
            onClick={onFeed}
            disabled={hashtroData !== null || isFetching ? false : true}
            colorScheme="purple"
            size="lg"
            variant="solid"
            leftIcon={"🌮"}
            data-hashtro-id={0}
          >
            {"Feed"}
          </Button>
        </VStack>
        <>{gameRenderer(hashtroData)}</>
      </Box>
    </Box>
  );
}
