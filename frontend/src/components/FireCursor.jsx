import React, { useEffect, useRef } from 'react'
import '../styles/fireCursor.css'

const isTouchDevice = () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)

export default function FireCursor() {
  const cursorRef = useRef(null)
  const particlesRef = useRef(null)

  useEffect(() => {
    if (isTouchDevice()) return

    document.body.classList.add('fc-enabled')

    const cursor = cursorRef.current
    const particles = particlesRef.current
    let lastMove = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    let lastScrollY = window.scrollY

    function particleColor() {
      const colors = ['#ffcf66', '#ff5e2b', '#ffd89b', '#ff8a00']
      return colors[Math.floor(Math.random() * colors.length)]
    }

    function spawnParticle(x, y, scale = 1) {
      if (!particles) return
      const p = document.createElement('span')
      p.className = 'fc-particle'
      p.style.left = `${x}px`
      p.style.top = `${y}px`
      p.style.background = particleColor()
      p.style.transform = `translate(-50%, -50%) scale(${0.6 + Math.random() * 0.9 * scale})`
      particles.appendChild(p)
      setTimeout(() => p.remove(), 1600)
    }

    function onMove(e) {
      const x = e.clientX || lastMove.x
      const y = e.clientY || lastMove.y
      lastMove = { x, y }
      if (cursor) cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`

      // small trailing embers while moving
      if (Math.random() < 0.14) spawnParticle(x + (Math.random() - 0.5) * 12, y + (Math.random() - 0.5) * 12, 0.9)

      // hide custom cursor on inputs and interactive elements
      const tag = e.target && e.target.tagName
      if (tag && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(tag)) {
        cursor && cursor.classList.add('fc-hidden')
      } else if (cursor) {
        cursor.classList.remove('fc-hidden')
      }
    }

    function onScroll() {
      const x = lastMove.x || window.innerWidth / 2
      const y = lastMove.y || window.innerHeight / 2
      const count = 6 + Math.floor(Math.random() * 6)
      for (let i = 0; i < count; i++) {
        const rx = x + (Math.random() - 0.5) * 160
        const ry = y + (Math.random() - 0.5) * 100
        spawnParticle(rx, ry, 0.6 + Math.random() * 1.2)
      }
      lastScrollY = window.scrollY
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      document.body.classList.remove('fc-enabled')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      <div ref={cursorRef} className="fire-cursor" aria-hidden="true" />
      <div ref={particlesRef} className="fire-particles" aria-hidden="true" />
    </>
  )
}
