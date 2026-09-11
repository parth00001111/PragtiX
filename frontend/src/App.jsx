import { useEffect, useState } from 'react'
import {
  ArrowRight, Bell, Building2, CheckCircle2, CircleUserRound,
  Factory, FileText, GraduationCap, Handshake, Languages, Lightbulb,
  MapPin, Menu, Search, ShieldCheck, Sparkles, Target, Upload, Users, X,
} from 'lucide-react'
import heroImage from './assets/jharkhand-innovation-hero.png'
import AuthModal from './components/AuthModal'
import { authApi } from './lib/authApi'
import './App.css'

const themes = [
  ['Agriculture', 'Sustainable farming & livelihoods', '28%'],
  ['Water & sanitation', 'Access, quality & management', '22%'],
  ['Healthcare', 'Community health & accessibility', '18%'],
  ['Education', 'Learning access & outcomes', '15%'],
  ['Environment', 'Forests, energy & resilience', '10%'],
  ['Urban development', 'Mobility & public services', '7%'],
]

const workflow = [
  { icon: Upload, n: '01', title: 'Share the challenge', text: 'Citizens and local bodies submit evidence, location and community context.' },
  { icon: Sparkles, n: '02', title: 'AI-assisted review', text: 'The platform classifies, checks duplicates and prioritises verified needs.' },
  { icon: GraduationCap, n: '03', title: 'Experts collaborate', text: 'Universities form teams while industry enables mentoring and prototyping.' },
  { icon: Target, n: '04', title: 'Impact is delivered', text: 'Pilots are tested, validated with communities and tracked to implementation.' },
]

const roles = {
  Citizens: { icon: Users, title: 'Your lived experience can inspire the next solution.', points: ['Submit a challenge in minutes', 'Track progress transparently', 'Validate solutions in your community'], cta: 'Raise a challenge' },
  Universities: { icon: GraduationCap, title: 'Turn academic capability into measurable field impact.', points: ['Discover validated research problems', 'Build multidisciplinary teams', 'Manage milestones and outcomes'], cta: 'Register your institution' },
  Industry: { icon: Factory, title: 'Back high-potential ideas from prototype to scale.', points: ['Mentor and co-develop projects', 'Fund pilots through CSR and grants', 'Enable technology transfer'], cta: 'Become a partner' },
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeRole, setActiveRole] = useState('Citizens')
  const [lang, setLang] = useState('EN')
  const [showSubmission, setShowSubmission] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [user, setUser] = useState(null)
  const role = roles[activeRole]
  const RoleIcon = role.icon

  useEffect(() => {
    authApi.me().then(({ user: currentUser }) => setUser(currentUser)).catch(() => {})
  }, [])

  const logout = async () => {
    try { await authApi.logout() } finally { setUser(null) }
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <div className="site-shell">
      <div className="utility-bar">
        <div className="container utility-inner">
          <span>Government of Jharkhand initiative</span>
          <div><button className="text-button" onClick={() => setLang(lang === 'EN' ? 'हि' : 'EN')}><Languages size={14} /> {lang === 'EN' ? 'English' : 'हिन्दी'}</button><span className="divider" /> <span>Citizen helpline · 1800-XXX-XXXX</span></div>
        </div>
      </div>

      <header className="navbar">
        <div className="container nav-inner">
          <button className="brand" onClick={() => scrollTo('home')} aria-label="PragatiX home">
            <span className="brand-mark"><Lightbulb size={23} strokeWidth={1.8} /></span>
            <span><strong>Pragati<span>X</span></strong><small>Societal Innovation Portal</small></span>
          </button>
          <nav className={menuOpen ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
            <button onClick={() => scrollTo('how-it-works')}>How it works</button>
            <button onClick={() => scrollTo('ecosystem')}>Ecosystem</button>
            <button onClick={() => scrollTo('impact')}>Impact</button>
            <button onClick={() => scrollTo('about')}>About</button>
            {user ? <button className="nav-login" onClick={logout} title="Sign out"><CircleUserRound size={17} /> {user.name}</button> : <button className="nav-login" onClick={() => setShowAuth(true)}><CircleUserRound size={17} /> Sign in</button>}
            <button className="primary small" onClick={() => scrollTo('submit')}>Submit a challenge <ArrowRight size={16} /></button>
          </nav>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main>
        <section className="hero-section" id="home">
          <img className="hero-image" src={heroImage} alt="A student and community member testing a water-quality sensor in rural Jharkhand" />
          <div className="hero-overlay" />
          <div className="container hero-content">
            <div className="eyebrow light"><MapPin size={15} /> Innovation rooted in Jharkhand</div>
            <h1>Local challenges.<br /><em>Collective solutions.</em></h1>
            <p>One trusted platform connecting citizens, universities and industry to turn Jharkhand’s most pressing needs into deployable solutions.</p>
            <div className="hero-actions">
              <button className="primary hero-cta" onClick={() => setShowSubmission(true)}>Submit a challenge <ArrowRight size={18} /></button>
              <button className="secondary hero-secondary" onClick={() => scrollTo('how-it-works')}>See how it works</button>
            </div>
            <div className="trust-row"><ShieldCheck size={19} /><span>Transparent review</span><span>•</span><span>District-level tracking</span><span>•</span><span>Community-validated impact</span></div>
          </div>
        </section>

        <section className="stats-strip" aria-label="Platform highlights">
          <div className="container stats-grid">
            <div><strong>24</strong><span>Districts connected</span></div>
            <div><strong>40+</strong><span>Higher education institutions</span></div>
            <div><strong>10</strong><span>Priority development sectors</span></div>
            <div><strong>1</strong><span>Shared innovation ecosystem</span></div>
          </div>
        </section>

        <section className="section workflow-section" id="how-it-works">
          <div className="container">
            <div className="section-heading split-heading">
              <div><span className="eyebrow">From concern to change</span><h2>A clear path from community need to real-world impact.</h2></div>
              <p>Every challenge follows a transparent, accountable process—so participants always know what happens next.</p>
            </div>
            <div className="workflow-grid">
              {workflow.map(({ icon: Icon, n, title, text }, i) => <div className="workflow-step" key={title}>
                <div className="step-top"><span className="step-icon"><Icon size={22} /></span><span className="step-number">{n}</span></div>
                <h3>{title}</h3><p>{text}</p>{i < workflow.length - 1 && <ArrowRight className="step-arrow" size={20} />}
              </div>)}
            </div>
          </div>
        </section>

        <section className="section ecosystem-section" id="ecosystem">
          <div className="container ecosystem-layout">
            <div className="ecosystem-copy">
              <span className="eyebrow">One mission, many contributors</span>
              <h2>Built for every partner in the innovation journey.</h2>
              <p>PragatiX gives each stakeholder the right tools, while keeping the community’s challenge at the centre.</p>
              <div className="role-tabs" role="tablist">
                {Object.keys(roles).map(name => <button key={name} className={activeRole === name ? 'active' : ''} onClick={() => setActiveRole(name)} role="tab">{name}</button>)}
              </div>
              <div className="role-content">
                <RoleIcon size={30} />
                <h3>{role.title}</h3>
                <ul>{role.points.map(point => <li key={point}><CheckCircle2 size={17} />{point}</li>)}</ul>
                <button className="link-button" onClick={() => scrollTo('submit')}>{role.cta} <ArrowRight size={17} /></button>
              </div>
            </div>
            <div className="network-visual" aria-label="PragatiX collaboration network">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <div className="network-node center"><span className="brand-mark"><Lightbulb size={26} /></span><strong>PragatiX</strong><small>Shared mission</small></div>
              <div className="network-node citizen"><Users /><span>Community</span></div>
              <div className="network-node university"><GraduationCap /><span>Universities</span></div>
              <div className="network-node industry"><Factory /><span>Industry</span></div>
              <div className="network-node government"><Building2 /><span>Government</span></div>
            </div>
          </div>
        </section>

        <section className="section themes-section" id="impact">
          <div className="container">
            <div className="section-heading split-heading"><div><span className="eyebrow">Where innovation matters</span><h2>Challenges across every dimension of life.</h2></div><p>AI-enabled classification connects each submission with the right expertise, facility and institutional capacity.</p></div>
            <div className="themes-layout">
              <div className="theme-list">{themes.map(([name, detail, value]) => <div className="theme-row" key={name}><div><strong>{name}</strong><span>{detail}</span></div><div className="theme-meter"><i style={{ width: value }} /></div><b>{value}</b></div>)}</div>
              <aside className="insight-panel">
                <span className="panel-label"><Sparkles size={15} /> Live insight</span>
                <h3>Water access is the leading community concern this quarter.</h3>
                <p>AI pattern analysis helps identify clusters, repeated problems and opportunities for solutions that can scale across districts.</p>
                <button className="link-button" onClick={() => window.alert('The public impact dashboard is being connected for the hackathon demo.')}>Explore public dashboard <ArrowRight size={17} /></button>
              </aside>
            </div>
          </div>
        </section>

        <section className="section submit-section" id="submit">
          <div className="container submit-panel">
            <div>
              <span className="eyebrow light">Start with what you see</span>
              <h2>Your local challenge could become Jharkhand’s next breakthrough.</h2>
              <p>Tell us what is happening, where it is happening, and who it affects. You can add photos, videos and documents.</p>
            </div>
            <div className="submit-actions"><button className="primary cream" onClick={() => setShowSubmission(true)}>Submit your challenge <ArrowRight size={18} /></button><span><FileText size={16} /> Takes about 5 minutes</span></div>
          </div>
        </section>

        <section className="section governance-section" id="about">
          <div className="container governance-grid">
            <div><span className="eyebrow">Designed for public trust</span><h2>Transparent by design.<br />Measurable by default.</h2></div>
            <div className="governance-points">
              <div><ShieldCheck /><span><strong>Verified workflow</strong><small>Clear ownership, approvals and audit trails.</small></span></div>
              <div><Bell /><span><strong>Timely communication</strong><small>Updates for every stakeholder at each stage.</small></span></div>
              <div><Search /><span><strong>Open progress tracking</strong><small>District, sector and institution-level visibility.</small></span></div>
              <div><Handshake /><span><strong>Responsible collaboration</strong><small>Defined roles, IP records and validation.</small></span></div>
            </div>
          </div>
        </section>
      </main>

      {showSubmission && <div className="modal-backdrop" onMouseDown={() => setShowSubmission(false)}>
        <div className="submission-modal" role="dialog" aria-modal="true" aria-labelledby="submission-title" onMouseDown={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowSubmission(false)} aria-label="Close submission form"><X /></button>
          {!submitted ? <>
            <span className="eyebrow">Community challenge</span>
            <h2 id="submission-title">Tell us what needs attention.</h2>
            <p>Start with the essentials. Evidence and supporting documents can be added in the next step.</p>
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}>
              <label>Challenge title<input required placeholder="e.g. Drinking water quality in our village" /></label>
              <div className="form-row"><label>District<select required defaultValue=""><option value="" disabled>Select district</option><option>Ranchi</option><option>East Singhbhum</option><option>Dhanbad</option><option>Other district</option></select></label><label>Category<select required defaultValue=""><option value="" disabled>Select category</option><option>Water & sanitation</option><option>Agriculture</option><option>Healthcare</option><option>Education</option><option>Other</option></select></label></div>
              <label>What is happening?<textarea required placeholder="Describe the problem, who it affects, and how long it has existed." rows="4" /></label>
              <button className="primary" type="submit">Continue submission <ArrowRight size={17} /></button>
            </form>
          </> : <div className="success-state"><CheckCircle2 size={48} /><h2>Challenge draft created.</h2><p>Your details have been captured for this prototype. The full portal will next collect location and multimedia evidence.</p><button className="primary" onClick={() => { setShowSubmission(false); setSubmitted(false) }}>Done</button></div>}
        </div>
      </div>}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthenticated={setUser} />}

      <footer>
        <div className="container footer-main">
          <div className="footer-brand"><div className="brand inverse"><span className="brand-mark"><Lightbulb size={23} /></span><span><strong>Pragati<span>X</span></strong><small>Societal Innovation Portal</small></span></div><p>An initiative to advance community-led research, innovation and entrepreneurship across Jharkhand.</p></div>
          <div><strong>Platform</strong><button>Submit a challenge</button><button>Track a challenge</button><button>Public dashboard</button></div>
          <div><strong>Participate</strong><button>For universities</button><button>For industry</button><button>For government</button></div>
          <div><strong>Support</strong><button>Help centre</button><button>Accessibility</button><button>Contact us</button></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 Government of Jharkhand. All rights reserved.</span><span>Privacy · Terms · Accessibility statement</span></div>
      </footer>
    </div>
  )
}

export default App
