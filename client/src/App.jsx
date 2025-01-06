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

const App = () => {
  // State to determine if the app is running inside Telegram
  const [isTelegram, setIsTelegram] = useState(null); // null = not yet determined

  // Effect to detect Telegram WebApp environment
  useEffect(() => {
    if (tele) {
      setIsTelegram(true);

      // Initialize Telegram WebApp
      tele.ready();
      tele.expand();

      // Set the header color
      tele.setHeaderColor("#191b33"); // Adjust as needed

      // Disable vertical swipes if the method exists
      if (typeof tele.disableVerticalSwipes === "function") {
        tele.disableVerticalSwipes();
        console.log("Vertical swipes disabled.");
      } else {
        console.warn("disableVerticalSwipes method is not available.");
      }

      // Haptic feedback if supported
      if (tele.HapticFeedback) {
        tele.HapticFeedback.impactOccurred("medium");
      }
    } else {
      setIsTelegram(false);
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

  // Function to render the Telegram-only message
  const renderTelegramOnlyMessage = () => (
    <div className="flex items-center justify-center min-h-screen bg-black text-white px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
        <p>
          This application is exclusively available within Telegram. Please open it through the Telegram app to continue.
        </p>
        <a
          href="https://t.me/YourBotUsername" // Replace with your bot's link
          className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Open in Telegram
        </a>
      </div>
    </div>
  );

  // While determining the environment, you can show a loader or nothing
  if (isTelegram === null) {
    return null; // Or a loading spinner if preferred
  }

  // If not running inside Telegram, show the restricted access message
  if (!isTelegram) {
    return renderTelegramOnlyMessage();
  }

  // If inside Telegram, render the app normally
  return (
    <>
      <div className="flex justify-center w-full">
        <div className="flex justify-center w-full">
          <div className="flex flex-col w-full pt-3 space-y-3">
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
