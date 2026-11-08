import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ControlWindow } from './routes/ControlWindow'
import { OutputWindow } from './routes/OutputWindow'

/**
 * Both windows load the same bundle; the hash decides which one renders.
 *
 * Keeping it to a hash check avoids a router dependency for what is, and will
 * stay, a two-screen app.
 */
const isOutput = window.location.hash.startsWith('#/output')

// Prevent default WebView2 / browser context menu globally across the app
window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isOutput ? <OutputWindow /> : <ControlWindow />}</StrictMode>,
)
