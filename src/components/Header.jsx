// src/components/Header.jsx
import React, { useState } from "react";
import "./Header.css";

import { useWallet } from "../contexts/WalletContext";
import { useNetwork } from "../contexts/NetworkContext";

// SVG assets
import TempoLogo from "../assets/logo/tempodex.svg";
import MetamaskIcon from "../assets/icons/metamask.svg";
import WalletConnectIcon from "../assets/icons/walletconnect.svg";
import CoinbaseIcon from "../assets/icons/coinbase.svg";
import CloseIcon from "../assets/icons/close.svg";

const Header = ({ activeTab, onTabChange }) => {
  const {
    account,
    ensName,
    isConnected,
    connectMetaMask,
    connectWalletConnect,
    connectCoinbase,
    disconnect,
  } = useWallet();

  const {
    isCorrectNetwork,
    isSwitching,
    switchToTempo,
    blockNumber,
  } = useNetwork();

  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const formatAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const handleWalletConnect = async (type) => {
    try {
      if (type === "metamask") await connectMetaMask();
      if (type === "walletconnect") await connectWalletConnect();
      if (type === "coinbase") await connectCoinbase();
      setShowWalletMenu(false);
    } catch (e) {
      console.error("Wallet connect failed:", e);
    }
  };

  return (
    <header className="header">
      <div className="header-container">

        {/* ===== LEFT : LOGO ===== */}
        <div className="logo-section">
          <div className="logo">
            <img src={TempoLogo} alt="TempoDEX" className="logo-icon" />
            <h1>
              Tempo<span className="logo-accent">DEX</span>
            </h1>
          </div>

          {isConnected && blockNumber && (
            <div className="block-info">
              Block {Number(blockNumber).toLocaleString()}
            </div>
          )}
        </div>

        {/* ===== CENTER : DESKTOP NAV ===== */}
        <div className="desktop-nav">
          <button
            className={`nav-link ${activeTab === "swap" ? "active" : ""}`}
            onClick={() => onTabChange("swap")}
          >
            Swap
          </button>

          <button
            className={`nav-link ${activeTab === "liquidity" ? "active" : ""}`}
            onClick={() => onTabChange("liquidity")}
          >
            Liquidity
          </button>

          <button
            className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => onTabChange("dashboard")}
          >
            Dashboard
          </button>
        </div>

        {/* ===== RIGHT : WALLET ===== */}
        <div className="header-controls">

          {isConnected && !isCorrectNetwork && (
            <button
              className="network-warning-button"
              onClick={switchToTempo}
              disabled={isSwitching}
            >
              {isSwitching ? "Switching..." : "Switch to Tempo"}
            </button>
          )}

          {isConnected && isCorrectNetwork && (
            <div className="network-indicator">
              <span className="network-dot" />
              Tempo
            </div>
          )}

          {isConnected ? (
            <div className="wallet-display">
              <span className="wallet-address">
                {ensName || formatAddress(account)}
              </span>
              <button className="disconnect-button" onClick={disconnect}>
                Disconnect
              </button>
            </div>
          ) : (
            <button
              className="connect-wallet-button"
              onClick={() => setShowWalletMenu(true)}
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* ===== WALLET MODAL ===== */}
        {showWalletMenu && !isConnected && (
          <div className="wallet-menu">
            <div className="wallet-menu-header">
              <h3>Connect Wallet</h3>
              <button
                className="close-menu"
                onClick={() => setShowWalletMenu(false)}
              >
                <img src={CloseIcon} alt="Close" />
              </button>
            </div>

            <div className="wallet-options">
              <button
                className="wallet-option"
                onClick={() => handleWalletConnect("metamask")}
              >
                <img src={MetamaskIcon} alt="MetaMask" />
                <span>MetaMask</span>
              </button>

              <button
                className="wallet-option"
                onClick={() => handleWalletConnect("walletconnect")}
              >
                <img src={WalletConnectIcon} alt="WalletConnect" />
                <span>WalletConnect</span>
              </button>

              <button
                className="wallet-option"
                onClick={() => handleWalletConnect("coinbase")}
              >
                <img src={CoinbaseIcon} alt="Coinbase" />
                <span>Coinbase Wallet</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;
