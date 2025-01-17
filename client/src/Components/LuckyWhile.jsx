import React, { useState } from 'react'
import { Wheel } from 'react-custom-roulette'

const data = [
  { option: 'Lose' },
  { option: 'Lose' },
  { option: '1.2×' },
  { option: '1.5×' },
  { option: '3×' },
  { option: '10×' },
]

export default function SimpleWheel() {
  const [mustSpin, setMustSpin] = useState(false)
  const [prizeNumber, setPrizeNumber] = useState(0)

  const handleSpinClick = () => {
    if (!mustSpin) {
      const randomIndex = Math.floor(Math.random() * data.length)
      setPrizeNumber(randomIndex)
      setMustSpin(true)
    }
  }

  return (
    <div>
      <Wheel
        mustStartSpinning={mustSpin}
        prizeNumber={prizeNumber}
        data={data}
        onStopSpinning={() => setMustSpin(false)}
        // No startingOptionIndex => full spin
      />
      <button onClick={handleSpinClick}>Spin</button>
    </div>
  )
}