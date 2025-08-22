// src/pages/Ref.jsx
import React, { useState } from "react";
import Animate from "../Components/Animate.jsx";
import { Outlet } from "react-router-dom";
import ClaimLeveler from "../Components/ClaimLeveler.jsx";
import Spinner from "../Components/Spinner.jsx";
import coinsmall from "../images/coinsmall.webp";
import { useUser } from "../context/userContext.jsx";
import ReferralRewards from "../Components/Rewards.jsx";
import { retrieveLaunchParams } from '@telegram-apps/sdk';

const REDEEM_URL = "https://function-ruby.vercel.app/api/redeemPromo";

const Ref = () => {
  const {
    id,
    referrals,
    loading,
    // added from userContext
    promo,
    setPromo,
    setBalance,
  } = useUser();

  // eslint-disable-next-line
  const [claimLevel, setClaimLevel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeIndex, setActiveIndex] = useState(1);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState(null);

  // Promo UI state
  const [promoInput, setPromoInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState("");
  const [redeemErr, setRedeemErr] = useState("");

  const copyToClipboard = () => {
    const reflink = `https://t.me/TapMianusBot/app?startapp=r${id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(reflink)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 10000);
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = reflink;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy", err);
      }
      document.body.removeChild(textArea);
    }
  };

  // Telegram share
  const handleShare = async () => {
    if (!id) {
      setShareError("User ID is not available.");
      return;
    }

    setSharing(true);
    setShareError(null);

    try {
      const response = await fetch(
        "https://function-ruby.vercel.app/api/getPreparedMessage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: id }),
        }
      );

      const data = await response.json();

      if (response.ok && data.prepared_message_id) {
        const preparedMessageId = data.prepared_message_id;

        if (
          window.Telegram &&
          window.Telegram.WebApp &&
          window.Telegram.WebApp.shareMessage
        ) {
          window.Telegram.WebApp.shareMessage(preparedMessageId, (success) => {
            if (!success) {
              setShareError("Message sharing failed.");
            }
          });
        } else {
          setShareError("Sharing is not supported in this environment.");
        }
      } else {
        setShareError(data.error || "Failed to prepare message for sharing.");
      }
    } catch (error) {
      console.error("Error sharing message:", error);
      setShareError("An unexpected error occurred while sharing.");
    } finally {
      setSharing(false);
    }
  };

  const formatNumber = (num) => {
    if (num < 1000000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, " ");
    } else {
      return (num / 1000000).toFixed(3) + " M";
    }
  };

  const handleMenu = (index) => setActiveIndex(index);

  const handleRedeem = async () => {
  setRedeemMsg("");
  setRedeemErr("");

  if (!id) {
    setRedeemErr("User not ready yet.");
    return;
  }
  if (promo?.code) {
    setRedeemErr("Promo already redeemed.");
    return;
  }

  const code = (promoInput || "").trim().toUpperCase();
  if (!code) {
    setRedeemErr("Please enter a promo code.");
    return;
  }

  // Prefer SDK initDataRaw, fallback to window.Telegram
  let initDataRaw = "";
  try {
    const { initDataRaw: sdkRaw } = retrieveLaunchParams();
    initDataRaw = sdkRaw || "";
  } catch {}
  if (!initDataRaw && window?.Telegram?.WebApp?.initData) {
    initDataRaw = window.Telegram.WebApp.initData;
  }
  if (!initDataRaw) {
    setRedeemErr("Telegram init data not available. Please open in Telegram.");
    return;
  }

  setRedeeming(true);
  try {
    const resp = await fetch(REDEEM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `tma ${initDataRaw}`,
      },
      body: JSON.stringify({ code }),
    });

    let data = {};
    try {
      data = await resp.json();
    } catch {}

    if (!resp.ok || !data.ok) {
      const err = data?.error || `HTTP_${resp.status}`;
      const nice = {
        INVALID_CODE: "Invalid code.",
        INACTIVE_CODE: "This code is not active.",
        EXPIRED_CODE: "This code has expired.",
        CODE_DEPLETED: "This code has reached its limit.",
        ALREADY_REDEEMED: "You have already redeemed a code.",
        INVALID_SIGNATURE: "Auth failed. Close and reopen the mini app.",
        INITDATA_TOO_OLD: "Session expired. Reopen the mini app.",
      }[err] || "Failed to redeem code.";
      setRedeemErr(nice);
      return;
    }

    if (data.promo) setPromo(data.promo);            // { code, amount, type }
    if (typeof data.balance === "number") setBalance(data.balance);

    setRedeemMsg(`Success! +${formatNumber(data?.promo?.amount || 0)} added to balance.`);
    setPromoInput("");
  } catch (e) {
    console.error("Redeem error:", e);
    setRedeemErr("Server error. Please try again.");
  } finally {
    setRedeeming(false);
  }
};

  return (
    <>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Animate>
            <div className="flex-col justify-center w-full px-5 space-y-3 pb-[80px]">
              {/* Header */}
              <div className="flex flex-col items-center justify-center space-y-0">
                <h1 className="text-[#fff] slackey-regular -mb-2 text-[30px] font-semibold">
                  {referrals.length} Buddys
                </h1>
                <p className="text-[#fff] slackey-regular">
                  Invite your friends and get 10% of their taps!
                </p>
              </div>

              {/* Referral Link Section */}
              <div className="relative bg-activebg border-[1px] border-activeborder w-full rounded-[12px] px-3 py-3 flex flex-col overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: "rgba(139, 0, 0, 0.8)",
                    filter: "blur(10px)",
                  }}
                />
                <div className="relative">
                  <span className="flex items-center justify-between w-full pb-2">
                    <h2 className="text-[18px] slackey-regular font-semibold">
                      Invite Link:
                    </h2>
                    <div className="flex space-x-2">
                      <span
                        onClick={copyToClipboard}
                        className="bg-activebg border-[1px] border-activeborder slackey-regular font-medium py-[6px] px-4 rounded-[12px] flex items-center justify-center text-[16px] cursor-pointer"
                      >
                        {copied ? <span>Done</span> : <span>Copy</span>}
                      </span>
                      <span
                        onClick={handleShare}
                        className="bg-activebg border-[1px] border-activeborder slackey-regular font-medium py-[6px] px-4 rounded-[12px] flex items-center justify-center text-[16px] cursor-pointer"
                      >
                        {sharing ? <span>Done</span> : <span>Share</span>}
                      </span>
                    </div>
                  </span>
                  {shareError && (
                    <div className="text-red-500 text-sm mt-2">
                      Error: {shareError}
                    </div>
                  )}
                  <div className="text-[#fffff] font-small ">
                    https://t.me/TapMianusBot/app?startapp=r{id}
                  </div>
                </div>
              </div>

              {/* ---- Promo Code Card ---- */}
              <div className="w-full mt-4">
                <div className="relative bg-activebg border-[1px] border-activeborder w-full rounded-[12px] px-3 py-3 overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: "rgba(139, 0, 0, 0.55)",
                      filter: "blur(12px)",
                    }}
                  />
                  <div className="relative">
                    <h2 className="text-[18px] slackey-regular font-semibold mb-2">
                      Promo Code
                    </h2>

                    {/* If already redeemed, show locked/disabled */}
                    {promo?.code ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={String(promo.code).toUpperCase()}
                          disabled
                          className="flex-1 rounded-[10px] px-3 py-2 bg-[#ffffff22] text-white border border-activeborder opacity-70"
                        />
                        <span className="text-xs px-2 py-1 rounded bg-[#ffffff22] text-white border border-activeborder">
                          Redeemed
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={promoInput.toUpperCase()}
                            onChange={(e) => setPromoInput(e.target.value)}
                            placeholder="Enter promo code"
                            className="flex-1 rounded-[10px] px-3 py-2 bg-[#ffffff22] text-white placeholder-white/70 border border-activeborder outline-none"
                          />
                          <button
                            onClick={handleRedeem}
                            disabled={redeeming}
                            className={`px-4 py-2 rounded-[10px] slackey-regular text-white border ${
                              redeeming
                                ? "opacity-60 cursor-not-allowed bg-[#ffffff22] border-activeborder"
                                : "bg-cards border-activeborder hover:opacity-90"
                            }`}
                          >
                            {redeeming ? "..." : "Apply"}
                          </button>
                        </div>
                        {redeemMsg && (
                          <p className="text-green-300 text-sm mt-2">
                            {redeemMsg}
                          </p>
                        )}
                        {redeemErr && (
                          <p className="text-red-400 text-sm mt-2">
                            {redeemErr}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-borders w-full px-5 h-[1px] !mt-6"></div>

              {/* Menu and Scrollable Content */}
              <div className="w-full">
                {/* Menu Buttons */}
                <div className="w-full rounded-[10px] slackey-regular p-1 flex items-center">
                  <div
                    onClick={() => handleMenu(1)}
                    className={`${
                      activeIndex === 1 ? "bg-cards" : ""
                    } rounded-[6px] py-[12px] px-3 w-[49%] flex justify-center text-center items-center cursor-pointer`}
                  >
                    Invites
                  </div>

                  <div
                    onClick={() => handleMenu(2)}
                    className={`${
                      activeIndex === 2 ? "bg-cards" : ""
                    } rounded-[6px] py-[12px] px-3 w-[49%] flex justify-center text-center items-center cursor-pointer`}
                  >
                    Stats
                  </div>
                </div>

                {/* Scrollable Container */}
                <div className="!mt-[10px] w-full flex flex-col">
                  <div className="w-full flex flex-col h-[50vh] pt-2 pb-[60px] overflow-y-auto">
                    {/* Earn Section */}
                    <div
                      className={`${
                        activeIndex === 1 ? "flex" : "hidden"
                      } alltaskscontainer flex-col w-full space-y-2 pb-20`}
                    >
                      <ReferralRewards />
                    </div>

                    {/* Stats Section */}
                    <div
                      className={`${
                        activeIndex === 2 ? "flex" : "hidden"
                      } alltaskscontainer flex-col w-full space-y-2 pb-20`}
                    >
                      {/* Referral List */}
                      <div className="flex flex-col w-full">
                        <h3 className="text-[22px] slackey-regular font-semibold pb-[16px]">
                          My Buddys:
                        </h3>

                        <div className="flex flex-col w-full space-y-3">
                          {referrals.length === 0 ? (
                            <p className="text-center w-full slackey-regular now pt-8 px-5 text-[14px] leading-[24px]">
                              You don't have buddys yet 😭
                              <br />
                              Invite your friends and get 10% of their taps!
                            </p>
                          ) : (
                            referrals.map((user, index) => (
                              <div
                                key={index}
                                className="bg-[#ffffff1a] rounded-[10px] p-[14px] flex flex-wrap justify-between items-center"
                              >
                                <div className="flex flex-col flex-1 space-y-1">
                                  <div className="text-[#fff] pl-1 text-[16px] font-semibold">
                                    {user.username}
                                  </div>

                                  <div className="flex items-center space-x-1 text-[14px] text-[#e5e5e5]">
                                    <div>
                                      <img
                                        src={user.level.imgUrl}
                                        alt={user.level.name}
                                        className="w-[18px]"
                                      />
                                    </div>
                                    <span className="font-medium text-[#9a96a6]">
                                      {user.level.name}
                                    </span>
                                    <span className="bg-[#bdbdbd] w-[1px] h-[13px] mx-2"></span>

                                    <span className="w-[20px]">
                                      <img
                                        src={coinsmall}
                                        className="w-full"
                                        alt="coin"
                                      />
                                    </span>
                                    <span className="font-normal text-[#ffffff] text-[15px]">
                                      {formatNumber(user.balance * 10)}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-[#fffff] font-semibold text-[14px]">
                                  <p>Upstream </p>
                                </div>
                                <div className="text-[#2e3a56] font-semibold text-[14px]">
                                  +{formatNumber(user.balance)}
                                </div>
                                <div className="flex w-full mt-2 p-[4px] items-center bg-energybar rounded-[10px] border-[1px] border-borders">
                                  <div className="h-[10px] rounded-[8px] bg-btn w-[.5%]"></div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Claim Leveler Modal */}
              <ClaimLeveler
                claimLevel={claimLevel}
                setClaimLevel={setClaimLevel}
              />
            </div>
            <Outlet />
          </Animate>
        </>
      )}
    </>
  );
};

export default Ref;
