import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import "./App.css";
import "./fire.scss";
import { AnimatePresence } from "framer-motion";
import Footer from "./Components/Footer";
import { UserProvider } from "./context/userContext";
import { THEME, TonConnectUIProvider } from "@tonconnect/ui-react";

const tele = window.Telegram.WebApp;
const App = () => {
  useEffect(() => {
    if (import.meta.env.PROD) { // Vite sets import.meta.env.PROD to true in production
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
    }
  }, []);
  

  useEffect(() => {
    tele.ready();
    tele.expand();

    window.Telegram.WebApp.setHeaderColor("#191b33"); // Set header color to red

    // Haptic feedback
    if (tele.HapticFeedback) {
      tele.HapticFeedback.impactOccurred("medium");
    }
  }, []);

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
    background: 'linear-gradient(to top, #8B0000 0%, #B22222 10%, #CD5C5C 25%, #F08080 50%, #FECFEF 100%)',
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
