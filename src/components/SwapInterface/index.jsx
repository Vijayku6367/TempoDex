import React, { useState, useEffect, useCallback } from "react";
import "./SwapInterface.css";
import { ethers } from "ethers";

import { useWallet } from "../../contexts/WalletContext";
import { useNetwork } from "../../contexts/NetworkContext";
import { CONTRACTS, ROUTER_ABI, TOKEN_ABI } from "../../config/constants";

import TokenSelector from "../TokenSelector";
import SwapProgress from "../SwapProgress";

const SwapInterface = () => {
  const { signer, account, isConnected, balances } = useWallet();
  const { isCorrectNetwork } = useNetwork();

  const tokens = CONTRACTS.tokens;

  const [fromToken, setFromToken] = useState('TmEth');
  const [toToken, setToToken] = useState('OmUsd');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);

  const [isLoading, setIsLoading] = useState(false);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [priceImpact, setPriceImpact] = useState(0);
  const [swapProgress, setSwapProgress] = useState(null);
  const [showTokenSelector, setShowTokenSelector] = useState(null);

  /* ---------------- RESET ON TOKEN CHANGE ---------------- */
  useEffect(() => {
    setFromAmount('');
    setToAmount('');
    setExchangeRate(0);
    setPriceImpact(0);
    setQuoteError('');
  }, [fromToken, toToken]);

  /* ---------------- FETCH QUOTE ---------------- */
  const fetchQuote = useCallback(
    async (amount) => {
      if (
        !signer ||
        !amount ||
        Number(amount) <= 0 ||
        fromToken === toToken
      ) {
        setToAmount('');
        return;
      }

      setIsGettingQuote(true);
      setQuoteError('');

      try {
        const router = new ethers.Contract(
          CONTRACTS.core.router,
          ROUTER_ABI,
          signer
        );

        const amountIn = ethers.parseUnits(
          amount,
          tokens[fromToken].decimals
        );

        const path = [
          tokens[fromToken].address,
          tokens[toToken].address
        ];

        const amounts = await router.getAmountsOut(amountIn, path);
        const amountOut = ethers.formatUnits(
          amounts[1],
          tokens[toToken].decimals
        );

        setToAmount(Number(amountOut).toFixed(6));
        const rate = Number(amountOut) / Number(amount);
        setExchangeRate(rate);
        setPriceImpact(Math.abs(rate - 1) * 100);
      } catch (err) {
        console.error("Quote error:", err);
        setQuoteError('No liquidity for this pair');
        setToAmount('');
      } finally {
        setIsGettingQuote(false);
      }
    },
    [signer, fromToken, toToken, tokens]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (fromAmount) fetchQuote(fromAmount);
    }, 400);
    return () => clearTimeout(t);
  }, [fromAmount, fetchQuote]);

  /* ---------------- MAX (INSTANT) ---------------- */
  const handleMaxAmount = () => {
    if (!balances || balances[fromToken] === undefined) return;
    const max = balances[fromToken] * 0.999; // gas buffer
    setFromAmount(max.toFixed(6));
  };

  /* ---------------- SWAP TOKENS ---------------- */
  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
    setToAmount('');
  };

  /* ---------------- EXECUTE SWAP ---------------- */
  const executeSwap = async () => {
    if (!signer || !account || !fromAmount || !toAmount) return;

    setIsLoading(true);
    try {
      const router = new ethers.Contract(
        CONTRACTS.core.router,
        ROUTER_ABI,
        signer
      );
      const token = new ethers.Contract(
        tokens[fromToken].address,
        TOKEN_ABI,
        signer
      );

      const amountIn = ethers.parseUnits(
        fromAmount,
        tokens[fromToken].decimals
      );

      const minOut = ethers.parseUnits(
        (toAmount * (100 - slippage) / 100).toFixed(6),
        tokens[toToken].decimals
      );

      const allowance = await token.allowance(
        account,
        CONTRACTS.core.router
      );

      if (allowance < amountIn) {
        const approveTx = await token.approve(
          CONTRACTS.core.router,
          amountIn
        );
        setSwapProgress({
          step: 1,
          message: 'Approving tokens...',
          txHash: approveTx.hash
        });
        await approveTx.wait();
      }

      const deadline = Math.floor(Date.now() / 1000) + 600;
      const path = [
        tokens[fromToken].address,
        tokens[toToken].address
      ];

      setSwapProgress({
        step: 2,
        message: 'Swapping tokens...',
      });

      const tx = await router.swapExactTokensForTokens(
        amountIn,
        minOut,
        path,
        account,
        deadline
      );

      setSwapProgress({
        step: 3,
        message: 'Swap submitted',
        txHash: tx.hash
      });

      await tx.wait();
      
      setSwapProgress({
        step: 4,
        message: 'Swap completed successfully!',
        isSuccess: true
      });
      
      setFromAmount('');
      setToAmount('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSwapProgress(null);
      }, 3000);
    } catch (err) {
      console.error("Swap error:", err);
      setSwapProgress({
        step: 0,
        message: err.reason || err.message || 'Swap failed',
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- BUTTON STATE ---------------- */
  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (!isCorrectNetwork) return 'Switch Network';
    if (!fromAmount) return 'Enter Amount';
    if (fromToken === toToken) return 'Select Different Tokens';
    if (quoteError) return 'No Liquidity';
    if (isLoading) return 'Processing...';
    return 'Swap';
  };

  const buttonDisabled = 
    !isConnected ||
    !isCorrectNetwork ||
    !fromAmount ||
    Number(fromAmount) <= 0 ||
    fromToken === toToken ||
    isLoading ||
    quoteError;

  return (
    <div className="swap-interface">
      <div className="swap-card glass-card">
        <h2>Swap</h2>

        {/* FROM */}
        <div className="input-section">
          <div className="input-header">
            <span>From</span>
            <button 
              className="max-button" 
              onClick={handleMaxAmount}
              disabled={!balances || !balances[fromToken]}
            >
              MAX
            </button>
          </div>

          <div className="input-wrapper">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="amount-input"
              disabled={!isConnected}
              step="any"
              min="0"
            />
            <button
              className="token-selector-button"
              onClick={() => setShowTokenSelector('from')}
              disabled={!isConnected}
            >
              <span>{tokens[fromToken]?.symbol || 'Select'}</span>
              <span className="token-selector-arrow">▼</span>
            </button>
          </div>

          <div className="balance-info">
            <span>Balance:</span>
            <span className="balance-value">
              {(balances && balances[fromToken] !== undefined) 
                ? balances[fromToken].toFixed(6) 
                : '0.000000'}
            </span>
          </div>
        </div>

        {/* SWITCH */}
        <div className="swap-divider">
          <button 
            className="swap-direction-button" 
            onClick={handleSwapTokens}
            disabled={!isConnected}
          >
            <span className="swap-direction-icon">⇄</span>
          </button>
        </div>

        {/* TO */}
        <div className="input-section">
          <div className="input-wrapper">
            <input
              value={isGettingQuote ? '...' : toAmount}
              readOnly
              className="amount-input"
              placeholder="0.0"
            />
            <button
              className="token-selector-button"
              onClick={() => setShowTokenSelector('to')}
              disabled={!isConnected}
            >
              <span>{tokens[toToken]?.symbol || 'Select'}</span>
              <span className="token-selector-arrow">▼</span>
            </button>
          </div>
          
          <div className="balance-info">
            <span>Balance:</span>
            <span className="balance-value">
              {(balances && balances[toToken] !== undefined) 
                ? balances[toToken].toFixed(6) 
                : '0.000000'}
            </span>
          </div>
        </div>

        {/* PRICE INFO */}
        {exchangeRate > 0 && !quoteError && (
          <div className="price-info">
            <div className="price-row">
              <span>Rate:</span>
              <span>1 {tokens[fromToken]?.symbol} = {exchangeRate.toFixed(6)} {tokens[toToken]?.symbol}</span>
            </div>
            {priceImpact > 0.5 && (
              <div className="price-row">
                <span>Price Impact:</span>
                <span className={priceImpact > 5 ? 'warning' : ''}>
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}

        {quoteError && <div className="quote-error">{quoteError}</div>}

        <button
          className={`swap-button ${buttonDisabled ? 'disabled' : 'active'}`}
          disabled={buttonDisabled}
          onClick={executeSwap}
        >
          {getButtonText()}
        </button>

        {/* SLIPPAGE SETTINGS */}
        <div className="slippage-settings">
          <div className="slippage-header">
            <span>Slippage Tolerance</span>
            <span>{slippage}%</span>
          </div>
          <div className="slippage-options">
            {[0.1, 0.5, 1.0].map((value) => (
              <button
                key={value}
                className={`slippage-option ${slippage === value ? 'active' : ''}`}
                onClick={() => setSlippage(value)}
              >
                {value}%
              </button>
            ))}
            <div className="slippage-custom">
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                min="0.1"
                max="50"
                step="0.1"
              />
              <span>%</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOKEN SELECTOR MODAL */}
      {showTokenSelector && (
        <TokenSelector
          currentToken={showTokenSelector === 'from' ? fromToken : toToken}
          onSelect={(t) => {
            if (showTokenSelector === 'from') {
              setFromToken(t);
            } else {
              setToToken(t);
            }
            setShowTokenSelector(null);
          }}
          onClose={() => setShowTokenSelector(null)}
        />
      )}

      {/* SWAP PROGRESS MODAL */}
      {swapProgress && <SwapProgress progress={swapProgress} />}
    </div>
  );
};

export default SwapInterface;
