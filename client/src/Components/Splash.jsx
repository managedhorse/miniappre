// src/Components/Splash.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Import all splash frames
import splat1 from '../images/splat1.webp';
import splat2 from '../images/splat2.webp';
import splat3 from '../images/splat3.webp';
import splat4 from '../images/splat4.webp';
import splat5 from '../images/splat5.webp';
import splat6 from '../images/splat6.webp';

// Array of splash frames
const splashFrames = [splat1, splat2, splat3, splat4, splat5, splat6];

const Splash = ({ x, y, onComplete }) => {
  const [frame, setFrame] = useState(0);
  const frameCount = splashFrames.length;
  const frameDuration = 20; // Duration per frame in milliseconds

  useEffect(() => {
    // Preload all frames to ensure smooth animation
    splashFrames.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const interval = setInterval(() => {
      setFrame((prevFrame) => {
        if (prevFrame < frameCount - 1) {
          return prevFrame + 1;
        } else {
          clearInterval(interval);
          if (onComplete) onComplete();
          return prevFrame;
        }
      });
    }, frameDuration);

    return () => clearInterval(interval);
  }, [frameCount, frameDuration, onComplete]);

  return (
    <img
      src={splashFrames[frame]}
      alt="Splash"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: '130px', // Adjust size as needed
        height: '130px',
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}
    />
  );
};

Splash.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  onComplete: PropTypes.func.isRequired,
};

export default React.memo(Splash);
