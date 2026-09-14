import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import LanguageSwitcher from './i18n/LanguageSwitcher.jsx'
import SamadhanAssistant from './components/SamadhanAssistant.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter><LanguageSwitcher /><SamadhanAssistant /><App /></BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)
