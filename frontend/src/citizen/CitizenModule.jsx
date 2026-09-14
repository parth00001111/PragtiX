import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, BarChart3, Bell, Bookmark, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clock3, FileText, Home, LayoutDashboard, Lightbulb, ListChecks, LocateFixed, LogIn, LogOut, MapPin, Paperclip, Plus, Search, ShieldCheck, Target, Upload, UserRound, Users, X } from 'lucide-react'
import { citizenStatuses, districts, domainValues, problemTaxonomy, statusLabels } from '../lib/problemTaxonomy'
import { problemApi } from '../lib/problemApi'
import samadhanSetuLogo from '../assets/samadhan-setu-logo.png'
import './CitizenModule.css'

const guestKey = 'pragatix-guest-problems'
const getGuestProblems = () => JSON.parse(localStorage.getItem(guestKey) || '[]')

export function ProblemSubmission({ user, onClose, onSubmitted, standalone = false }) {
  const [category, setCategory] = useState('')
  const [files, setFiles] = useState([])
  const [locationBusy, setLocationBusy] = useState(false)
  const [coords, setCoords] = useState({ latitude: '', longitude: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const locate = () => {
    if (!navigator.geolocation) return setError('Location is not available in this browser.')
    setLocationBusy(true); setError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords: value }) => { setCoords({ latitude: value.latitude.toFixed(6), longitude: value.longitude.toFixed(6) }); setLocationBusy(false) },
      () => { setError('Location permission was not granted. You can enter coordinates manually.'); setLocationBusy(false) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const context = [
      ['Sub-category', values.subCategory], ['District', values.district], ['Block', values.block],
      ['Panchayat / Municipality', values.panchayat], ['Village / Ward', values.village], ['Location', values.location],
      ['Severity', values.severity], ['Frequency', values.frequency], ['Seasonality', values.seasonality],
      ['Existing solution', values.existingSolution], ['Expected solution', values.expectedSolution],
    ].filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join('\n')
    const description = `${values.description}\n\n--- Submission details ---\n${context}`
    try {
      if (user) {
        const payload = new FormData()
        payload.set('title', values.title); payload.set('description', description)
        payload.set('domain', domainValues[category] || 'OTHER')
        if (coords.latitude) payload.set('latitude', coords.latitude)
        if (coords.longitude) payload.set('longitude', coords.longitude)
        if (values.peopleAffected) payload.set('peopleAffected', values.peopleAffected)
        payload.set('isPublic', String(values.isPublic === 'on'))
        files.slice(0, 5).forEach(file => payload.append('attachments', file))
        await problemApi.create(payload)
      } else {
        if (values.isPublic !== 'on') throw new Error('Sensitive or private problems require sign in before submission.')
        const guestProblem = { id: `GUEST-${Date.now()}`, title: values.title, domain: category, status: 'SUBMITTED', createdAt: new Date().toISOString(), isGuestDraft: true }
        localStorage.setItem(guestKey, JSON.stringify([guestProblem, ...getGuestProblems()]))
      }
      setDone(true); onSubmitted?.()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return <div className={standalone ? 'citizen-form-page' : 'modal-backdrop citizen-backdrop'} onMouseDown={standalone ? undefined : onClose}>
    <div className="submission-modal citizen-form-modal" role="dialog" aria-modal={!standalone} onMouseDown={event => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Close"><X /></button>
      {done ? <div className="success-state"><CheckCircle2 size={50}/><h2>Problem submitted.</h2><p>{user ? 'It now appears in your citizen dashboard.' : 'Your non-sensitive guest submission is saved on this device.'}</p><button className="primary" onClick={onClose}>Done</button></div> : <>
        <span className="eyebrow">Citizen problem submission</span><h2>Tell us what needs attention.</h2>
        <p>{user ? 'Add clear local evidence so the right team can verify and act.' : 'Guest mode is available for public, non-sensitive problems. Sign in to sync and track across devices.'}</p>
        <form onSubmit={submit}>
          <section><h3>Problem details</h3><label>Problem title<input name="title" required minLength="5" maxLength="200" placeholder="e.g. Handpump stops working every summer" /></label><label>Problem description<textarea name="description" required minLength="10" rows="5" placeholder="What is happening, who is affected, and for how long?" /></label>
          <div className="citizen-form-grid"><label>Category<select name="category" required value={category} onChange={e => setCategory(e.target.value)}><option value="">Select category</option>{Object.keys(problemTaxonomy).map(name => <option key={name}>{name}</option>)}</select></label><label>Sub-category<select name="subCategory" required disabled={!category}><option value="">Select sub-category</option>{(problemTaxonomy[category] || []).map(name => <option key={name}>{name}</option>)}</select></label></div></section>
          <section><h3><MapPin size={18}/> Location</h3><div className="citizen-form-grid"><label>District<select name="district" required><option value="">Select district</option>{districts.map(name => <option key={name}>{name}</option>)}</select></label><label>Block<input name="block" placeholder="Block name" /></label><label>Panchayat / Municipality<input name="panchayat" placeholder="Local body" /></label><label>Village / Ward<input name="village" placeholder="Village or ward" /></label></div><label>Location / landmark<input name="location" placeholder="Nearby landmark or address" /></label><div className="coordinate-row"><label>Latitude<input name="latitude" inputMode="decimal" value={coords.latitude} onChange={e => setCoords({ ...coords, latitude: e.target.value })} /></label><label>Longitude<input name="longitude" inputMode="decimal" value={coords.longitude} onChange={e => setCoords({ ...coords, longitude: e.target.value })} /></label><button type="button" className="location-button" onClick={locate}><LocateFixed size={17}/>{locationBusy ? 'Locating…' : 'Use my GPS'}</button></div></section>
          <section><h3>Community impact</h3><div className="citizen-form-grid"><label>Problem severity<select name="severity" required><option value="">Select severity</option><option>Low</option><option>Moderate</option><option>High</option><option>Critical</option></select></label><label>Number of people affected<input name="peopleAffected" type="number" min="1" placeholder="Estimated number" /></label><label>Frequency<select name="frequency"><option value="">Select frequency</option><option>One-time</option><option>Occasional</option><option>Frequent</option><option>Continuous</option></select></label><label>Seasonality<input name="seasonality" placeholder="e.g. Mainly during summer" /></label></div><label>Existing solution<textarea name="existingSolution" rows="2" placeholder="What is currently being tried?" /></label><label>Expected solution<textarea name="expectedSolution" rows="2" placeholder="What outcome would help the community?" /></label></section>
          <section><h3><Paperclip size={18}/> Evidence and contact</h3><label className="upload-box"><Upload size={24}/><strong>Add photos, videos, PDFs or documents</strong><span>Up to 5 files, 20 MB each</span><input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,application/pdf,.doc,.docx" onChange={e => setFiles([...e.target.files])} /></label>{files.length > 0 && <div className="file-list">{files.slice(0, 5).map(file => <span key={file.name}><FileText size={14}/>{file.name}</span>)}</div>}<label>Contact information<input name="contact" required placeholder="Mobile number or email" /></label><label className="check-label"><input name="isPublic" type="checkbox" defaultChecked /> This is a non-sensitive problem and may be visible publicly</label></section>
          {error && <div className="auth-error" role="alert">{error}</div>}<button className="primary submit-problem" disabled={loading}>{loading ? 'Submitting…' : 'Submit problem'} <Plus size={17}/></button>
        </form>
      </>}
    </div>
  </div>
}

export function CitizenDashboard({ user, path, onNavigate, onSignIn, onLogout }) {
  const [problems, setProblems] = useState(() => user ? [] : getGuestProblems())
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState('')
  const [ideas,setIdeas]=useState([])
  useEffect(() => {
    if (!user) return
    Promise.all([problemApi.listMine(),problemApi.listMyIdeas()]).then(([problemResult,ideaResult])=>{setProblems(problemResult.data||[]);setIdeas(ideaResult.data||[])}).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [user])
  const isProblems = path === '/citizen/problems'
  const isSaved = path === '/citizen/saved'
  const isIdeas = path === '/citizen/ideas'
  return <div className="citizen-app">
    <aside className="citizen-sidebar">
      <button className="citizen-brand" onClick={() => onNavigate('/')} aria-label="SamadhanSetu home"><img src={samadhanSetuLogo} alt="SamadhanSetu"/><small>Citizen portal</small></button>
      <nav><button className={!isProblems&&!isSaved&&!isIdeas ? 'active' : ''} onClick={() => onNavigate('/citizen')}><LayoutDashboard size={19}/> Overview</button><button className={isProblems ? 'active' : ''} onClick={() => onNavigate('/citizen/problems')}><ListChecks size={19}/> My Problems <b>{problems.length}</b></button><button className={isIdeas ? 'active' : ''} onClick={() => onNavigate('/citizen/ideas')}><Lightbulb size={19}/> My Ideas <b>{ideas.length}</b></button><button className={isSaved ? 'active' : ''} onClick={() => onNavigate('/citizen/saved')}><Bookmark size={19}/> Saved</button><button onClick={() => onNavigate('/citizen/submit')}><Plus size={19}/> Submit Problem</button></nav>
      <div className="citizen-side-bottom"><button><CircleHelp size={18}/> Help & support</button><button onClick={() => onNavigate('/')}><Home size={18}/> Public website</button>{user ? <button onClick={onLogout}><LogOut size={18}/> Sign out</button> : <button onClick={onSignIn}><LogIn size={18}/> Sign in</button>}</div>
    </aside>
    <main className="citizen-main">
      <div className="citizen-topbar"><div><strong>{isProblems?'My Problems':isSaved?'Saved Challenges':isIdeas?'My Ideas':'Dashboard'}</strong><span>Citizen workspace</span></div><div><button aria-label="Notifications"><Bell size={19}/></button><span className="citizen-avatar"><UserRound size={18}/></span><p><strong>{user?.name || 'Guest citizen'}</strong><small>{user?.email || 'Local submissions only'}</small></p></div></div>
      <div className="citizen-content">{!user && <div className="signin-banner"><ShieldCheck size={21}/><div><strong>Sign in to sync and track problems securely</strong><span>Guest submissions stay only on this device.</span></div><button onClick={onSignIn}>Sign in <ChevronRight size={16}/></button></div>}
        {isProblems?<MyProblemsView problems={problems} loading={loading} error={error} onNavigate={onNavigate}/>:isSaved?<SavedChallenges onNavigate={onNavigate}/>:isIdeas?<MyIdeas ideas={ideas} loading={loading} user={user} onNavigate={onNavigate} onSignIn={onSignIn}/>:<CitizenOverview user={user} problems={problems} ideas={ideas} loading={loading} error={error} onNavigate={onNavigate}/>}
      </div>
    </main>
  </div>
}

function SavedChallenges({onNavigate}){
  const [savedIds,setSavedIds]=useState(()=>{try{return JSON.parse(localStorage.getItem('samadhansetu-challenge-bookmarks')||'[]')}catch{return[]}})
  const [challenges,setChallenges]=useState(()=>{try{return JSON.parse(localStorage.getItem('samadhansetu-saved-challenges')||'[]')}catch{return[]}})
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  useEffect(()=>{problemApi.listPublic().then(result=>setChallenges(current=>{const live=result.data||[];const liveIds=new Set(live.map(item=>item.id));return [...live,...current.filter(item=>!liveIds.has(item.id))]})).catch(err=>setError(err.message)).finally(()=>setLoading(false))},[])
  const saved=challenges.filter(problem=>savedIds.includes(problem.id))
  const remove=id=>{const next=savedIds.filter(savedId=>savedId!==id);setSavedIds(next);localStorage.setItem('samadhansetu-challenge-bookmarks',JSON.stringify(next));localStorage.setItem('samadhansetu-saved-challenges',JSON.stringify(challenges.filter(item=>next.includes(item.id))))}
  return <div className="saved-challenges-view"><div className="citizen-page-head saved-page-head"><div><span className="eyebrow">YOUR READING LIST</span><h1>Saved Challenges</h1><p>Keep promising public problems together and return when you are ready to contribute.</p></div><button className="primary" onClick={()=>onNavigate('/challenges')}>Explore challenges <ArrowUpRight/></button></div>
    <div className="saved-summary"><span><Bookmark/></span><div><strong>{savedIds.length} saved {savedIds.length===1?'challenge':'challenges'}</strong><small>Saved on this device for quick access</small></div></div>
    {error&&<div className="auth-error" role="alert">{error}</div>}
    {loading?<div className="saved-loading"><i/><span>Loading saved challenges…</span></div>:saved.length?<div className="saved-challenge-list">{saved.map(problem=>{const district=problem.description?.match(/District: ([^\n]+)/)?.[1]||'Jharkhand';return <article key={problem.id}><div className="saved-challenge-icon"><Bookmark/></div><div className="saved-challenge-copy"><div><span>{problem.id}</span><i/><span>{problem.domain?.replaceAll('_',' ')||'Community problem'}</span></div><h2>{problem.title}</h2><p>{problem.description?.split('\n---')[0]||'Public community challenge.'}</p><small><MapPin/>{district}<b>{statusLabels[problem.status]||'Submitted'}</b></small></div><div className="saved-challenge-actions"><button onClick={()=>remove(problem.id)}>Remove</button><button onClick={()=>onNavigate('/challenges')}>View challenge <ChevronRight/></button></div></article>})}</div>:<div className="saved-empty"><Bookmark/><h2>No saved challenges yet</h2><p>Browse public challenges and use the bookmark button to keep the problems that matter to you.</p><button className="primary" onClick={()=>onNavigate('/challenges')}>Browse public challenges <ArrowUpRight/></button></div>}
  </div>
}

function MyIdeas({ideas,loading,user,onNavigate,onSignIn}){
  return <div className="my-ideas-view"><div className="citizen-page-head ideas-page-head"><div><span className="eyebrow">YOUR CONTRIBUTIONS</span><h1>Ideas Submitted</h1><p>Revisit the solution ideas you shared for public challenges.</p></div><button className="primary" onClick={()=>onNavigate('/challenges')}>Find a challenge <ArrowUpRight/></button></div>
    <div className="ideas-summary"><article><span>Ideas shared</span><strong>{ideas.length}</strong><small>Across public challenges</small></article><article><span>Challenges supported</span><strong>{new Set(ideas.map(idea=>idea.problem?.id)).size}</strong><small>Problems where you contributed</small></article><article><span>Latest contribution</span><strong>{ideas[0]?.createdAt?new Date(ideas[0].createdAt).toLocaleDateString(undefined,{day:'numeric',month:'short'}):'—'}</strong><small>Your most recent idea</small></article></div>
    {loading?<div className="saved-loading"><i/><span>Loading your solution ideas…</span></div>:ideas.length?<div className="my-idea-list">{ideas.map(idea=><article key={idea.id}><div className="my-idea-head"><span><Lightbulb/></span><div><small>{idea.problem?.id} · {new Date(idea.createdAt).toLocaleDateString()}</small><h2>{idea.title}</h2></div><b>{statusLabels[idea.problem?.status]||'Public challenge'}</b></div><p>{idea.summary}</p>{idea.impact&&<div className="my-idea-impact"><strong>Expected impact</strong><span>{idea.impact}</span></div>}<footer><span>For: <strong>{idea.problem?.title||'Public challenge'}</strong></span>{idea.skills&&<small>{idea.skills}</small>}<button onClick={()=>onNavigate(`/challenges/${idea.problem?.id}/solution`)}>Open idea discussion <ChevronRight/></button></footer></article>)}</div>:<div className="saved-empty"><Lightbulb/><h2>{user?'You have not submitted an idea yet':'Sign in to view your ideas'}</h2><p>{user?'Explore a public challenge and share an approach that could inspire the teams working on it.':'Your submitted solution ideas are securely linked to your citizen account.'}</p><button className="primary" onClick={user?()=>onNavigate('/challenges'):onSignIn}>{user?'Explore challenges':'Sign in'} <ArrowUpRight/></button></div>}
  </div>
}

function CitizenOverview({user,problems,ideas,loading,error,onNavigate}){
  const analytics=useMemo(()=>{
    const resolved=problems.filter(problem=>problem.status==='RESOLVED').length
    const active=problems.filter(problem=>!['RESOLVED','REJECTED'].includes(problem.status)).length
    const peopleReached=problems.reduce((total,problem)=>total+(Number(problem.peopleAffected)||0),0)
    const progress=problems.length?Math.round(problems.reduce((total,problem)=>{
      const label=statusLabels[problem.status]||'Submitted'
      const step=Math.max(0,citizenStatuses.indexOf(label))
      return total+((step+1)/citizenStatuses.length)*100
    },0)/problems.length):0
    const statusCounts=citizenStatuses.map(label=>({label,count:problems.filter(problem=>(statusLabels[problem.status]||'Submitted')===label).length})).filter(item=>item.count)
    const domainCounts=Object.entries(problems.reduce((counts,problem)=>{
      const domain=(problem.domain||'Community problem').replaceAll('_',' ')
      counts[domain]=(counts[domain]||0)+1
      return counts
    },{})).sort((a,b)=>b[1]-a[1]).slice(0,4)
    return {resolved,active,peopleReached,progress,statusCounts,domainCounts,publicCount:problems.filter(problem=>problem.isPublic!==false).length,attention:problems.filter(problem=>problem.status==='ESCALATED').length}
  },[problems])
  const maxStatus=Math.max(...analytics.statusCounts.map(item=>item.count),1)
  const maxDomain=Math.max(...analytics.domainCounts.map(([,count])=>count),1)
  return <div className="citizen-analytics-overview">
    <section className="analytics-hero"><div><span className="eyebrow">YOUR COMMUNITY IMPACT</span><h1>Good to see you{user?.name?`, ${user.name.split(' ')[0]}`:''}.</h1><p>See what is moving, where your concerns are focused and what you can do next.</p><div className="analytics-hero-actions"><button className="primary" onClick={()=>onNavigate('/citizen/submit')}><Plus size={17}/>Submit a new problem</button><button onClick={()=>onNavigate('/challenges')}>Explore public challenges <ArrowUpRight size={16}/></button></div></div><div className="analytics-score"><span>Overall journey</span><strong>{analytics.progress}%</strong><div><i style={{width:`${analytics.progress}%`}}/></div><small>Average progress across your submissions</small></div></section>
    {error&&<div className="auth-error" role="alert">{error}</div>}
    <div className="analytics-metrics"><article><span><FileText/>Total submitted</span><strong>{loading?'—':problems.length}</strong><small>Your recorded community concerns</small></article><article><span><Clock3/>Active now</span><strong>{loading?'—':analytics.active}</strong><small>Moving through review or delivery</small></article><article><span><CheckCircle2/>Resolved</span><strong>{loading?'—':analytics.resolved}</strong><small>{problems.length?`${Math.round((analytics.resolved/problems.length)*100)}% resolution rate`:'No outcomes recorded yet'}</small></article><article className="ideas-metric" onClick={()=>onNavigate('/citizen/ideas')}><span><Lightbulb/>Ideas submitted</span><strong>{loading?'—':ideas.length}</strong><small>Solutions you contributed · View ideas</small></article></div>
    <div className="analytics-grid">
      <section className="analytics-panel"><div className="analytics-panel-head"><div><span className="panel-icon"><BarChart3/></span><div><h2>Progress at a glance</h2><p>Where your submissions are in the solution journey</p></div></div><button onClick={()=>onNavigate('/citizen/problems')}>Open tracker <ChevronRight/></button></div>{loading?<div className="analytics-loading">Loading your progress…</div>:analytics.statusCounts.length?<div className="analytics-bars">{analytics.statusCounts.map(item=><div className="analytics-bar" key={item.label}><div><span>{item.label}</span><strong>{item.count}</strong></div><div><i style={{width:`${(item.count/maxStatus)*100}%`}}/></div></div>)}</div>:<div className="analytics-empty">Submit your first problem to begin tracking its journey.</div>}</section>
      <section className="analytics-panel"><div className="analytics-panel-head"><div><span className="panel-icon warm"><Target/></span><div><h2>Your issue areas</h2><p>Categories you have highlighted most</p></div></div></div>{analytics.domainCounts.length?<div className="domain-breakdown">{analytics.domainCounts.map(([domain,count],index)=><div key={domain}><span>{index+1}</span><p><strong>{domain.toLowerCase().replace(/\b\w/g,char=>char.toUpperCase())}</strong><small>{count} {count===1?'submission':'submissions'}</small></p><div><i style={{width:`${(count/maxDomain)*100}%`}}/></div></div>)}</div>:<div className="analytics-empty">Your most reported issue areas will appear here.</div>}</section>
    </div>
    <div className="impact-strip"><div><span>Public challenges</span><strong>{analytics.publicCount}</strong><small>Visible for innovators to discover</small></div><div><span>Needs attention</span><strong>{analytics.attention}</strong><small>Items currently escalated</small></div><div className="impact-next"><span>RECOMMENDED NEXT STEP</span><strong>{analytics.attention?'Review your escalated submissions':problems.length?'Add evidence to strengthen active problems':'Report a problem affecting your locality'}</strong><button onClick={()=>onNavigate(problems.length?'/citizen/problems':'/citizen/submit')}>{problems.length?'Review problems':'Get started'} <ArrowUpRight/></button></div></div>
    <section className="analytics-panel recent-analytics"><div className="analytics-panel-head"><div><span className="panel-icon"><Clock3/></span><div><h2>Recent submissions</h2><p>Your latest activity and current status</p></div></div><button onClick={()=>onNavigate('/citizen/problems')}>View all <ChevronRight/></button></div>{problems.slice(0,4).map(problem=><button className="analytics-recent-row" key={problem.id} onClick={()=>onNavigate('/citizen/problems')}><span><FileText/></span><div><strong>{problem.title}</strong><small>{problem.domain?.replaceAll('_',' ')||'Community problem'} · {problem.createdAt?new Date(problem.createdAt).toLocaleDateString():'Recently'}</small></div><b className={`citizen-status status-${problem.status?.toLowerCase()}`}>{statusLabels[problem.status]||'Submitted'}</b><ChevronRight/></button>)}{!loading&&!problems.length&&<div className="analytics-empty">No submissions yet. Your recent activity will appear here.</div>}</section>
  </div>
}

function MyProblemsView({problems,loading,error,onNavigate}){
  const [query,setQuery]=useState('')
  const [filter,setFilter]=useState('All statuses')
  const filtered=useMemo(()=>problems.filter(problem=>{
    const label=statusLabels[problem.status]||'Submitted'
    const matchesFilter=filter==='All statuses'||label===filter
    const matchesQuery=`${problem.title} ${problem.id} ${problem.domain}`.toLowerCase().includes(query.toLowerCase())
    return matchesFilter&&matchesQuery
  }),[problems,query,filter])
  const resolved=problems.filter(problem=>problem.status==='RESOLVED').length
  const active=problems.filter(problem=>!['RESOLVED','REJECTED'].includes(problem.status)).length
  return <div className="my-problems-view">
    <div className="citizen-page-head problems-page-head"><div><span className="eyebrow">YOUR SUBMISSIONS</span><h1>My Problems</h1><p>A clear view of every problem you have raised and what happens next.</p></div><button className="primary" onClick={()=>onNavigate('/citizen/submit')}><Plus size={17}/>Submit a problem</button></div>
    <div className="problem-summary"><article><span>All problems</span><strong>{problems.length}</strong><small>Submitted by you</small></article><article><span>In progress</span><strong>{active}</strong><small>Moving towards a solution</small></article><article><span>Resolved</span><strong>{resolved}</strong><small>Completed outcomes</small></article></div>
    <div className="problem-list-shell">
      <div className="problem-list-toolbar"><div><h2>Your problem tracker</h2><p>Follow verification, assignment and solution progress.</p></div><div><label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search your problems…"/></label><select value={filter} onChange={event=>setFilter(event.target.value)}><option>All statuses</option>{citizenStatuses.map(status=><option key={status}>{status}</option>)}</select></div></div>
      {error&&<div className="auth-error">{error}</div>}
      {loading?<div className="problems-loading"><i/><span>Loading your problems…</span></div>:<div className="clean-problem-list">{filtered.map(problem=>{
        const label=statusLabels[problem.status]||'Submitted'
        const step=Math.max(0,citizenStatuses.indexOf(label))
        const description=problem.description?.split('\n\n---')[0]
        const district=problem.description?.match(/District: ([^\n]+)/)?.[1]
        return <article className="clean-problem-card" key={problem.id}>
          <div className="problem-card-icon"><FileText/></div>
          <div className="problem-card-content"><div className="problem-card-meta"><span>{problem.id}</span><i/> <span>{problem.domain?.replaceAll('_',' ')||'Community problem'}</span>{district&&<><i/><span><MapPin/>{district}</span></>}</div><h3>{problem.title}</h3><p>{description||'Your submitted community problem.'}</p>
            <div className="problem-progress"><div><span>Progress</span><strong>{label}</strong></div><div className="progress-line"><i style={{width:`${((step+1)/citizenStatuses.length)*100}%`}}/></div><div className="progress-labels"><span>Submitted</span><span>Verification</span><span>Assigned</span><span>Resolved</span></div></div>
            <details><summary>View submission details <ChevronDown/></summary><div className="problem-detail-row"><span><Clock3/><b>Submitted</b>{problem.createdAt?new Date(problem.createdAt).toLocaleDateString():'Recently'}</span><span><Users/><b>People affected</b>{problem.peopleAffected?.toLocaleString()||'Not specified'}</span><span><ShieldCheck/><b>Visibility</b>{problem.isPublic===false?'Private':'Public challenge'}</span></div></details>
          </div>
          <div className="problem-card-state"><span className={`citizen-status status-${problem.status?.toLowerCase()}`}>{label}</span>{problem.isGuestDraft&&<small>Saved on this device</small>}</div>
        </article>
      })}{!filtered.length&&<div className="problems-empty"><ListChecks/><h3>{problems.length?'No matching problems':'No problems submitted yet'}</h3><p>{problems.length?'Try another search or status filter.':'When you raise a community problem, its complete journey will appear here.'}</p>{!problems.length&&<button className="primary" onClick={()=>onNavigate('/citizen/submit')}><Plus/>Submit your first problem</button>}</div>}</div>}
    </div>
  </div>
}
