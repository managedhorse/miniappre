// Spinner.jsx
import React from 'react';
import '../App.css'; // or App.css, whichever you prefer

const Spinner = () => {
  return (
    <div className="spinner-container">
      {/* This container or the img will get the transition */}
      <div className="spinner-revolving-image">
        <img
          src="../revolvingmianus.webp"
          alt="Revolving Mianus"
        />
      </div>
      <p className="spinner-text">Loading Mianus...</p>
    </div>
  );
};

export default Spinner;