// Components/SplashEffect.jsx
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const SplashEffect = ({ x, y, onComplete }) => {
  const splashRef = useRef(null);

  useEffect(() => {
    const droplets = splashRef.current.querySelectorAll('.droplet');

    const tl = gsap.timeline({
      onComplete: () => {
        console.log(`Splash at (${x}, ${y}) completed`);
        onComplete();
      },
    });

    droplets.forEach((droplet, index) => {
      const angle = (360 / droplets.length) * index; // Evenly distributed angles
      const distance = 80; // Distance to move outward

      const radians = (angle * Math.PI) / 180;
      const deltaX = distance * Math.cos(radians);
      const deltaY = distance * Math.sin(radians);

      tl.to(
        droplet,
        {
          x: deltaX,
          y: deltaY,
          scale: 1.8, // Scale up for a fatter appearance
          opacity: 0,
          duration: 1.2,
          ease: 'power1.out',
        },
        0 // All droplets animate simultaneously
      );
    });

    // Optional: Fade in the splashes with a slight delay
    tl.fromTo(
      splashRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 },
      0.1
    );

    return () => {
      tl.kill();
    };
  }, [x, y, onComplete]);

  return (
    <svg
      ref={splashRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 150 150" // Increased viewBox for larger splashes
      style={{
        position: 'absolute',
        left: x, // Position relative to the container
        top: y,  // Position relative to the container
        width: '150px', // Increased size for a fatter splash
        height: '150px',
        pointerEvents: 'none', // Allow clicks to pass through
        overflow: 'visible',
        transform: 'translate(-75px, -75px)', // Center the SVG at the tap point
      }}
      xmlSpace="preserve"
    >
      {/* Define Radial Gradient */}
      <defs>
        <radialGradient id="dropletGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: '#8B0000', stopOpacity: 1 }} /> {/* Dark Red */}
          <stop offset="100%" style={{ stopColor: '#654321', stopOpacity: 0 }} /> {/* Brown */}
        </radialGradient>
      </defs>

      <style type="text/css">
        {`
          .droplet {
            fill: url(#dropletGradient);
            opacity: 1;
            filter: blur(0px); /* Add slight blur for a juicier look */
          }
        `}
      </style>

      {/* Define Droplets */}
      {Array.from({ length: 12 }).map((_, index) => (
        <circle key={index} className="droplet" cx="100" cy="100" r="10" />
      ))}
    </svg>
  );
};

export default SplashEffect;
