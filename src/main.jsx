import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ChakraProvider } from '@chakra-ui/react';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

function getLibrary(provider) {
  return new Web3Provider(provider);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <ChakraProvider>
        <App />
      </ChakraProvider>
    </Web3ReactProvider>
  </React.StrictMode>
);
// rhis is the main code