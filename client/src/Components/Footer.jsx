import React from "react";
import ref from "../images/ref.webp";
import boost from "../images/shop.webp";
import tasks from "../images/tasks.webp";
import stats from "../images/locked.webp";
import coinsmall from "../images/coinsmall.webp";
import Friends from '../images/friends.webp';
import { NavLink } from "react-router-dom";

const Footer = () => {
  return (
    <div className="flex items-center justify-center w-full space-x-2">
      {/* Buddys NavLink */}
      <NavLink
        to="/ref"
        end
        className={({ isActive }) => `
          w-[20%] h-[65px] pt-1 flex flex-col rounded-[10px] items-center justify-center text-[#fff] text-[15px]
          ${isActive ? "bg-activebg border-[1px] border-activeborder" : ""}
        `}
      >
        <div className="w-[30px] h-[30px] flex items-center justify-center">
          <img src={Friends} className="w-full h-full object-contain" alt="Buddys" />
        </div>
        <span className="slackey-regular font-medium mt-1">Invite</span>
      </NavLink>

      {/* Tap NavLink */}
      <NavLink
        to="/"
        end
        className={({ isActive }) => `
          w-[20%] h-[65px] pt-1 flex flex-col rounded-[10px] items-center justify-center text-[#fff] text-[15px]
          ${isActive ? "bg-activebg border-[1px] border-activeborder" : ""}
        `}
      >
        <div className="w-[30px] h-[30px] flex items-center justify-center">
          <img src={coinsmall} className="w-full h-full object-contain" alt="Tap" />
        </div>
        <span className="slackey-regular font-medium mt-1">Tap</span>
      </NavLink>

      {/* Tasks NavLink */}
      <NavLink
        to="/earn"
        end
        className={({ isActive }) => `
          w-[20%] h-[65px] pt-1 flex flex-col rounded-[10px] items-center justify-center text-[#fff] text-[15px]
          ${isActive ? "bg-activebg border-[1px] border-activeborder" : ""}
        `}
      >
        <div className="w-[30px] h-[30px] flex items-center justify-center">
          <img src={tasks} className="w-full h-full object-contain" alt="Tasks" />
        </div>
        <span className="slackey-regular font-medium mt-1">Tasks</span>
      </NavLink>

      {/* Shop NavLink */}
      <NavLink
        to="/boost"
        end
        className={({ isActive }) => `
          w-[20%] h-[65px] pt-1 flex flex-col rounded-[10px] items-center justify-center text-[#fff] text-[15px]
          ${isActive ? "bg-activebg border-[1px] border-activeborder" : ""}
        `}
      >
        <div className="w-[30px] h-[30px] flex items-center justify-center">
          <img src={boost} className="w-full h-full object-contain" alt="Shop" />
        </div>
        <span className="slackey-regular font-medium mt-1">Shop</span>
      </NavLink>

      {/* Wallet NavLink */}
      <NavLink
        to="/user"
        end
        className={({ isActive }) => `
          w-[20%] h-[65px] pt-1 flex flex-col rounded-[10px] items-center justify-center text-[#fff] text-[15px]
          ${isActive ? "bg-activebg border-[1px] border-activeborder" : ""}
        `}
      >
        <div className="w-[30px] h-[30px] flex items-center justify-center">
          <img src={stats} className="w-full h-full object-contain" alt="Wallet" />
        </div>
        <span className="slackey-regular font-medium mt-1">Wallet</span>
      </NavLink>
    </div>
  );
};

export default Footer;