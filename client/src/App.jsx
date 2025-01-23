import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import "./App.css";
import "./fire.scss";
import { AnimatePresence } from "framer-motion";
import Footer from "./Components/Footer";
import { UserProvider } from "./context/userContext";
import { THEME, TonConnectUIProvider } from "@tonconnect/ui-react";

// Access the Telegram WebApp object
const tele = window.Telegram?.WebApp;

// Toggle this flag to allow desktop browsers
const allowDesktop = true; // set to false to enforce Telegram-only mode

const App = () => {
  // State to determine if the app is running inside Telegram on supported platforms
  const [isTelegram, setIsTelegram] = useState(null); // null = not yet determined

  // Effect to detect Telegram WebApp environment and platform
  useEffect(() => {
    if (allowDesktop) {
      // If desktop is allowed, bypass platform restrictions
      setIsTelegram(true);
      if (tele) {
        tele.ready();
        tele.expand();
        tele.setHeaderColor("#191b33");

        if (typeof tele.disableVerticalSwipes === "function") {
          tele.disableVerticalSwipes();
          console.log("Vertical swipes disabled.");
        } else {
          console.warn("disableVerticalSwipes method is not available.");
        }

        if (tele.HapticFeedback) {
          tele.HapticFeedback.impactOccurred("medium");
        }
      } else {
        console.warn("Telegram.WebApp is not available.");
      }
    } else if (tele) {
      const platform = tele.platform; // "android", "ios", "web", etc.

      // Allow only if platform is 'android' or 'ios'
      if (platform === "android" || platform === "ios") {
        setIsTelegram(true);

        // Initialize Telegram WebApp
        tele.ready();
        tele.expand();
        tele.setHeaderColor("#191b33");

        if (typeof tele.disableVerticalSwipes === "function") {
          tele.disableVerticalSwipes();
          console.log("Vertical swipes disabled.");
        } else {
          console.warn("disableVerticalSwipes method is not available.");
        }

        if (tele.HapticFeedback) {
          tele.HapticFeedback.impactOccurred("medium");
        }
      } else {
        setIsTelegram(false);
        console.warn(`Unsupported platform: ${platform}`);
      }
    } else {
      setIsTelegram(false);
      console.warn("Telegram.WebApp is not available.");
    }
  }, [tele]);

  // Effect to prevent right-click and certain key combinations
  useEffect(() => {
    const handleContextMenu = (event) => event.preventDefault();
    const handleKeyDown = (event) => {
      if (
        (event.ctrlKey && (event.key === "u" || event.key === "s")) ||
        (event.ctrlKey && event.shiftKey && event.key === "i")
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const renderTelegramOnlyMessage = () => (
    <div className="flex items-center justify-center min-h-screen bg-black text-white px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
        <p>
          This application is exclusively available within the Telegram mobile app. Please open it through the Telegram app on your mobile device to continue.
        </p>
        <a
          href="https://t.me/TapMianusBot"
          className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Open in Telegram
        </a>
      </div>
    </div>
  );

  if (isTelegram === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p>Loading...</p>
      </div>
    );
  }

  // Only show restricted message if Telegram restrictions are enforced and not on Telegram
  if (!isTelegram && !allowDesktop) {
    return renderTelegramOnlyMessage();
  }

  return (
    <>
      <div className="flex justify-center w-full">
        <div className="flex justify-center w-full">
          <div className="flex flex-col w-full space-y-3">
            <div className="w-full pb-[60px]">
              <TonConnectUIProvider
                manifestUrl="https://ton-connect.github.io/demo-dapp-with-wallet/tonconnect-manifest.json"
                uiPreferences={{ theme: THEME.DARK }}
                enableAndroidBackHandler={false}
              >
                <UserProvider>
                  <AnimatePresence mode="wait">
                    <Outlet />
                  </AnimatePresence>
                </UserProvider>
              </TonConnectUIProvider>
            </div>
            <div
              id="footermain"
              className="flex flex-col space-y-6 fixed bottom-0 py-2 left-0 right-0 justify-center items-center px-5"
              style={{
                background:
                  "linear-gradient(to top, #8B0000 0%, #B22222 10%, #CD5C5C 25%, #F08080 50%, #FECFEF 100%)",
              }}
            >
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
