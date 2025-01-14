import React, { useState } from "react";
import Animate from "../Components/Animate.jsx";
import { Outlet } from "react-router-dom";
import coinsmall from "../images/coinsmall.webp";
import { TonConnectButton } from "@tonconnect/ui-react";
import { useUser } from "../context/userContext";
import tswap from "../images/tswap.png";
import botr from "../images/bott.webp";
import { IoClose } from "react-icons/io5";

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

  // Define your projects with custom background and text colors
  const projects = [
    {
      id: 1,
      logo: tswap,
      title: "To be announced",
      subtitle: "An Agentic AI Token",
      aboutLines: [
        "5% of total supply to TapMianus players",
        "Agentic AI application powered by Virtuals protocol",
        "Token on BASE chain",
      ],
      siteLink: "https://app.virtuals.io/", // Replace with your actual link
      bgColor: "#cee856", // Example background color
      textColor: "#070e25", // Example text color
    },
    // Add more projects as needed
  ];

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

          {/* Airdrop Box with Margin Bottom */}
          <div className="flex slackey-regular justify-between gap-2 px-4 mt-4 mb-2">
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
                    {formatNumber(totalCount)}
                  </p>
                </div>
              </div>

              {/* “Your part” on the same line, right side */}
              <div className="flex items-end">
                <h3 className="text-md">You have:&nbsp;</h3>
                <div className="flex items-center w-full pt-1 space-x-2">
                  <p className="text-sm">
                    {userShareDisplay}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content Area with Margin Top and Padding Bottom */}
          <div className="flex-1 overflow-y-auto no-scrollbar mt-2 pb-20 px-4">
            {/* Projects Section */}
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-lg p-4 mb-4"
                style={{ backgroundColor: proj.bgColor, color: proj.textColor }}
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
                    <p className="text-sm slackey-regular">
                      {proj.subtitle}
                    </p>
                  </div>
                </div>

                {/* About / Lines */}
                <div className="text-sm leading-relaxed slackey-regular">
                  {proj.aboutLines.map((line, idx) => (
                    <p key={idx} className="mb-2">
                      {line}
                    </p>
                  ))}
                </div>

                {/* Link to Site */}
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
  );
};

export default Profile;
