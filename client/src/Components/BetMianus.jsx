import React from "react";
import betPreview from "../images/betpreview.webp";
import coinSmall from "../images/coinsmall.webp";

/**
 * BetMianus - A mobile-friendly page for a Telegram mini app
 * Single-column layout, Slackey font for headings & 'Mianus' references,
 * constrained hero image (40% of screen height), pink/peach background
 * with dark red text & highlights.
 */
const BetMianus = () => {
  return (
    <div
      className="w-full min-h-screen p-4"
      style={{
        backgroundColor: "#ffe4e6", // Light pink background
        color: "#8B0000",          // Dark red text
      }}
    >
      {/* Title / Heading */}
      <h1 className="text-xl font-bold mb-3 slackey-regular uppercase">
        Bet Mianus
      </h1>

      {/* Intro Section with Floated Image */}
<div className="mb-6 relative">
  <img
    src={betPreview}
    alt="Bet Mianus Preview"
    className="float-left mr-3 mb-3 rounded-md object-contain"
    style={{ height: "35vh", width: "auto" }}
  />
  <p className="text-sm leading-5 mb-2">
    <strong className="slackey-regular">Bet Mianus</strong> is a next-generation,
    provably fair crypto gaming platform enabling you to deposit, play, and withdraw
    on multiple blockchains (ETH, BASE, TRON, BSC, SOLANA) within a single
    mobile-friendly experience.
  </p>
  <p className="text-sm leading-5">
    Enjoy slots, table games, crypto mini-games, and sports betting with a deep
    referral system, VIP levels, and <strong>Bet Mining</strong>. Licensed under
    Curacao, powered by BetConstruct CRM, and distributing 100% of its Gross Gaming
    Revenue (GGR) to <span className="slackey-regular">Mianus</span> Token holders.
  </p>
</div>

{/* Clear Floats */}
<div className="clear-both"></div>

      {/* Token Overview */}
      <div
        className="rounded-md p-4 mb-6 shadow-md"
        style={{ backgroundColor: "#ffe8e9" }} // Slightly different pink
      >
        <div className="flex items-center mb-3">
          <img
            src={coinSmall}
            alt="Mianus Token Logo"
            className="w-12 h-12 object-contain mr-3"
          />
          <h2 className="text-lg font-bold slackey-regular uppercase">
            Mianus Token
          </h2>
        </div>
        <ul className="list-disc ml-5 text-sm space-y-2">
          <li>
            <strong>100% GGR Distribution:</strong> All platform Gross Gaming 
            Revenue is shared among <span className="slackey-regular">Mianus</span> stakers.
          </li>
          <li>
            <strong>Platform Reserve:</strong> 20% of tokens allocated for operating 
            costs & liquidity.
          </li>
          <li>
            <strong>Bet Mining:</strong> Earn <span className="slackey-regular">Mianus</span> 
            for every USDT-equivalent qualifying wager.
          </li>
          <li>
            <strong>Stake <span className="slackey-regular">Mianus</span>:</strong> Lock tokens 
            for passive income and a share of revenue.
          </li>
        </ul>
      </div>

      {/* Pie Chart Section (3D & Interactive) */}
<div
  className="rounded-md p-4 mb-6 shadow-md flex flex-col items-center"
  style={{ backgroundColor: "#ffd7d7" }}
>
  <h2 className="text-lg font-bold mb-4 slackey-regular uppercase">
    Token Supply
  </h2>

  {/* 3D Container with perspective */}
  <div className="relative"
       style={{ perspective: "600px" }}>
    {/* The Donut Chart itself, tilted in 3D; we apply hover transitions */}
    <div
      className="relative w-32 h-32 rounded-full mb-3 transition-transform duration-500 ease-out hover:rotate-x-12 hover:rotate-y-6 hover:scale-105"
      style={{
        transformStyle: "preserve-3d",
        transform: "rotateX(10deg) rotateY(0deg)",
        boxShadow: "0 15px 25px rgba(0,0,0,0.2)",
        background: "conic-gradient(#fa8072 0% 45%, #ffe4e6 45% 100%)",
      }}
    >
      {/* Optional donut hole (inner circle) */}
      <div
        className="absolute top-[15%] left-[15%] w-[70%] h-[70%] rounded-full"
        style={{ backgroundColor: "#ffe4e6", boxShadow: "inset 0 0 5px rgba(0,0,0,0.15)" }}
      ></div>
    </div>
  </div>

  {/* Legend */}
  <ul className="space-y-2 text-sm">
    <li className="flex items-center space-x-2">
      <span
        className="inline-block w-4 h-4 rounded-sm"
        style={{ backgroundColor: "#fa8072" }}
      ></span>
      <span>
        <strong>45%</strong> allocated to <strong>Users</strong>
      </span>
    </li>
    <li className="flex items-center space-x-2">
      <span
        className="inline-block w-4 h-4 rounded-sm"
        style={{ backgroundColor: "#ffe4e6" }}
      ></span>
      <span>
        <strong>55%</strong> retained by <strong>Platform</strong>
      </span>
    </li>
  </ul>
</div>


      {/* KEY FEATURES */}
<div
  className="rounded-md p-4 shadow-md"
  style={{ backgroundColor: "#ffebe8" }}
>
  <h2 className="text-lg font-bold mb-3 slackey-regular uppercase">
    Key Features
  </h2>

  {/* Feature 1: Card with Icon/Image on the Left */}
  <div className="bg-white bg-opacity-70 rounded-md shadow p-4 mb-4">
    <div className="flex items-center space-x-4">
      {/* Placeholder icon/image */}
      <img
        src="https://via.placeholder.com/80"
        alt="Provably Fair Icon"
        className="w-16 h-16 object-cover rounded"
      />
      <div>
        <h3 className="font-bold text-sm mb-1">Provably Fair</h3>
        <p className="text-sm leading-5">
          Transparent results using <strong>blockchain-based randomness</strong>.
        </p>
      </div>
    </div>
  </div>

  {/* Feature 2: Horizontal Card with Banner & Text */}
  <div className="relative bg-white bg-opacity-70 rounded-md shadow p-4 mb-4">
    {/* Placeholder banner */}
    <img
      src="https://via.placeholder.com/300x100/ffd7d7/8B0000?text=Multi-Chain+Support"
      alt="Multi-Chain Support Banner"
      className="rounded w-full h-24 object-cover mb-2"
    />
    <div>
      <h3 className="font-bold text-sm mb-1">Multi-Chain Support</h3>
      <p className="text-sm leading-5">
        Deposits & withdrawals on ETH, BASE, TRON, BSC, and SOLANA.
      </p>
    </div>
  </div>

  {/* Feature 3: Card with Full-Width Image at Bottom */}
  <div className="bg-white bg-opacity-70 rounded-md shadow p-4 mb-4">
    <h3 className="font-bold text-sm mb-2">Exciting Games</h3>
    <p className="text-sm leading-5 mb-3">
      Slots, table games, crypto mini-games, and sports betting.
    </p>
    {/* Bottom image placeholder */}
    <img
      src="https://via.placeholder.com/320x120/ffebe8/8B0000?text=Slots+Table+Crypto+Sports"
      alt="Exciting Games"
      className="w-full h-24 object-cover rounded"
    />
  </div>

  {/* Feature 4: Stacked Card with Small Image and Info */}
  <div className="bg-white bg-opacity-70 rounded-md shadow p-4 mb-4">
    <div className="flex flex-col items-start space-y-2">
      <img
        src="https://via.placeholder.com/60"
        alt="Referrals Icon"
        className="w-14 h-14 object-cover rounded"
      />
      <h3 className="font-bold text-sm">Referrals & VIP</h3>
      <p className="text-sm leading-5">
        10% upstream referral trees + special VIP rewards.
      </p>
    </div>
  </div>

  {/* Feature 5: Carousel-like Horizontal Scroll for smaller bullet points */}
  <div className="bg-white bg-opacity-70 rounded-md shadow p-4 mb-4">
    <h3 className="font-bold text-sm mb-2">Stake & Earn (Carousel)</h3>
    <p className="text-sm leading-5 mb-3">
      Earn a share of GGR by staking 
      <span className="slackey-regular"> Mianus</span>.
    </p>
    {/* Horizontal scroll container */}
    <div className="flex space-x-4 overflow-x-auto">
      {/* Carousel Item 1 */}
      <div className="flex-shrink-0 w-40 bg-[#ffd7d7] p-3 rounded shadow">
        <img
          src="https://via.placeholder.com/40"
          alt="Staking"
          className="mb-2 rounded"
        />
        <p className="text-xs">Stake <span className="slackey-regular">Mianus</span></p>
      </div>

      {/* Carousel Item 2 */}
      <div className="flex-shrink-0 w-40 bg-[#ffd7d7] p-3 rounded shadow">
        <img
          src="https://via.placeholder.com/40"
          alt="Earnings"
          className="mb-2 rounded"
        />
        <p className="text-xs">Earn Passive Income</p>
      </div>

      {/* Carousel Item 3 */}
      <div className="flex-shrink-0 w-40 bg-[#ffd7d7] p-3 rounded shadow">
        <img
          src="https://via.placeholder.com/40"
          alt="GGR"
          className="mb-2 rounded"
        />
        <p className="text-xs">100% GGR Share</p>
      </div>
    </div>
  </div>

  {/* Feature 6: Side-by-Side Images */}
  <div className="bg-white bg-opacity-70 rounded-md shadow p-4 mb-4">
    <h3 className="font-bold text-sm mb-2">Curacao Licensed</h3>
    <p className="text-sm leading-5 mb-3">
      Compliance & reliability powered by BetConstruct CRM.
    </p>
    <div className="flex space-x-2">
      {/* Placeholder image 1 */}
      <img
        src="https://via.placeholder.com/100"
        alt="Curacao License Badge"
        className="w-20 h-20 object-cover rounded"
      />
      {/* Placeholder image 2 */}
      <img
        src="https://via.placeholder.com/100"
        alt="BetConstruct CRM"
        className="w-20 h-20 object-cover rounded"
      />
    </div>
  </div>

  {/* Feature 7: Another Carousel or Slideshow */}
  <div className="bg-white bg-opacity-70 rounded-md shadow p-4">
    <h3 className="font-bold text-sm mb-2">
      100% GGR to Holders
    </h3>
    <p className="text-sm leading-5 mb-3">
      Revenue share for 
      <span className="slackey-regular"> Mianus</span> Token stakers.
    </p>
    {/* Minimal “carousel” style container */}
    <div className="flex space-x-3 overflow-x-auto">
      {/* Carousel Slide #1 */}
      <div className="flex-shrink-0 bg-[#ffd7d7] p-3 rounded shadow w-44">
        <img
          src="https://via.placeholder.com/44"
          alt="Slide 1"
          className="mb-2 rounded"
        />
        <p className="text-xs font-bold">Slide #1</p>
      </div>
      {/* Carousel Slide #2 */}
      <div className="flex-shrink-0 bg-[#ffd7d7] p-3 rounded shadow w-44">
        <img
          src="https://via.placeholder.com/44"
          alt="Slide 2"
          className="mb-2 rounded"
        />
        <p className="text-xs font-bold">Slide #2</p>
      </div>
      {/* Carousel Slide #3 */}
      <div className="flex-shrink-0 bg-[#ffd7d7] p-3 rounded shadow w-44">
        <img
          src="https://via.placeholder.com/44"
          alt="Slide 3"
          className="mb-2 rounded"
        />
        <p className="text-xs font-bold">Slide #3</p>
      </div>
    </div>
  </div>
</div>

    </div>
  );
};

export default BetMianus;
