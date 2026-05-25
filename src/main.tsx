import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { SplashScreen } from './SplashScreen.tsx'
import SpatialNavigation from 'spatial-navigation-js'

// Initialize TV remote spatial navigation globally
SpatialNavigation.init()
SpatialNavigation.add({
  selector: 'a, button, input, textarea, select, [tabindex="0"]'
})
SpatialNavigation.makeFocusable()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SplashScreen>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SplashScreen>
    </BrowserRouter>
  </StrictMode>,
)
