import React, { useState, useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

import backgroundMusic from "../images/background_music.mp3";
import pinkBallImage from "../images/pink_ball.png";
import circleImage from "../images/circle.png";
// ... other asset imports

export default function Plinko() {
    const [bet, setBet] = useState(1.0);
    const [points, setPoints] = useState(100);
    const [topBounce, setTopBounce] = useState(0.5);
    const [sideBounce, setSideBounce] = useState(4);
    const [incrWeightValue, setIncrWeightValue] = useState(0);
    const containerRef = useRef(null);
  
    // Keep a reference to the PixiJS Application
    const appRef = useRef(null);
  
    useEffect(() => {
      let app; // local variable to hold the PixiJS Application
  
      // We use an immediately-invoked async function so we can await app.init(...)
      (async () => {
        // 1) Create a new PixiJS application with no constructor options
        app = new PIXI.Application();
        
        // 2) Initialize the application with your desired options
        //    The "await" ensures the app fully initializes before we proceed
        await app.init({ 
          height: 700, 
          backgroundColor: 0x1496c,
        });
        
        // Store the app in a ref for later use (e.g., cleanup, game logic)
        appRef.current = app;
  
        // 3) Append the newly created canvas to the container
        if (containerRef.current) {
          containerRef.current.appendChild(app.canvas);
        }
  
        // 4) Run any setup logic that depends on the app being ready
        setupPixiGame(app);
  
        // (Optional) Background music or other code goes here...
        // const music = new Audio(backgroundMusic);
        // music.loop = true;
        // music.volume = 0.03;
        // const playMusicOnInteraction = () => music.play();
        // document.body.addEventListener("mousemove", playMusicOnInteraction);
      })();
  
      // Cleanup
      return () => {
        // If we created an app, destroy it on unmount
        if (app) {
          app.destroy(true, { children: true });
        }
        // document.body.removeEventListener("mousemove", playMusicOnInteraction);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    // Example setup logic for your pegs, slots, etc.
    function setupPixiGame(app) {
      // Here, "app" is fully initialized with "app.canvas" available
      const { stage } = app;
  
      // Add your game objects, e.g.:
      // const sprite = PIXI.Sprite.from(circleImage);
      // stage.addChild(sprite);
      
      // ... Additional game logic or your custom Peg, Slot, Play classes
    }
  
    // React UI event handlers
    const increaseBet = () => {
      if (points > bet) {
        setBet((prev) => prev + 1.0);
      }
    };
    const decreaseBet = () => {
      if (bet > 1.0) {
        setBet((prev) => prev - 1.0);
      }
    };
    const increaseWeight = () => {
      if (topBounce > 0.1) {
        setTopBounce((prev) => prev - 0.01);
        setSideBounce((prev) => prev - 0.05);
        setIncrWeightValue((prev) => prev + 1);
      }
    };
    const decreaseWeight = () => {
      if (topBounce < 0.5) {
        setTopBounce((prev) => prev + 0.01);
        setSideBounce((prev) => prev + 0.05);
        setIncrWeightValue((prev) => prev - 1);
      }
    };
  
    const handlePlayButton = () => {
      if (points > 0 && bet <= points) {
        setPoints((prev) => +((prev - bet).toFixed(2)));
        // ...
        // handle game logic for "Play" using your custom classes or stage objects
        // ...
      }
    };
  
    return (
      <div className="game-wrapper">
        <div className="heading">
          <span>Plinko</span>
        </div>
        <div className="canvas-wrapper">
          {/* The ref below will host the PIXI canvas after init */}
          <div id="pixi-container" ref={containerRef}>
            {/* Optionally place UI elements here */}
            <div className="canvas-options">
              <span className="canvas-options_title">Lines</span>
              {["8","9","10","11","12","13","14","15","16"].map((line) => (
                <div key={line} className="canvas-option_div">{line}</div>
              ))}
            </div>
  
            <div id="play-button" className="play-button" onClick={handlePlayButton}>
              <label>Play</label>
            </div>
  
            <div className="points-bet-wrapper">
              {/* Example of bet UI */}
              <div className="points-bet-wrapper__bet">
                <div
                  className="points-bet-wrapper__bet--decrease"
                  onClick={decreaseBet}
                >
                  -
                </div>
                <span>Bet: {bet.toFixed(2)}</span>
                <div
                  className="points-bet-wrapper__bet--increase"
                  onClick={increaseBet}
                >
                  +
                </div>
              </div>
              <div className="points-bet-wrapper__points">
                <span>Points: {points}</span>
              </div>
              <div className="points-bet-wrapper__weight">
                <span>Ball weight: {50 + incrWeightValue}</span>
                <div onClick={decreaseWeight}>-</div>
                <div onClick={increaseWeight}>+</div>
              </div>
            </div>
          </div>
        </div>
        <div className="game-history">
          {/* Add your game history UI here */}
        </div>
      </div>
    );
  }