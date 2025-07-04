import React from "react";



const CoinExplainerAdvanced = () => {
  return (
    <div className="w-full bg-gradient-to-b from-blue-500 to-blue-700 text-white font-sans px-4 py-10 md:py-16">
      {/* Container */}
      <div className="max-w-4xl mx-auto space-y-16">

        {/* 1) Mianus Token Distribution Section */}
        <section className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Mianus Token Distribution</h2>
          <div className="flex flex-col md:flex-row md:items-center md:justify-center">
            {/* Pie Chart Image */}
            <div className="flex-shrink-0 mx-auto md:mx-0 md:mr-10">
              {/* Replace with your actual pie chart image */}
              <img
                src="/images/mianus_pie.png"
                alt="Mianus Token Distribution"
                className="w-64 h-64 object-cover mx-auto"
              />
            </div>

            {/* Legend / Explanation */}
            <div className="mt-6 md:mt-0 text-left space-y-3 max-w-md mx-auto">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-pink-300" />
                <p><strong>Company (27.5%)</strong> - This is the supply held by the company.</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-300" />
                <p><strong>Bet Mining (25%)</strong> - Gradual distribution to players over 10 years.</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-400" />
                <p><strong>Platform (20%)</strong> - Staked by the platform to fund operations.</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-400" />
                <p><strong>Airdrop (10%)</strong> - Shared by Tap Mianus players.</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-400" />
                <p><strong>ICO (10%)</strong> - Potential sale if the community demands it.</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-indigo-300" />
                <p><strong>Liquidity (5%)</strong> - Initial LP on DEX.</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-300" />
                <p><strong>Presale (2.5%)</strong> - Tokens offered to early supporters (closed).</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2) Full-Featured iGaming Application Section */}
        <section className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Full-Featured iGaming Application</h2>
          <div className="flex flex-col md:flex-row items-center justify-center">
            {/* Phone Preview Image */}
            <div className="flex-shrink-0 mx-auto md:mx-0 md:mr-10 mb-4 md:mb-0">
              {/* Replace with your actual phone preview image */}
              <img
                src="/images/app_preview.png"
                alt="Bet Mianus App"
                className="w-48 h-auto object-contain"
              />
            </div>
            {/* Description */}
            <div className="max-w-md text-left">
              <p className="mb-3">
                <strong>Bet Mianus</strong> is a <strong>provably fair crypto gaming platform</strong> that
                lets you deposit, play, and withdraw using ETH, BASE, TRON, BSC, and SOLANA. The platform
                offers a comprehensive suite of Slots, Table Games, Crypto Games, and Sports Betting.
              </p>
              <p className="mb-3">
                Backed by a team with long-standing experience in iGaming and GambleFi, our experts excel
                in hash games, on-chain betting, and provably fair gaming. They have also collaborated
                with some of the biggest names in the industry, including AG, KY Group, and BetConstruct.
              </p>
              <p>
                <strong>Revenue-Sharing Model:</strong> 100% of the platform’s gross gaming revenue (GGR)
                is distributed to <strong>$Mianus</strong> token holders who stake their tokens.
              </p>
            </div>
          </div>
        </section>

        {/* 3) Platform Revenue Sharing Flow */}
        <section className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Platform Revenue Sharing</h2>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
            {/* Box 1: Platform Revenue */}
            <div className="w-64 h-48 bg-gradient-to-r from-orange-400 to-pink-400 rounded-md flex flex-col items-center justify-center p-4">
              {/* Possibly an emoji or icon */}
              <div className="text-4xl mb-2">💰</div>
              <h3 className="font-bold text-xl">Platform Revenue</h3>
              <p className="text-sm">All revenue generated by the platform.</p>
            </div>

            {/* Arrow */}
            <div className="text-4xl md:text-6xl">↓</div>

            {/* Box 2: Staked Mianus Holders */}
            <div className="w-64 h-48 bg-gradient-to-r from-yellow-300 to-green-300 rounded-md flex flex-col items-center justify-center p-4">
              <div className="text-4xl mb-2">🪙</div>
              <h3 className="font-bold text-xl">Staked $Mianus Holders</h3>
              <p className="text-sm">Receive 100% of platform revenue.</p>
            </div>
          </div>
        </section>

        {/* 4) Additional Highlights (Multi-Chain, 100% GGR to You, etc.) */}
        <section className="text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Multi-Chain Card */}
            <div className="bg-blue-900 bg-opacity-40 rounded-md p-4 flex flex-col items-center">
              <div className="text-4xl mb-2">🔗</div>
              <h3 className="font-bold text-lg mb-1">Multi-Chain</h3>
              <p className="text-sm">
                Deposit in ETH, BASE, TRON, BSC, or SOL. Seamless cross-chain support with zero KYC.
              </p>
            </div>

            {/* 100% GGR to You Card */}
            <div className="bg-blue-900 bg-opacity-40 rounded-md p-4 flex flex-col items-center">
              <div className="text-4xl mb-2">💎</div>
              <h3 className="font-bold text-lg mb-1">100% GGR to You</h3>
              <p className="text-sm">
                Grow with the house! Mianus Token holders share all gross gaming revenue—everyone wins
                together.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default CoinExplainerAdvanced;
