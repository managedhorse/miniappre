import React from "react";
import Animate from "../Components/Animate.jsx";
import { Outlet } from "react-router-dom";
import iDemo from "../images/bronze.png";
import { useUser } from "../context/userContext.jsx";
import { useNavigate } from 'react-router-dom';
const More = () => {
  // eslint-disable-next-line
  const navigate = useNavigate();
const { totalCount, dividedCount, users, dividedUsers } = useUser();
// const [showModal, setShowModal] = useState(false);


  const formatNumber = (num) => {
    if (num < 100000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, " ");
    } else if (num < 1000000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, " ") + " K";
    } else {
      return (num / 1000000).toFixed(3).replace(".", ".") + " M";
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
          <div className="w-full px-5 space-y-3">
                <div className="flex items-center justify-center w-full pt-2 pb-3">
                    <h2 className="text-[#9d99a9] text-[20px] font-medium">
                        More
                    </h2>
                </div>

                <div className="w-full pr-list">
                  <div className="grid items-start grid-cols-2 gap-4 pb-3">
                    <div onClick={() => navigate("/more/daily-reward")} className="text-center item-list bg-[#ffffff1a] border-[#45434305] rounded-2xl p-4">
                        <div className="flex justify-center w-full icon-item">
                            <img src={iDemo} alt="" className="h-[70px]" />
                        </div>
                        <div className="w-full item-text">
                            <h3 className="font-semibold text-[17px]"> Daily Rewasrd </h3>
                            <p className="font-medium text-[15px] pt-2">Com every day to get reward</p>
                        </div>
                    </div>
                    <div onClick={() => navigate("/more/leaderboard")} className="text-center item-list bg-[#3b393942] border-[#45434305] rounded-2xl p-4">
                        <div className="flex justify-center w-full icon-item">
                            <img src={iDemo} alt="" className="h-[70px]" />
                        </div>
                        <div className="w-full item-text">
                            <h3 className="font-semibold text-[17px]"> Ranking </h3>
                            <p className="font-medium text-[15px] pt-2">Play with the whole world</p>
                        </div>
                    </div>
                    <div className="text-center item-list bg-[#3b393942] border-[#45434305] rounded-2xl p-4">
                        <div className="flex justify-center w-full icon-item">
                            <img src={iDemo} alt="" className="h-[70px]" />
                        </div>
                        <div className="w-full item-text">
                            <h3 className="font-semibold text-[17px]"> Garage </h3>
                            <p className="font-medium text-[15px] pt-2">Choose your spaceship model</p>
                        </div>
                    </div>
                    <div className="text-center item-list bg-[#3b393942] border-[#45434305] rounded-2xl p-4">
                        <div className="flex justify-center w-full icon-item">
                            <img src={iDemo} alt="" className="h-[70px]" />
                        </div>
                        <div className="w-full item-text">
                            <h3 className="font-semibold text-[17px]"> Rewards </h3>
                            <p className="font-medium text-[15px] pt-2">List of your recent rewards</p>
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

export default More;
