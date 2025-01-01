import React, { useEffect, useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import { useUser } from '../context/userContext.jsx';
import { IoCheckmarkCircle } from 'react-icons/io5';
import congratspic from "../images/celebrate.gif";
import Animate from './Animate.jsx';
import ref from "../images/ref.webp";
import coinsmall from "../images/coinsmall.webp";

const friendsRewards = [
  { title: 'Invite 3 buddys', referralsRequired: 2, bonusAward: 50000 },
  { title: 'Invite 5 buddys', referralsRequired: 5, bonusAward: 150000 },
  { title: 'Invite 10 buddys', referralsRequired: 10, bonusAward: 250000 },
  { title: 'Invite 20 buddys', referralsRequired: 20, bonusAward: 500000 },
];

const ReferralRewards = () => {
  const { referrals, balance, setBalance, id, claimedReferralRewards, setClaimedReferralRewards } = useUser();
  const [congrats, setCongrats] = useState(false);


  const handleClaim = async (reward) => {
    if (referrals.length >= reward.referralsRequired && !claimedReferralRewards.includes(reward.title)) {
      const newBalance = balance + reward.bonusAward;
      try {
        const userRef = doc(db, 'telegramUsers', id);
        await updateDoc(userRef, {
          balance: newBalance,
          claimedReferralRewards: [...claimedReferralRewards, reward.title],
        });
        setBalance(newBalance);
        setClaimedReferralRewards([...claimedReferralRewards, reward.title]);
    
        setCongrats(true);

        setTimeout(() => {
          setCongrats(false);
        }, 4000);
      } catch (error) {
        console.error('Error claiming referral reward:', error);
      }
    } else {
      console.error('Already Claimed');
    }
  };

    const formatNumberCliam = (num) => {
        if (num < 100000) {
          return new Intl.NumberFormat().format(num).replace(/,/g, " ");
        } else if (num < 1000000) {
          return new Intl.NumberFormat().format(num).replace(/,/g, " ");
        } else if (num < 10000000) {
            return new Intl.NumberFormat().format(num).replace(/,/g, " ");
          } else {
          return (num / 10000000).toFixed(3).replace(".", ".") + " T";
        }
      };


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
    <Animate>

<div className="flex flex-col w-full space-y-4">

      {friendsRewards
        .filter((reward) => !claimedReferralRewards.includes(reward.title))
        .map((reward) => {
          const progress = (referrals.length / reward.referralsRequired) * 100;
          const isClaimable = referrals.length >= reward.referralsRequired && !claimedReferralRewards.includes(reward.title);
          return (
            <div
                key={reward.title}
                className="slackey-regular bg-activebg border-[1px] border-activeborder relative rounded-[10px] px-[14px] py-[5px] overflow-hidden"
              >
                

                {/* Content Layer */}
                <div className="relative flex flex-wrap justify-between items-center">
                  {/* Left Side Content */}
                  <div className="flex items-center flex-1 space-x-2">
                    <div className="">
                      <img src={ref} alt="bronze" className="w-[50px]" />
                    </div>
                    <div className="flex flex-col space-y-1 text-sm">
                      <span className="font-semibold">{reward.title}</span>
                      <div className="flex items-center space-x-1">
                        <span className="w-[20px] h-[20px]">
                          <img src={coinsmall} className="w-full" alt="coin" />
                        </span>
                        <span className="font-medium">
                          {formatNumberCliam(reward.bonusAward)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Content */}
                  <div className="">
                    <button
                      disabled={!isClaimable}
                      onClick={() => handleClaim(reward)}
                      className={`${
                        isClaimable ? 'bgs-1 text-white' : 'bg-btn2 text-[#fff6]'
                      } relative rounded-[8px] font-semibold py-2 px-3`}
                    >
                      {isClaimable ? 'Claim' : 'Claim'}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex w-full mt-1 p-[4px] items-center bg-[#ffffff1a] rounded-[10px] border-[1px] border-borders">
                    <div
                      className={`h-[8px] rounded-[8px] ${
                        progress >= 100 ? 'bg-btn' : 'bg-btn'
                      }`}
                      style={{ width: `${progress >= 100 ? 100 : progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}

        {/* Congratulations Image */}
        <div className="w-full absolute top-[-35px] left-0 right-0 flex justify-center z-20 pointer-events-none select-none">
          {congrats ? (
            <img src={congratspic} alt="congrats" className="w-[80%]" />
          ) : null}
        </div>

        {/* Success Message */}
        <div
          className={`${
            congrats === true ? 'visible bottom-6' : 'invisible bottom-[-10px]'
          } z-[60] ease-in duration-300 w-full fixed left-0 right-0 px-4`}
        >
          <div className="w-full text-[#54d192] flex items-center space-x-2 px-4 bg-[#121620ef] h-[50px] rounded-[8px]">
            <IoCheckmarkCircle size={24} className="" />

            <span className="font-medium">Good</span>
          </div>
        </div>
      </div>
    </Animate>
  );
};

export default ReferralRewards;
