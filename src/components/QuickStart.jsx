import { Card, Timeline } from "antd";
import React, { useMemo } from "react";
import { useMoralis, useWeb3ExecuteFunction } from "react-moralis";
import { abi as contractAbi } from "../constants/abis/Token.json";
import { Text, Image, Container, VStack, Box } from "@chakra-ui/react";

//const { Text } = Typography;

const styles = {
  title: {
    fontSize: "20px",
    fontWeight: "700",
  },
  text: {
    fontSize: "16px",
  },
  card: {
    boxShadow: "0 0.5rem 1.2rem rgb(189 197 209 / 20%)",
    border: "1px solid #e7eaf3",
    borderRadius: "0.5rem",
  },
  timeline: {
    marginBottom: "-45px",
  },
};

export default function QuickStart({ isServerInfo }) {
  const { Moralis } = useMoralis();

  /*   const isInchDex = useMemo(
    () => (Moralis.Plugins?.oneInch ? true : false),
    [Moralis.Plugins?.oneInch]
  ); */

  const { data, error, fetch, isFetching } = useWeb3ExecuteFunction();
  // the deplyed Token contract
  let contractAddress = "0x2bE349ffF31E9D1bb5CD2339376A7406655727bC";

  // move this to later after data from contract is retrieved.
  /*   let deathTime = new Date(
    (parseInt(data.lastMeal) + parseInt(data.endurance)) * 1000
  ); */
  const options = {
    abi: contractAbi,
    contractAddress,
    functionName: "getTokenDetails",
    params: {
      tokenId: [0],
    },
  };

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <div>
        <button
          onClick={() => fetch({ params: options })}
          disabled={isFetching}
        >
          Fetch data
        </button>
        {data && (
          <>
            <VStack>
              <Box>
                <Text>Damage: {data.damage}</Text>
              </Box>
              <Box>
                <Text>Power: {data.power}</Text>
              </Box>
              <Box>
                <Text>Endurance: {data.endurance}</Text>
              </Box>
              <Box>
                <Text>Deathtime: {/*deathTime*/}</Text>
              </Box>
            </VStack>
          </>
        )}
        {error && <pre>{JSON.stringify(error)}</pre>}
      </div>
    </div>
  );
}
