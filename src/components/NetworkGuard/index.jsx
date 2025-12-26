// components/NetworkGuard.js
import React, { useEffect } from 'react';
import './NetworkGuard.css';
import { useNetwork } from "../../contexts/NetworkContext";
import { useWallet } from "../../contexts/WalletContext";
import { TEMPO_NETWORK } from "../../config/constants";

const NetworkGuard = () => {
  const { isConnected } = useWallet();
  const { currentChainId, isCorrectNetwork, isSwitching, switchToTempo } = useNetwork();

  if (!isConnected || isCorrectNetwork) return null;

  return (
    <div className="network-guard-overlay">
      <div className="network-guard-modal">
        <div className="network-guard-icon">⚠️</div>
        <h2>Wrong Network</h2>
        <p className="network-guard-description">
          You are connected to network ID {currentChainId || 'Unknown'}.<br />
          Please switch to Tempo Testnet (Chain ID: {TEMPO_NETWORK.chainId}) to continue.
        </p>
        <button
          className="network-guard-button"
          onClick={switchToTempo}
          disabled={isSwitching}
        >
          {isSwitching ? 'Switching...' : `Switch to ${TEMPO_NETWORK.name}`}
        </button>
        <div className="network-guard-hint">
          If the switch fails, please add the network manually in your wallet:
          <div className="network-details">
            <div>RPC URL: {TEMPO_NETWORK.rpc}</div>
            <div>Chain ID: {TEMPO_NETWORK.chainId}</div>
            <div>Symbol: {TEMPO_NETWORK.symbol}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGuard;
