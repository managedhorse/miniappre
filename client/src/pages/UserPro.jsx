// src/pages/Profile.jsx
import React, { useState } from "react";
import Animate from "../Components/Animate.jsx";
import { Outlet } from "react-router-dom";
import coinsmall from "../images/coinsmall.webp";
import BNBwallet from "../images/BNBwallet.webp";
import { useUser } from "../context/userContext.jsx";
import CoinExplainer from "../Components/CoinExplainer.jsx";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.jsx";

// Helper to format the user's share percentage
function formatUserShare(share) {
  if (share >= 1) return parseFloat(share.toFixed(1)).toString();
  return parseFloat(share.toFixed(6)).toString();
}

// Format large numbers with K/M suffix
function formatNumber(num) {
  if (num < 1000) return new Intl.NumberFormat().format(num);
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)} K`;
  return `${(num / 1_000_000).toFixed(1)} M`;
}

// Format USD range
function formatUsdRange(minValue, maxValue) {
  const fmt = (val) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return Math.round(val).toString();
  };
  return `${fmt(minValue)} - ${fmt(maxValue)} USD`;
}

export default function Profile() {
  const {
    id,
    username,
    totalCount,
    balance,
    refBonus,
    bindAddress,
    timeBind,
    setBindAddress,
    setTimeBind,
  } = useUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [inputAddr, setInputAddr] = useState(bindAddress || "");
  const [error, setError] = useState("");

  // Allow bind only once per 24h
  const canBind = () => {
    if (!timeBind) return true;
    const last = new Date(timeBind).getTime();
    return Date.now() - last >= 24 * 60 * 60 * 1000;
  };

  // Validate basic Ethereum/BSC address
  const isValidEth = (a) => /^0x[a-fA-F0-9]{40}$/.test(a);

  async function handleBind() {
    setError("");
    if (!isValidEth(inputAddr)) {
      setError("❌ Invalid BSC address");
      return;
    }
    if (!canBind()) {
      setError("⏳ You can only re-bind once every 24 hours");
      return;
    }
    try {
      const userRef = doc(db, "telegramUsers", id);
      const now = new Date();
      await updateDoc(userRef, {
        bindAddress: inputAddr,
        timeBind: now,
      });
      setBindAddress(inputAddr);
      setTimeBind(now);
      setModalOpen(false);
      alert("✅ Address bound!");
    } catch (e) {
      console.error(e);
      setError("⚠️ Failed to bind — please try again.");
    }
  }

  // Compute airdrop share and USD range
  const userSharePercent = totalCount
    ? ((balance + refBonus) / totalCount) * 100
    : 0;
  const userShareDisplay = formatUserShare(userSharePercent);
  const userAirdropFraction = 0.2 * (balance + refBonus) / (totalCount || 1);
  const minUserUsd = userAirdropFraction * 3_000_000;
  const maxUserUsd = userAirdropFraction * 5_000_000;

  return (
    <Animate>
      <div className="flex justify-center w-full">
        <div className="flex flex-col w-full h-screen max-w-xl text-white">

          {/* ── Header ── */}
          <div className="flex px-4 items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              {window.Telegram.WebApp.initDataUnsafe?.user?.photo_url && (
                <img
                  src={window.Telegram.WebApp.initDataUnsafe.user.photo_url}
                  alt="Profile"
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="font-semibold">{username}</span>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-semibold text-white hover:scale-105 transition"
            >
              <img src={BNBwallet} alt="BSC" className="w-5 h-5 mr-2" />
              Bind Wallet
            </button>
          </div>

          {/* ── Summary Card ── */}
          <div className="px-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-gray-900">
              <div className="grid grid-cols-3 gap-x-4 gap-y-2 items-center">
                <span className="slackey-regular text-sm">Airdrop</span>
                <div className="col-span-2 flex justify-end items-center space-x-2">
                  <span className="slackey-regular text-xl font-bold">
                    {formatNumber(totalCount)}
                  </span>
                  <img src={coinsmall} alt="Coin" className="w-6 h-6" />
                </div>

                <span className="slackey-regular text-sm">You Hold</span>
                <span className="col-span-2 slackey-regular text-xl font-bold text-right">
                  {userShareDisplay}%
                </span>

                <span className="slackey-regular text-sm">Est. Value</span>
                <span className="col-span-2 slackey-regular text-xl font-bold text-right">
                  {formatUsdRange(minUserUsd, maxUserUsd)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="flex-1 overflow-hidden mt-4 pb-20 px-4">
            <CoinExplainer />
          </div>
        </div>
      </div>

      {/* ── Bind Wallet Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-11/12 max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg text-gray-700 font-bold">Bind Your Wallet</h3>
              <button onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Bind your Binance Smart Chain wallet to receive your airdrop.
            </p>
            <div className="flex items-center space-x-2 mb-4">
              <img src={BNBwallet} alt="BSC Logo" className="w-6 h-6" />
              <input
                type="text"
                value={inputAddr}
                onChange={(e) => setInputAddr(e.target.value)}
                placeholder="0x1234...ABCD"
                className="
                flex-1 rounded-lg px-3 py-2
                bg-white text-gray-900 placeholder-gray-400
                border border-gray-300
                focus:ring-2 focus:ring-pink-400 outline-none
              "
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 mb-4">{error}</p>
            )}
            {!canBind() && (
  <p className="mt-2 text-xs text-gray-700">
    Locked until:{" "}
    {(() => {
      // if timeBind is a Firestore Timestamp, use .toDate(); otherwise assume it's already a Date/string
      const bindDate = timeBind?.toDate ? timeBind.toDate() : new Date(timeBind);
      const next = new Date(bindDate.getTime() + 24 * 60 * 60 * 1000);
      return isNaN(next.getTime())
        ? "—"
        : next.toLocaleString();
    })()}
  </p>
)}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-white hover:bg-gray-300 transition"
              >
                Close
              </button>
              <button
                onClick={handleBind}
                disabled={!canBind()}
                className={`px-4 py-2 rounded-lg font-semibold text-white transition ${
                  canBind()
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105"
                    : "bg-gray-400 cursor-not-allowed opacity-50"
                }`}
              >
                {bindAddress ? (canBind() ? "Re-bind" : "Address Bound") : "Bind"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Outlet />
    </Animate>
  );
}
