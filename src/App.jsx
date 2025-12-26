// src/App.jsx
import React, { useState, useEffect } from "react";
import "./App.css";

import Header from "./components/Header";
import SwapInterface from "./components/SwapInterface";
import Dashboard from "./components/Dashboard";
import TokenMinter from "./components/TokenMinter";
import LiquidityManager from "./components/LiquidityManager";
import TransactionHistory from "./components/TransactionHistory";
import BottomNavigation from "./components/BottomNavigation";
import NetworkGuard from "./components/NetworkGuard";

import { useWallet } from "./contexts/WalletContext";

function App() {
  const { isConnected } = useWallet();

  const [activeTab, setActiveTab] = useState("swap");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="connect-prompt">
          <div className="glass-card">
            <h2>Connect Wallet</h2>
            <p>Connect your wallet to start trading on Tempo DEX</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "swap":
        return <SwapInterface />;
      case "liquidity":
        return <LiquidityManager />;
      case "dashboard":
        return <Dashboard />;
      default:
        return <SwapInterface />;
    }
  };

  return (
    <div className="app">
      <NetworkGuard />

      {/* 🔥 FIX HERE */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="main-content">
        <div className="container">
          {renderContent()}

          {isConnected && (
            <>
              <TokenMinter />
              <TransactionHistory />
            </>
          )}
        </div>
      </main>

      {/* Mobile Nav */}
      {isMobile && isConnected && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
}

export default App;
