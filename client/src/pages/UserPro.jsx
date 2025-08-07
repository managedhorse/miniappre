import React, { useState } from "react";
import Animate from "../Components/Animate.jsx";
import { Outlet } from "react-router-dom";
import coinsmall from "../images/coinsmall.webp";
import { TonConnectButton } from "@tonconnect/ui-react";
import { useUser } from "../context/userContext";
import CoinExplainer from "../Components/CoinExplainer.jsx";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.jsx";


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
  const {
   totalCount, dividedCount, users, dividedUsers,
   username, balance, refBonus,
   bindAddress, timeBind, setBindAddress, setTimeBind,
   id
 } = useUser();
  const [draftAddress, setDraftAddress] = useState(bindAddress);

  const canBind = () => {
  if (!timeBind) return true;
  return (Date.now() - new Date(timeBind).getTime()) >= 24*60*60*1000;
};

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

async function handleBind() {
  if (!canBind()) {
    alert("You can only re-bind your address once every 24 hours.");
    return;
  }
  try {
    // update Firestore
    const ref = doc(db, "telegramUsers", id);
    const now = new Date();
    await updateDoc(ref, {
      bindAddress: draftAddress,
      timeBind:    now
    });
    // update local context
    setBindAddress(draftAddress);
    setTimeBind(now);
    alert("Address bound!");
  } catch (e) {
    console.error(e);
    alert("Failed to bind — please try again.");
  }
}

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

          <div className="px-4 mt-2 mb-1">
  <div className="bg-white rounded-2xl p-6 shadow-lg">
    <div className="grid grid-cols-3 gap-x-4 gap-y-2 items-center">
      {/* Airdrop */}
      <span className="slackey-regular text-sm text-gray-800">
        Airdrop
      </span>
      <div className="col-span-2 flex items-center space-x-2 justify-end">
        <span className="slackey-regular text-xl font-bold text-gray-900 whitespace-nowrap text-right">
          {formatNumber(totalCount)}
        </span>
        <img src={coinsmall} alt="Coin" className="w-6 h-6" />
      </div>

      {/* You Hold */}
      <span className="slackey-regular text-sm text-gray-800">
        You Hold
      </span>
      <span className="col-span-2 slackey-regular text-xl font-bold text-gray-900 whitespace-nowrap text-right">
        {userShareDisplay}%
      </span>

      {/* Est. Value */}
      <span className="slackey-regular text-sm text-gray-800">
        Est. Value
      </span>
      <span className="col-span-2 slackey-regular text-xl font-bold text-gray-900 whitespace-nowrap text-right">
        {formatUsdRange(minUserUsd, maxUserUsd)}
      </span>
    </div>
  </div>
</div>

{/* ─── New: Bind BSC address ─────────────────────────────────── */}
    <div className="px-4 mt-6">
      <label className="block text-sm font-medium text-gray-200 mb-1">
        BSC Address
      </label>
      <div className="flex space-x-2">
        <input
          type="text"
          value={draftAddress}
          onChange={e => setDraftAddress(e.target.value)}
          className="
            flex-1 rounded-lg px-3 py-2
            bg-white/10 backdrop-blur-sm ring-1 ring-gray-600
            text-white placeholder-gray-400
            focus:ring-2 focus:ring-pink-400
          "
          placeholder="0x…"
        />
        <button
          onClick={handleBind}
          disabled={!canBind()}
          className={`
            px-4 py-2 rounded-lg font-semibold
            ${canBind()
              ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105"
              : "bg-gray-600 opacity-50 cursor-not-allowed"
            }
            text-white
            transition-transform
          `}
        >
          {bindAddress ? (canBind() ? "Re-bind" : "Locked") : "Bind"}
        </button>
      </div>
      {!canBind() && (
        <p className="mt-1 text-xs text-gray-400">
          Next update:{" "}
          {new Date(new Date(timeBind).getTime() + 24*60*60*1000)
            .toLocaleString()}
        </p>
      )}
    </div>

          {/* Non-scrolling Content Area */}
          <div className="flex-1 overflow-hidden mt-2 pb-20 px-4">
            <CoinExplainer />
          </div>
        </div>
      </div>
      <Outlet />
    </Animate>
  );
};

export default Profile;
