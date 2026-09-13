import { useEffect, useRef, useState } from 'react'
import { Bot, ChevronRight, Languages, MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import './SamadhanAssistant.css'

const copy = {
  en: {
    title: 'Samadhan Sahayak', status: 'Bilingual citizen assistant', welcome: 'Namaste! I can guide you through SamadhanSetu. Ask me how to submit or track a problem, add evidence, or participate in a project.',
    placeholder: 'Ask in English or Hindi…', send: 'Send message', open: 'Open Samadhan Sahayak', close: 'Close assistant', typing: 'Finding the right guidance…',
    prompts: ['How do I submit a problem?', 'What evidence should I add?', 'How can I track my problem?'],
  },
  hi: {
    title: 'समाधान सहायक', status: 'द्विभाषी नागरिक सहायक', welcome: 'नमस्ते! मैं समाधानसेतु का उपयोग करने में आपकी सहायता कर सकता हूँ। समस्या दर्ज करने, साक्ष्य जोड़ने, स्थिति देखने या परियोजना में भाग लेने के बारे में पूछें।',
    placeholder: 'हिन्दी या English में पूछें…', send: 'संदेश भेजें', open: 'समाधान सहायक खोलें', close: 'सहायक बंद करें', typing: 'सही जानकारी खोजी जा रही है…',
    prompts: ['समस्या कैसे दर्ज करें?', 'कौन से साक्ष्य जोड़ें?', 'समस्या की स्थिति कैसे देखें?'],
  },
}

const answers = {
  submit: {
    en: 'To submit a problem: 1) Select “Submit a problem”. 2) Add a clear title and description. 3) Choose the category and location. 4) Explain severity, frequency and people affected. 5) Upload useful evidence. 6) Review the details and submit. You can submit as a guest, but signing in lets you track updates across devices.',
    hi: 'समस्या दर्ज करने के चरण: 1) “समस्या दर्ज करें” चुनें। 2) स्पष्ट शीर्षक और विवरण लिखें। 3) श्रेणी और स्थान चुनें। 4) गंभीरता, आवृत्ति और प्रभावित लोगों की संख्या बताएँ। 5) उपयोगी साक्ष्य अपलोड करें। 6) जानकारी जाँचकर प्रस्तुत करें। अतिथि के रूप में भी दर्ज कर सकते हैं, लेकिन साइन इन करने पर हर डिवाइस से स्थिति देख पाएँगे।',
  },
  evidence: {
    en: 'Add evidence that clearly shows the issue: recent photographs, a short video, PDFs or supporting documents, and GPS location. Avoid uploading unrelated files or sensitive identity documents. A useful photo plus an accurate location often helps verification happen faster.',
    hi: 'समस्या को स्पष्ट दिखाने वाले साक्ष्य जोड़ें: हाल की तस्वीरें, छोटा वीडियो, PDF या सहायक दस्तावेज और GPS स्थान। असंबंधित फ़ाइलें या संवेदनशील पहचान दस्तावेज अपलोड न करें। उपयोगी तस्वीर और सही स्थान से सत्यापन तेज़ हो सकता है।',
  },
  track: {
    en: 'Sign in and open Citizen Portal → My Problems. You can follow each submission through Submitted, Under Verification, Verified, Assigned, In Development, Pilot Testing, Resolved and Closed. Guest drafts remain only on the device used to submit them.',
    hi: 'साइन इन करके नागरिक पोर्टल → मेरी समस्याएँ खोलें। प्रत्येक प्रस्तुति की स्थिति प्रस्तुत, सत्यापनाधीन, सत्यापित, आवंटित, विकासाधीन, पायलट परीक्षण, समाधान हुआ और बंद चरणों में देख सकते हैं। अतिथि ड्राफ्ट केवल उसी डिवाइस पर रहते हैं।',
  },
  category: {
    en: 'Choose the category that best describes the main issue—for example Agriculture, Healthcare, Education, Water Management, Sanitation or Public Safety. If more than one applies, select the primary cause and explain related concerns in the description. The platform can assist with classification during review.',
    hi: 'मुख्य समस्या के अनुसार सबसे उपयुक्त श्रेणी चुनें—जैसे कृषि, स्वास्थ्य, शिक्षा, जल प्रबंधन, स्वच्छता या सार्वजनिक सुरक्षा। यदि एक से अधिक श्रेणियाँ लागू हों, तो मुख्य कारण चुनें और बाकी जानकारी विवरण में लिखें। समीक्षा के दौरान प्लेटफ़ॉर्म वर्गीकरण में सहायता करेगा।',
  },
  description: {
    en: 'A strong problem statement answers five questions: What is happening? Where is it happening? Who is affected? How often does it occur? What outcome is needed? Example: “The handpump in Village X stops working every summer, affecting about 120 residents who then walk 2 km for drinking water.”',
    hi: 'अच्छा समस्या विवरण पाँच प्रश्नों का उत्तर देता है: क्या हो रहा है? कहाँ हो रहा है? कौन प्रभावित है? कितनी बार होता है? क्या परिणाम चाहिए? उदाहरण: “गाँव X का हैंडपंप हर गर्मी में बंद हो जाता है, जिससे लगभग 120 लोगों को पीने के पानी के लिए 2 किमी चलना पड़ता है।”',
  },
  account: {
    en: 'Select Sign in, then choose Create account. Enter your name, email, optional mobile number, password and participation role. Aadhaar is not mandatory. Citizens may also create non-sensitive guest submissions without an account.',
    hi: 'साइन इन चुनें और फिर खाता बनाएँ पर जाएँ। नाम, ईमेल, वैकल्पिक मोबाइल नंबर, पासवर्ड और अपनी भूमिका भरें। आधार अनिवार्य नहीं है। नागरिक बिना खाते के भी गैर-संवेदनशील अतिथि समस्या दर्ज कर सकते हैं।',
  },
  university: {
    en: 'Universities can review open challenges, create multidisciplinary student teams, assign faculty mentors, submit solution proposals and manage research, prototypes and pilots. Sign in with a university or faculty role to open the organisation workspace.',
    hi: 'विश्वविद्यालय खुली चुनौतियाँ देख सकते हैं, बहुविषयक विद्यार्थी टीमें बना सकते हैं, संकाय मार्गदर्शक नियुक्त कर सकते हैं, समाधान प्रस्ताव जमा कर सकते हैं और शोध, प्रोटोटाइप व पायलट प्रबंधित कर सकते हैं। संगठन कार्यस्थल के लिए विश्वविद्यालय या संकाय भूमिका से साइन इन करें।',
  },
  industry: {
    en: 'Industries and startups can browse validated challenges and offer funding, mentorship, technology, hardware, software, prototyping, field testing or deployment support. CSR partners can express interest in milestone-based project funding.',
    hi: 'उद्योग और स्टार्टअप सत्यापित चुनौतियाँ देखकर वित्त, मार्गदर्शन, तकनीक, हार्डवेयर, सॉफ्टवेयर, प्रोटोटाइप, क्षेत्र परीक्षण या क्रियान्वयन सहायता दे सकते हैं। सीएसआर भागीदार चरणबद्ध परियोजना वित्तपोषण में रुचि दर्ज कर सकते हैं।',
  },
  location: {
    en: 'Provide district, block, Panchayat or municipality, village or ward, and the most accurate location available. You can use the GPS button to capture latitude and longitude after allowing browser location access.',
    hi: 'जिला, प्रखंड, पंचायत या नगरपालिका, गाँव या वार्ड और उपलब्ध सबसे सटीक स्थान भरें। ब्राउज़र को स्थान अनुमति देने के बाद GPS बटन से अक्षांश और देशांतर दर्ज कर सकते हैं।',
  },
  safety: {
    en: 'Do not include Aadhaar numbers, bank details, medical records or another person’s private information. For an immediate danger or emergency, contact the appropriate emergency service instead of waiting for portal review.',
    hi: 'आधार नंबर, बैंक जानकारी, चिकित्सा रिकॉर्ड या किसी अन्य व्यक्ति की निजी जानकारी साझा न करें। तत्काल खतरे या आपात स्थिति में पोर्टल समीक्षा की प्रतीक्षा करने के बजाय संबंधित आपात सेवा से संपर्क करें।',
  },
  fallback: {
    en: 'I can help with problem submission, writing a problem statement, evidence, GPS location, categories, tracking, registration, university teams, industry collaboration and CSR funding. Try asking: “How do I write a good problem statement?”',
    hi: 'मैं समस्या दर्ज करने, समस्या विवरण लिखने, साक्ष्य, GPS स्थान, श्रेणी, स्थिति, पंजीकरण, विश्वविद्यालय टीम, उद्योग सहयोग और सीएसआर वित्तपोषण में सहायता कर सकता हूँ। पूछें: “अच्छा समस्या विवरण कैसे लिखें?”',
  },
}

const intentPatterns = [
  ['evidence', /evidence|photo|video|document|pdf|upload|proof|साक्ष्य|फोटो|तस्वीर|वीडियो|दस्तावेज|अपलोड/i],
  ['track', /track|status|progress|where.*problem|स्थिति|प्रगति|ट्रैक|कहाँ.*समस्या/i],
  ['description', /statement|description|write|title|विवरण|लिख|शीर्षक|स्टेटमेंट/i],
  ['category', /category|domain|sector|श्रेणी|वर्ग|क्षेत्र/i],
  ['account', /login|sign in|register|account|aadhaar|लॉगिन|साइन|पंजीकरण|खाता|आधार/i],
  ['university', /university|student|faculty|team|mentor|college|विश्वविद्यालय|विद्यार्थी|छात्र|संकाय|टीम|मार्गदर्शक/i],
  ['industry', /industry|startup|csr|fund|company|उद्योग|स्टार्टअप|सीएसआर|वित्त|कंपनी/i],
  ['location', /location|gps|district|block|village|ward|स्थान|जिला|प्रखंड|गाँव|वार्ड/i],
  ['safety', /privacy|safe|emergency|sensitive|private|गोपनीय|सुरक्षित|आपात|संवेदनशील|निजी/i],
  ['submit', /submit|add problem|report|raise|problem.*how|प्रस्तुत|दर्ज|समस्या.*कैसे|शिकायत|बताएँ/i],
]

const detectLanguage = value => /[\u0900-\u097F]/.test(value) ? 'hi' : 'en'
const findAnswer = value => intentPatterns.find(([, pattern]) => pattern.test(value))?.[0] || 'fallback'

export default function SamadhanAssistant() {
  const { language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState([])
  const endRef = useRef(null)
  const ui = copy[language]

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])
  const ask = value => {
    const question = value.trim()
    if (!question || typing) return
    const responseLanguage = detectLanguage(question)
    setMessages(current => [...current, { role: 'user', text: question }])
    setInput('')
    setTyping(true)
    window.setTimeout(() => {
      setMessages(current => [...current, { role: 'assistant', text: answers[findAnswer(question)][responseLanguage] }])
      setTyping(false)
    }, 450)
  }
  const submit = event => { event.preventDefault(); ask(input) }

  return <div className="samadhan-assistant" data-no-translate>
    {open && <section className="assistant-panel" role="dialog" aria-label={ui.title}>
      <header><span><Bot/></span><div><strong>{ui.title}</strong><small><i/>{ui.status}</small></div><button onClick={() => setOpen(false)} aria-label={ui.close}><X/></button></header>
      <div className="assistant-messages">
        <article className="assistant-message bot-message"><Bot/><p>{ui.welcome}</p></article>
        {!messages.length && <div className="assistant-prompts">{ui.prompts.map(prompt => <button key={prompt} onClick={() => ask(prompt)}>{prompt}<ChevronRight/></button>)}</div>}
        {messages.map((message, index) => <article key={`${message.role}-${index}`} className={`assistant-message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}>{message.role === 'assistant' && <Bot/>}<p>{message.text}</p></article>)}
        {typing && <article className="assistant-message bot-message assistant-typing"><Sparkles/><p>{ui.typing}</p></article>}
        <div ref={endRef}/>
      </div>
      <form onSubmit={submit}><Languages/><input value={input} onChange={event => setInput(event.target.value)} placeholder={ui.placeholder} maxLength={500}/><button disabled={!input.trim() || typing} aria-label={ui.send}><Send/></button></form>
      <footer>SamadhanSetu AI Guide · कृपया निजी जानकारी साझा न करें</footer>
    </section>}
    <button className={`assistant-launcher ${open ? 'open' : ''}`} onClick={() => setOpen(value => !value)} aria-label={open ? ui.close : ui.open}>{open ? <X/> : <><MessageCircle/><span>{ui.title}</span></>}</button>
  </div>
}
