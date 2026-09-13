import { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bell,
  Building2, Check, ChevronDown, ChevronRight, CircleDot, Clock3, Download,
  Factory, FileCheck2, FileText, Filter, GraduationCap, Handshake, HelpCircle,
  LayoutDashboard, Lightbulb, LogOut, MapPin, Menu, MoreHorizontal, Search,
  Settings, ShieldCheck, Target, TrendingUp, Users, X,
} from 'lucide-react'
import './AdminDashboard.css'

const navItems = [
  ['Overview', LayoutDashboard], ['Challenges', FileText], ['Projects', Target],
  ['Institutions', GraduationCap], ['Industry partners', Factory], ['Analytics', BarChart3],
]

const challenges = [
  { id: 'JH-2026-1842', title: 'Arsenic contamination in community hand pumps', domain: 'Water', district: 'Sahebganj', priority: 'Critical', status: 'Awaiting review', age: '2h' },
  { id: 'JH-2026-1839', title: 'Post-harvest storage losses for lac producers', domain: 'Agriculture', district: 'Khunti', priority: 'High', status: 'Validated', age: '5h' },
  { id: 'JH-2026-1834', title: 'Accessible learning material for tribal-language students', domain: 'Education', district: 'West Singhbhum', priority: 'High', status: 'AI screening', age: '8h' },
  { id: 'JH-2026-1827', title: 'Remote maternal health monitoring in forest villages', domain: 'Healthcare', district: 'Latehar', priority: 'Critical', status: 'Assignment due', age: '1d' },
  { id: 'JH-2026-1819', title: 'Solid waste segregation near weekly markets', domain: 'Sanitation', district: 'Dumka', priority: 'Medium', status: 'Validated', age: '1d' },
]

const projects = [
  { title: 'Solar-powered water quality nodes', institution: 'BIT Mesra', progress: 72, phase: 'Field pilot', due: '18 Sep', health: 'On track' },
  { title: 'AI crop advisory in Ho language', institution: 'IIT (ISM) Dhanbad', progress: 48, phase: 'Prototype', due: '24 Sep', health: 'At risk' },
  { title: 'Low-cost assistive classroom kit', institution: 'NIT Jamshedpur', progress: 88, phase: 'Validation', due: '14 Sep', health: 'On track' },
  { title: 'Cold-chain retrofit for SHG collectives', institution: 'BAU Ranchi', progress: 31, phase: 'Research', due: '30 Sep', health: 'Delayed' },
]

const districts = [['Ranchi', 142], ['East Singhbhum', 119], ['Dhanbad', 104], ['West Singhbhum', 91], ['Dumka', 78]]
const domains = [['Agriculture', 28, '#2d6b51'], ['Water & sanitation', 22, '#378a91'], ['Healthcare', 18, '#d68c32'], ['Education', 15, '#667fc0'], ['Environment', 10, '#7da45b'], ['Other', 7, '#bac2bd']]

const allPages = {
  Challenges: { eyebrow: 'Challenge governance', title: 'Challenge review & allocation', note: 'Validate, prioritise and route citizen submissions.' },
  Projects: { eyebrow: 'Delivery governance', title: 'Project lifecycle monitoring', note: 'Track milestones, risks, deliverables and implementation.' },
  Institutions: { eyebrow: 'Academic network', title: 'Institution participation', note: 'Capabilities, allocation load and response performance.' },
  'Industry partners': { eyebrow: 'Innovation ecosystem', title: 'Industry & CSR partnerships', note: 'Mentorship, funding, pilots and technology transfer.' },
  Analytics: { eyebrow: 'Decision intelligence', title: 'Impact & performance analytics', note: 'District, sector and outcome-level programme insights.' },
}

function AdminDashboard() {
  const [active, setActive] = useState('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('Last 30 days')
  const [notice, setNotice] = useState('')
  const filteredChallenges = useMemo(() => challenges.filter((item) => `${item.title} ${item.id} ${item.district}`.toLowerCase().includes(query.toLowerCase())), [query])

  const selectPage = (name) => { setActive(name); setSidebarOpen(false) }
  const action = (message) => { setNotice(message); window.setTimeout(() => setNotice(''), 2800) }

  return <div className="admin-shell">
    <aside className={sidebarOpen ? 'admin-sidebar open' : 'admin-sidebar'}>
      <div className="admin-brand"><span className="admin-brand-mark"><Lightbulb size={21} /></span><div><strong>Pragati<span>X</span></strong><small>Government administration</small></div><button className="sidebar-close" onClick={() => setSidebarOpen(false)}><X size={20} /></button></div>
      <div className="admin-context"><span>Workspace</span><button><span className="jh-seal">JH</span><span><strong>State Mission Cell</strong><small>Jharkhand</small></span><ChevronDown size={16} /></button></div>
      <nav className="admin-nav">
        <span className="nav-label">Management</span>
        {navItems.map(([name, Icon]) => <button key={name} className={active === name ? 'active' : ''} onClick={() => selectPage(name)}><Icon size={18} /><span>{name}</span>{name === 'Challenges' && <b>18</b>}</button>)}
        <span className="nav-label secondary-label">System</span>
        <button onClick={() => action('Notification centre opened.')}><Bell size={18} /><span>Notifications</span><i /></button>
        <button onClick={() => action('Settings are available to super administrators.')}><Settings size={18} /><span>Settings</span></button>
      </nav>
      <div className="admin-support"><HelpCircle size={18} /><div><strong>Need assistance?</strong><small>View admin handbook</small></div><ChevronRight size={16} /></div>
      <div className="admin-profile"><span className="avatar">AK</span><div><strong>Ananya Kumari</strong><small>State Administrator</small></div><button title="Sign out" onClick={() => window.location.assign('/')}><LogOut size={17} /></button></div>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar">
        <button className="sidebar-trigger" onClick={() => setSidebarOpen(true)}><Menu /></button>
        <div className="global-search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search challenges, projects or institutions…" /><kbd>⌘ K</kbd></div>
        <div className="topbar-actions"><button className="icon-button" title="Notifications"><Bell size={19} /><i /></button><span className="topbar-divider" /><span className="system-status"><i /> All systems operational</span></div>
      </header>

      <div className="admin-content">
        {active === 'Overview' ? <Overview period={period} setPeriod={setPeriod} challenges={filteredChallenges} action={action} /> : <DetailPage active={active} query={query} setQuery={setQuery} action={action} />}
      </div>
    </main>
    {notice && <div className="admin-toast"><Check size={17} />{notice}</div>}
    {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
  </div>
}

function Overview({ period, setPeriod, challenges: visibleChallenges, action }) {
  return <>
    <div className="admin-page-head"><div><span className="page-eyebrow">State mission control</span><h1>Good morning, Ananya.</h1><p>Here is what needs attention across Jharkhand today.</p></div><div className="head-actions"><button className="outline-action" onClick={() => action('Report export started.')}><Download size={16} /> Export report</button><button className="solid-action" onClick={() => action('Challenge review queue opened.')}><FileCheck2 size={16} /> Review challenges <span>18</span></button></div></div>
    <section className="attention-banner"><span className="attention-icon"><AlertTriangle size={20} /></span><div><strong>6 high-priority challenges are approaching the review SLA.</strong><p>Two require departmental validation and four await domain expert assignment.</p></div><button onClick={() => action('Showing SLA-critical challenges.')}>Review now <ChevronRight size={16} /></button></section>
    <section className="metric-grid">
      <Metric icon={FileText} title="Total challenges" value="1,842" delta="12.4%" positive foot="228 added this month" />
      <Metric icon={Target} title="Active projects" value="126" delta="8.2%" positive foot="34 currently in pilot" />
      <Metric icon={GraduationCap} title="Institutions engaged" value="47" delta="3 new" positive foot="Across 18 districts" />
      <Metric icon={Handshake} title="Industry partnerships" value="83" delta="5.1%" positive foot="₹4.8 Cr committed" />
    </section>

    <section className="dashboard-row primary-row">
      <div className="dashboard-panel submissions-chart">
        <PanelHead title="Challenge submissions" subtitle="Monthly submissions and validated challenges"><select value={period} onChange={(e) => setPeriod(e.target.value)}><option>Last 30 days</option><option>Last 6 months</option><option>This year</option></select></PanelHead>
        <div className="chart-summary"><div><strong>428</strong><span>Total submissions</span></div><span className="trend up"><ArrowUpRight size={14} /> 18.2%</span><div className="legend"><span><i className="dark" />Submitted</span><span><i className="gold" />Validated</span></div></div>
        <div className="bar-chart" aria-label="Submissions chart">{[[42,28],[55,36],[49,31],[72,46],[64,43],[83,58],[75,52],[88,63],[96,67],[84,59],[105,76],[92,71]].map(([a,b],i)=><div className="bar-group" key={i}><div className="bars"><i style={{height:`${a}%`}}/><i style={{height:`${b}%`}}/></div><span>{['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'][i]}</span></div>)}</div>
      </div>
      <div className="dashboard-panel domain-panel"><PanelHead title="Challenges by domain" subtitle="All active submissions" action="View all" /><div className="domain-chart"><div className="donut"><div><strong>1,842</strong><span>Total</span></div></div><div className="domain-legend">{domains.map(([name,value,color])=><div key={name}><span><i style={{background:color}}/>{name}</span><strong>{value}%</strong></div>)}</div></div></div>
    </section>

    <section className="dashboard-panel table-panel">
      <PanelHead title="Challenges requiring attention" subtitle="Prioritised by urgency, age and community impact" action="View review queue" />
      <div className="table-scroll"><table><thead><tr><th>Challenge</th><th>Domain</th><th>District</th><th>Priority</th><th>Status</th><th>Received</th><th /></tr></thead><tbody>{visibleChallenges.map(c=><tr key={c.id}><td><strong>{c.title}</strong><small>{c.id}</small></td><td>{c.domain}</td><td><span className="district"><MapPin size={14}/>{c.district}</span></td><td><Status type={c.priority}>{c.priority}</Status></td><td><span className="workflow-status"><CircleDot size={14}/>{c.status}</span></td><td>{c.age}</td><td><button className="row-menu" onClick={()=>action(`${c.id} action menu opened.`)}><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table>{visibleChallenges.length===0&&<div className="empty-state">No challenges match your search.</div>}</div>
    </section>

    <section className="dashboard-row lower-row">
      <div className="dashboard-panel projects-panel"><PanelHead title="Project delivery health" subtitle="Milestones requiring programme oversight" action="All projects" />{projects.map(p=><div className="project-line" key={p.title}><div><strong>{p.title}</strong><span>{p.institution} · {p.phase}</span></div><div className="progress-wrap"><div><i style={{width:`${p.progress}%`}} /></div><span>{p.progress}%</span></div><Status type={p.health}>{p.health}</Status><small>{p.due}</small></div>)}</div>
      <div className="dashboard-panel district-panel"><PanelHead title="District participation" subtitle="Challenges submitted this quarter" action="District view" />{districts.map(([name,count],i)=><div className="district-line" key={name}><span><b>{i+1}</b>{name}</span><div><i style={{width:`${count/1.42}%`}} /></div><strong>{count}</strong></div>)}<div className="coverage-note"><MapPin size={17}/><span><strong>24 of 24 districts active</strong><small>Statewide submission coverage achieved</small></span></div></div>
    </section>

    <section className="dashboard-row outcome-row">
      <div className="dashboard-panel outcomes"><PanelHead title="Innovation outcomes" subtitle="Cumulative programme impact" /><div className="outcome-grid"><Outcome value="38" label="Solutions deployed" icon={Check}/><Outcome value="12" label="Patents filed" icon={Lightbulb}/><Outcome value="9" label="Startups created" icon={TrendingUp}/><Outcome value="2.4L" label="Citizens impacted" icon={Users}/></div></div>
      <div className="dashboard-panel activity-panel"><PanelHead title="Recent activity" subtitle="Across the ecosystem" action="View log" /><div className="activity-list"><ActivityItem icon={ShieldCheck} text={<><strong>Challenge JH-2026-1821</strong> validated by Water Resources Department</>} time="18 min"/><ActivityItem icon={Building2} text={<><strong>NIT Jamshedpur</strong> accepted institutional allocation</>} time="42 min"/><ActivityItem icon={Factory} text={<><strong>Tata Steel Foundation</strong> offered pilot support</>} time="1 hr"/></div></div>
    </section>
  </>
}

function DetailPage({ active, query, setQuery, action }) {
  const page = allPages[active]
  return <><div className="admin-page-head"><div><span className="page-eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.note}</p></div><div className="head-actions"><button className="outline-action"><Download size={16}/> Export</button><button className="solid-action" onClick={()=>action(`New ${active.toLowerCase()} workflow opened.`)}>Add new <ChevronRight size={16}/></button></div></div><section className="detail-toolbar"><div><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${active.toLowerCase()}…`}/></div><button><Filter size={16}/> Filters</button><button><Clock3 size={16}/> Updated just now</button></section><section className="dashboard-panel detail-placeholder"><span><Activity size={28}/></span><h2>{active} workspace ready</h2><p>This operational view is structured for live Supabase records. Connect the corresponding table to replace the current overview demo dataset.</p><div><button className="solid-action" onClick={()=>action('Data connection checklist opened.')}>Open data checklist</button><button className="outline-action" onClick={()=>setQuery('')}>Clear filters</button></div></section></>
}

function Metric({icon:Icon,title,value,delta,positive,foot}){return <div className="metric-card"><div className="metric-head"><span><Icon size={19}/></span><button><MoreHorizontal size={17}/></button></div><small>{title}</small><div className="metric-value"><strong>{value}</strong><span className={positive?'up':'down'}>{positive?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>} {delta}</span></div><p>{foot}</p></div>}
function PanelHead({title,subtitle,action,children}){return <div className="panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div>{children||action&&<button>{action}<ChevronRight size={15}/></button>}</div>}
function Status({type,children}){return <span className={`status ${type.toLowerCase().replaceAll(' ','-')}`}>{children}</span>}
function Outcome({value,label,icon:Icon}){return <div><span><Icon size={18}/></span><strong>{value}</strong><small>{label}</small></div>}
function ActivityItem({icon:Icon,text,time}){return <div><span><Icon size={16}/></span><p>{text}<small>{time} ago</small></p></div>}

export default AdminDashboard
