import { StrictMode } from 'react'
import './i18n'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { isChunkError, reloadForStaleChunk } from '@/lib/lazyRetry'

function onChunkFailure(reason: unknown) {
  if (isChunkError(reason)) reloadForStaleChunk()
}

window.addEventListener('unhandledrejection', (e) => {
  onChunkFailure(e.reason)
})
window.addEventListener('error', (e) => {
  onChunkFailure(e.error || e.message)
}, true)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
