import { Languages } from 'lucide-react'
import { useLanguage } from './LanguageContext'
import './language.css'

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage()
  return <button className="global-language-switcher" data-no-translate onClick={toggleLanguage} aria-label={language === 'en' ? 'हिन्दी में देखें' : 'View in English'}><Languages size={16}/><span>{language === 'en' ? 'हिन्दी' : 'English'}</span></button>
}
