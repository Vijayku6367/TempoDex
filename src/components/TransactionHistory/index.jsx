import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from "../../contexts/WalletContext";
import { TEMPO_NETWORK } from "../../config/constants";
import { ethers } from "ethers";

const MAX_TX = 10;

const TransactionHistory = () => {
  const { account, provider } = useWallet();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);

  /* -------------------------
     Helper: method name
  -------------------------- */
  const getMethodName = (input) => {
    if (!input || input === "0x") return "Transfer";

    const id = input.slice(0, 10).toLowerCase();

    const map = {
      "0x38ed1739": "Swap",
      "0x18cbafe5": "Swap",
      "0xe8e33700": "Add Liquidity",
      "0xbaa2abde": "Remove Liquidity",
      "0xa9059cbb": "Transfer",
      "0x40c10f19": "Mint",
    };

    return map[id] || "Contract Call";
  };

  /* -------------------------
     Load recent txs (RPC)
  -------------------------- */
  const loadTxs = useCallback(async () => {
    if (!provider || !account) return;

    setLoading(true);

    try {
      const block = await provider.getBlockNumber();
      const start = Math.max(block - 2000, 0);

      const history = await provider.getHistory(account, start, block);

      const parsed = history
        .reverse()
        .slice(0, MAX_TX)
        .map((tx) => ({
          hash: tx.hash,
          time: tx.timestamp,
          input: tx.data,
          status: tx.confirmations > 0 ? "success" : "pending",
        }));

      setTxs(parsed);
    } catch (e) {
      console.error("Tx history error:", e);
    } finally {
      setLoading(false);
    }
  }, [provider, account]);

  /* -------------------------
     Initial load + poll
  -------------------------- */
  useEffect(() => {
    loadTxs();
    const i = setInterval(loadTxs, 30000);
    return () => clearInterval(i);
  }, [loadTxs]);

  /* -------------------------
     Instant inject (swap)
  -------------------------- */
  useEffect(() => {
    const handler = (e) => {
      const { hash, input } = e.detail;

      setTxs((prev) => [
        {
          hash,
          input,
          time: Date.now() / 1000,
          status: "pending",
        },
        ...prev.slice(0, MAX_TX - 1),
      ]);
    };

    window.addEventListener("tx-added", handler);
    return () => window.removeEventListener("tx-added", handler);
  }, []);

  /* -------------------------
     Format time
  -------------------------- */
  const formatTime = (t) => {
    if (!t) return "";
    return new Date(t * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!account) return null;

  return (
    <div className="transaction-history">
      <div className="glass-card">
        <h3>Recent Transactions</h3>

        {loading && txs.length === 0 && (
          <div className="no-transactions">Loading...</div>
        )}

        {!loading && txs.length === 0 && (
          <div className="no-transactions">No transactions found</div>
        )}

        <div className="transactions-list">
          {txs.map((tx) => (
            <a
              key={tx.hash}
              href={`${TEMPO_NETWORK.explorer}/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transaction-item"
            >
              <div className="transaction-method">
                {getMethodName(tx.input)}
              </div>

              <div className="transaction-details">
                <div className="transaction-time">
                  {formatTime(tx.time)}
                </div>

                <div
                  className={`transaction-status ${
                    tx.status === "success" ? "success" : "pending"
                  }`}
                >
                  {tx.status === "success" ? "✓" : "⏳"}
                </div>
              </div>
            </a>
          ))}
        </div>

        <a
          href={`${TEMPO_NETWORK.explorer}/address/${account}`}
          target="_blank"
          rel="noopener noreferrer"
          className="view-all-link"
        >
          View all on explorer ↗
        </a>
      </div>
    </div>
  );
};

export default TransactionHistory;
