import React, { useState, useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

import backgroundMusic from "../images/background_music.mp3";
import pinkBallImage from "../images/pink_ball.png";
import circleImage from "../images/circle.png";
// ... other asset imports

// Define helper classes (Peg, Slot, Play) outside the component
class Peg {
  constructor(x, y, anchor, width, height, radius) {
    this.x = x;
    this.y = y;
    this.anchor = anchor;
    this.width = width;
    this.height = height;
    this.radius = radius;
    this.pegBall = null;
  }
  create() {
    const peg = PIXI.Sprite.from(circleImage);
    peg.anchor.set(this.anchor);
    peg.x = this.x;
    peg.y = this.y;
    peg.width = this.width;
    peg.height = this.height;
    this.pegBall = peg;
    return peg;
  }
}

class Slot {
  constructor(x, y, anchor, width, height, cost) {
    this.x = x;
    this.y = y;
    this.anchor = anchor;
    this.width = width;
    this.height = height;
    this.cost = cost;
    this.radius = 0;
    this.slot = null;
  }
  create() {
    // Dynamically load images based on cost if needed
    const slot = PIXI.Sprite.from(`./public/${this.cost}.png`);
    slot.anchor.set(this.anchor);
    slot.x = this.x;
    slot.y = this.y;
    slot.width = this.width;
    slot.height = this.height;
    this.slot = slot;
    return slot;
  }
}

class Play {
  constructor(openning, app, fraction, pegs, slots, bet, top_bounce, side_bounce) {
    this.openning = openning;
    this.app = app;
    this.fraction = fraction;
    this.pegs = pegs;
    this.slots = slots;
    this.bet = bet;
    this.top_bounce = top_bounce;
    this.side_bounce = side_bounce;
    this.pinkBall = PIXI.Sprite.from(pinkBallImage);
    this.cost_scored = 0;
    this.slotCost = 0;
    this.time = new Date().toLocaleTimeString();
  }
  // ... (Include methods start, isCollision, getCostScored, roundToTwoDecimal as in original)
  start() {
    // Implementation of game play logic as in original JS, adapted to use PIXI and React state if necessary.
    // Use this.app.stage.addChild, etc.
  }
  // ... additional methods from original Play class
}

export default function Plinko() {
  const [bet, setBet] = useState(1.0);
  const [points, setPoints] = useState(100);
  const [topBounce, setTopBounce] = useState(0.5);
  const [sideBounce, setSideBounce] = useState(4);
  const [incrWeightValue, setIncrWeightValue] = useState(0);
  const containerRef = useRef(null);

  // Game-related variables
  const pegsRef = useRef([]);
  const slotsRef = useRef([]);
  const appRef = useRef(null);
  const fractionRef = useRef(0);
  const openningRef = useRef(null);
  const topBounceRef = useRef(topBounce);
  const sideBounceRef = useRef(sideBounce);
  
  // Constants and state
  const initialLevel = 8;
  const slotCostsList = [
    [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    // ... rest of slot costs arrays
  ];

  useEffect(() => {
    topBounceRef.current = topBounce;
    sideBounceRef.current = sideBounce;
  }, [topBounce, sideBounce]);

  function setup(levels) {
    const lines = 2 + levels;
    const slot_costs = slotCostsList[levels - 8];
    pegsRef.current = [];
    slotsRef.current = [];

    fractionRef.current = 7 / lines;
    let space_bottom = 150 * fractionRef.current;

    // Initialize Pixi.js stage elements
    for (let i = 3; i <= lines; i++) {
      let space_left = 50;
      for (let space = 1; space <= lines - i; space++) {
        space_left += 50 * fractionRef.current;
      }
      for (let point = 1; point <= i; point++) {
        const pegObj = new Peg(
          space_left,
          space_bottom,
          0,
          30 * fractionRef.current,
          30 * fractionRef.current,
          (30 * fractionRef.current) / 2
        );
        const newPeg = pegObj.create();
        appRef.current.stage.addChild(newPeg);
        pegsRef.current.push(pegObj);
        space_left += 100 * fractionRef.current;
      }
      space_bottom += 90 * fractionRef.current;
    }

    for (let s = 0; s < slot_costs.length; s++) {
      const temp_bottom_peg =
        pegsRef.current[pegsRef.current.length - 1 - slot_costs.length + s];
      const slotObj = new Slot(
        temp_bottom_peg.x + temp_bottom_peg.width * fractionRef.current,
        space_bottom,
        0,
        55 - lines,
        50 - lines,
        slot_costs[s]
      );
      const newSlot = slotObj.create();
      appRef.current.stage.addChild(newSlot);
      slotsRef.current.push(slotObj);
    }

    openningRef.current = PIXI.Sprite.from("/bC.png");
    openningRef.current.anchor.set(0);
    openningRef.current.x = pegsRef.current[1].x - 8 * fractionRef.current;
    openningRef.current.y = 50 * fractionRef.current;
    openningRef.current.width = 50 * fractionRef.current;
    openningRef.current.height = 50 * fractionRef.current;
    appRef.current.stage.addChild(openningRef.current);
  }

  useEffect(() => {
    // Initialize Pixi application on mount
    appRef.current = new PIXI.Application({
      height: 700,
      backgroundColor: 0x1496c,
    });
  
    if (containerRef.current && appRef.current) {
      let canvasElement;
      try {
        // Try to access the new canvas property if available, or fallback to view
        canvasElement = appRef.current.canvas || appRef.current.view;
      } catch (e) {
        console.warn("Error accessing canvas property:", e);
        canvasElement = appRef.current.view;
      }
      if (canvasElement) {
        containerRef.current.appendChild(canvasElement);
      } else {
        console.error("No canvas element available to append.");
      }
    }
  
    setup(initialLevel);
  
    // Background music setup
    const music = new Audio(backgroundMusic);
    music.loop = true;
    music.volume = 0.03;
    const playMusicOnInteraction = () => music.play();
    document.body.addEventListener("mousemove", playMusicOnInteraction);
  
    // Clean up on unmount
    return () => {
      document.body.removeEventListener("mousemove", playMusicOnInteraction);
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Event handlers for UI controls
  const increaseBet = () => {
    if (points > bet) {
      setBet(prev => prev + 1.0);
    }
  };
  const decreaseBet = () => {
    if (bet > 1.0) {
      setBet(prev => prev - 1.0);
    }
  };
  const increaseWeight = () => {
    if (topBounce > 0.1) {
      setTopBounce(prev => prev - 0.01);
      setSideBounce(prev => prev - 0.05);
      setIncrWeightValue(prev => prev + 1);
    }
  };
  const decreaseWeight = () => {
    if (topBounce < 0.5) {
      setTopBounce(prev => prev + 0.01);
      setSideBounce(prev => prev + 0.05);
      setIncrWeightValue(prev => prev - 1);
    }
  };

  const handlePlayButton = () => {
    if (points > 0 && bet <= points) {
      setPoints(prev => +((prev - bet).toFixed(2)));
      // Instantiate and start a new play
      const playInstance = new Play(
        openningRef.current,
        appRef.current,
        fractionRef.current,
        pegsRef.current,
        slotsRef.current,
        bet,
        topBounceRef.current,
        sideBounceRef.current
      );
      playInstance.start();
    }
  };

  return (
    <div className="game-wrapper">
      <div className="heading">
        
        <span>Plinko</span>
        
      </div>
      <div className="canvas-wrapper">
      <div id="pixi-container" ref={containerRef}>
          {/* Canvas and UI controls will be injected here */}
          <div className="canvas-options">
            <span className="canvas-options_title">Lines</span>
            {/* Options for lines; implement stateful selection as needed */}
            {["8","9","10","11","12","13","14","15","16"].map((line) => (
              <div key={line} className="canvas-option_div">{line}</div>
            ))}
          </div>
          <div id="play-button" className="play-button" onClick={handlePlayButton}>
            <label>Play</label>
          </div>
          <div className="points-bet-wrapper">
            <div
              className="points-bet-wrapper__won-flash"
              id="points-bet-wrapper__won-flash"
            >
              <span>Won</span>&nbsp;
              <span id="points-won"></span>&nbsp;
              <span>points</span>
            </div>
            <div className="points-bet-wrapper__bet">
              <div
                id="points-bet-wrapper__bet--decrease"
                className="points-bet-wrapper__bet--decrease"
                onClick={decreaseBet}
              >
                -
              </div>
              <span>Bet: </span>&nbsp;
              <span id="points-bet-wrapper__bet--amount">{bet.toFixed(2)}</span>
              <div
                id="points-bet-wrapper__bet--increase"
                className="points-bet-wrapper__bet--increase"
                onClick={increaseBet}
              >
                +
              </div>
            </div>
            <div className="points-bet-wrapper__points">
              <span>Points: </span>&nbsp;
              <span id="points-bet-wrapper__points--player-points">{points}</span>
            </div>
            <div className="points-bet-wrapper__weight">
              <span style={{ fontSize: "15px" }}>Ball weight: </span>&nbsp;
              <span id="points-bet-wrapper__weight--amount">{50 + incrWeightValue}</span>
              <div
                id="points-bet-wrapper__weight--decrease"
                className="points-bet-wrapper__weight--decrease"
                onClick={decreaseWeight}
              >
                -
              </div>
              <div
                id="points-bet-wrapper__weight--increase"
                className="points-bet-wrapper__weight--increase"
                onClick={increaseWeight}
              >
                +
              </div>
            </div>
          </div>
          
        </div>
      </div>
      <div className="game-history">
        <div className="table-wrapper" id="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Bet</th>
                <th>Slot Cost</th>
                <th>Return</th>
              </tr>
            </thead>
          </table>
          <table>
            <tbody id="game-history-table-body">
              {/* Game history rows will be appended dynamically in Play.start */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}