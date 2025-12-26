// components/SwapProgress.js
import React from 'react';
import './SwapProgress.css';
import { TEMPO_NETWORK } from "../../config/constants";

const SwapProgress = ({ progress }) => {
  const steps = [
    { id: 1, label: 'Checking Allowance' },
    { id: 2, label: 'Approving Tokens' },
    { id: 3, label: 'Swapping' },
    { id: 4, label: 'Complete' }
  ];

  return (
    <div className="swap-progress-overlay">
      <div className="swap-progress-modal">
        <div className="progress-header">
          <h3>Transaction Progress</h3>
          <div className="progress-status">
            {progress.isError ? 'Failed' : 'In Progress'}
          </div>
        </div>

        <div className="progress-steps">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`progress-step ${progress.step >= step.id ? 'active' : ''} ${progress.step > step.id ? 'completed' : ''}`}
            >
              <div className="step-number">
                {progress.step > step.id ? '✓' : step.id}
              </div>
              <div className="step-label">{step.label}</div>
              <div className="step-connector"></div>
            </div>
          ))}
        </div>

        <div className="progress-message">
          {progress.message}
        </div>

        {progress.txHash && (
          <a
            href={`${TEMPO_NETWORK.explorer}/tx/${progress.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            View on Explorer ↗
          </a>
        )}

        {progress.isError && (
          <button 
            className="dismiss-button"
            onClick={() => window.location.reload()}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default SwapProgress;
