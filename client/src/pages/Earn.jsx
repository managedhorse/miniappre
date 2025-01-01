import React, { useEffect, useState } from "react";
import Animate from "../Components/Animate";
import { Outlet } from "react-router-dom";
import coinsmall from "../images/coinsmall.webp";
import taskbook from "../images/taskbook.webp";
import loadingGif from "../images/loading.gif";
import { IoCheckmarkCircle } from "react-icons/io5";
import congratspic from "../images/celebrate.gif";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { db } from "../firebase.jsx";
import {
  collection,
  getDoc,
  getDocs,
  updateDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import Spinner from "../Components/Spinner";
import TaskTelegram from "../Components/Task/TaskTelegram";
import ClaimLeveler from "../Components/ClaimLeveler";
import Levels from "../Components/Levels";
import { IoCheckmarkSharp } from "react-icons/io5";
import TaskTw from "../Components/Task/TaskTw";
import { useUser } from "../context/userContext";
import MilestoneRewards from "../Components/MilestoneRewards";
import telegram from "../images/telegram.webp";
import twitter from "../images/twitter.webp";
import website from "../images/website.webp";

const Earn = () => {
  const {
    id,
    balance,
    setBalance,
    refBonus,
    taskCompleted,
    level,
    setTaskCompleted,
    taskCompleted2,
    setTaskCompleted2,
  } = useUser();
  // eslint-disable-next-line
  const [loading, setLoading] = useState(false);
  const [showTaskTelegram, setShowTaskTelegram] = useState(false);
  const [showTaskTw, setShowTaskTw] = useState(false);
  // eslint-disable-next-line
  const [claimLevel, setClaimLevel] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  // eslint-disable-next-line
  const [message, setMessage] = useState("");
  const taskID = "task_tele_1"; // Assign a unique ID to this task
  const taskID2 = "task_tw_1"; // Assign a unique ID to this task
  const [tasks, setTasks] = useState([]);

  const [activeIndex, setActiveIndex] = useState(1);
  const [congrats, setCongrats] = useState(false);
  const [notifyBalance, setNotifyBalance] = useState(0);

  const handleMenu = (index) => {
    setActiveIndex(index);
  };

  const taskTelegram = () => {
    setShowTaskTelegram(true);
    document.getElementById("footermain").style.zIndex = "50";
  };

  const taskTw = () => {
    setShowTaskTw(true);
    document.getElementById("footermain").style.zIndex = "50";
  };

  useEffect(() => {
    checkTaskCompletion(id, taskID).then((completed) => {
      setTaskCompleted(completed);
      if (completed) {
        setMessage("");
      }
    });
    checkTaskCompletion(id, taskID2).then((completed) => {
      setTaskCompleted2(completed);
      if (completed) {
        setMessage("");
      }
    });

    console.log("my userid is:", id);

    // eslint-disable-next-line
  }, [id]);

  const checkTaskCompletion = async (id, taskId, taskId2) => {
    try {
      const userTaskDocRef = doc(db, "userTasks", `${id}_${taskId}`);
      const userTaskDocRef2 = doc(db, "userTasks", `${id}_${taskId2}`);
      const docSnap = await getDoc(userTaskDocRef, userTaskDocRef2);
      if (docSnap.exists()) {
        return docSnap.data().completed;
      } else {
        return false;
      }
    } catch (e) {
      console.error("Error checking task completion: ", e);
      return false;
    }
  };

  const levelsAction = () => {
    setShowLevels(true);

    document.getElementById("footermain").style.zIndex = "50";
  };

  const formatNumber = (num) => {
    if (num < 100000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, " ");
    } else if (num < 1000000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, " ");
    } else {
      return (num / 1000000).toFixed(3).replace(".", ".") + " M";
    }
  };

  // Define listTasks with image property
const listTasks = [
  {
    taskId: "task1",
    title: "Join Tapmianus TG",
    url: "https://t.me/+9uQKkz_qB2BiNDU0",
    completed: false,
    point: 50000,
    status: "start",
    image: telegram, // Assign telegram image
  },
  {
    taskId: "task2",
    title: "Join Boss88pro.com",
    url: "https://boss88pro.com",
    completed: false,
    point: 50000,
    status: "start",
    image: website, // Assign twitter image
  },
  {
    taskId: "task3",
    title: "Join Boss88.ph",
    url: "https://t.me/Ibccapital",
    completed: false,
    point: 50000,
    status: "start",
    image: telegram, // Assign telegram image
  },
  {
    taskId: "task4",
    title: "Join Boss88pro.com",
    url: "https://t.me/BicentoHub",
    completed: false,
    point: 50000,
    status: "start",
    image: twitter, // Assign twitter image
  },
  {
    taskId: "task5",
    title: "Join Boss88 TG",
    url: "https://t.me/TomCat_meomeo",
    completed: false,
    point: 50000,
    status: "start",
    image: telegram, // Assign default taskbook image or another specific image
  },
  {
    taskId: "task6",
    title: "Join Boss88 TG",
    url: "https://t.me/TomCat_meomeo",
    completed: false,
    point: 20000,
    status: "start",
    image: telegram, // Assign default taskbook image or another specific image
  },
];

  useEffect(() => {
    const fetchTasks = async () => {
      const tasksInit = await Promise.all(
        listTasks.map(async (task) => {
          const userTaskDocRef = doc(db, "userTasks", `${id}_${task.taskId}`);
          const docSnap = await getDoc(userTaskDocRef);
          if (docSnap.exists()) {
            return {
              ...task,
              completed: docSnap.data().completed,
              status: "done",
            };
          }
          return task;
        })
      );
      setTasks(tasksInit);
    };

    if (id) {
      fetchTasks();
    } else {
      setTasks(listTasks);
    }
  }, [id]);

  const handleTaskLinkClick = (taskId, url) => {
    window.open(url);

    setTimeout(() => {
      setTasks(
        tasks.map((task) =>
          task.taskId === taskId ? { ...task, status: "check" } : task
        )
      );
    }, 2000);
  };

  const handleTaskCheck = (taskId) => {
    if (id) {
      saveTaskCompletionToFirestore(id, taskId, true);
      setTasks(
        tasks.map((task) =>
          task.taskId === taskId ? { ...task, status: "checking" } : task
        )
      );
      setTimeout(() => {
        setTasks(
          tasks.map((task) =>
            task.taskId === taskId ? { ...task, status: "claim" } : task
          )
        );
      }, 6000);
    }
  };

  const handleTaskDoneClaim = (taskId, point) => {
    if (id) {
      const newBalance = balance + Number(point);
      updateUserCountInFirestore(id, newBalance);
      setTasks(
        tasks.map((task) =>
          task.taskId === taskId
            ? { ...task, completed: true, status: "done" }
            : task
        )
      );
      setBalance(newBalance)
      setCongrats(true);
      setNotifyBalance(Number(point));
      setTimeout(() => {
        setCongrats(false);
      }, 4000);
    }
  };

  const saveTaskCompletionToFirestore = async (id, taskId, isCompleted) => {
    try {
      const userTaskDocRef = doc(db, "userTasks", `${id}_${taskId}`);
      await setDoc(
        userTaskDocRef,
        { userId: id, taskId: taskId, completed: isCompleted },
        { merge: true }
      );
      // console.log('Task completion status saved to Firestore.');
    } catch (e) {
      console.error("Error saving task completion status: ", e);
    }
  };

  const updateUserCountInFirestore = async (id, newBalance) => {
    try {
      const userRef = doc(db, "telegramUsers", id.toString());
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          balance: Number(newBalance)
        });
      }else {
        console.error("User document not found.");
      }
    } catch (e) {
      console.error("Error updating user newBalance in Firestore: ", e);
    }
  };

  return (
    <>
      {loading ? (
        <Spinner />
      ) : (
        <Animate>
          <div className="flex-col justify-center w-full px-5 space-y-3">
            <div className="px-5">
              <div className="relative flex items-center justify-center space-x-2">
                <div
                  id="congrat"
                  className="opacity-0 invisible w-[80%] absolute pl-10 ease-in-out duration-500 transition-all"
                >
                  <img src={congratspic} alt="congrats" className="w-full" />
                </div>
                {/* <Congratulations showCongrats={showCongrats} setShowCongrats={setShowCongrats} /> */}
                <div className="w-[50px] h-[50px]">
                  <img src={coinsmall} className="w-full" alt="coin" />
                </div>
                <h1 className="text-[#fff] text-[42px] slackey-regular font-extrabold">
                  {formatNumber(balance + refBonus)}
                </h1>
              </div>

              <div
                onClick={levelsAction}
                className="w-full flex ml-[6px] space-x-1 items-center justify-center"
              >
                <img
                  src={level.imgUrl}
                  className="w-[25px] relative"
                  alt="bronze"
                />
                <h2 className="text-[#fffff]slackey-regular text-[20px] font-medium">
                  {level.name}
                </h2>
                <MdOutlineKeyboardArrowRight className="w-[20px] h-[20px] text-[#fffff] mt-[2px]" />
              </div>

              <div className="bg-borders w-full px-5 h-[1px] !mt-5 !mb-5"></div>

              <div className="w-full rounded-[10px] p-1 flex items-center">
                <div
                  onClick={() => handleMenu(1)}
                  className={`${
                    activeIndex === 1 ? "bg-cards" : ""
                  }  rounded-[6px] py-[12px] slackey-regular px-3 w-[50%] flex justify-center text-center items-center`}
                >
                  Tasks
                </div>

                <div
                  onClick={() => handleMenu(2)}
                  className={`${
                    activeIndex === 2 ? "bg-cards" : ""
                  }  rounded-[6px] py-[12px] slackey-regular px-3 w-[50%] flex justify-center text-center items-center`}
                >
                  Levels
                </div>
              </div>
            </div>

            <div className="!mt-[30px] w-full h-[60vh] flex flex-col overflow-y-auto pb-[160px]">
              <div
                className={`${
                  activeIndex === 1 ? "flex" : "hidden"
                } alltaskscontainer flex-col w-full space-y-2`}
              >
                
                  {tasks.map((item) => (
                    <div
                      key={item.taskId}
                      className="bg-activebg border-[1px] border-activeborder slackey-regular rounded-[10px] flex items-center justify-between border-t-[1px] border-white px-[14px] py-[5px] mt-1"
                    >
                      <div className="flex items-center flex-1 space-x-2">
                        <div className="">
                          {/* **Use the image from the task item** */}
                          <img src={item.image} alt={`${item.title} Image`} className="w-[30px]" />
                        </div>
                        <div className="flex flex-col pt-1 space-y-1">
                          <span className="font-semibold text-[#eeee] text-sm">
                            {item.title}
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="w-[16px] h-[16px]">
                              <img src={coinsmall} className="w-full" alt="coin" />
                            </span>
                            <span className="font-medium text-[#eeee] text-xs">
                              {formatNumber(item.point)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="">
                        {item.status === "start" && (
                          <span
                            onClick={() => handleTaskLinkClick(item.taskId, item.url)}
                            className="bgs-1 font-medium py-[6px] px-4 rounded-full text-[#] flex items-center justify-center text-[16px]"
                          >
                            start
                          </span>
                        )}
                        {item.status === "check" && (
                          <span
                            onClick={() => handleTaskCheck(item.taskId)}
                            className="bg-cards font-medium py-[5px] px-4 rounded-full flex items-center justify-center text-[16px]"
                          >
                            check
                          </span>
                        )}
                        {item.status === "checking" && (
                          <span className="bg-cards font-medium py-[5px] px-4 rounded-full flex items-center justify-center text-[14px]">
                            <img src={loadingGif} className="w-6" alt="" /> checking 15s
                          </span>
                        )}
                        {item.status === "claim" && (
                          <span
                            onClick={() => handleTaskDoneClaim(item.taskId, item.point)}
                            className="bgs-1 font-medium py-[5px] px-4 rounded-full flex items-center justify-center text-[16px]"
                          >
                            Claim
                          </span>
                        )}
                        {(item.status === "done" || item.completed) && (
                          <span className="bg-[#eee] text-[#9d99a9] font-medium py-[5px] px-4 rounded-full flex items-center justify-center text-[16px]">
                            Done
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                

                {/*  */}
              </div>

              {/*  */}

              <div
                className={`${
                  activeIndex === 2 ? "flex" : "hidden"
                } alltaskscontainer flex-col w-full space-y-2`}
              >
                <MilestoneRewards />
              </div>
            </div>

            <TaskTelegram
              showModal={showTaskTelegram}
              setShowModal={setShowTaskTelegram}
            />
            <TaskTw showModal={showTaskTw} setShowModal={setShowTaskTw} />
            {/* <TaskTwo showModal2={showModal2} setShowModal2={setShowModal2} /> */}
            <ClaimLeveler
              claimLevel={claimLevel}
              setClaimLevel={setClaimLevel}
            />
            <Levels showLevels={showLevels} setShowLevels={setShowLevels} />
            {/*  */}
            <div className="w-full absolute top-[-35px] left-0 right-0 flex justify-center z-20 pointer-events-none select-none">
              {congrats ? (
                <img src={congratspic} alt="congrats" className="w-[80%]" />
              ) : null}
            </div>

            <div
              className={`${
                congrats === true
                  ? "visible bottom-6"
                  : "invisible bottom-[-10px]"
              } z-[60] ease-in duration-300 w-full fixed left-0 right-0 px-4`}
            >
              <div className="w-full text-[#54d192] flex items-center space-x-2 px-4 bg-[#121620ef] h-[50px] rounded-[8px]">
                <IoCheckmarkCircle size={24} className="" />

                <span className="font-medium">
                  {formatNumber(notifyBalance)}
                </span>
              </div>
            </div>
            {/*  */}
          </div>
          <Outlet />
        </Animate>
      )}
    </>
  );
};

export default Earn;
