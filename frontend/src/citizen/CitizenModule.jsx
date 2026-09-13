import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCircle2, ChevronRight, CircleHelp, FileText, Home, LayoutDashboard, ListChecks, LocateFixed, LogIn, LogOut, MapPin, Paperclip, Plus, ShieldCheck, Upload, UserRound, X } from 'lucide-react'
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
      ['Existing solution', values.existingSolution], ['Expected solution', values.expectedSolution], ['Contact', values.contact],
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
  useEffect(() => {
    if (!user) return
    problemApi.listMine().then(result => setProblems(result.data || [])).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [user])
  const grouped = useMemo(() => citizenStatuses.map(label => [label, problems.filter(problem => (statusLabels[problem.status] || 'Submitted') === label)]), [problems])
  const isProblems = path === '/citizen/problems'
  const activeProblems = problems.filter(problem => !['RESOLVED', 'REJECTED'].includes(problem.status)).length
  return <div className="citizen-app">
    <aside className="citizen-sidebar">
      <button className="citizen-brand" onClick={() => onNavigate('/')} aria-label="SamadhanSetu home"><img src={samadhanSetuLogo} alt="SamadhanSetu"/><small>Citizen portal</small></button>
      <nav><button className={!isProblems ? 'active' : ''} onClick={() => onNavigate('/citizen')}><LayoutDashboard size={19}/> Overview</button><button className={isProblems ? 'active' : ''} onClick={() => onNavigate('/citizen/problems')}><ListChecks size={19}/> My Problems <b>{problems.length}</b></button><button onClick={() => onNavigate('/citizen/submit')}><Plus size={19}/> Submit Problem</button></nav>
      <div className="citizen-side-bottom"><button><CircleHelp size={18}/> Help & support</button><button onClick={() => onNavigate('/')}><Home size={18}/> Public website</button>{user ? <button onClick={onLogout}><LogOut size={18}/> Sign out</button> : <button onClick={onSignIn}><LogIn size={18}/> Sign in</button>}</div>
    </aside>
    <main className="citizen-main">
      <div className="citizen-topbar"><div><strong>{isProblems ? 'My Problems' : 'Dashboard'}</strong><span>Citizen workspace</span></div><div><button aria-label="Notifications"><Bell size={19}/></button><span className="citizen-avatar"><UserRound size={18}/></span><p><strong>{user?.name || 'Guest citizen'}</strong><small>{user?.email || 'Local submissions only'}</small></p></div></div>
      <div className="citizen-content">{!user && <div className="signin-banner"><ShieldCheck size={21}/><div><strong>Sign in to sync and track problems securely</strong><span>Guest submissions stay only on this device.</span></div><button onClick={onSignIn}>Sign in <ChevronRight size={16}/></button></div>}
        {isProblems ? <><div className="citizen-page-head"><div><span className="eyebrow">Your submissions</span><h1>My Problems</h1><p>Track every community problem through verification and delivery.</p></div><button className="primary" onClick={() => onNavigate('/citizen/submit')}><Plus size={17}/> Submit a problem</button></div>{error && <div className="auth-error">{error}</div>}{loading ? <div className="dashboard-empty">Loading your problems…</div> : <div className="status-board">{grouped.map(([label, items]) => <section key={label}><div className="status-heading"><span>{label}</span><b>{items.length}</b></div>{items.length ? items.map(problem => <article key={problem.id}><small>{problem.id}</small><h3>{problem.title}</h3><p><MapPin size={13}/>{problem.domain?.replaceAll('_', ' ') || 'Community problem'}</p>{problem.isGuestDraft && <em>Guest draft · saved on this device</em>}</article>) : <p className="no-items">No problems</p>}</section>)}</div>}</> : <><div className="welcome-panel"><div><span className="eyebrow">Citizen dashboard</span><h1>Good to see you{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.</h1><p>Raise local concerns, follow their progress and see how your voice creates change.</p><button className="primary" onClick={() => onNavigate('/citizen/submit')}><Plus size={18}/> Submit a new problem</button></div><div className="welcome-mark"><ShieldCheck size={44}/><strong>Simple. Transparent. Accountable.</strong><span>Every submission has a visible journey.</span></div></div><div className="citizen-metrics"><article><span>Total submitted</span><strong>{problems.length}</strong><small>All your problems</small></article><article><span>Active</span><strong>{activeProblems}</strong><small>Currently being handled</small></article><article><span>Resolved</span><strong>{problems.filter(p => p.status === 'RESOLVED').length}</strong><small>Community outcomes</small></article><article><span>Needs attention</span><strong>{problems.filter(p => p.status === 'ESCALATED').length}</strong><small>Escalated problems</small></article></div><div className="citizen-overview-grid"><section><div className="overview-head"><div><h2>Recent problems</h2><p>Your latest submissions and their status</p></div><button onClick={() => onNavigate('/citizen/problems')}>View all <ChevronRight size={15}/></button></div>{problems.slice(0, 4).map(problem => <div className="recent-problem" key={problem.id}><span><FileText size={18}/></span><div><strong>{problem.title}</strong><small>{problem.domain?.replaceAll('_', ' ') || 'Community problem'}</small></div><b>{statusLabels[problem.status] || 'Submitted'}</b></div>)}{!problems.length && <div className="overview-empty">No submissions yet. Start with a problem you see around you.</div>}</section><section className="how-card"><h2>What happens next?</h2>{['Submit the local problem', 'Official verification', 'Assignment to the right team', 'Track solution and impact'].map((item, index) => <div key={item}><span>{index + 1}</span><p><strong>{item}</strong><small>{index === 0 ? 'Add location and useful evidence' : 'Updates appear here automatically'}</small></p></div>)}</section></div></>}
      </div>
    </main>
  </div>
}
