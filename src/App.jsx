import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  Text,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { Alchemy, Network, Utils } from "alchemy-sdk";
import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";

// Basic debounce implementation
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const injected = new InjectedConnector();

function App() {
  const { activate, deactivate, active } = useWeb3React();
  const [userAddress, setUserAddress] = useState("");
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const toast = useToast();

  const fetchTokenBalance = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const config = {
        apiKey: "_0uETKZZjS8Gj3EpFLVrP9R0qO7TzfVk",
        network: Network.ETH_MAINNET,
      };

      const alchemy = new Alchemy(config);

      let resolvedAddress = userAddress;
      if (ethers.utils.isAddress(userAddress)) {
        resolvedAddress = await ethers.utils.getAddress(userAddress);
      } else if (ethers.utils.isValidEnsName(userAddress)) {
        resolvedAddress = await alchemy.core.resolveName(userAddress);
      } else {
        throw new Error("Invalid address or ENS name.");
      }

      const data = await alchemy.core.getTokenBalances(resolvedAddress);

      setResults(data);

      const tokenDataPromises = data.tokenBalances.map((tokenBalance) =>
        alchemy.core.getTokenMetadata(tokenBalance.contractAddress)
      );

      setTokenDataObjects(await Promise.all(tokenDataPromises));
      setHasQueried(true);
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching token balances.");
      toast({
        title: "Error",
        description: err.message || "An error occurred while fetching token balances.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
    setIsLoading(false);
  }, [userAddress, toast]);

  // Use the debounce function
  const debouncedFetchTokenBalance = useCallback(debounce(fetchTokenBalance, 300), [fetchTokenBalance]);

  useEffect(() => {
    if (userAddress) {
      debouncedFetchTokenBalance();
    }
  }, [userAddress, debouncedFetchTokenBalance]);

  return (
    <Box w="100vw" minH="100vh" bg="gray.800" color="white" p={4}>
      <Center>
        <Flex
          alignItems={"center"}
          justifyContent="center"
          flexDirection={"column"}
          mb={8}
        >
          <Heading mb={2} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text mb={4}>
            Connect your wallet and check ERC-20 token balances of any address!
          </Text>
          {active ? (
            <Button onClick={() => deactivate()} mb={4}>
              Disconnect Wallet
            </Button>
          ) : (
            <Button onClick={() => activate(injected)} mb={4}>
              Connect Wallet
            </Button>
          )}
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={"center"}
      >
        <Heading mt={4} mb={4}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button
          fontSize={20}
          onClick={fetchTokenBalance}
          mt={4}
          bgColor="blue.500"
          color="white"
          _hover={{ bg: "blue.600" }}
        >
          Check ERC-20 Token Balances
        </Button>
        {isLoading && <Spinner size="xl" mt={4} />}
        {error && <Text color="red.500" mt={4}>{error}</Text>}
        <Heading my={4}>ERC-20 Token Balances:</Heading>
        {hasQueried && (
          <Flex wrap="wrap" justify="center">
            {results.tokenBalances.map((e, i) => (
              <Box
                key={e.id}
                bg="blue.600"
                p={4}
                borderRadius="md"
                m={2}
                minW="200px"
                maxW="250px"
                textAlign="center"
                boxShadow="lg"
              >
                <Text>
                  <b>Symbol:</b> {tokenDataObjects[i].symbol}
                </Text>
                <Text>
                  <b>Balance:</b>{" "}
                  {Utils.formatUnits(
                    e.tokenBalance,
                    tokenDataObjects[i].decimals
                  )}
                </Text>
                {tokenDataObjects[i].logo && (
                  <Image
                    src={tokenDataObjects[i].logo}
                    alt="Token logo"
                    boxSize="50px"
                    mt={2}
                    mx="auto"
                  />
                )}
              </Box>
            ))}
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

export default App;
