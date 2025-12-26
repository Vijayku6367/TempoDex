// components/TokenMinter.js
import React, { useState } from 'react';
import './TokenMinter.css';
import { ethers } from 'ethers';
import { useWallet } from "../../contexts/WalletContext";
import { useNetwork } from "../../contexts/NetworkContext";
import { CONTRACTS, TOKEN_ABI, MINT_AMOUNTS } from "../../config/constants";
import { TEMPO_NETWORK } from "../../config/constants";

const TokenMinter = () => {
  const { signer, account } = useWallet();
  const { isCorrectNetwork } = useNetwork();
  const [isMinting, setIsMinting] = useState(false);
  const [mintProgress, setMintProgress] = useState({});
  const [txHashes, setTxHashes] = useState({});
  const [error, setError] = useState(null);

  const mintTokens = async () => {
    if (!signer || !account || !isCorrectNetwork) {
      setError('Connect wallet and switch to Tempo network');
      return;
    }

    setIsMinting(true);
    setError(null);
    setMintProgress({});
    setTxHashes({});

    try {
      for (const [key, token] of Object.entries(CONTRACTS.tokens)) {
        try {
          setMintProgress(prev => ({ ...prev, [key]: 'Signing...' }));

          const contract = new ethers.Contract(token.address, TOKEN_ABI, signer);
          const mintAmount = MINT_AMOUNTS[key];
          
          const tx = await contract.mint(mintAmount);
          setTxHashes(prev => ({ ...prev, [key]: tx.hash }));
          setMintProgress(prev => ({ ...prev, [key]: 'Processing...' }));

          await tx.wait();
          setMintProgress(prev => ({ ...prev, [key]: 'Completed' }));

        } catch (tokenError) {
          console.error(`Failed to mint ${key}:`, tokenError);
          setMintProgress(prev => ({ ...prev, [key]: 'Failed' }));
        }
      }

      setTimeout(() => {
        setMintProgress({});
        setTxHashes({});
      }, 10000);

    } catch (error) {
      setError(error.message || 'Minting failed');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="token-minter">
      <div className="glass-card">
        <div className="minter-header">
          <h3>Get Test Tokens</h3>
          <div className="minter-description">
            Mint 1000 test tokens of each type directly to your wallet
          </div>
        </div>

        <div className="token-list-minter">
          {Object.entries(CONTRACTS.tokens).map(([key, token]) => (
            <div key={key} className="token-minter-item">
              <div className="token-minter-info">
                <div className="token-icon-small">{token.symbol.charAt(0)}</div>
                <div>
                  <div className="token-symbol">{token.symbol}</div>
                  <div className="token-name">{token.name}</div>
                </div>
              </div>
              <div className="minter-status">
                {mintProgress[key] && (
                  <div className={`status-indicator ${mintProgress[key].toLowerCase()}`}>
                    {mintProgress[key]}
                  </div>
                )}
                {txHashes[key] && (
                  <a
                    href={`${TEMPO_NETWORK.explorer}/tx/${txHashes[key]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    View ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="minter-error">
            ⚠️ {error}
          </div>
        )}

        <button
          className="mint-button"
          onClick={mintTokens}
          disabled={isMinting || !signer || !isCorrectNetwork}
        >
          {isMinting ? 'Minting...' : 'Mint All Tokens'}
        </button>

        <div className="minter-note">
          Note: Each mint transaction requires gas fees on Tempo testnet
        </div>
      </div>
    </div>
  );
};

export default TokenMinter;
