import React, { useEffect, useRef } from 'react';
import './TokenSelector.css';
import { CONTRACTS } from '../../config/constants';
import { useWallet } from '../../contexts/WalletContext';

const TokenSelector = ({ currentToken, onSelect, onClose }) => {
  const modalRef = useRef(null);
  const { balances } = useWallet();

  useEffect(() => {
    const handleOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  return (
    <div className="token-selector-overlay">
      <div className="token-selector-modal" ref={modalRef}>
        <div className="token-selector-header">
          <h3>Select Token</h3>
          <button className="close-selector" onClick={onClose}>×</button>
        </div>

        <div className="token-list">
          {Object.entries(CONTRACTS.tokens).map(([key, token]) => (
            <button
              key={key}
              className={`token-item ${currentToken === key ? 'selected' : ''}`}
              onClick={() => {
                onSelect(key);
                onClose();
              }}
            >
              <div className="token-icon">
                {token.symbol.charAt(0)}
              </div>

              <div className="token-info">
                <div className="token-symbol">{token.symbol}</div>
                <div className="token-name">{token.name}</div>
              </div>

              <div className="token-balance">
                {(balances[key] ?? 0).toFixed(6)}
              </div>

              {currentToken === key && (
                <div className="token-selected-indicator">✓</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenSelector;
