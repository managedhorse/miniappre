import React, { useState } from "react";
import Animate from "../Components/Animate.jsx";
import { Outlet } from "react-router-dom";
import ClaimLeveler from "../Components/ClaimLeveler.jsx";
import Spinner from "../Components/Spinner.jsx";
import coinsmall from "../images/coinsmall.webp";
import { useUser } from "../context/userContext.jsx";
import ReferralRewards from '../Components/Rewards.jsx';

const Ref = () => {
  const { id, referrals, loading } = useUser();
  // eslint-disable-next-line
  const [claimLevel, setClaimLevel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeIndex, setActiveIndex] = useState(1);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState(null);

  const copyToClipboard = () => {
    const reflink = `https://t.me/tap_mianus_bot?start=r${id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reflink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 10000); // Reset after 10 seconds
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    } else {
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = reflink;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error('Failed to copy', err);
      }
      document.body.removeChild(textArea);
    }
  };

   // Updated handleShare function to use server's prepared_message_id
  const handleShare = async () => {
    if (!id) {
      setShareError('User ID is not available.');
      return;
    }

    setSharing(true);
    setShareError(null);

    try {
      // Request prepared message ID from the server
      const response = await fetch('/api/getPreparedMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: id }),
      });      

      const data = await response.json();

      if (response.ok && data.prepared_message_id) {
        const preparedMessageId = data.prepared_message_id;
        console.log('Prepared Message ID:', preparedMessageId);

        // Ensure Telegram.WebApp is available
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.shareMessage) {
          window.Telegram.WebApp.shareMessage(preparedMessageId, (success) => {
            if (success) {
              console.log('Message shared successfully');
            } else {
              console.error('Message sharing failed');
              setShareError('Message sharing failed.');
            }
          });
        } else {
          console.error('Telegram.WebApp.shareMessage is not available');
          setShareError('Sharing is not supported in this environment.');
        }
      } else {
        console.error('Failed to get prepared_message_id:', data.error);
        setShareError(data.error || 'Failed to prepare message for sharing.');
      }
    } catch (error) {
      console.error('Error sharing message:', error);
      setShareError('An unexpected error occurred while sharing.');
    } finally {
      setSharing(false);
    }
  };

  const formatNumber = (num) => {
    if (num < 1000000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, " ");
    } else {
      return (num / 1000000).toFixed(3).replace(".", ".") + " M";
    }
  };

  const handleMenu = (index) => {
    setActiveIndex(index);
  };

  return (
    <>
      {loading ? (
        // Display loading indicator if data is fetching
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
              </div>
           
              {/* Referral Link Section */}
              <div className="relative bg-activebg border-[1px] border-activeborder w-full rounded-[12px] px-3 py-3 flex flex-col overflow-hidden">
  <div
    className="absolute inset-0"
    style={{
      backgroundColor: 'rgba(139, 0, 0, 0.8)',
      filter: 'blur(10px)',
    }}
  ></div>
  <div className="relative">
                <span className="flex items-center justify-between w-full pb-2">
                  <h2 className="text-[18px] slackey-regular font-semibold">Invite Link:</h2>
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
                <div className="text-[#fffff] font-medium ">
                  https://t.me/tap_mianus_bot?start=r{id}
                </div>
              </div>
</div>
              <div className="bg-borders w-full px-5 h-[1px] !mt-6"></div>

              {/* Menu and Scrollable Content */}
              <div className='w-full'>
                {/* Menu Buttons */}
                <div className='w-full rounded-[10px] slackey-regular p-1 flex items-center'>
                  <div
                    onClick={() => handleMenu(1)}
                    className={`${activeIndex === 1 ? 'bg-cards' : ''} rounded-[6px] py-[12px] px-3 w-[49%] flex justify-center text-center items-center cursor-pointer`}
                  >
                    Invites
                  </div>

                  <div
                    onClick={() => handleMenu(2)}
                    className={`${activeIndex === 2 ? 'bg-cards' : ''} rounded-[6px] py-[12px] px-3 w-[49%] flex justify-center text-center items-center cursor-pointer`}
                  >
                    Stats
                  </div>
                </div>

                {/* Scrollable Container */}
                <div className='!mt-[10px] w-full flex flex-col'>
                  <div className='w-full flex flex-col h-[50vh] pt-2 pb-[60px] overflow-y-auto'>
                    {/* Earn Section */}
                    <div className={`${activeIndex === 1 ? 'flex' : 'hidden'} alltaskscontainer flex-col w-full space-y-2 pb-20`}>
                      <ReferralRewards />
                    </div>

                    {/* Stats Section */}
                    <div className={`${activeIndex === 2 ? 'flex' : 'hidden'} alltaskscontainer flex-col w-full space-y-2 pb-20`}>
                      {/* Referral List */}
                      <div className="flex flex-col w-full">
                        <h3 className="text-[22px] slackey-regular font-semibold pb-[16px]">My Buddys:</h3>

                        <div className="flex flex-col w-full space-y-3">
                          {referrals.length === 0 ? (
                            <p className='text-center w-full slackey-regular now pt-8 px-5 text-[14px] leading-[24px]'>
                              You don't have buddys yet 😭

                              Invite your friends and get 10% upstream income from their taps!
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
                                      <img src={user.level.imgUrl} alt={user.level.name} className="w-[18px]" />
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
                                      {formatNumber(user.balance)}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-[#fffff] font-semibold text-[14px]">
                                  <p>Upstream </p>
                                </div>
                                <div className="text-[#2e3a56] font-semibold text-[14px]">
                                  +{formatNumber(user.balance / 100 * 10)}
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
              <ClaimLeveler claimLevel={claimLevel} setClaimLevel={setClaimLevel} />
            </div>
            <Outlet />
          </Animate>
        </>
      )}
    </>
  );
};

export default Ref;
