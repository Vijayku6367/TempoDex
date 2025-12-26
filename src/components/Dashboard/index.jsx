// components/Dashboard/index.jsx
import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { ethers } from "ethers";
import { useWallet } from "../../contexts/WalletContext";
import {
  CONTRACTS,
  TOKEN_ABI,
  FACTORY_ABI,
  PAIR_ABI
} from "../../config/constants";
import SkeletonLoader from "../SkeletonLoader";

/* ===============================
   Animated Number Hook
================================ */
const useAnimatedNumber = (value, duration = 600) => {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    let start = display;
    let startTime = null;

    const step = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      setDisplay(start + (value - start) * progress);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [value]);

  return display;
};

const Dashboard = () => {
  const { signer, account, balances, setBalances } = useWallet();
  const [loading, setLoading] = useState(true);
  const [pairCount, setPairCount] = useState(0);
  const [tvl, setTvl] = useState(0);

  /* ===============================
     FAST BALANCE FETCH (NO MULTICALL)
  =============================== */
  const loadBalances = async () => {
    const entries = Object.entries(CONTRACTS.tokens);

    const calls = entries.map(async ([key, token]) => {
      try {
        const contract = new ethers.Contract(
          token.address,
          TOKEN_ABI,
          signer
        );

        const [raw, decimals] = await Promise.all([
          contract.balanceOf(account),
          token.decimals !== undefined
            ? Promise.resolve(token.decimals)
            : contract.decimals()
        ]);

        return [key, Number(ethers.formatUnits(raw, decimals))];
      } catch {
        return [key, 0];
      }
    });

    const resolved = await Promise.all(calls);
    setBalances(Object.fromEntries(resolved));
  };

  /* ===============================
     TVL + PAIRS
  =============================== */
  const loadPools = async () => {
    try {
      const factory = new ethers.Contract(
        CONTRACTS.core.factory,
        FACTORY_ABI,
        signer
      );

      const count = Number(await factory.allPairsLength());
      setPairCount(count);

      let total = 0;

      for (let i = 0; i < Math.min(count, 10); i++) {
        try {
          const pairAddr = await factory.allPairs(i);
          const pair = new ethers.Contract(pairAddr, PAIR_ABI, signer);

          const [r0, r1] = await pair.getReserves();
          const t0 = await pair.token0();
          const t1 = await pair.token1();

          const token0 = Object.values(CONTRACTS.tokens)
            .find(t => t.address.toLowerCase() === t0.toLowerCase());
          const token1 = Object.values(CONTRACTS.tokens)
            .find(t => t.address.toLowerCase() === t1.toLowerCase());

          if (!token0 || !token1) continue;

          total +=
            Number(ethers.formatUnits(r0, token0.decimals)) +
            Number(ethers.formatUnits(r1, token1.decimals));
        } catch {}
      }

      setTvl(total);
    } catch {}
  };

  /* ===============================
     LOAD ALL
  =============================== */
  useEffect(() => {
    if (!signer || !account) return;

    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([loadBalances(), loadPools()]);
      } finally {
        setLoading(false); // 🔥 NEVER STUCK
      }
    };

    load();
  }, [signer, account]);

  const totalBalance = Object.values(balances).reduce((a, b) => a + b, 0);

  const animatedBalance = useAnimatedNumber(totalBalance);
  const animatedTVL = useAnimatedNumber(tvl);

  /* ===============================
     UI
  =============================== */
  if (loading) {
    return (
      <div className="dashboard">
        <div className="glass-card">
          <SkeletonLoader height={220} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="glass-card">
        <h2>Dashboard</h2>

        <div className="dashboard-summary">
          <div className="summary-item">
            <div className="summary-label">Total Balance</div>
            <div className="summary-value">
              ${animatedBalance.toFixed(2)}
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-label">Total Pairs</div>
            <div className="summary-value">{pairCount}</div>
          </div>

          <div className="summary-item">
            <div className="summary-label">TVL</div>
            <div className="summary-value">
              ${animatedTVL.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="balances-section">
          <h3>Token Balances</h3>

          <div className="balances-grid">
            {Object.entries(CONTRACTS.tokens).map(([key, token]) => (
              <div key={key} className="balance-card">
                <div className="balance-header">
                  <div className="token-icon-small">
                    {token.symbol[0]}
                  </div>
                  <div className="token-info-small">
                    <div className="token-symbol">{token.symbol}</div>
                    <div className="token-name">{token.name}</div>
                  </div>
                </div>

                <div className="balance-amount">
                  {(balances[key] ?? 0).toFixed(6)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
