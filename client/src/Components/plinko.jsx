// In your mini app's /earn/plinko component/page
import React, { useEffect, useRef } from 'react';

function PlinkoIframePage({ playerBalance }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    // When iframe loads, send the player's balance
    const iframe = iframeRef.current;
    const sendBalanceToIframe = () => {
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: 'SET_BALANCE', balance: playerBalance },
          'https://plinko-game-main-two.vercel.app'
        );
      }
    };

    // Listen for iframe load event to send initial balance
    iframe.addEventListener('load', sendBalanceToIframe);

    return () => {
      iframe.removeEventListener('load', sendBalanceToIframe);
    };
  }, [playerBalance]); // resend if balance changes

  return (
    <iframe
      ref={iframeRef}
      src="https://plinko-game-main-two.vercel.app/"
      title="Plinko Game"
      style={{ width: '100%', height: '100vh', border: 'none' }}
    ></iframe>
  );
}

export default PlinkoIframePage;