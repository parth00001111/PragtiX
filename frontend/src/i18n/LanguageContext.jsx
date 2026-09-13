import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const LanguageContext = createContext(null)
const storageKey = 'samadhan-setu-language'

const hindi = {
  'Government of Jharkhand · Societal Innovation Initiative': 'झारखंड सरकार · सामाजिक नवाचार पहल',
  'English': 'हिन्दी', 'Helpline': 'हेल्पलाइन', 'The challenge': 'चुनौती', 'Ecosystem': 'सहयोग तंत्र',
  'Platform': 'प्लेटफ़ॉर्म', 'How it works': 'यह कैसे काम करता है', 'Open workspace': 'कार्यस्थल खोलें', 'Dashboard': 'डैशबोर्ड',
  'Sign in': 'साइन इन', 'Sign out': 'साइन आउट', 'Explore open challenges': 'खुली चुनौतियाँ देखें',
  'Share a challenge': 'समस्या साझा करें', 'Submit a problem': 'समस्या दर्ज करें', 'Submit a new problem': 'नई समस्या दर्ज करें',
  'Solve a challenge': 'चुनौती का समाधान करें', 'Fund a project': 'परियोजना को वित्त दें',
  'Citizen or guest': 'नागरिक या अतिथि', 'Students & universities': 'विद्यार्थी और विश्वविद्यालय', 'CSR partners': 'सीएसआर भागीदार',
  'Track your work': 'अपना कार्य देखें', 'My workspace': 'मेरा कार्यस्थल', 'THE OPPORTUNITY': 'अवसर',
  'Jharkhand’s hardest problems can become its most meaningful learning opportunities.': 'झारखंड की कठिन समस्याएँ सबसे सार्थक सीखने के अवसर बन सकती हैं।',
  'Communities understand the problems around them. Universities hold research capability and young talent. Industry has technology, capital and implementation experience. SamadhanSetu brings these strengths into one accountable system.': 'समुदाय अपने आसपास की समस्याओं को समझते हैं। विश्वविद्यालयों के पास शोध क्षमता और युवा प्रतिभा है। उद्योग के पास तकनीक, पूंजी और क्रियान्वयन का अनुभव है। समाधानसेतु इन सभी क्षमताओं को एक जवाबदेह व्यवस्था में जोड़ता है।',
  'Built for action, not just reporting': 'केवल शिकायत नहीं, कार्रवाई के लिए निर्मित',
  'Every verified problem moves toward a team, project, pilot and measurable outcome.': 'हर सत्यापित समस्या टीम, परियोजना, पायलट और मापने योग्य परिणाम की ओर बढ़ती है।',
  'ONE SHARED ECOSYSTEM': 'एक साझा सहयोग तंत्र', 'A useful role for everyone.': 'हर किसी के लिए उपयोगी भूमिका।',
  'Each participant gets a focused workspace while working toward the same public outcome.': 'सभी प्रतिभागियों को एक साझा जनहित लक्ष्य के लिए समर्पित कार्यस्थल मिलता है।',
  'Citizens': 'नागरिक', 'Universities & students': 'विश्वविद्यालय और विद्यार्थी', 'Industry & startups': 'उद्योग और स्टार्टअप',
  'Government': 'सरकार', 'Enter workspace': 'कार्यस्थल में जाएँ',
  'Share lived problems and validate outcomes.': 'स्थानीय समस्याएँ साझा करें और परिणाम सत्यापित करें।',
  'Research and build through experiential learning.': 'अनुभवात्मक शिक्षा के माध्यम से शोध और निर्माण करें।',
  'Contribute proven technology and capability.': 'प्रमाणित तकनीक और क्षमता उपलब्ध कराएँ।',
  'Fund transparent milestone-based projects.': 'पारदर्शी चरणबद्ध परियोजनाओं को वित्त दें।',
  'Verify, evaluate and monitor public impact.': 'जन प्रभाव का सत्यापन, मूल्यांकन और निगरानी करें।',
  'Community problem': 'सामुदायिक समस्या', 'Research talent': 'शोध प्रतिभा', 'Technology & funding': 'तकनीक और वित्त', 'Public impact': 'जन प्रभाव',
  'ONE CONNECTED PLATFORM': 'एक जुड़ा हुआ प्लेटफ़ॉर्म', 'Everything needed to move from problem to solution.': 'समस्या से समाधान तक की पूरी व्यवस्था।',
  'Designed around the complete lifecycle—not disconnected forms and dashboards.': 'अलग-अलग फ़ॉर्म नहीं, संपूर्ण परियोजना जीवनचक्र के लिए बनाया गया।',
  'Citizen engagement': 'नागरिक सहभागिता', 'AI problem management': 'एआई समस्या प्रबंधन', 'University collaboration': 'विश्वविद्यालय सहयोग',
  'Industry partnership': 'उद्योग भागीदारी', 'Project lifecycle': 'परियोजना जीवनचक्र', 'Visual analytics': 'दृश्य विश्लेषण',
  'Evidence, multimedia and location-based submissions.': 'साक्ष्य, मल्टीमीडिया और स्थान आधारित प्रस्तुति।',
  'Classification, priority, duplicates and intelligent routing.': 'वर्गीकरण, प्राथमिकता, डुप्लिकेट पहचान और बुद्धिमान आवंटन।',
  'Teams, mentors, research and solution proposals.': 'टीमें, मार्गदर्शक, शोध और समाधान प्रस्ताव।',
  'Technology, mentorship, funding and deployment.': 'तकनीक, मार्गदर्शन, वित्त और कार्यान्वयन।',
  'Milestones, approvals, testing, IP and implementation.': 'माइलस्टोन, अनुमोदन, परीक्षण, बौद्धिक संपदा और क्रियान्वयन।',
  'Real-time district, domain and impact intelligence.': 'जिला, क्षेत्र और प्रभाव की रीयल-टाइम जानकारी।',
  'TRANSPARENT BY DESIGN': 'पारदर्शिता के साथ निर्मित', 'A visible journey from concern to change.': 'समस्या से बदलाव तक की स्पष्ट यात्रा।',
  'Submit': 'प्रस्तुत करें', 'Verify': 'सत्यापित करें', 'Match': 'मिलान करें', 'Research': 'शोध', 'Prototype': 'प्रोटोटाइप',
  'Pilot': 'पायलट', 'Scale': 'विस्तार', 'Measure': 'प्रभाव मापें', 'Evidence & location': 'साक्ष्य और स्थान',
  'Government review': 'सरकारी समीक्षा', 'Right expertise': 'उपयुक्त विशेषज्ञता', 'Student teams': 'विद्यार्थी टीमें',
  'Build & test': 'निर्माण और परीक्षण', 'Field deployment': 'क्षेत्र में क्रियान्वयन', 'Adoption': 'स्वीकृति', 'Impact report': 'प्रभाव रिपोर्ट',
  'districts': 'जिले', 'problem domains': 'समस्या क्षेत्र', 'partner communities': 'भागीदार समुदाय', 'shared mission': 'साझा लक्ष्य',
  'Start with a problem': 'समस्या से शुरुआत करें', 'Problems of the people. Solutions by the people.': 'लोगों की समस्याएँ। लोगों द्वारा समाधान।',
  'Citizen portal': 'नागरिक पोर्टल', 'Organisation portal': 'संगठन पोर्टल', 'Government dashboard': 'सरकारी डैशबोर्ड',
  'Secure access': 'सुरक्षित प्रवेश', 'Account created': 'खाता बन गया', 'Go to sign in': 'साइन इन पर जाएँ', 'Create account': 'खाता बनाएँ',
  'Welcome back.': 'पुनः स्वागत है।', 'Join the innovation network.': 'नवाचार नेटवर्क से जुड़ें।',
  'Sign in to manage challenges, teams and project progress.': 'चुनौतियों, टीमों और परियोजना प्रगति के प्रबंधन के लिए साइन इन करें।',
  'Create a verified profile to participate across Jharkhand.': 'झारखंड भर में भाग लेने के लिए सत्यापित प्रोफ़ाइल बनाएँ।',
  'Full name': 'पूरा नाम', 'Mobile number': 'मोबाइल नंबर', '(optional)': '(वैकल्पिक)', 'Email address': 'ईमेल पता', 'Password': 'पासवर्ड',
  'I am joining as': 'मैं इस रूप में जुड़ रहा/रही हूँ', 'Citizen / community member': 'नागरिक / समुदाय सदस्य',
  'University / organisation administrator': 'विश्वविद्यालय / संगठन प्रशासक', 'Innovation company / startup': 'नवाचार कंपनी / स्टार्टअप',
  'Organisation team member / researcher': 'संगठन टीम सदस्य / शोधकर्ता', 'Please wait…': 'कृपया प्रतीक्षा करें…',
  'Aadhaar is never required. Government-approved identity verification may be offered only where appropriate. By continuing, you agree to the portal terms and privacy policy.': 'आधार कभी अनिवार्य नहीं है। जहाँ उचित हो, केवल सरकार-अनुमोदित पहचान सत्यापन दिया जा सकता है। आगे बढ़कर आप पोर्टल की शर्तों और गोपनीयता नीति से सहमत होते हैं।',
  'Overview': 'अवलोकन', 'My Problems': 'मेरी समस्याएँ', 'Submit Problem': 'समस्या दर्ज करें', 'Help & support': 'सहायता',
  'Public website': 'सार्वजनिक वेबसाइट', 'Dashboard': 'डैशबोर्ड', 'Citizen workspace': 'नागरिक कार्यस्थल', 'Guest citizen': 'अतिथि नागरिक',
  'Local submissions only': 'केवल स्थानीय प्रस्तुतियाँ', 'Sign in to sync and track problems securely': 'समस्याओं को सुरक्षित रूप से सहेजने और ट्रैक करने के लिए साइन इन करें',
  'Guest submissions stay only on this device.': 'अतिथि प्रस्तुतियाँ केवल इस डिवाइस पर रहती हैं।', 'Your submissions': 'आपकी प्रस्तुतियाँ',
  'Track every community problem through verification and delivery.': 'हर सामुदायिक समस्या को सत्यापन से समाधान तक ट्रैक करें।',
  'Loading your problems…': 'आपकी समस्याएँ लोड हो रही हैं…', 'No problems': 'कोई समस्या नहीं', 'Citizen dashboard': 'नागरिक डैशबोर्ड',
  'Raise local concerns, follow their progress and see how your voice creates change.': 'स्थानीय समस्याएँ उठाएँ, उनकी प्रगति देखें और जानें कि आपकी आवाज़ बदलाव कैसे लाती है।',
  'Simple. Transparent. Accountable.': 'सरल। पारदर्शी। जवाबदेह।', 'Every submission has a visible journey.': 'हर प्रस्तुति की यात्रा स्पष्ट है।',
  'Total submitted': 'कुल प्रस्तुत', 'All your problems': 'आपकी सभी समस्याएँ', 'Active': 'सक्रिय', 'Currently being handled': 'वर्तमान में कार्य जारी',
  'Resolved': 'समाधान हुआ', 'Community outcomes': 'सामुदायिक परिणाम', 'Needs attention': 'ध्यान आवश्यक', 'Escalated problems': 'एस्केलेट की गई समस्याएँ',
  'Recent problems': 'हाल की समस्याएँ', 'Your latest submissions and their status': 'आपकी नवीनतम प्रस्तुतियाँ और स्थिति', 'View all': 'सभी देखें',
  'No submissions yet. Start with a problem you see around you.': 'अभी कोई प्रस्तुति नहीं। अपने आसपास दिखने वाली समस्या से शुरुआत करें।',
  'What happens next?': 'आगे क्या होगा?', 'Submit the local problem': 'स्थानीय समस्या प्रस्तुत करें', 'Official verification': 'आधिकारिक सत्यापन',
  'Assignment to the right team': 'उपयुक्त टीम को आवंटन', 'Track solution and impact': 'समाधान और प्रभाव ट्रैक करें',
  'Add location and useful evidence': 'स्थान और उपयोगी साक्ष्य जोड़ें', 'Updates appear here automatically': 'अपडेट यहाँ स्वतः दिखाई देंगे',
  'Organisation CRM': 'संगठन सीआरएम', 'Open Challenges': 'खुली चुनौतियाँ', 'Validated Challenges': 'सत्यापित चुनौतियाँ',
  'Problem Pipeline': 'समस्या पाइपलाइन', 'My Applications': 'मेरे आवेदन', 'Collaborations': 'सहयोग', 'CSR Funding': 'सीएसआर वित्तपोषण',
  'Technology Matching': 'तकनीकी मिलान', 'Solutions': 'समाधान', 'Teams': 'टीमें', 'University Profile': 'विश्वविद्यालय प्रोफ़ाइल',
  'Faculty Profile': 'संकाय प्रोफ़ाइल', 'Industry Profile': 'उद्योग प्रोफ़ाइल', 'Research Library': 'शोध पुस्तकालय', 'Help centre': 'सहायता केंद्र',
  'Settings': 'सेटिंग्स', 'Team member workspace': 'टीम सदस्य कार्यस्थल', 'Organisation administration': 'संगठन प्रशासन',
  'Innovation company': 'नवाचार कंपनी', 'University / HEI': 'विश्वविद्यालय / उच्च शिक्षण संस्थान', 'Research team': 'शोध टीम',
  'Organisation user': 'संगठन उपयोगकर्ता', 'Sign in required': 'साइन इन आवश्यक', 'Sign in to open your organisation workspace': 'संगठन कार्यस्थल खोलने के लिए साइन इन करें',
  'Problems are protected by role-based access.': 'समस्याएँ भूमिका-आधारित पहुँच से सुरक्षित हैं।',
  'Government administration': 'सरकारी प्रशासन', 'Workspace': 'कार्यस्थल', 'State Mission Cell': 'राज्य मिशन प्रकोष्ठ', 'Management': 'प्रबंधन',
  'Challenges': 'चुनौतियाँ', 'Projects': 'परियोजनाएँ', 'Solution evaluation': 'समाधान मूल्यांकन', 'Institutions': 'संस्थान',
  'Industry partners': 'उद्योग भागीदार', 'Analytics': 'विश्लेषण', 'System': 'प्रणाली', 'Notifications': 'सूचनाएँ',
  'Need assistance?': 'सहायता चाहिए?', 'View admin handbook': 'प्रशासन पुस्तिका देखें', 'State Administrator': 'राज्य प्रशासक',
  'All systems operational': 'सभी प्रणालियाँ चालू हैं', 'State mission control': 'राज्य मिशन नियंत्रण',
  'Here is what needs attention across Jharkhand today.': 'आज झारखंड में इन विषयों पर ध्यान आवश्यक है।', 'Export report': 'रिपोर्ट निर्यात करें',
  'Review challenges': 'चुनौतियों की समीक्षा करें', 'Total challenges': 'कुल चुनौतियाँ', 'Active projects': 'सक्रिय परियोजनाएँ',
  'Institutions engaged': 'जुड़े संस्थान', 'Industry partnerships': 'उद्योग भागीदारी', 'Challenge submissions': 'चुनौती प्रस्तुतियाँ',
  'Challenges by domain': 'क्षेत्र के अनुसार चुनौतियाँ', 'Total': 'कुल', 'Challenges requiring attention': 'ध्यान माँगने वाली चुनौतियाँ',
  'Challenge': 'चुनौती', 'Domain': 'क्षेत्र', 'District': 'जिला', 'Priority': 'प्राथमिकता', 'Status': 'स्थिति', 'Received': 'प्राप्त',
  'Project delivery health': 'परियोजना प्रगति स्थिति', 'District participation': 'जिला सहभागिता', 'Innovation outcomes': 'नवाचार परिणाम',
  'Recent activity': 'हाल की गतिविधि', 'Solutions deployed': 'लागू समाधान', 'Patents filed': 'दायर पेटेंट', 'Startups created': 'निर्मित स्टार्टअप',
  'Citizens impacted': 'प्रभावित नागरिक', 'Search challenges, projects or institutions…': 'चुनौतियाँ, परियोजनाएँ या संस्थान खोजें…',
  'Your full name': 'आपका पूरा नाम', '10-digit mobile number': '10 अंकों का मोबाइल नंबर', 'Your password': 'आपका पासवर्ड',
  'At least 8 characters': 'कम से कम 8 अक्षर', 'Close authentication': 'प्रवेश विंडो बंद करें', 'Hide password': 'पासवर्ड छिपाएँ', 'Show password': 'पासवर्ड दिखाएँ',
}

const reverseHindi = Object.fromEntries(Object.entries(hindi).map(([english, translation]) => [translation, english]))

function translateValue(value, language) {
  if (!value || !value.trim()) return value
  const leading = value.match(/^\s*/)?.[0] || ''
  const trailing = value.match(/\s*$/)?.[0] || ''
  const core = value.trim()
  const translated = language === 'hi' ? hindi[core] : reverseHindi[core]
  return translated ? `${leading}${translated}${trailing}` : value
}

function translateTree(root, language) {
  if (!root) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node
  while ((node = walker.nextNode())) {
    const parent = node.parentElement
    if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName) || parent.closest('[data-no-translate]')) continue
    const translated = translateValue(node.nodeValue, language)
    if (translated !== node.nodeValue) node.nodeValue = translated
  }
  root.querySelectorAll?.('[placeholder], [title], [aria-label]').forEach(element => {
    for (const attribute of ['placeholder', 'title', 'aria-label']) {
      if (element.hasAttribute(attribute)) {
        const current = element.getAttribute(attribute)
        const translated = translateValue(current, language)
        if (translated !== current) element.setAttribute(attribute, translated)
      }
    }
  })
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem(storageKey) || 'en')
  useEffect(() => {
    localStorage.setItem(storageKey, language)
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en'
    translateTree(document.body, language)
    const observer = new MutationObserver(mutations => mutations.forEach(mutation => {
      if (mutation.type === 'characterData') translateTree(mutation.target.parentElement, language)
      mutation.addedNodes.forEach(node => translateTree(node.nodeType === Node.TEXT_NODE ? node.parentElement : node, language))
    }))
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [language])
  const value = useMemo(() => ({ language, setLanguage, toggleLanguage: () => setLanguage(value => value === 'en' ? 'hi' : 'en') }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// The hook intentionally shares this module with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  return useContext(LanguageContext)
}
