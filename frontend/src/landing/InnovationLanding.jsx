import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, Building2, ChevronLeft, ChevronRight, CircleUserRound, ExternalLink, Factory, FileText, GraduationCap, HandCoins, Languages, Mail, MapPin, Menu, Network, Phone, ShieldCheck, Sparkles, Target, Upload, Users, X } from 'lucide-react'
import leadershipPoster from '../assets/landing-innovation-leadership.png'
import cmPoster from '../assets/cm-jharkhand-innovation-hero.png'
import communityPoster from '../assets/jharkhand-innovation-hero.png'
import samadhanSetuLogo from '../assets/samadhan-setu-logo.png'
import { useLanguage } from '../i18n/LanguageContext'
import './InnovationLanding.css'

const slides=[
  [cmPoster,'Innovation for every district','Universities and students solving Jharkhand’s real challenges.','A state-wide platform for demand-driven research and opportunity.','Explore open challenges','/challenges'],
  [leadershipPoster,'People-powered public innovation','A local problem can inspire change across the state.','Citizens share evidence. Universities research. Industry enables. Government helps solutions scale.','Submit a problem','/citizen/submit'],
  [communityPoster,'From concern to measurable impact','Community knowledge meets institutional capability.','Structured workflows turn real needs into research, prototypes, pilots and deployable solutions.','See how it works','#workflow'],
]
const capabilities=[
  [Upload,'Citizen engagement','Evidence, multimedia and location-based submissions.'],
  [Sparkles,'AI problem management','Classification, priority, duplicates and intelligent routing.'],
  [GraduationCap,'University collaboration','Teams, mentors, research and solution proposals.'],
  [Factory,'Industry partnership','Technology, mentorship, funding and deployment.'],
  [Target,'Project lifecycle','Milestones, approvals, testing, IP and implementation.'],
  [BarChart3,'Visual analytics','Real-time district, domain and impact intelligence.'],
]
const partners=[
  [Users,'Citizens','Share lived problems and validate outcomes.','/citizen/submit'],
  [GraduationCap,'Universities & students','Research and build through experiential learning.','/organization/challenges'],
  [Factory,'Industry & startups','Contribute proven technology and capability.','/organization/technology-matching'],
  [HandCoins,'CSR partners','Fund transparent milestone-based projects.','/organization/csr-funding'],
  [Building2,'Government','Verify, evaluate and monitor public impact.','/admin'],
]
const districtInsights=[
  ['Ranchi',142,38,12,'Urban Infrastructure'],['East Singhbhum',119,31,9,'Environment'],['Dhanbad',104,27,7,'Mining-area Development'],['West Singhbhum',91,22,6,'Tribal Development'],
  ['Dumka',78,19,5,'Rural Development'],['Bokaro',74,20,6,'Skill Development'],['Hazaribagh',69,18,4,'Agriculture'],['Giridih',64,15,4,'Water Management'],
  ['Palamu',61,14,3,'Water Management'],['Deoghar',58,16,5,'Tourism'],['Godda',53,12,3,'Energy'],['Sahebganj',51,11,3,'Healthcare'],
  ['Khunti',48,14,4,'Agriculture'],['Gumla',46,12,3,'Livelihood'],['Latehar',43,10,3,'Healthcare'],['Ramgarh',41,11,3,'Environment'],
  ['Jamtara',38,9,2,'Digital Governance'],['Pakur',36,8,2,'Water Management'],['Lohardaga',34,9,2,'Tribal Development'],['Simdega',31,8,2,'Transportation'],
  ['Koderma',29,7,2,'Public Safety'],['Garhwa',27,6,1,'Food Security'],['Chatra',25,6,1,'Agriculture'],['Seraikela-Kharsawan',23,7,2,'Urban Infrastructure'],
]
const domainInsights=[['Agriculture',248,82],['Water Management',211,70],['Healthcare',184,61],['Education',169,56],['Sanitation',142,47],['Rural Livelihoods',126,42],['Environment',113,37],['Urban Infrastructure',96,32]]

export default function InnovationLanding({user,onNavigate,onSignIn,onLogout}){
  const {language,toggleLanguage}=useLanguage()
  const [slide,setSlide]=useState(0)
  const [menuOpen,setMenuOpen]=useState(false)
  const [selectedDistrict,setSelectedDistrict]=useState('Ranchi')
  useEffect(()=>{const timer=setInterval(()=>setSlide(value=>(value+1)%slides.length),7000);return()=>clearInterval(timer)},[])
  const [image,eyebrow,title,text,action,target]=slides[slide]
  const workspace=user?.role==='CITIZEN'?'/citizen':user?.role==='ADMIN'?'/admin':'/organization'
  const move=direction=>setSlide(value=>(value+direction+slides.length)%slides.length)
  const openTarget=()=>target.startsWith('#')?document.querySelector(target)?.scrollIntoView({behavior:'smooth'}):onNavigate(target)
  return <div className="innovation-home">
    <div className="innovation-top"><div className="innovation-wrap"><span>Government of Jharkhand · Societal Innovation Initiative</span><div><button data-no-translate onClick={toggleLanguage}><Languages/> {language==='en'?'हिन्दी':'English'}</button><span>Helpline · 1800-XXX-XXXX</span></div></div></div>
    <header className="innovation-nav"><div className="innovation-wrap"><button className="innovation-brand" onClick={()=>onNavigate('/')} aria-label="SamadhanSetu home"><img src={samadhanSetuLogo} alt="SamadhanSetu"/></button><nav className={menuOpen?'open':''}><button className="nav-challenges" onClick={()=>onNavigate('/challenges')}>Challenges</button><a href="#glance">Jharkhand at a Glance</a><a href="#ecosystem">Ecosystem</a><a href="#platform">Platform</a><a href="#workflow">How it works</a>{user?<><button className="workspace-button" onClick={()=>onNavigate(workspace)}>Dashboard</button><button className="login-button" onClick={onLogout}><CircleUserRound/>{user.name}</button></>:<button className="login-button" onClick={onSignIn}><CircleUserRound/>Sign in</button>}</nav><button className="innovation-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen?<X/>:<Menu/>}</button></div></header>
    <main>
      <section className={`poster-slider slide-${slide}`}><img key={image} src={image} alt="Jharkhand societal innovation campaign illustration"/><div className="poster-shade"/><div className="innovation-wrap slide-content"><span>{eyebrow}</span><h1>{title}</h1><p>{text}</p><div><button onClick={openTarget}>{action}<ArrowRight/></button><button onClick={()=>onNavigate('/citizen/submit')}>Share a challenge</button></div></div><button className="slide-arrow previous" onClick={()=>move(-1)} aria-label="Previous poster"><ChevronLeft/></button><button className="slide-arrow next" onClick={()=>move(1)} aria-label="Next poster"><ChevronRight/></button><div className="slide-dots">{slides.map((item,index)=><button key={item[0]} className={index===slide?'active':''} onClick={()=>setSlide(index)} aria-label={`Show poster ${index+1}`}/>)}</div><small className="ai-label">AI-generated illustrative campaign artwork</small></section>
      <section className="action-dock"><div className="innovation-wrap"><Dock icon={FileText} title="Submit a problem" note="Citizen or guest" onClick={()=>onNavigate('/citizen/submit')}/><Dock icon={GraduationCap} title="Solve a challenge" note="Open to everyone" onClick={()=>onNavigate('/challenges')}/><Dock icon={HandCoins} title="Fund a project" note="CSR partners" onClick={()=>onNavigate('/organization/csr-funding')}/><Dock icon={CircleUserRound} title={user?'My workspace':'Sign in'} note="Track your work" onClick={()=>user?onNavigate(workspace):onSignIn()}/></div></section>
      <AtGlance selectedDistrict={selectedDistrict} setSelectedDistrict={setSelectedDistrict} onNavigate={onNavigate}/>
      <section className="innovation-section problem-story" id="about"><div className="innovation-wrap story-layout"><div><span className="section-tag">THE OPPORTUNITY</span><h2>Jharkhand’s hardest problems can become its most meaningful learning opportunities.</h2></div><div><p>Communities understand the problems around them. Universities hold research capability and young talent. Industry has technology, capital and implementation experience. SamadhanSetu brings these strengths into one accountable system.</p><div className="story-proof"><ShieldCheck/><span><strong>Built for action, not just reporting</strong><small>Every verified problem moves toward a team, project, pilot and measurable outcome.</small></span></div></div></div></section>
      <section className="innovation-section ecosystem" id="ecosystem"><div className="innovation-wrap"><SectionHead label="ONE SHARED ECOSYSTEM" title="A useful role for everyone." text="Each participant gets a focused workspace while working toward the same public outcome."/><div className="partner-grid">{partners.map(([Icon,name,description,route])=><button key={name} onClick={()=>onNavigate(route)}><span><Icon/></span><h3>{name}</h3><p>{description}</p><b>Enter workspace <ArrowRight/></b></button>)}</div><div className="ecosystem-equation"><Network/><span>Community problem</span><i>+</i><span>Research talent</span><i>+</i><span>Technology & funding</span><strong>→</strong><span>Public impact</span></div></div></section>
      <section className="innovation-section platform" id="platform"><div className="innovation-wrap"><SectionHead label="ONE CONNECTED PLATFORM" title="Everything needed to move from problem to solution." text="Designed around the complete lifecycle—not disconnected forms and dashboards."/><div className="capability-grid">{capabilities.map(([Icon,name,description],index)=><article key={name}><b>0{index+1}</b><span><Icon/></span><h3>{name}</h3><p>{description}</p></article>)}</div></div></section>
      <section className="innovation-section workflow" id="workflow"><div className="innovation-wrap"><SectionHead label="TRANSPARENT BY DESIGN" title="A visible journey from concern to change."/><div className="workflow-track">{[['Submit','Evidence & location'],['Verify','Government review'],['Match','Right expertise'],['Research','Student teams'],['Prototype','Build & test'],['Pilot','Field deployment'],['Scale','Adoption'],['Measure','Impact report']].map(([name,note],index)=><div key={name}><b>{index+1}</b><i/><strong>{name}</strong><span>{note}</span></div>)}</div></div></section>
      <section className="outcome-strip"><div className="innovation-wrap"><div><strong>24</strong><span>districts</span></div><div><strong>25</strong><span>problem domains</span></div><div><strong>4</strong><span>partner communities</span></div><div><strong>1</strong><span>shared mission</span></div><button onClick={()=>onNavigate('/citizen/submit')}>Start with a problem <ArrowRight/></button></div></section>
    </main>
    <footer className="innovation-footer">
      <div className="innovation-wrap footer-main">
        <div className="innovation-footer-brand"><img src={samadhanSetuLogo} alt="SamadhanSetu"/><p>An initiative connecting community challenges with research, innovation, funding and implementation capability across Jharkhand.</p><small>Department of Higher and Technical Education, Government of Jharkhand</small></div>
        <div className="footer-column"><h3>Quick Links</h3><a href="#about">About the initiative</a><a href="#workflow">How it works</a><a href="#platform">Accessibility statement</a><a href="#about">Frequently asked questions</a><a href="#about">Privacy policy</a><a href="#about">Terms and conditions</a></div>
        <div className="footer-column"><h3>Portal Access</h3><button onClick={()=>onNavigate('/citizen/submit')}>Submit a problem</button><button onClick={()=>onNavigate('/citizen')}>Citizen portal</button><button onClick={()=>onNavigate('/challenges')}>Open Challenges</button><button onClick={()=>onNavigate('/organization')}>Organisation portal</button><button onClick={()=>onNavigate('/admin')}>Government dashboard</button></div>
        <div className="footer-column footer-contact"><h3>Get in touch</h3><p><MapPin/> Ranchi, Jharkhand, India</p><a href="mailto:support@samadhansetu.jh.gov.in"><Mail/> support@samadhansetu.jh.gov.in</a><a href="tel:18000000000"><Phone/> 1800-XXX-XXXX</a><small>Monday–Friday · 9:30 AM–6:00 PM</small></div>
      </div>
      <div className="footer-government"><div className="innovation-wrap"><h3>Government Links</h3><div>{[['Jharkhand Government','https://www.jharkhand.gov.in/'],['National Portal of India','https://www.india.gov.in/'],['Digital India','https://www.digitalindia.gov.in/'],['MyGov','https://www.mygov.in/'],['Open Government Data','https://www.data.gov.in/'],['DigiLocker','https://www.digilocker.gov.in/'],['UMANG','https://web.umang.gov.in/']].map(([name,url])=><a key={name} href={url} target="_blank" rel="noreferrer">{name}<ExternalLink/></a>)}</div></div></div>
      <div className="footer-bottom"><div className="innovation-wrap"><span>© 2026 Government of Jharkhand. All rights reserved.</span><span>Last updated: 13 September 2026</span></div></div>
    </footer>
  </div>
}
function AtGlance({selectedDistrict,setSelectedDistrict,onNavigate}){
  const district=districtInsights.find(item=>item[0]===selectedDistrict) || districtInsights[0]
  return <section className="innovation-section state-glance" id="glance"><div className="innovation-wrap">
    <div className="glance-heading"><div><span className="section-tag">DISTRICT INNOVATION VIEW</span><h2>Jharkhand at a Glance</h2><p>Explore community challenges, active solution projects and priority domains across all 24 districts.</p></div><span className="snapshot-note"><i/> Platform snapshot · illustrative data</span></div>
    <div className="glance-metrics"><article><strong>24</strong><span>Districts connected</span></article><article><strong>1,365</strong><span>Problems submitted</span></article><article><strong>342</strong><span>Active solution projects</span></article><article><strong>94</strong><span>Pilots in the field</span></article></div>
    <div className="glance-layout">
      <div className="district-explorer"><div className="district-feature"><div className="district-feature-head"><span><MapPin/> Selected district</span><b>{district[0]}</b></div><div className="district-numbers"><div><strong>{district[1]}</strong><small>Total problems</small></div><div><strong>{district[2]}</strong><small>Active projects</small></div><div><strong>{district[3]}</strong><small>Field pilots</small></div></div><div className="district-focus"><span>Leading problem domain</span><strong>{district[4]}</strong></div><button onClick={()=>onNavigate('/challenges')}>View district challenges <ArrowRight/></button></div>
        <div className="district-selector"><div><strong>District Profiles</strong><small>Select a district to view its innovation snapshot</small></div><div>{districtInsights.map(([name])=><button key={name} className={selectedDistrict===name?'active':''} onClick={()=>setSelectedDistrict(name)}>{name}</button>)}</div></div>
      </div>
      <div className="domain-overview"><div className="domain-overview-head"><div><span>STATEWIDE VIEW</span><h3>Problems by domain</h3></div><BarChart3/></div><div className="domain-bars">{domainInsights.map(([name,count,width])=><div key={name}><div><span>{name}</span><strong>{count}</strong></div><i><b style={{width:`${width}%`}}/></i></div>)}</div><button onClick={()=>onNavigate('/challenges')}>Explore all 25 problem domains <ArrowRight/></button></div>
    </div>
  </div></section>
}
function Dock({icon:Icon,title,note,onClick}){return <button onClick={onClick}><span><Icon/></span><div><strong>{title}</strong><small>{note}</small></div><ArrowRight/></button>}
function SectionHead({label,title,text}){return <div className="section-head"><span>{label}</span><h2>{title}</h2>{text&&<p>{text}</p>}</div>}
