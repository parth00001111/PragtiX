import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, Building2, ChevronLeft, ChevronRight, CircleUserRound, Factory, FileText, GraduationCap, HandCoins, Languages, Menu, Network, ShieldCheck, Sparkles, Target, Upload, Users, X } from 'lucide-react'
import leadershipPoster from '../assets/landing-innovation-leadership.png'
import cmPoster from '../assets/cm-jharkhand-innovation-hero.png'
import communityPoster from '../assets/jharkhand-innovation-hero.png'
import samadhanSetuLogo from '../assets/samadhan-setu-logo.png'
import { useLanguage } from '../i18n/LanguageContext'
import './InnovationLanding.css'

const slides=[
  [cmPoster,'Innovation for every district','Universities and students solving Jharkhand’s real challenges.','A state-wide platform for demand-driven research and opportunity.','Explore open challenges','/organization/challenges'],
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

export default function InnovationLanding({user,onNavigate,onSignIn,onLogout}){
  const {language,toggleLanguage}=useLanguage()
  const [slide,setSlide]=useState(0)
  const [menuOpen,setMenuOpen]=useState(false)
  useEffect(()=>{const timer=setInterval(()=>setSlide(value=>(value+1)%slides.length),7000);return()=>clearInterval(timer)},[])
  const [image,eyebrow,title,text,action,target]=slides[slide]
  const workspace=user?.role==='CITIZEN'?'/citizen':user?.role==='ADMIN'?'/admin':'/organization'
  const move=direction=>setSlide(value=>(value+direction+slides.length)%slides.length)
  const openTarget=()=>target.startsWith('#')?document.querySelector(target)?.scrollIntoView({behavior:'smooth'}):onNavigate(target)
  return <div className="innovation-home">
    <div className="innovation-top"><div className="innovation-wrap"><span>Government of Jharkhand · Societal Innovation Initiative</span><div><button data-no-translate onClick={toggleLanguage}><Languages/> {language==='en'?'हिन्दी':'English'}</button><span>Helpline · 1800-XXX-XXXX</span></div></div></div>
    <header className="innovation-nav"><div className="innovation-wrap"><button className="innovation-brand" onClick={()=>onNavigate('/')} aria-label="SamadhanSetu home"><img src={samadhanSetuLogo} alt="SamadhanSetu"/></button><nav className={menuOpen?'open':''}><a href="#about">The challenge</a><a href="#ecosystem">Ecosystem</a><a href="#platform">Platform</a><a href="#workflow">How it works</a>{user?<><button className="workspace-button" onClick={()=>onNavigate(workspace)}>Dashboard</button><button className="login-button" onClick={onLogout}><CircleUserRound/>{user.name}</button></>:<button className="login-button" onClick={onSignIn}><CircleUserRound/>Sign in</button>}</nav><button className="innovation-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen?<X/>:<Menu/>}</button></div></header>
    <main>
      <section className={`poster-slider slide-${slide}`}><img key={image} src={image} alt="Jharkhand societal innovation campaign illustration"/><div className="poster-shade"/><div className="innovation-wrap slide-content"><span>{eyebrow}</span><h1>{title}</h1><p>{text}</p><div><button onClick={openTarget}>{action}<ArrowRight/></button><button onClick={()=>onNavigate('/citizen/submit')}>Share a challenge</button></div></div><button className="slide-arrow previous" onClick={()=>move(-1)} aria-label="Previous poster"><ChevronLeft/></button><button className="slide-arrow next" onClick={()=>move(1)} aria-label="Next poster"><ChevronRight/></button><div className="slide-dots">{slides.map((item,index)=><button key={item[0]} className={index===slide?'active':''} onClick={()=>setSlide(index)} aria-label={`Show poster ${index+1}`}/>)}</div><small className="ai-label">AI-generated illustrative campaign artwork</small></section>
      <section className="action-dock"><div className="innovation-wrap"><Dock icon={FileText} title="Submit a problem" note="Citizen or guest" onClick={()=>onNavigate('/citizen/submit')}/><Dock icon={GraduationCap} title="Solve a challenge" note="Students & universities" onClick={()=>onNavigate('/organization/challenges')}/><Dock icon={HandCoins} title="Fund a project" note="CSR partners" onClick={()=>onNavigate('/organization/csr-funding')}/><Dock icon={CircleUserRound} title={user?'My workspace':'Sign in'} note="Track your work" onClick={()=>user?onNavigate(workspace):onSignIn()}/></div></section>
      <section className="innovation-section problem-story" id="about"><div className="innovation-wrap story-layout"><div><span className="section-tag">THE OPPORTUNITY</span><h2>Jharkhand’s hardest problems can become its most meaningful learning opportunities.</h2></div><div><p>Communities understand the problems around them. Universities hold research capability and young talent. Industry has technology, capital and implementation experience. SamadhanSetu brings these strengths into one accountable system.</p><div className="story-proof"><ShieldCheck/><span><strong>Built for action, not just reporting</strong><small>Every verified problem moves toward a team, project, pilot and measurable outcome.</small></span></div></div></div></section>
      <section className="innovation-section ecosystem" id="ecosystem"><div className="innovation-wrap"><SectionHead label="ONE SHARED ECOSYSTEM" title="A useful role for everyone." text="Each participant gets a focused workspace while working toward the same public outcome."/><div className="partner-grid">{partners.map(([Icon,name,description,route])=><button key={name} onClick={()=>onNavigate(route)}><span><Icon/></span><h3>{name}</h3><p>{description}</p><b>Enter workspace <ArrowRight/></b></button>)}</div><div className="ecosystem-equation"><Network/><span>Community problem</span><i>+</i><span>Research talent</span><i>+</i><span>Technology & funding</span><strong>→</strong><span>Public impact</span></div></div></section>
      <section className="innovation-section platform" id="platform"><div className="innovation-wrap"><SectionHead label="ONE CONNECTED PLATFORM" title="Everything needed to move from problem to solution." text="Designed around the complete lifecycle—not disconnected forms and dashboards."/><div className="capability-grid">{capabilities.map(([Icon,name,description],index)=><article key={name}><b>0{index+1}</b><span><Icon/></span><h3>{name}</h3><p>{description}</p></article>)}</div></div></section>
      <section className="innovation-section workflow" id="workflow"><div className="innovation-wrap"><SectionHead label="TRANSPARENT BY DESIGN" title="A visible journey from concern to change."/><div className="workflow-track">{[['Submit','Evidence & location'],['Verify','Government review'],['Match','Right expertise'],['Research','Student teams'],['Prototype','Build & test'],['Pilot','Field deployment'],['Scale','Adoption'],['Measure','Impact report']].map(([name,note],index)=><div key={name}><b>{index+1}</b><i/><strong>{name}</strong><span>{note}</span></div>)}</div></div></section>
      <section className="outcome-strip"><div className="innovation-wrap"><div><strong>24</strong><span>districts</span></div><div><strong>25</strong><span>problem domains</span></div><div><strong>4</strong><span>partner communities</span></div><div><strong>1</strong><span>shared mission</span></div><button onClick={()=>onNavigate('/citizen/submit')}>Start with a problem <ArrowRight/></button></div></section>
    </main>
    <footer className="innovation-footer"><div className="innovation-wrap"><div className="innovation-footer-brand"><img src={samadhanSetuLogo} alt="SamadhanSetu"/><small>Problems of the people. Solutions by the people.</small></div><nav><button onClick={()=>onNavigate('/citizen')}>Citizen portal</button><button onClick={()=>onNavigate('/organization')}>Organisation portal</button><button onClick={()=>onNavigate('/admin')}>Government dashboard</button></nav><small>© 2026 Government of Jharkhand · Privacy · Accessibility · Help</small></div></footer>
  </div>
}
function Dock({icon:Icon,title,note,onClick}){return <button onClick={onClick}><span><Icon/></span><div><strong>{title}</strong><small>{note}</small></div><ArrowRight/></button>}
function SectionHead({label,title,text}){return <div className="section-head"><span>{label}</span><h2>{title}</h2>{text&&<p>{text}</p>}</div>}
