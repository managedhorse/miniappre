import React, {useState} from "react";
import Animate from "../Components/Animate.jsx";
import { Outlet } from "react-router-dom";
import coinsmall from "../images/coinsmall.webp";
import convertPic from "../images/convert.webp";
import {TonConnectButton} from "@tonconnect/ui-react";
import { useUser } from "../context/userContext";
import tswap from "../images/tswap.png";
import botr from "../images/bott.webp";
import { IoClose } from "react-icons/io5";

const Profile = () => {
  // eslint-disable-next-line
const { totalCount, dividedCount, users, dividedUsers, username } = useUser();
const [modalConvertVisibleEnc, setModalConvert] = useState(false);

const formatNumber = (num) => {
  // under 1,000 => return just the number
  if (num < 1000) {
    return new Intl.NumberFormat().format(num);
  }
  // under 1,000,000 => convert to thousands (xxx.x K)
  else if (num < 1000000) {
    const thousands = (num / 1000).toFixed(1);
    return `${thousands} K`;
  }
  // 1,000,000 or more => convert to millions (xxx.x M)
  else {
    const millions = (num / 1000000).toFixed(1);
    return `${millions} M`;
  }
};

  const formattedUsers = new Intl.NumberFormat()
    .format(users)
    .replace(/,/g, " ");

  const formattedDividedUsers = new Intl.NumberFormat()
    .format(dividedUsers)
    .replace(/,/g, " ");

  return (
    <>

    <Animate>
        <div className="flex justify-center">
            <div className="flex flex-col w-full h-screen max-w-xl font-bold text-white">
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

                
                {/* 
              SCROLLABLE SECTION
              We'll give it a flex-1 (to fill remaining height),
              overflow-y-auto, and the no-scrollbar class.
            */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="flex slackey-regular justify-between gap-2 px-4 mt-4">
                <div className="bg-[#ffffff1a] rounded-lg px-4 py-2 w-full">
                  <h3 className="text-lg">Total Airdrop</h3>
                  <div className="flex items-center w-full pt-1 space-x-2">
                    <div className="p-1">
                      <img
                        src={coinsmall}
                        alt="Coin smail"
                        className="w-6 h-6 mx-auto"
                      />
                    </div>
                    <div>
                      <p className="text-md">{formatNumber(totalCount)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="w-full min-h-[150px] px-4 mt-5"
                style={{
                  backgroundImage: `url(${tswap})`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "contain",
                }}
              ></div>
              {/* Description */}
              <div className="px-4 mt-4 text-sm leading-relaxed slackey-regular mb-20">
                <h3 className="text-lg mb-2">About Lucky Rabbi</h3>
                <p className="mb-2">
                  The Lucky Rabbi is a <strong>provably fair iGaming platform</strong>{" "}
                  partnered with Boss88, Asia Gaming, and GFG Gaming. The Lucky Rabbi
                  token is the platform token that will receive the total GGR (Gross
                  Gaming Revenue) of all games played on the platform in the form of
                  a dividend.
                </p>
              </div>
            </div>

            {/* FLOATING CONVERT BUTTON (always visible) */}
            <div
              onClick={() => setModalConvert(true)}
              className="
                bg-[#ffffff1a] 
                rounded-full 
                p-3 
                w-fit 
                flex 
                flex-col 
                items-center 
                justify-center 
                fixed 
                bottom-[86px]
                right-4 
                shadow-lg 
                cursor-pointer 
                hover:bg-white/20 
                transition
              "
            >
              <img src={convertPic} alt="Convert" className="w-8 h-8" />
              <p className="text-[10px] text-center slackey-regular text-white mt-1">
                Convert
              </p>
            </div>

            {/* MODAL */}
            <div
              className={`${
                modalConvertVisibleEnc ? "visible" : "invisible"
              } absolute bottom-0 left-0 right-0 h-fit bg-[#1e2340f7] z-[100] rounded-tl-[20px] rounded-tr-[20px] flex justify-center px-4 py-5`}
            >
              <div className="flex slackey-regular flex-col justify-between w-full py-8">
                <button
                  onClick={() => setModalConvert(false)}
                  className="flex items-center justify-center absolute right-8 top-8 text-center rounded-[12px] font-medium text-[16px]"
                >
                  <IoClose size={24} className="text-[#9a96a6]" />
                </button>

                <div className="flex flex-col items-center justify-center w-full">
                  <div className="w-[120px] h-[120px] rounded-[25px] bg-[#252e57] flex items-center justify-center">
                    <img alt="claim" src={botr} className="w-[80px]" />
                  </div>
                  <h3 className="font-semibold text-center text-[20px] py-4">
                    Convert to Rabbi-Shekels
                  </h3>
                  <p className="pb-6 text-[#9a96a6] text-[16px] text-center">
                    Ratio : 1/1000
                  </p>

                  <div className="flex items-center flex-1 space-x-2">
                    <div>
                      <img src={coinsmall} className="w-[25px]" alt="Coin Icon" />
                    </div>
                    <div className="font-bold text-[26px] flex items-center">
                      1000 = 1 coin
                    </div>
                  </div>
                </div>
                <div className="flex justify-center w-full pt-4 pb-6">
                  <button
                    disabled={true}
                    className="bg-btn2 text-[#979797] w-full py-5 px-3 flex items-center justify-center text-center rounded-[12px] font-semibold text-[22px]"
                  >
                    Convert at TGE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Outlet />
      </Animate>
    </>
  );
};

export default Profile;