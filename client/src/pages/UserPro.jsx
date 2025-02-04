import React, { useState } from "react";
import Animate from "../Components/Animate.jsx";
import { Outlet } from "react-router-dom";
import coinsmall from "../images/coinsmall.webp";
import { TonConnectButton } from "@tonconnect/ui-react";
import { useUser } from "../context/userContext";
import tswap from "../images/tswap.png";
import botr from "../images/bott.webp";
import { IoClose } from "react-icons/io5";
import BetMianus from "../Components/BetMianus.jsx";

// Helper function to format the user's share percentage
function formatUserShare(share) {
  if (share >= 1) {
    // If share >= 1%, keep 1 decimal
    return parseFloat(share.toFixed(1)).toString();
  } else {
    // If share < 1%, keep up to 6 decimals
    return parseFloat(share.toFixed(6)).toString();
  }
}

const Profile = () => {
  // Destructure user-related data from the context
  const { totalCount, dividedCount, users, dividedUsers, username, balance, refBonus } = useUser();

  // State for modal visibility (if needed in future)
  const [modalConvertVisibleEnc, setModalConvert] = useState(false);

  // Function to format numbers with appropriate suffixes
  const formatNumber = (num) => {
    if (num < 1000) {
      return new Intl.NumberFormat().format(num);
    } else if (num < 1000000) {
      const thousands = (num / 1000).toFixed(1);
      return `${thousands} K`;
    } else {
      const millions = (num / 1000000).toFixed(1);
      return `${millions} M`;
    }
  };

  // Calculate the user's share percentage
  let userSharePercent = 0;
  if (totalCount && totalCount !== 0) {
    userSharePercent = ((balance + refBonus)/ totalCount) * 100;
  }

  // Format the share percentage based on the helper function
  const userShareDisplay = formatUserShare(userSharePercent);

  // Format users and dividedUsers for display
  const formattedUsers = new Intl.NumberFormat()
    .format(users)
    .replace(/,/g, " ");

  const formattedDividedUsers = new Intl.NumberFormat()
    .format(dividedUsers)
    .replace(/,/g, " ");

  // Calculate userFraction and userAirdropFraction
const userFraction = totalCount !== 0 ? (balance + refBonus) / totalCount : 0;
const userAirdropFraction = 0.20 * userFraction; // user fraction of the 20% pool

// Market cap range
const minMarketCap = 3000000; // $3M
const maxMarketCap = 5000000; // $5M

// The user's share in USD range
const minUserUsd = userAirdropFraction * minMarketCap;
const maxUserUsd = userAirdropFraction * maxMarketCap;

function formatUsdRange(minValue, maxValue) {
  const formatUsd = (val) => {
    if (val >= 1_000_000) {
      return (val / 1_000_000).toFixed(2).replace(/\.00$/, "") + "M";
    } else if (val >= 1000) {
      return Math.round(val / 1000) + "k";
    } else {
      return Math.round(val).toString();
    }
  };

  return `${formatUsd(minValue)} - ${formatUsd(maxValue)} USD`;
}

  return (
    <Animate>
      <div className="flex justify-center w-full">
        <div className="flex flex-col w-full h-screen max-w-xl font-bold text-white">
          {/* Top Row: User Profile and TonConnect Button */}
          <div className="flex px-4">
            <div className="flex items-center w-1/2 pt-0 space-x-2">
              <div className="w-[25px]">
                {/* Display Current User's Profile Picture */}
                {window.Telegram.WebApp.initDataUnsafe?.user?.photo_url ? (
                  <img
                    src={window.Telegram.WebApp.initDataUnsafe.user.photo_url}
                    alt="Profile"
                    className="w-[20px] h-[20px] rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-white">
                    {username}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-white">{username}</p>
            </div>
            <div className="flex items-center justify-end w-1/2 pt-0 mt-1 space-x-4">
              <TonConnectButton />
            </div>
          </div>

          <div className="flex slackey-regular justify-between gap-2 px-4 mt-4 mb-2">
  <div className="bg-[#ffffff1a] rounded-lg px-4 py-2 w-full">
    {/* First row: total supply */}
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-md">Total supply:</h3>
        <div className="flex items-center pt-1 space-x-2">
          <div className="p-1">
            <img src={coinsmall} alt="Coin smail" className="w-6 h-6 mx-auto" />
          </div>
          <p className="text-sm">{formatNumber(totalCount)} Mianus</p>
        </div>
      </div>
      <div className="flex items-center">
        <h3 className="text-md">Your part:&nbsp;</h3>
        <p className="text-sm">{userShareDisplay}%</p>
      </div>
    </div>

    {/* Second row: your airdrop est. value */}
    <div className="pt-3">
      <h3 className="text-md">Your Airdrop est. Value:</h3>
      <p className="text-sm">
        {/* e.g. "300k - 500k USD" */}
        {formatUsdRange(minUserUsd, maxUserUsd)}
      </p>
    </div>
  </div>
</div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar mt-2 pb-20 px-4">
            {/* Instead of mapping old projects, just place BetMianus here */}
            <h3 className="text-md">Coming soon...</h3>
            
          </div>
        </div>
      </div>
      <Outlet />
    </Animate>
  );
};

export default Profile;
