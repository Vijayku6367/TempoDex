// components/LiquidityManager.js
import React, { useState, useEffect, useCallback } from 'react';
import './LiquidityManager.css';
import { ethers } from 'ethers';
import { useWallet } from "../../contexts/WalletContext";
import { useNetwork } from "../../contexts/NetworkContext";
import { CONTRACTS, ROUTER_ABI, TOKEN_ABI, FACTORY_ABI, PAIR_ABI } from "../../config/constants";
import TokenSelector from "../TokenSelector";

const LiquidityManager = () => {
  const { signer, account } = useWallet();
  const { isCorrectNetwork } = useNetwork();
  const [tokenA, setTokenA] = useState('TmEth');
  const [tokenB, setTokenB] = useState('OmUsd');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(true);
  const [liquidity, setLiquidity] = useState('');
  const [poolShare, setPoolShare] = useState(0);
  const [reserves, setReserves] = useState({ reserveA: 0, reserveB: 0 });
  const [showTokenSelector, setShowTokenSelector] = useState(null);
  const [lpBalance, setLpBalance] = useState(0);

  const tokens = CONTRACTS.tokens;

  const fetchPoolData = useCallback(async () => {
    if (!signer || tokenA === tokenB) return;

    try {
      const factory = new ethers.Contract(CONTRACTS.core.factory, FACTORY_ABI, signer);
      const pairAddress = await factory.getPair(
        tokens[tokenA].address,
        tokens[tokenB].address
      );

      if (pairAddress === ethers.ZeroAddress) {
        setReserves({ reserveA: 0, reserveB: 0 });
        setPoolShare(0);
        setLpBalance(0);
        return;
      }

      const pair = new ethers.Contract(pairAddress, PAIR_ABI, signer);
      const [reserve0, reserve1] = await pair.getReserves();
      const token0 = await pair.token0();

      const isTokenAFirst = token0.toLowerCase() === tokens[tokenA].address.toLowerCase();
      const reserveA = isTokenAFirst ? reserve0 : reserve1;
      const reserveB = isTokenAFirst ? reserve1 : reserve0;

      const formattedReserveA = ethers.formatUnits(reserveA, tokens[tokenA].decimals);
      const formattedReserveB = ethers.formatUnits(reserveB, tokens[tokenB].decimals);

      setReserves({
        reserveA: Number(formattedReserveA),
        reserveB: Number(formattedReserveB)
      });

      if (account) {
        const balance = await pair.balanceOf(account);
        const totalSupply = await pair.totalSupply();
        
        const formattedBalance = ethers.formatUnits(balance, 18);
        const formattedTotal = ethers.formatUnits(totalSupply, 18);
        
        setLpBalance(Number(formattedBalance));
        setPoolShare((Number(formattedBalance) / Number(formattedTotal)) * 100);
      }

    } catch (error) {
      console.error('Failed to fetch pool data:', error);
    }
  }, [signer, tokenA, tokenB, tokens, account]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  useEffect(() => {
    if (!amountA || !reserves.reserveA || !reserves.reserveB) {
      setAmountB('');
      return;
    }

    const amount = (Number(amountA) * reserves.reserveB) / reserves.reserveA;
    setAmountB(amount.toFixed(6));
  }, [amountA, reserves]);

  const handleMaxLiquidity = () => {
    setLiquidity(lpBalance.toString());
  };

  const addLiquidity = async () => {
    if (!signer || !account || !amountA || !amountB || !isCorrectNetwork) return;

    setIsLoading(true);

    try {
      const router = new ethers.Contract(CONTRACTS.core.router, ROUTER_ABI, signer);
      
      const amountADesired = ethers.parseUnits(amountA, tokens[tokenA].decimals);
      const amountBDesired = ethers.parseUnits(amountB, tokens[tokenB].decimals);

      const tokenAContract = new ethers.Contract(tokens[tokenA].address, TOKEN_ABI, signer);
      const tokenBContract = new ethers.Contract(tokens[tokenB].address, TOKEN_ABI, signer);

      const allowanceA = await tokenAContract.allowance(account, CONTRACTS.core.router);
      const allowanceB = await tokenBContract.allowance(account, CONTRACTS.core.router);

      if (allowanceA < amountADesired) {
        await tokenAContract.approve(CONTRACTS.core.router, amountADesired);
      }
      if (allowanceB < amountBDesired) {
        await tokenBContract.approve(CONTRACTS.core.router, amountBDesired);
      }

      const deadline = Math.floor(Date.now() / 1000) + 600;
      
      const tx = await router.addLiquidity(
        tokens[tokenA].address,
        tokens[tokenB].address,
        amountADesired,
        amountBDesired,
        amountADesired * 95n / 100n,
        amountBDesired * 95n / 100n,
        account,
        deadline
      );

      await tx.wait();
      
      setAmountA('');
      setAmountB('');
      await fetchPoolData();

    } catch (error) {
      console.error('Add liquidity failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeLiquidity = async () => {
    if (!signer || !account || !liquidity || !isCorrectNetwork) return;

    setIsLoading(true);

    try {
      const factory = new ethers.Contract(CONTRACTS.core.factory, FACTORY_ABI, signer);
      const pairAddress = await factory.getPair(
        tokens[tokenA].address,
        tokens[tokenB].address
      );

      const pair = new ethers.Contract(pairAddress, PAIR_ABI, signer);
      const router = new ethers.Contract(CONTRACTS.core.router, ROUTER_ABI, signer);

      const liquidityAmount = ethers.parseUnits(liquidity, 18);
      
      const allowance = await pair.allowance(account, CONTRACTS.core.router);
      if (allowance < liquidityAmount) {
        await pair.approve(CONTRACTS.core.router, liquidityAmount);
      }

      const deadline = Math.floor(Date.now() / 1000) + 600;
      
      const tx = await router.removeLiquidity(
        tokens[tokenA].address,
        tokens[tokenB].address,
        liquidityAmount,
        0,
        0,
        account,
        deadline
      );

      await tx.wait();
      
      setLiquidity('');
      await fetchPoolData();

    } catch (error) {
      console.error('Remove liquidity failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonState = () => {
    if (!isCorrectNetwork) return { disabled: true, text: 'Wrong Network' };
    if (!account) return { disabled: true, text: 'Connect Wallet' };
    if (isLoading) return { disabled: true, text: 'Processing...' };
    if (isAdding) {
      if (!amountA || Number(amountA) <= 0) return { disabled: true, text: 'Enter Amount' };
      return { disabled: false, text: 'Add Liquidity' };
    } else {
      if (!liquidity || Number(liquidity) <= 0) return { disabled: true, text: 'Enter LP Amount' };
      if (Number(liquidity) > lpBalance) return { disabled: true, text: 'Insufficient LP' };
      return { disabled: false, text: 'Remove Liquidity' };
    }
  };

  const buttonState = getButtonState();

  return (
    <div className="liquidity-manager">
      <div className="glass-card">
        <div className="liquidity-header">
          <h2>Liquidity</h2>
          <div className="liquidity-tabs">
            <button
              className={`tab-button ${isAdding ? 'active' : ''}`}
              onClick={() => setIsAdding(true)}
            >
              Add
            </button>
            <button
              className={`tab-button ${!isAdding ? 'active' : ''}`}
              onClick={() => setIsAdding(false)}
            >
              Remove
            </button>
          </div>
        </div>

        {isAdding ? (
          <div className="add-liquidity">
            <div className="token-pair">
              <div className="token-input">
                <div className="input-header">
                  <span>Token A</span>
                </div>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={amountA}
                    onChange={(e) => setAmountA(e.target.value)}
                    placeholder="0.0"
                    min="0"
                    disabled={!account || !isCorrectNetwork}
                    className="amount-input"
                  />
                  <button 
                    className="token-selector-button"
                    onClick={() => setShowTokenSelector('tokenA')}
                    disabled={!account}
                  >
                    <span className="token-symbol">{tokens[tokenA].symbol}</span>
                    <span className="dropdown-arrow">▼</span>
                  </button>
                </div>
              </div>

              <div className="pair-divider">+</div>

              <div className="token-input">
                <div className="input-header">
                  <span>Token B</span>
                </div>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={amountB || '0.0'}
                    readOnly
                    placeholder="0.0"
                    className="amount-input"
                  />
                  <button 
                    className="token-selector-button"
                    onClick={() => setShowTokenSelector('tokenB')}
                    disabled={!account}
                  >
                    <span className="token-symbol">{tokens[tokenB].symbol}</span>
                    <span className="dropdown-arrow">▼</span>
                  </button>
                </div>
              </div>
            </div>

            {reserves.reserveA > 0 && reserves.reserveB > 0 && (
              <div className="pool-info">
                <div className="info-row">
                  <span>Pool Reserves</span>
                  <span>
                    {reserves.reserveA.toFixed(4)} {tokens[tokenA].symbol} / {reserves.reserveB.toFixed(4)} {tokens[tokenB].symbol}
                  </span>
                </div>
                <div className="info-row">
                  <span>Exchange Rate</span>
                  <span>1 {tokens[tokenA].symbol} = {(reserves.reserveB / reserves.reserveA).toFixed(6)} {tokens[tokenB].symbol}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="remove-liquidity">
            <div className="lp-input">
              <div className="input-header">
                <span>LP Tokens to Remove</span>
                <button 
                  className="max-button"
                  onClick={handleMaxLiquidity}
                  disabled={!account || lpBalance <= 0}
                >
                  MAX
                </button>
              </div>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={liquidity}
                  onChange={(e) => setLiquidity(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  max={lpBalance}
                  disabled={!account || !isCorrectNetwork}
                  className="amount-input"
                />
                <div className="lp-token-label">
                  LP {tokens[tokenA].symbol}-{tokens[tokenB].symbol}
                </div>
              </div>
              {lpBalance > 0 && (
                <div className="balance-info">
                  Available: {lpBalance.toFixed(6)} LP ({poolShare.toFixed(2)}% of pool)
                </div>
              )}
            </div>
          </div>
        )}

        <button
          className={`liquidity-button ${buttonState.disabled ? 'disabled' : 'active'}`}
          onClick={isAdding ? addLiquidity : removeLiquidity}
          disabled={buttonState.disabled}
        >
          {buttonState.text}
        </button>

        <div className="pool-share">
          {poolShare > 0 && (
            <div className="share-bar">
              <div 
                className="share-fill"
                style={{ width: `${Math.min(poolShare, 100)}%` }}
              ></div>
              <div className="share-label">Your Pool Share: {poolShare.toFixed(4)}%</div>
            </div>
          )}
        </div>
      </div>

      {showTokenSelector && (
        <TokenSelector
          currentToken={showTokenSelector === 'tokenA' ? tokenA : tokenB}
          onSelect={(token) => {
            if (showTokenSelector === 'tokenA') {
              setTokenA(token);
            } else {
              setTokenB(token);
            }
            setShowTokenSelector(null);
          }}
          onClose={() => setShowTokenSelector(null)}
        />
      )}
    </div>
  );
};

export default LiquidityManager;
