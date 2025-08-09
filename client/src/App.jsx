import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import "./App.css";
import "./fire.scss";
import { AnimatePresence } from "framer-motion";
import Footer from "./Components/Footer";
import { UserProvider } from "./context/userContext";
import { THEME, TonConnectUIProvider } from "@tonconnect/ui-react";

// Toggle this flag to allow desktop browsers
const allowDesktop = false; // set to false to enforce Telegram-only mode

const App = () => {
  useEffect(() => {
    console.log("App component mounted. Current URL is:", window.location.href);

    if (window.Telegram?.WebApp) {
      console.log("Telegram WebApp initData:", window.Telegram.WebApp.initData);
      console.log(
        "Telegram WebApp initDataUnsafe:",
        window.Telegram.WebApp.initDataUnsafe
      );
      console.log("Telegram WebApp platform:", window.Telegram.WebApp.platform);
    } else {
      console.log("Telegram.WebApp is NOT available (yet)");
    }
  }, []);

  // null = not yet determined
  const [isTelegram, setIsTelegram] = useState(null);

  // Detect Telegram env with a short retry window (handles hard reloads)
  useEffect(() => {
    let tries = 0;
    let timer;

    const boot = () => {
      const tele = window.Telegram?.WebApp;

      if (!tele) {
        if (tries++ < 30) {
          // retry for ~3s total (30 * 100ms)
          timer = setTimeout(boot, 100);
          return;
        }
        // Give up after retries
        setIsTelegram(allowDesktop ? true : false);
        console.warn("Telegram.WebApp not found after retries.");
        return;
      }

      const platform = tele.platform; // "android", "ios", "web", etc.
      const platformOk =
        allowDesktop || platform === "android" || platform === "ios";

      setIsTelegram(platformOk);

      if (!platformOk) {
        console.warn(`Unsupported platform: ${platform}`);
        return;
      }

      // Safe Telegram calls (optional chaining to avoid surprises)
      tele.ready?.();
      tele.expand?.();
      tele.setHeaderColor?.("#191b33");
      tele.disableVerticalSwipes?.();
      tele.HapticFeedback?.impactOccurred?.("medium");
    };

    boot();
    return () => clearTimeout(timer);
  }, []);

  // Prevent right-click and certain key combos
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
          This application is exclusively available within the Telegram mobile
          app. Please open it through the Telegram app on your mobile device to
          continue.
        </p>
        <a
          href="https://betmian.us/?utm_campaign=desktopredirect"
          className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          More Info
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
