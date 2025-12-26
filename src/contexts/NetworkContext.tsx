// contexts/NetworkContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { TEMPO_NETWORK } from '../config/constants';

const NetworkContext = createContext();

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }) => {
  const [currentChainId, setCurrentChainId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [blockNumber, setBlockNumber] = useState(null);

  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      setCurrentChainId(Number(network.chainId));
      setIsCorrectNetwork(Number(network.chainId) === TEMPO_NETWORK.chainId);
    } catch (error) {
      console.error('Network check failed:', error);
    }
  }, []);

  const switchToTempo = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('Wallet not connected');
    }

    setIsSwitching(true);
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${TEMPO_NETWORK.chainId.toString(16)}` }],
      });
      
      await checkNetwork();
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${TEMPO_NETWORK.chainId.toString(16)}`,
                chainName: TEMPO_NETWORK.name,
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: [TEMPO_NETWORK.rpc],
                blockExplorerUrls: [TEMPO_NETWORK.explorer]
              }
            ]
          });
          await checkNetwork();
        } catch (addError) {
          throw new Error('Failed to add Tempo network');
        }
      } else {
        throw switchError;
      }
    } finally {
      setIsSwitching(false);
    }
  }, [checkNetwork]);

  useEffect(() => {
    if (window.ethereum) {
      checkNetwork();
      
      const handleChainChanged = () => {
        checkNetwork();
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [checkNetwork]);

  useEffect(() => {
    const fetchBlockNumber = async () => {
      if (isCorrectNetwork && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const block = await provider.getBlockNumber();
          setBlockNumber(block);
        } catch (error) {
          console.error('Failed to fetch block:', error);
        }
      }
    };

    fetchBlockNumber();
    const interval = setInterval(fetchBlockNumber, 15000);
    
    return () => clearInterval(interval);
  }, [isCorrectNetwork]);

  const value = {
    currentChainId,
    isCorrectNetwork,
    isSwitching,
    blockNumber,
    switchToTempo,
    checkNetwork
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};
