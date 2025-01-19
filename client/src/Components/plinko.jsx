import React, { useState, useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

import backgroundMusic from "../images/background_music.mp3";
import pinkBallImage from "../images/pink_ball.png";
import circleImage from "../images/circle.png";

// Global game configuration and state variables
let fraction;
let slots = [];
let pegs = [];
let openning;
const slot_costs_list = [
  [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
  [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
  [8.9, 3, 1.1, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
  [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
  [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
  [8.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 8.1],
  [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
  [15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15],
  [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
];
const initial_level = 8;
let top_bounce = 0.5;
let side_bounce = 4;
let incr_weight_value = 0;
window.points = 100; // Initialize global points

// Helper Classes
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
    const slot = PIXI.Sprite.from(`/${this.cost}.png`);
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

  isCollision(peg_x, peg_y, peg_r, ball_x, ball_y, ball_r) {
    const circleDistance = (peg_x - ball_x) ** 2 + (peg_y - ball_y) ** 2;
    return circleDistance <= ((peg_r + ball_r) ** 2);
  }

  getCostScored(bet, slot_cost) {
    return bet * slot_cost;
  }

  roundToTwoDecimal(num) {
    return +(Math.round(num + "e+2") + "e-2");
  }

  start() {
    const wonFlashEl = document.getElementById("points-bet-wrapper__won-flash");
    if (wonFlashEl) {
      wonFlashEl.classList.remove("points-bet-wrapper__won-flash__animate");
    }

    this.pinkBall.x = openning.x + 5 * this.fraction;
    this.pinkBall.y = openning.y;
    this.pinkBall.width = 35 * this.fraction;
    this.pinkBall.height = 35 * this.fraction;
    this.pinkBall.vy = 0;
    this.pinkBall.vx = 0;
    this.app.stage.addChild(this.pinkBall);

    let last_peg;
    let randomTurn = Math.floor(Math.random() * 2);
    const that = this;

    console.log("Starting ticker for ball animation.");
    this.app.ticker.add(function () {
      that.pinkBall.y += that.pinkBall.vy;
      that.pinkBall.vy += 0.8;

      for (let pegIndx = 0; pegIndx < that.pegs.length; pegIndx++) {
        if (
          that.isCollision(
            that.pegs[pegIndx].x - 1 * that.fraction,
            that.pegs[pegIndx].y,
            that.pegs[pegIndx].radius,
            that.pinkBall.x,
            that.pinkBall.y,
            that.pinkBall.width / 2
          )
        ) {
          console.log("Collision detected with peg index:", pegIndx);
          that.pegs[pegIndx].pegBall.tint = 0xF101C4;
          setTimeout(() => {
            that.pegs[pegIndx].pegBall.tint = 0xffffff;
          }, 100);

          let collisionSoundEffect = new Audio("/Sound Effects/collisionEffect.wav");
          collisionSoundEffect.volume = 0.2;
          collisionSoundEffect.play();

          let current_peg = that.pegs[pegIndx];

          that.pinkBall.vy *= -that.top_bounce;
          that.pinkBall.y += that.pinkBall.vy;
          that.pinkBall.vx += that.side_bounce;
          that.pinkBall.vx = that.pinkBall.vx * that.fraction;

          if (current_peg !== last_peg) {
            randomTurn = Math.floor(Math.random() * 2);
            last_peg = current_peg;
          }

          if (randomTurn === 0) {
            that.pinkBall.x -= that.pinkBall.vx;
          } else if (randomTurn === 1) {
            that.pinkBall.x += that.pinkBall.vx;
          }
          break;
        }
      }

      for (let slotIndx = 0; slotIndx < that.slots.length; slotIndx++) {
        if (
          that.isCollision(
            that.slots[slotIndx].x,
            that.slots[slotIndx].y + 40,
            that.slots[slotIndx].width / 2,
            that.pinkBall.x,
            that.pinkBall.y,
            that.pinkBall.width / 2
          )
        ) {
          console.log("Collision detected with slot index:", slotIndx);
          that.app.stage.removeChild(that.pinkBall);
          let scoredSoundEffect = new Audio("/Sound Effects/scoreEffect.wav");
          scoredSoundEffect.volume = 0.2;
          scoredSoundEffect.play();
          if (that.cost_scored === 0) {
            that.slotCost = that.slots[slotIndx].cost;
            that.cost_scored = that.roundToTwoDecimal(
              that.getCostScored(that.bet, that.slotCost)
            );

            window.points = (window.points || 100) + that.cost_scored;
            window.points = that.roundToTwoDecimal(window.points);

            const pointsWonEl = document.getElementById("points-won");
            if (pointsWonEl) pointsWonEl.innerHTML = that.cost_scored;
            const playerPointsEl = document.getElementById(
              "points-bet-wrapper__points--player-points"
            );
            if (playerPointsEl) playerPointsEl.innerHTML = window.points;
            const wonFlashEl = document.getElementById("points-bet-wrapper__won-flash");
            if (wonFlashEl)
              wonFlashEl.classList.add("points-bet-wrapper__won-flash__animate");

            let tableGameHistory = document.getElementById(
              "game-history-table-body"
            );
            if (tableGameHistory) {
              tableGameHistory.innerHTML =
                `<tr>
                  <td colspan="1">${that.time}</td>
                  <td>${that.bet}</td>
                  <td>${that.slotCost}x</td>
                  ${
                    that.cost_scored > that.bet
                      ? `<td class="td-won"><div>${that.cost_scored}</div></td>`
                      : that.cost_scored < that.bet
                      ? `<td class="td-lost"><div>${that.cost_scored}</div></td>`
                      : `<td class="td-no-gain"><div>${that.cost_scored}</div></td>`
                  }
                </tr>` + tableGameHistory.innerHTML;
            }

            that.slots[slotIndx].slot.y += 10;
            setTimeout(() => {
              that.slots[slotIndx].slot.y -= 10;
            }, 50);
          }
        }
      }
    });
  }
}

export default function Plinko() {
  const [bet, setBet] = useState(1.0);
  const [points, setPoints] = useState(100);
  const [topBounce, setTopBounce] = useState(0.5);
  const [sideBounce, setSideBounce] = useState(4);
  const [incrWeightValue, setIncrWeightValue] = useState(0);
  const containerRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    let app;
    let assetsToLoad = new Set([
      circleImage,
      pinkBallImage,
      "/bC.png",
      "/0.5.png",
      "/0.7.png",
      "/1.1.png",
      "/1.2.png",
      "/1.3.png",
      "/1.4.png",
      "/1.5.png",
      "/1.6.png",
      "/1.9.png",
      "/1.png",
      "/2.1.png",
      "/2.png",
      "/3.png",
      "/4.png",
      "/5.6.png",
      "/7.1.png",
      "/8.1.png",
      "/8.4.png",
      "/8.9.png",
      "/8.png",
      "/9.png",
      "/10.png",
      "/15.png",
      "/16.png",
    ]);

    // Preload images related to initial level
    slot_costs_list[initial_level - 8].forEach((cost) => {
      assetsToLoad.add(`/${cost}.png`);
    });

    console.log("Assets to load:", assetsToLoad);

    const loader = new PIXI.Loader(); // Create a new loader instance
    console.log("Created new PIXI.Loader instance:", loader);

    assetsToLoad.forEach((asset) => {
      if (typeof loader.add === "function") {
        console.log(`Adding asset: ${asset}`);
        loader.add(asset);
      } else {
        console.error("loader.add is not a function!", loader);
      }
    });

    console.log("Starting loader.load()...");
    loader.load(() => {
      console.log("Loader finished loading assets.");
      (async () => {
        app = new PIXI.Application({ height: 700, backgroundColor: 0x1496c });
        appRef.current = app;
        if (containerRef.current) {
          containerRef.current.appendChild(app.view);
        }
        setupPixiGame(app);
      })();
    });

    return () => {
      if (app) {
        console.log("Destroying app...");
        app.destroy(true, { children: true });
      }
    };
  }, []);

  function setupPixiGame(app) {
    const { stage } = app;
    let lines = 2 + initial_level;
    let slot_costs = slot_costs_list[initial_level - 8];
    fraction = 7 / lines;
    pegs = [];
    slots = [];

    console.log("Setting up Pixi game with lines:", lines, "and fraction:", fraction);

    let space_bottom = 150 * fraction;

    for (let i = 3; i <= lines; i++) {
      let space_left = 50;
      for (let space = 1; space <= lines - i; space++) {
        space_left += 50 * fraction;
      }
      for (let point = 1; point <= i; point++) {
        let pegObj = new Peg(
          space_left,
          space_bottom,
          0,
          30 * fraction,
          30 * fraction,
          (30 * fraction) / 2
        );
        let newPeg = pegObj.create();
        stage.addChild(newPeg);
        pegs.push(pegObj);
        space_left += 100 * fraction;
      }
      space_bottom += 90 * fraction;
    }

    for (let s = 0; s < slot_costs.length; s++) {
      let temp_bottom_peg = pegs[pegs.length - 1 - slot_costs.length + s];
      let slotObj = new Slot(
        temp_bottom_peg.x + temp_bottom_peg.width * fraction,
        space_bottom,
        0,
        55 - lines,
        50 - lines,
        slot_costs[s]
      );
      let newSlot = slotObj.create();
      stage.addChild(newSlot);
      slots.push(slotObj);
    }

    openning = PIXI.Sprite.from("/bC.png");
    openning.anchor.set(0);
    openning.x = pegs[1].x - 8 * fraction;
    openning.y = 50 * fraction;
    openning.width = 50 * fraction;
    openning.height = 50 * fraction;
    stage.addChild(openning);

    console.log("Board setup complete. Pegs count:", pegs.length, "Slots count:", slots.length);
  }

  const increaseBet = () => {
    if (points > bet) setBet((prev) => prev + 1.0);
  };
  const decreaseBet = () => {
    if (bet > 1.0) setBet((prev) => prev - 1.0);
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
      const playInstance = new Play(
        openning,
        appRef.current,
        fraction,
        pegs,
        slots,
        bet,
        topBounce,
        sideBounce
      );
      console.log("Starting play with instance:", playInstance);
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
          <div className="canvas-options">
            <span className="canvas-options_title">Lines</span>
            {["8", "9", "10", "11", "12", "13", "14", "15", "16"].map(
              (line) => (
                <div key={line} className="canvas-option_div">
                  {line}
                </div>
              )
            )}
          </div>
          <div id="play-button" className="play-button" onClick={handlePlayButton}>
            <label>Play</label>
          </div>
          <div className="points-bet-wrapper">
            <div className="points-bet-wrapper__bet">
              <div onClick={decreaseBet}>-</div>
              <span>Bet: {bet.toFixed(2)}</span>
              <div onClick={increaseBet}>+</div>
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
        {/* Add game history UI elements as needed */}
      </div>
    </div>
  );
}
