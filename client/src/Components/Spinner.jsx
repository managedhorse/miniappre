import React from 'react';
import '../Spinner.css'; // Ensure this file is linked correctly

const Spinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner-revolving-image">
        <img
          src="../revolvingmianus.webp" // Replace with the actual path to your "mianus" image
          alt="Revolving Mianus"
        />
      </div>
      <p className="spinner-text">Loading Mianus...</p>
    </div>
  );
};

export default Spinner;