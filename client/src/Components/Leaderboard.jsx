import React, {useEffect} from "react";
import Animate from "./Animate.jsx";
import { Outlet } from "react-router-dom";
import coinsmall from "../images/coinsmall.webp";

import { LiaMedalSolid } from "react-icons/lia";
// Adjust the path as needed
import { useUser } from "../context/userContext";

const Leaderboard = () => {
  const { balance, refBonus, leaderboard, rankUser, username, users } = useUser();


  const formatNumber = (num) => {
    if (num < 100000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, " ");
    } else if (num < 1000000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, " ");
    } else {
      return (num / 1000000).toFixed(3).replace(".", ".") + " M";
    }
  };

  const formattedUsers = new Intl.NumberFormat()
  .format(users)
  .replace(/,/g, " ");

  useEffect(() => {
 
    // Show the back button when the component mounts
    window.Telegram.WebApp.BackButton.show();

    // Attach a click event listener to handle the back navigation
    const handleBackButtonClick = () => {
      window.history.back();
    };

    window.Telegram.WebApp.BackButton.onClick(handleBackButtonClick);

    // Clean up the event listener and hide the back button when the component unmounts
    return () => {
      window.Telegram.WebApp.BackButton.offClick(handleBackButtonClick);
      window.Telegram.WebApp.BackButton.hide();
    };

  }, []);

  return (
    <>
      <Animate>
        <div className="flex-col justify-center w-full px-5 space-y-3 pb-[80px]">
          {/* Header Section */}
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-center w-full pb-2">
              <h2 className="text-[#9d99a9] text-[30px] font-medium">
                Leaderboard
              </h2>
            </div>
            <p className="text-center w-full pb-2 text-[26px]">
              {formattedUsers} {" "} Holders
            </p>
            {/* Current User Info */}
            <div className="flex flex-col w-full space-y-2 alltaskscontainer">
              <div className="flex alltaskscontainer flex-col w-full space-y-2 pb-2">
                <div
                  className="bg-cards rounded-[10px] px-[14px] py-[5px] flex justify-between items-center"
                >
                  <div className="flex items-center flex-1 space-x-2">
                    <div className="w-[46px]">
                      {/** Display Current User's Profile Picture */}
                      {window.Telegram.WebApp.initDataUnsafe?.user?.photo_url ? (
                        <img
                          src={window.Telegram.WebApp.initDataUnsafe.user.photo_url}
                          alt="Profile"
                          className="w-[46px] h-[46px] rounded-full object-cover"
                        />
                      ) : (
                        <span className="w-full px-[10px] py-[10px] text-sm bg-[#ffffff1a] rounded-full text-amber-500 uppercase text-center">
                          {username.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col space-y-1 text-left">
                      <span className="font-semibold text-[15px]">
                        {username}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="w-[20px] h-[20px]">
                          <img src={coinsmall} className="w-full" alt="coin" />
                        </span>
                        <span className="flex items-center font-medium">
                          <span className="text-[14px]">
                            {formatNumber(balance + refBonus)}
                          </span>{" "}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Medal Icon */}
                  <div className="">
                    <LiaMedalSolid className="text-[#d0ef36] w-[28px] h-[28px] mt-[2px]" />
                  </div>
                </div>
              </div>
            </div>
            {/* Divider */}
            <div className="bg-borders w-full px-5 h-[1px] !mt-3 !mb-5"></div>
            <div className="flex flex-col w-full pt-2">
              <h3 className="text-[18px] font-semibold">Top 50 {" "} Holders</h3>
            </div>
          </div>

          {/* Scrollable Container */}
          <div className="w-full !mt-[20px] flex flex-col">
            <div className="w-full flex flex-col h-[50vh] pt-2 pb-[60px] overflow-y-auto">
              <div className="flex flex-col w-full space-y-2 pb-2">
                {leaderboard.map((rank, index) => (
                  <div
                    key={rank.userId}
                    className="bg-cards rounded-[10px] px-[14px] py-[5px] flex justify-between items-center"
                  >
                    <div className="flex items-center flex-1 space-x-2">
                      <div className="w-[46px]">
                        {/** Display User's Profile Picture */}
                        {rank.photo_url ? (
                          <img
                            src={rank.photo_url}
                            alt={rank.username}
                            className="w-[46px] h-[46px] rounded-full object-cover"
                          />
                        ) : (
                          <span className="w-[46px] px-[10px] py-[10px] text-sm text-white rounded-full bg-slate-700 uppercase text-center">
                            {rank.username.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col space-y-1 text-left">
                        <span className="font-semibold text-[15px]">
                          {rank.username}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="w-[20px] h-[20px]">
                            <img src={coinsmall} className="w-full" alt="coin" />
                          </span>
                          <span className="flex items-center font-medium">
                            <span className="text-[14px]">
                              {formatNumber(rank.balance)}
                            </span>{" "}
                            <span className="bg-[#bdbdbd] w-[1px] h-[13px] mx-2"></span>
                            <span className="text-[#9a96a6] text-[14px]">
                              Rank #{index + 1}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Medal Icon */}
                    <div className="">
                      {index + 1 <= 3 ? (
                        <>
                          {index + 1 === 3 && (
                            <LiaMedalSolid className="w-[28px] h-[28px] text-[#813e20] mt-[2px]" />
                          )}
                          {index + 1 === 2 && (
                            <LiaMedalSolid className="w-[28px] h-[28px] text-[#fff] mt-[2px]" />
                          )}
                          {index + 1 === 1 && (
                            <LiaMedalSolid className="w-[28px] h-[28px] text-[#efba36] mt-[2px]" />
                          )}
                        </>
                      ) : (
                        <LiaMedalSolid className="w-[28px] h-[28px] text-[#34ec5f] mt-[2px]" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Outlet />
      </Animate>
      {/* )} */}
    </>
  );
};

export default Leaderboard;
