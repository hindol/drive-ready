import { StrictMode } from 'react'
import { ClerkProvider } from '@clerk/clerk-react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'
import App from './App.tsx'
import { applyPalette, DEFAULT_PALETTE, getPalette } from './theme/palettes'

const fallbackClerkPublishableKey =
  'pk_test_ZmlybS1xdWV0emFsLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ'
const providedClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim()
const clerkPublishableKey =
  providedClerkKey && providedClerkKey.length > 0
    ? providedClerkKey
    : fallbackClerkPublishableKey

if (!providedClerkKey) {
  console.warn(
    'VITE_CLERK_PUBLISHABLE_KEY not set. Falling back to the default DriveReady Clerk key defined in src/main.tsx.',
  )
}

if (!clerkPublishableKey) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY. Set it in your environment to enable Clerk authentication.',
  )
}

applyPalette(getPalette(DEFAULT_PALETTE))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>,
)
