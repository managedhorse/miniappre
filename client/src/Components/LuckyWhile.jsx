// LuckyWheel.jsx
import React, { useEffect, useRef, useState } from 'react'
// Import the Wheel constructor from spin-wheel
import { Wheel } from 'spin-wheel'
// If you need easing, import from spin-wheel/dist/easing-utils:
// import { cubicOut } from 'spin-wheel/dist/easing-utils.js';

function LuckyWheel() {
  const wheelContainerRef = useRef(null)
  const wheelInstanceRef = useRef(null) // to store the Wheel instance
  const [items] = useState([
    { label: 'Lose', backgroundColor: '#D30000' },
    { label: '1.2×', backgroundColor: '#004225' },
    { label: '1.5×', backgroundColor: '#FFA500' },
    { label: '3×',   backgroundColor: '#1E90FF' },
    { label: '10×',  backgroundColor: '#800080' },
  ])

  useEffect(() => {
    // 1) On mount, create the Wheel in the container
    if (wheelContainerRef.current) {
      wheelInstanceRef.current = new Wheel(wheelContainerRef.current, {
        items,
        // For example, you can set pointerAngle if you have a pointer in mind
        pointerAngle: 0,
        // The radius as a % of container's size
        radius: 0.85,
        // Possibly reduce lineWidth:
        lineWidth: 2,
        borderWidth: 2,
      })
    }
    // 2) Optional cleanup if you remove the wheel
    return () => {
      if (wheelInstanceRef.current) {
        wheelInstanceRef.current.remove()
      }
    }
  }, [items])

  const spinToRandomItem = () => {
    if (!wheelInstanceRef.current) return
    const wheel = wheelInstanceRef.current

    // Pick a random item index
    const itemIndex = Math.floor(Math.random() * items.length)
    // Spin for 3000ms, 2 full revolutions, clockwise
    wheel.spinToItem(itemIndex, 3000, true, 2, 1 /* direction=1=clockwise */)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Spin-Wheel Example</h2>
      {/* 3) Container for the Wheel */}
      <div
        ref={wheelContainerRef}
        style={{
          width: '300px',
          height: '300px',
          margin: '0 auto',
          border: '1px dashed #ccc',
          position: 'relative'
        }}
      />
      <button onClick={spinToRandomItem}>
        Spin
      </button>
    </div>
  )
}

export default LuckyWheel