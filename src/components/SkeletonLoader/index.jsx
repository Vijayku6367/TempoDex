// components/SkeletonLoader.js
import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ height = 20, width = '100%', borderRadius = 4 }) => {
  return (
    <div 
      className="skeleton-loader"
      style={{
        height: `${height}px`,
        width: width,
        borderRadius: `${borderRadius}px`
      }}
    ></div>
  );
};

export default SkeletonLoader;
