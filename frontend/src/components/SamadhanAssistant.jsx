import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Bot, ChevronRight, Languages, MessageCircle, RotateCcw, Send, Sparkles, X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { sendChatMessage } from '../lib/chatApi'
import './SamadhanAssistant.css'

const copy = {
  en: {
    title: 'Samadhan Sahayak', status: 'Hindi · English · Hinglish',
    welcome: 'Namaste! I am your SamadhanSetu guide. Ask me about submitting or tracking a problem, solution ideas, university teams, or collaboration.',
    placeholder: 'Ask in English, Hindi, or Hinglish…', send: 'Send message', open: 'Open Samadhan Sahayak', close: 'Close assistant',
    typing: 'Understanding your question…', clear: 'Start a new conversation', offline: 'I could not answer that. Please try again.',
    fallback: 'Basic guidance', ai: 'AI response', privacy: 'Do not share passwords, OTPs, Aadhaar, or bank details.',
    prompts: ['How do I submit a problem?', 'Meri problem ka status kaise dekhu?', 'How can a student join a challenge?'],
  },
  hi: {
    title: 'समाधान सहायक', status: 'हिन्दी · English · Hinglish',
    welcome: 'नमस्ते! मैं आपका समाधानसेतु मार्गदर्शक हूँ। समस्या दर्ज करने या उसकी स्थिति देखने, समाधान विचार, विश्वविद्यालय टीम या सहयोग के बारे में पूछें।',
    placeholder: 'हिन्दी, English या Hinglish में पूछें…', send: 'संदेश भेजें', open: 'समाधान सहायक खोलें', close: 'सहायक बंद करें',
    typing: 'आपका प्रश्न समझा जा रहा है…', clear: 'नई बातचीत शुरू करें', offline: 'उत्तर नहीं मिल पाया। कृपया दोबारा प्रयास करें।',
    fallback: 'मूल मार्गदर्शन', ai: 'AI उत्तर', privacy: 'पासवर्ड, OTP, आधार या बैंक जानकारी साझा न करें।',
    prompts: ['समस्या कैसे दर्ज करें?', 'Meri problem ka status kaise dekhu?', 'विद्यार्थी किसी चुनौती से कैसे जुड़ें?'],
  },
}

const savedMessages = () => {
  try {
    const value = JSON.parse(sessionStorage.getItem('samadhan-chat') || '[]')
    return Array.isArray(value) ? value.slice(-20) : []
  } catch { return [] }
}

export default function SamadhanAssistant() {
  const { language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState(savedMessages)
  const [error, setError] = useState('')
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const ui = copy[language]

  useEffect(() => { sessionStorage.setItem('samadhan-chat', JSON.stringify(messages.slice(-20))) }, [messages])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])
  useEffect(() => { if (open) window.setTimeout(() => inputRef.current?.focus(), 100) }, [open])

  const ask = async value => {
    const question = value.trim()
    if (!question || typing) return
    const previousMessages = messages
    setMessages(current => [...current, { role: 'user', text: question }])
    setInput('')
    setError('')
    setTyping(true)
    try {
      const history = previousMessages.slice(-10).map(item => ({ role: item.role, content: item.text }))
      const result = await sendChatMessage(question, history)
      setMessages(current => [...current, { role: 'assistant', text: result.reply, mode: result.mode }])
    } catch (requestError) {
      setError(requestError.message || ui.offline)
    } finally {
      setTyping(false)
    }
  }

  const clearConversation = () => {
    setMessages([])
    setError('')
    sessionStorage.removeItem('samadhan-chat')
  }

  return <div className="samadhan-assistant" data-no-translate>
    {open && <section className="assistant-panel" role="dialog" aria-label={ui.title}>
      <header>
        <span><Bot/></span><div><strong>{ui.title}</strong><small><i/>{ui.status}</small></div>
        <button onClick={() => setOpen(false)} aria-label={ui.close}><X/></button>
      </header>
      <div className="assistant-messages" aria-live="polite">
        <article className="assistant-message bot-message"><Bot/><div className="assistant-bubble"><p>{ui.welcome}</p></div></article>
        {!messages.length && <div className="assistant-prompts">{ui.prompts.map(prompt => <button key={prompt} onClick={() => ask(prompt)}>{prompt}<ChevronRight/></button>)}</div>}
        {messages.map((message, index) => <article key={`${message.role}-${index}`} className={`assistant-message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}>
          {message.role === 'assistant' && <Bot/>}<div className="assistant-bubble"><p>{message.text}</p>{message.role === 'assistant' && message.mode && <small>{message.mode === 'ai' ? ui.ai : ui.fallback}</small>}</div>
        </article>)}
        {typing && <article className="assistant-message bot-message assistant-typing"><Sparkles/><div className="assistant-bubble"><p>{ui.typing}</p></div></article>}
        {error && <div className="assistant-error"><AlertCircle/><span>{error}</span></div>}
        {messages.length > 0 && <button className="assistant-clear" onClick={clearConversation}><RotateCcw/>{ui.clear}</button>}
        <div ref={endRef}/>
      </div>
      <form onSubmit={event => { event.preventDefault(); ask(input) }}>
        <Languages/><input ref={inputRef} value={input} onChange={event => setInput(event.target.value)} placeholder={ui.placeholder} maxLength={1000}/>
        <button disabled={!input.trim() || typing} aria-label={ui.send}><Send/></button>
      </form>
      <footer>{ui.privacy}</footer>
    </section>}
    <button className={`assistant-launcher ${open ? 'open' : ''}`} onClick={() => setOpen(value => !value)} aria-label={open ? ui.close : ui.open}>{open ? <X/> : <><MessageCircle/><span>{ui.title}</span></>}</button>
  </div>
}
