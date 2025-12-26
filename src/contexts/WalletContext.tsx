import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";
import { ethers } from "ethers";

const WalletContext = createContext(null);

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  /* ===============================
     CORE WALLET STATE
  =============================== */
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  /* ===============================
     UI / STATUS
  =============================== */
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  /* ===============================
     🔥 BALANCE STATE (IMPORTANT)
     Dashboard / Swap / Liquidity
     sab yahin se read karenge
  =============================== */
  const [balances, setBalances] = useState({});

  /* ===============================
     CONNECT: METAMASK
  =============================== */
  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    setIsConnecting(true);
    setError(null);

    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const signer = await web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(signer);
      setAccount(accounts[0]);
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /* ===============================
     DISCONNECT
  =============================== */
  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setBalances({});
    setError(null);
  }, []);

  /* ===============================
     AUTO-CONNECT (REFRESH SAFE)
  =============================== */
  useEffect(() => {
    const autoConnect = async () => {
      if (!window.ethereum) return;

      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await web3Provider.send("eth_accounts", []);

        if (!accounts.length) return;

        const signer = await web3Provider.getSigner();

        setProvider(web3Provider);
        setSigner(signer);
        setAccount(accounts[0]);
      } catch {
        // silent fail (normal)
      }
    };

    autoConnect();
  }, []);

  /* ===============================
     ACCOUNT / CHAIN LISTENERS
     (NO PAGE RELOAD)
  =============================== */
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts.length) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        setBalances({}); // force refetch
      }
    };

    const handleChainChanged = () => {
      setBalances({});
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  /* ===============================
     CONTEXT VALUE
  =============================== */
  const value = {
    /* core */
    provider,
    signer,
    account,

    /* balances */
    balances,
    setBalances,

    /* status */
    isConnecting,
    error,
    isConnected: !!account && !!signer,

    /* actions */
    connectMetaMask,
    disconnect
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
