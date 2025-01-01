// main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { UserProvider } from "./context/userContext.jsx"; // Import the UserProvider
import ErrorCom from "./Components/ErrorCom.jsx";
import Earn from "./pages/Earn.jsx";
import Boost from "./pages/Boost.jsx";
import Leaderboard from "./Components/Leaderboard.jsx";
import Ref from "./pages/Ref.jsx";
import Plutos from "./pages/Plutos.jsx";
import UserPro from "./pages/UserPro.jsx";
import LuckyWhile from "./Components/LuckyWhile.jsx";
import DailyReward from "./Components/DailyReward.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorCom />,
    children:[
      {
        path:"/",
        element: <Plutos />,
      },
      {
        path:"/ref",
        element: <Ref />,
      },
      {
        path:"/earn",
        element: <Earn />,
      },
      // {
      //   path:"/taskslist",
      //   element: <TasksList />,
      // },
      {
        path:"/boost",
        element: <Boost />,
      },
      {
        path:"/user",
        element: <UserPro />,
      },
      {
        path:"/user/leaderboard",
        element: <Leaderboard />,
      },
      {
        path:"/earn/lucky",
        element: <LuckyWhile />,
      },
      {
        path:"/earn/daily-reward",
        element: <DailyReward />,
      },
    ]

  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider> {/* Move UserProvider here */}
      <RouterProvider router={router} />
    </UserProvider>
  </StrictMode>
);
