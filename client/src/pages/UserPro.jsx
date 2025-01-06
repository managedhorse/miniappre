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

// 1. Our new helper function
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
  // eslint-disable-next-line
const { totalCount, dividedCount, users, dividedUsers, username, balance } = useUser();
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

 // 2. Calculate the user’s share in % if totalCount is not zero
 let userSharePercent = 0;
 if (totalCount && totalCount !== 0) {
   userSharePercent = (balance / totalCount) * 100;
 }

 // 3. Format the share using our new helper
 const userShareDisplay = formatUserShare(userSharePercent);

  const formattedUsers = new Intl.NumberFormat()
    .format(users)
    .replace(/,/g, " ");

  const formattedDividedUsers = new Intl.NumberFormat()
    .format(dividedUsers)
    .replace(/,/g, " ");

    const projects = [
      {
        id: 1,
        logo: tswap,
        title: "The Lucky Rabbi",
        subtitle: "A Jewish-themed gambling platform. 100% Certified Kosher",
        aboutLines: [
          "BYJFOJ - By Jews For Jews",
          "The Lucky Rabbi is a provably fair iGaming platform partnered with Boss88, Asia Gaming, and GFG Gaming.",
          "The Lucky Rabbi token is the platform token that will receive the total GGR (Gross Gaming Revenue) of all games played on the platform in the form of a dividend.",
        ],
        siteLink: "https://example.com", // Or your real link
      },
    ];

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

                
                {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="flex slackey-regular justify-between gap-2 px-4 mt-4">
                {/* Airdrop box */}
                <div className="bg-[#ffffff1a] rounded-lg px-4 py-2 w-full flex items-center justify-between">
                  <div>
                    <h3 className="text-md">Total Mianus</h3>
                    <div className="flex items-center w-full pt-1 space-x-2">
                      <div className="p-1">
                        <img
                          src={coinsmall}
                          alt="Coin smail"
                          className="w-6 h-6 mx-auto"
                        />
                      </div>
                      <p className="text-sm">
                        {/* Show total */}
                        {formatNumber(totalCount)}
                      </p>
                    </div>
                  </div>

                  {/* “Your part” on the same line, right side */}
                  <div className="flex items-end">
                  <h3 className="text-md">You have: </h3>
                  <div className="flex items-center w-full pt-1 space-x-2">
                    <p className="text-sm">
                       {userShareDisplay}%
                    </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects Section */}
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-[#ffffff1a] rounded-lg p-4 mb-4"
                >
                  {/* Logo + Title */}
                  <div className="flex items-center space-x-4 mb-3">
                    <img
                      src={proj.logo}
                      alt={proj.title}
                      className="w-[60px] h-[60px] object-contain"
                    />
                    <div>
                      <h2 className="text-lg font-bold">{proj.title}</h2>
                      <p className="text-sm text-gray-300 slackey-regular">
                        {proj.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* About / Lines */}
                  <div className="text-sm leading-relaxed text-gray-100 slackey-regular">
                    {proj.aboutLines.map((line, idx) => (
                      <p key={idx} className="mb-2">
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Link to site */}
                  {proj.siteLink && (
                    <div className="mt-3">
                      <a
                        href={proj.siteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#ffffff1a] hover:bg-[#ffffff33] text-white px-4 py-2 rounded"
                      >
                        Visit Site
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <Outlet />
      </Animate>
    </>
  );
};

export default Profile;