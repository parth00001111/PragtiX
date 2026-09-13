import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileSearch,
  Filter,
  Home,
  LayoutDashboard,
  Lightbulb,
  ListFilter,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  UserRoundCog,
  UsersRound,
  X,
} from "lucide-react";
import { problemApi } from "../lib/problemApi";
import { districts, statusLabels } from "../lib/problemTaxonomy";
import samadhanSetuLogo from "../assets/samadhan-setu-logo.png";
import "./OrganizationDashboard.css";

const workspaceKey = (user) => `pragatix-org-workspace-${user?.id || "guest"}`;
const loadWorkspace = (user) => ({
  teams: [],
  cases: {},
  solutions: [],
  profile: {},
  faculty: {},
  applications: [],
  industryProfile: {},
  collaborations: [],
  fundingCommitments: [],
  technologyMatches: [],
  ...JSON.parse(localStorage.getItem(workspaceKey(user)) || "{}"),
});

export default function OrganizationDashboard({
  user,
  path,
  onNavigate,
  onSignIn,
  onLogout,
}) {
  const memberView = user?.role === "STUDENT";
  const industryView = user?.role === "INDUSTRY";
  const [problems, setProblems] = useState([]);
  const [workspace, setWorkspace] = useState(() => loadWorkspace(user));
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [teamForm, setTeamForm] = useState(false);
  const [solutionProblem, setSolutionProblem] = useState(null);
  const [applyProblem, setApplyProblem] = useState(null);
  const [collaborationProblem, setCollaborationProblem] = useState(null);
  const [fundingProblem, setFundingProblem] = useState(null);
  const [technologyProblem, setTechnologyProblem] = useState(null);

  useEffect(() => {
    if (user)
      problemApi
        .list()
        .then((result) => setProblems(result.data || []))
        .catch((err) => setError(err.message));
  }, [user]);
  const save = (next) => {
    setWorkspace(next);
    localStorage.setItem(workspaceKey(user), JSON.stringify(next));
  };
  const cases = useMemo(
    () =>
      problems.map((problem) => ({
        ...problem,
        ...(workspace.cases[problem.id] || {}),
      })),
    [problems, workspace.cases],
  );
  const visible = cases.filter(
    (problem) =>
      (!query ||
        `${problem.title} ${problem.description}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!district || problem.description?.includes(`District: ${district}`)) &&
      (!status || problem.status === status),
  );
  const validated = visible.filter((problem) => ["VERIFIED", "PRIORITIZED", "ASSIGNED", "IN_PROGRESS"].includes(problem.status));
  const assigned = memberView
    ? visible.filter(
        (problem) =>
          problem.teamId &&
          workspace.teams
            .find((team) => team.id === problem.teamId)
            ?.members?.some((member) => member.email === user?.email),
      )
    : visible;
  const page = path.split("/")[2] || "dashboard";
  const nav = (slug, icon, label) => (
    <button
      className={page === slug ? "active" : ""}
      onClick={() => onNavigate(`/organization/${slug}`)}
    >
      {icon}
      {label}
    </button>
  );
  const createTeam = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const members = data
      .get("members")
      .split("\n")
      .map((line) => {
        const [name, discipline, email] = line
          .split("|")
          .map((value) => value?.trim());
        return { name, discipline, email };
      })
      .filter((member) => member.email);
    const team = {
      id: `TEAM-${Date.now()}`,
      name: data.get("name"),
      focus: data.get("focus"),
      mentor: data.get("mentor"),
      members,
    };
    save({ ...workspace, teams: [...workspace.teams, team] });
    setTeamForm(false);
  };
  const assign = (problemId, teamId) =>
    save({
      ...workspace,
      cases: {
        ...workspace.cases,
        [problemId]: {
          ...(workspace.cases[problemId] || {}),
          teamId,
          crmStatus: "ACTIVE",
        },
      },
    });
  const submitSolution = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const solution = {
      id: `SOL-${Date.now()}`,
      problemId: solutionProblem.id,
      title: data.get("title"),
      problemUnderstanding: data.get("problemUnderstanding"),
      proposedSolution: data.get("proposedSolution"),
      technology: data.get("technology"),
      architecture: data.get("architecture"),
      innovation: data.get("innovation"),
      expectedImpact: data.get("expectedImpact"),
      implementationPlan: data.get("implementationPlan"),
      estimatedCost: data.get("estimatedCost"),
      requiredResources: data.get("requiredResources"),
      prototypePlan: data.get("prototypePlan"),
      riskAnalysis: data.get("riskAnalysis"),
      scalability: data.get("scalability"),
      sustainability: data.get("sustainability"),
      progress: data.get("progress"),
      status: "SUBMITTED",
      submittedBy: user?.name,
      createdAt: new Date().toISOString(),
    };
    save({
      ...workspace,
      solutions: [solution, ...workspace.solutions],
      cases: {
        ...workspace.cases,
        [solutionProblem.id]: {
          ...(workspace.cases[solutionProblem.id] || {}),
          crmStatus: "SOLUTION_SUBMITTED",
        },
      },
    });
    setSolutionProblem(null);
  };
  const saveProfile = (event, field) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const arrays =
      field === "profile"
        ? [
            "departments",
            "courses",
            "researchAreas",
            "labs",
            "incubators",
            "innovationCentres",
            "patents",
            "startups",
            "previousProjects",
          ]
        : field === "industryProfile"
          ? ["technicalExpertise", "csrFocus", "fundingCapacity", "mentorshipAreas", "availableTechnologies", "labs", "equipment", "pastProjects", "preferredDistricts"]
          : ["skills", "publications", "projects", "patents", "availableDomains"];
    arrays.forEach((key) => {
      values[key] = (values[key] || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    });
    if (field === "faculty") values.mentorship = values.mentorship === "on";
    save({ ...workspace, [field]: values });
  };
  const apply = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const application = {
      id: `APP-${Date.now()}`,
      problemId: applyProblem.id,
      problemTitle: applyProblem.title,
      skills: data.get("skills"),
      teamSize: data.get("teamSize"),
      note: data.get("note"),
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    };
    save({
      ...workspace,
      applications: [application, ...workspace.applications],
    });
    setApplyProblem(null);
  };
  const expressInterest = (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const contributionTypes = ['Funding','Mentorship','Technology','Prototype','Hardware','Software','Field Testing','Deployment'].filter(name => data.get(name) === 'on'); const collaboration = { id: `COL-${Date.now()}`, problemId: collaborationProblem.id, problemTitle: collaborationProblem.title, contributionTypes, note: data.get('note'), status: 'INTEREST_SUBMITTED', createdAt: new Date().toISOString() }; save({ ...workspace, collaborations: [collaboration, ...workspace.collaborations] }); setCollaborationProblem(null) };
  const createFundingInterest = (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const commitment = { id:`CSR-${Date.now()}`, problemId:fundingProblem.id, problemTitle:fundingProblem.title, domain:fundingProblem.domain, requiredAmount:Number(data.get('requiredAmount')), offeredAmount:Number(data.get('offeredAmount')), proposal:data.get('proposal'), milestones:data.get('milestones'), contact:data.get('contact'), stage:1, createdAt:new Date().toISOString() }; save({ ...workspace, fundingCommitments:[commitment,...workspace.fundingCommitments] }); setFundingProblem(null) };
  const advanceFunding = id => save({ ...workspace, fundingCommitments:workspace.fundingCommitments.map(item=>item.id===id ? {...item,stage:Math.min(6,item.stage+1)} : item) });
  const submitTechnologyMatch = (event) => { event.preventDefault(); const data=new FormData(event.currentTarget); const match={id:`TECH-${Date.now()}`,problemId:technologyProblem.id,problemTitle:technologyProblem.title,technology:data.get('technology'),readiness:data.get('readiness'),universityResearch:data.get('universityResearch'),integration:data.get('integration'),pilotPlan:data.get('pilotPlan'),support:data.get('support'),status:'MATCH_PROPOSED',createdAt:new Date().toISOString()}; save({...workspace,technologyMatches:[match,...workspace.technologyMatches]}); setTechnologyProblem(null) };

  return (
    <div className="org-app">
      <aside className="org-sidebar">
        <button className="org-brand" onClick={() => onNavigate("/")}>
          <img src={samadhanSetuLogo} alt="SamadhanSetu" />
          <small>Organisation CRM</small>
        </button>
        <nav>
          {nav("dashboard", <LayoutDashboard />, "Overview")}
          {memberView
            ? nav("challenges", <BookOpen />, "Open Challenges")
            : industryView
              ? nav("industry-challenges", <BookOpen />, "Validated Challenges")
              : nav("problems", <ClipboardList />, "Problem Pipeline")}
          {memberView && nav("applications", <Send />, "My Applications")}
          {industryView && nav("collaborations", <Send />, "Collaborations")}
          {industryView && nav("csr-funding", <Activity />, "CSR Funding")}
          {industryView && nav("technology-matching", <Lightbulb />, "Technology Matching")}
          {nav("solutions", <Lightbulb />, "Solutions")}
          {!memberView && !industryView && nav("teams", <UsersRound />, "Teams")}
          {!memberView && !industryView && nav("profile", <Building2 />, "University Profile")}
          {!memberView && !industryView && nav("faculty", <UserRoundCog />, "Faculty Profile")}
          {industryView && nav("industry-profile", <Building2 />, "Industry Profile")}
          <button>
            <FileSearch /> Research Library
          </button>
        </nav>
        <div className="org-side-bottom">
          <button>
            <CircleHelp /> Help centre
          </button>
          <button>
            <Settings /> Settings
          </button>
          <button onClick={() => onNavigate("/")}>
            <Home /> Public website
          </button>
          {user ? (
            <button onClick={onLogout}>
              <LogOut /> Sign out
            </button>
          ) : (
            <button onClick={onSignIn}>
              <LogIn /> Sign in
            </button>
          )}
        </div>
      </aside>
      <main className="org-main">
        <header className="org-top">
          <div>
            <strong>
              {memberView
                ? "Team member workspace"
                : "Organisation administration"}
            </strong>
            <span>
              {user?.role === "INDUSTRY"
                ? "Innovation company"
                : user?.role === "FACULTY"
                  ? "University / HEI"
                  : "Research team"}
            </span>
          </div>
          <div>
            <button>
              <Bell />
            </button>
            <i>{user?.name?.[0] || "O"}</i>
            <p>
              <strong>{user?.name || "Organisation user"}</strong>
              <small>{user?.email || "Sign in required"}</small>
            </p>
          </div>
        </header>
        <div className="org-content">
          {!user && (
            <div className="org-signin">
              <ShieldCheck />
              <div>
                <strong>Sign in to open your organisation workspace</strong>
                <span>Problems are protected by role-based access.</span>
              </div>
              <button onClick={onSignIn}>
                Sign in <ChevronRight />
              </button>
            </div>
          )}
          {error && <div className="auth-error">{error}</div>}
          {page === "dashboard" && (
            <OrgOverview
              memberView={memberView}
              problems={assigned}
              workspace={workspace}
              onNavigate={onNavigate}
            />
          )}
          {page === "problems" && (
            <>
              <PageHead
                eyebrow={
                  memberView
                    ? "Your team queue"
                    : "State-wide opportunity pipeline"
                }
                title={memberView ? "Assigned Problems" : "Problem Pipeline"}
                note={
                  memberView
                    ? "Research and develop solutions for problems assigned to your team."
                    : "Discover, filter and process verified community needs."
                }
              />
              <ProblemFilters
                query={query}
                setQuery={setQuery}
                district={district}
                setDistrict={setDistrict}
                status={status}
                setStatus={setStatus}
              />
              <div className="org-problem-list">
                {assigned.map((problem) => (
                  <ProblemRow
                    key={problem.id}
                    problem={problem}
                    teams={workspace.teams}
                    memberView={memberView}
                    onAssign={assign}
                    onSolution={() => setSolutionProblem(problem)}
                  />
                ))}
              </div>
            </>
          )}
          {page === "challenges" && memberView && (
            <>
              <PageHead eyebrow="Student innovation" title="Open Challenges" note="Explore real community problems and apply with your skills or student team." />
              <ProblemFilters query={query} setQuery={setQuery} district={district} setDistrict={setDistrict} status={status} setStatus={setStatus} />
              <div className="challenge-grid">{visible.map(problem => <article key={problem.id}><div className="challenge-code">#{problem.id.slice(0,8).toUpperCase()}<span>{statusLabels[problem.status] || 'Open'}</span></div><h2>{problem.title}</h2><dl><div><dt>Domain</dt><dd>{problem.domain?.replaceAll('_',' ')}</dd></div><div><dt>Location</dt><dd>{problem.description?.match(/District: ([^\n]+)/)?.[1] || 'Jharkhand'}</dd></div><div><dt>Difficulty</dt><dd>{problem.severityScore >= 7 ? 'High' : problem.severityScore >= 4 ? 'Medium' : 'Open level'}</dd></div><div><dt>Team required</dt><dd>4–6 students</dd></div></dl><div className="skill-tags"><span>Research</span><span>Field study</span><span>Innovation</span></div><button className="org-primary" onClick={()=>setApplyProblem(problem)}>Apply to challenge <ChevronRight/></button></article>)}</div>
            </>
          )}
          {page === "industry-challenges" && industryView && <><PageHead eyebrow="Industry collaboration" title="Validated Challenges" note="Discover government-validated problems where your organisation can contribute capability, capital or deployment support."/><ProblemFilters query={query} setQuery={setQuery} district={district} setDistrict={setDistrict} status={status} setStatus={setStatus}/><div className="challenge-grid industry-challenges">{validated.map(problem=><article key={problem.id}><div className="challenge-code">#{problem.id.slice(0,8).toUpperCase()}<span>Validated</span></div><h2>{problem.title}</h2><dl><div><dt>Domain</dt><dd>{problem.domain?.replaceAll('_',' ')}</dd></div><div><dt>District</dt><dd>{problem.description?.match(/District: ([^\n]+)/)?.[1] || 'Jharkhand'}</dd></div><div><dt>People affected</dt><dd>{problem.peopleAffected || 'Assessment pending'}</dd></div><div><dt>Status</dt><dd>{statusLabels[problem.status]}</dd></div></dl><button className="org-primary" onClick={()=>setCollaborationProblem(problem)}>Interested in collaboration <ChevronRight/></button></article>)}{!validated.length&&<Empty text="No validated challenges match the selected filters."/>}</div></>}
          {page === "collaborations" && industryView && <><PageHead eyebrow="Partnership pipeline" title="My Collaborations" note="Track every expression of interest and the capabilities offered by your organisation."/><div className="application-list">{workspace.collaborations.map(item=><article key={item.id}><span><Send/></span><div><small>{item.id} · {new Date(item.createdAt).toLocaleDateString()}</small><h3>{item.problemTitle}</h3><p>{item.contributionTypes.join(' · ')}</p></div><b>{item.status.replaceAll('_',' ')}</b></article>)}{!workspace.collaborations.length&&<Empty text="No collaboration interests submitted yet."/>}</div></>}
          {page === "csr-funding" && industryView && <CsrFunding problems={validated} commitments={workspace.fundingCommitments} onFund={setFundingProblem} onAdvance={advanceFunding}/>} 
          {page === "technology-matching" && industryView && <StartupParticipation problems={validated} matches={workspace.technologyMatches} technologies={workspace.industryProfile.availableTechnologies || []} onMatch={setTechnologyProblem}/>} 
          {page === "industry-profile" && industryView && <ProfileEditor title="Industry Profile" note="Show government and delivery partners exactly where your organisation can contribute." values={workspace.industryProfile} type="industryProfile" onSubmit={saveProfile}/>} 
          {page === "applications" && memberView && <><PageHead eyebrow="Student applications" title="My Applications" note="Follow applications submitted to open innovation challenges."/><div className="application-list">{workspace.applications.map(item=><article key={item.id}><span><Send/></span><div><small>{item.id} · {new Date(item.createdAt).toLocaleDateString()}</small><h3>{item.problemTitle}</h3><p>Skills: {item.skills} · Preferred team: {item.teamSize}</p></div><b>{item.status}</b></article>)}{!workspace.applications.length&&<Empty text="You have not applied to an open challenge yet."/>}</div></>}
          {page === "profile" && !memberView && <ProfileEditor title="University Profile" note="Keep institutional capabilities visible for accurate challenge matching." values={workspace.profile} type="profile" onSubmit={saveProfile}/>} 
          {page === "faculty" && !memberView && <ProfileEditor title="Faculty Profile" note="Publish mentorship availability, expertise and research outcomes." values={workspace.faculty} type="faculty" onSubmit={saveProfile}/>} 
          {page === "teams" && !memberView && (
            <>
              <PageHead
                eyebrow="Organisation structure"
                title="Teams"
                note="Create focused groups and assign multiple problems to the right expertise."
                action={
                  <button
                    className="org-primary"
                    onClick={() => setTeamForm(true)}
                  >
                    <Plus /> Create team
                  </button>
                }
              />
              <div className="team-grid">
                {workspace.teams.map((team) => (
                  <article key={team.id}>
                    <span>
                      <UsersRound />
                    </span>
                    <h3>{team.name}</h3>
                    <p>{team.focus || "Cross-functional innovation team"}</p>
                    <small>Mentor: {team.mentor || 'Not assigned'}</small>
                    <strong>{team.members.length} members</strong>
                    <ul>
                      {team.members.slice(0, 4).map((member) => (
                        <li key={member.email}><b>{member.name || member.email}</b>{member.discipline && ` · ${member.discipline}`}</li>
                      ))}
                    </ul>
                  </article>
                ))}
                {!workspace.teams.length && (
                  <Empty text="No teams yet. Create your first delivery team." />
                )}
              </div>
            </>
          )}
          {page === "solutions" && (
            <>
              <PageHead
                eyebrow="Research and delivery"
                title="Solution Workspace"
                note="Document research, progress and proposed solutions for every assigned problem."
              />
              <div className="solution-grid">
                {workspace.solutions.map((solution) => (
                  <article key={solution.id}>
                    <small>
                      {solution.id} ·{" "}
                      {new Date(solution.createdAt).toLocaleDateString()}
                    </small>
                    <h3>{solution.title}</h3>
                    <p>{solution.proposedSolution || solution.proposal}</p>
                    <div>
                      <span>Progress</span>
                      <strong>{solution.progress}%</strong>
                    </div>
                  </article>
                ))}
                {!workspace.solutions.length && (
                  <Empty text="No solution submissions yet. Open an assigned problem to begin." />
                )}
              </div>
            </>
          )}
        </div>
      </main>
      {teamForm && (
        <Modal title="Create a new team" onClose={() => setTeamForm(false)}>
          <form onSubmit={createTeam}>
            <label>
              Team name
              <input
                name="name"
                required
                placeholder="e.g. Water Systems Lab"
              />
            </label>
            <label>
              Focus area
              <input name="focus" placeholder="Domain or capability" />
            </label>
            <label>
              Faculty mentor
              <input name="mentor" required placeholder="Dr. Faculty Name" />
            </label>
            <label>
              Member emails
              <textarea
                name="members"
                rows="6"
                placeholder={'Student Name | Discipline | email@example.com\nAsha | Computer Science | asha@example.com\nRavi | Agriculture | ravi@example.com'}
              />
            </label>
            <button className="org-primary">Create team</button>
          </form>
        </Modal>
      )}
      {solutionProblem && (
        <Modal
          title="Develop a solution"
          onClose={() => setSolutionProblem(null)}
        >
          <p className="modal-problem">For: {solutionProblem.title}</p>
          <form className="proposal-form" onSubmit={submitSolution}>
            <label>
              Solution title
              <input name="title" required />
            </label>
            <label>
              Problem understanding
              <textarea
                name="problemUnderstanding"
                required
                rows="4"
                placeholder="Root cause, affected users and evidence"
              />
            </label>
            <label>Proposed solution<textarea name="proposedSolution" required rows="4" /></label>
            <div className="proposal-form-grid"><label>Technology<textarea name="technology" required rows="3" /></label><label>Architecture<textarea name="architecture" required rows="3" /></label></div>
            <label>Innovation<textarea name="innovation" required rows="3" placeholder="What makes this approach distinct?" /></label>
            <label>Expected impact<textarea name="expectedImpact" required rows="3" /></label>
            <label>Implementation plan<textarea name="implementationPlan" required rows="4" /></label>
            <div className="proposal-form-grid"><label>Estimated cost<input name="estimatedCost" required placeholder="₹ amount and assumptions" /></label><label>Required resources<input name="requiredResources" required placeholder="People, equipment, data, facilities" /></label></div>
            <label>Prototype plan<textarea name="prototypePlan" required rows="3" /></label>
            <label>Risk analysis<textarea name="riskAnalysis" required rows="3" /></label>
            <div className="proposal-form-grid"><label>Scalability<textarea name="scalability" required rows="3" /></label><label>Sustainability<textarea name="sustainability" required rows="3" /></label></div>
            <label>
              Progress (%)
              <input
                name="progress"
                type="number"
                min="0"
                max="100"
                defaultValue="10"
              />
            </label>
            <button className="org-primary">
              <Send /> Submit solution proposal
            </button>
          </form>
        </Modal>
      )}
      {applyProblem && <Modal title="Apply to open challenge" onClose={()=>setApplyProblem(null)}><p className="modal-problem">#{applyProblem.id.slice(0,8)} · {applyProblem.title}</p><form onSubmit={apply}><label>Your relevant skills<input name="skills" required placeholder="Python, IoT, design research"/></label><label>Preferred team size<select name="teamSize" defaultValue="4-6"><option>Individual</option><option>2-3</option><option value="4-6">4-6</option></select></label><label>Why do you want to work on this?<textarea name="note" required rows="5"/></label><button className="org-primary"><Send/> Submit application</button></form></Modal>}
      {collaborationProblem && <Modal title="Interested in collaboration" onClose={()=>setCollaborationProblem(null)}><p className="modal-problem">{collaborationProblem.title}</p><form onSubmit={expressInterest}><fieldset className="collaboration-options"><legend>How can your industry contribute?</legend>{['Funding','Mentorship','Technology','Prototype','Hardware','Software','Field Testing','Deployment'].map(name=><label key={name}><input type="checkbox" name={name}/><span>{name}</span></label>)}</fieldset><label>Collaboration note<textarea name="note" rows="4" required placeholder="Describe capacity, timeline or conditions"/></label><button className="org-primary"><Send/> Submit interest</button></form></Modal>}
      {fundingProblem && <Modal title="Express CSR funding interest" onClose={()=>setFundingProblem(null)}><p className="modal-problem">{fundingProblem.title}</p><form onSubmit={createFundingInterest}><div className="proposal-form-grid"><label>Funding requirement (₹ lakh)<input name="requiredAmount" type="number" min="1" required defaultValue={fundingProblem.peopleAffected ? Math.max(5,Math.ceil(fundingProblem.peopleAffected/1000)) : 5}/></label><label>Your funding offer (₹ lakh)<input name="offeredAmount" type="number" min="1" required/></label></div><label>CSR proposal<textarea name="proposal" required rows="4" placeholder="Purpose, eligibility and proposed funding structure"/></label><label>Milestone funding plan<textarea name="milestones" required rows="4" placeholder="Milestone 1 — amount — outcome"/></label><label>CSR contact<input name="contact" required placeholder="Name, email or phone"/></label><button className="org-primary"><Send/> Submit CSR interest</button></form></Modal>}
      {technologyProblem && <Modal title="Contribute existing technology" onClose={()=>setTechnologyProblem(null)}><p className="modal-problem">Government problem: {technologyProblem.title}</p><form onSubmit={submitTechnologyMatch}><label>Existing technology<input name="technology" required list="available-technologies" placeholder="e.g. IoT health-monitoring platform"/><datalist id="available-technologies">{(workspace.industryProfile.availableTechnologies || []).map(item=><option key={item} value={item}/>)}</datalist></label><label>Technology readiness<select name="readiness" required defaultValue="PILOT_READY"><option value="PROTOTYPE">Prototype available</option><option value="PILOT_READY">Pilot ready</option><option value="DEPLOYED">Already deployed</option><option value="SCALING">Ready to scale</option></select></label><label>University research required<textarea name="universityResearch" required rows="3" placeholder="Validation, localisation, clinical study, field research…"/></label><label>Integration approach<textarea name="integration" required rows="3" placeholder="How the technology addresses this government problem"/></label><label>Pilot deployment plan<textarea name="pilotPlan" required rows="4" placeholder="Location, duration, users, milestones and success measures"/></label><label>Support offered<input name="support" required placeholder="Technology, training, devices, APIs, maintenance…"/></label><button className="org-primary"><Send/> Propose technology match</button></form></Modal>}
    </div>
  );
}

const fundingStages = ['Funding Requirement','CSR Interest','Proposal','Approval','Agreement','Milestone Funding','Impact Report']
function StartupParticipation({ problems, matches, technologies, onMatch }) {
  return <><PageHead eyebrow="Reuse before reinventing" title="Startup Technology Matching" note="Connect proven startup technology with university expertise and validated government needs."/><div className="technology-equation"><div><Lightbulb/><strong>Existing technology</strong><span>{technologies.length ? `${technologies.length} technologies registered` : 'Add technologies in your industry profile'}</span></div><b>+</b><div><BookOpen/><strong>University research</strong><span>Evidence, validation and localisation</span></div><b>+</b><div><Building2/><strong>Government problem</strong><span>Verified public need and field access</span></div><b>↓</b><div className="pilot-result"><Activity/><strong>Pilot deployment</strong><span>Faster delivery with lower duplication</span></div></div><div className="startup-layout"><section className="funding-section"><div className="funding-title"><div><h2>Validated problems seeking technology</h2><p>Offer a product or platform that can be adapted and piloted.</p></div></div><div className="technology-problems">{problems.slice(0,8).map(problem=><article key={problem.id}><span>{problem.domain?.replaceAll('_',' ')}</span><h3>{problem.title}</h3><p><MapPin/>{problem.description?.match(/District: ([^\n]+)/)?.[1] || 'Jharkhand'}</p><button onClick={()=>onMatch(problem)}>Contribute technology <ChevronRight/></button></article>)}{!problems.length&&<Empty text="No validated technology challenges are currently available."/>}</div></section><section className="funding-section"><div className="funding-title"><div><h2>Proposed matches</h2><p>Your startup’s technology-to-problem pipeline.</p></div></div><div className="technology-match-list">{matches.map(item=><article key={item.id}><small>{item.id} · {item.readiness?.replaceAll('_',' ')}</small><h3>{item.technology}</h3><p>For: {item.problemTitle}</p><div><span>{item.status.replaceAll('_',' ')}</span><b>Pilot proposed</b></div></article>)}{!matches.length&&<Empty text="No technology matches proposed yet."/>}</div></section></div></>
}
function CsrFunding({ problems, commitments, onFund, onAdvance }) {
  const requirement = problem => problem.peopleAffected ? Math.max(5,Math.ceil(problem.peopleAffected/1000)) : ({WATER_MANAGEMENT:5,EDUCATION:12,HEALTHCARE:8,RURAL_LIVELIHOOD:20}[problem.domain] || 10)
  return <><PageHead eyebrow="Purpose-led capital" title="CSR Funding" note="Fund validated projects and follow every commitment through milestones to measurable impact."/><div className="funding-summary"><article><span>Open requirements</span><strong>{problems.length}</strong><small>Validated projects</small></article><article><span>CSR committed</span><strong>₹{commitments.reduce((sum,item)=>sum+item.offeredAmount,0)}L</strong><small>Across {commitments.length} projects</small></article><article><span>In milestone funding</span><strong>{commitments.filter(item=>item.stage===5).length}</strong><small>Active disbursements</small></article><article><span>Impact reports</span><strong>{commitments.filter(item=>item.stage===6).length}</strong><small>Completed reports</small></article></div><section className="funding-section"><div className="funding-title"><div><h2>Problems requiring funding</h2><p>Select a validated problem to begin a transparent CSR funding journey.</p></div></div><div className="funding-cards">{problems.slice(0,8).map(problem=><article key={problem.id}><div><span>{problem.domain?.replaceAll('_',' ')}</span><b>{statusLabels[problem.status]}</b></div><h3>{problem.title}</h3><strong>₹{requirement(problem)} lakh</strong><p><MapPin/> {problem.description?.match(/District: ([^\n]+)/)?.[1] || 'Jharkhand'}</p><button onClick={()=>onFund(problem)}>Fund this project <ChevronRight/></button></article>)}{!problems.length&&<Empty text="No validated funding requirements are currently available."/>}</div></section><section className="funding-section"><div className="funding-title"><div><h2>Funding lifecycle</h2><p>Manage approvals, agreements, milestone releases and impact reporting.</p></div></div><div className="funding-pipeline">{commitments.map(item=><article key={item.id}><div className="funding-record-head"><div><small>{item.id}</small><h3>{item.problemTitle}</h3><span>₹{item.offeredAmount} lakh offered</span></div><b>{fundingStages[item.stage]}</b></div><div className="lifecycle-track">{fundingStages.map((stage,index)=><div className={index<=item.stage?'complete':''} key={stage}><i>{index<item.stage?'✓':index+1}</i><span>{stage}</span></div>)}</div><div className="funding-record-foot"><p>{item.proposal}</p>{item.stage<6&&<button className="org-primary" onClick={()=>onAdvance(item.id)}>Move to {fundingStages[item.stage+1]} <ChevronRight/></button>}</div></article>)}{!commitments.length&&<Empty text="Your CSR funding interests and lifecycle records will appear here."/>}</div></section></>
}
function ProfileEditor({ title, note, values, type, onSubmit }) {
  const universityFields = [['name','Institution name'],['location','Location / address'],['district','District'],['institutionType','Institution type'],['departments','Departments'],['courses','Courses'],['researchAreas','Research areas'],['labs','Labs'],['incubators','Incubators'],['innovationCentres','Innovation centres'],['patents','Patents'],['startups','Startups'],['previousProjects','Previous projects']]
  const facultyFields = [['name','Faculty name'],['department','Department'],['researchArea','Research area'],['skills','Skills'],['publications','Publications'],['projects','Projects'],['patents','Patents'],['availableDomains','Available domains']]
  const industryFields = [['organization','Organization'],['industry','Industry'],['sector','Sector'],['location','Location'],['technicalExpertise','Technical expertise'],['csrFocus','CSR focus'],['fundingCapacity','Funding capacity'],['mentorshipAreas','Mentorship areas'],['availableTechnologies','Available technologies'],['labs','Labs'],['equipment','Equipment'],['pastProjects','Past projects'],['preferredDistricts','Preferred districts']]
  const fields = type === 'profile' ? universityFields : type === 'industryProfile' ? industryFields : facultyFields
  const eyebrow = type === 'profile' ? 'Institution information' : type === 'industryProfile' ? 'Industry capabilities' : 'Academic expertise'
  return <><PageHead eyebrow={eyebrow} title={title} note={note}/><form className="profile-form" onSubmit={event=>onSubmit(event,type)}><div className="profile-form-grid">{fields.map(([name,label])=><label key={name}>{label}{name === 'district' ? <select name={name} defaultValue={values[name] || ''}><option value="">Select district</option>{districts.map(item=><option key={item}>{item}</option>)}</select> : name === 'institutionType' ? <select name={name} defaultValue={values[name] || ''}><option value="">Select type</option><option>Central University</option><option>State University</option><option>Private University</option><option>Engineering College</option><option>Medical College</option><option>Research Institute</option></select> : <textarea name={name} rows={['location','previousProjects','publications','projects','pastProjects'].includes(name) ? 3 : 2} defaultValue={Array.isArray(values[name]) ? values[name].join(', ') : values[name] || ''} placeholder={['name','organization','industry','sector','location','researchArea','department'].includes(name) ? `Enter ${label.toLowerCase()}` : 'Separate multiple entries with commas'}/>}</label>)}</div>{type === 'faculty' && <label className="mentor-check"><input type="checkbox" name="mentorship" defaultChecked={values.mentorship}/> Available for mentorship</label>}<button className="org-primary"><CheckCircle2/> Save profile</button></form></>
}
function PageHead({ eyebrow, title, note, action }) {
  return (
    <div className="org-page-head">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{note}</p>
      </div>
      {action}
    </div>
  );
}
function OrgOverview({ memberView, problems, workspace, onNavigate }) {
  const live = problems.filter(
    (problem) => !["RESOLVED", "REJECTED"].includes(problem.status),
  ).length;
  return (
    <>
      <PageHead
        eyebrow={
          memberView
            ? "Focused research workspace"
            : "Organisation command centre"
        }
        title={memberView ? "My Team Workspace" : "Innovation CRM"}
        note={
          memberView
            ? "Everything assigned to you, in one focused place."
            : "Monitor community needs from discovery through solution delivery."
        }
      />
      <div className="org-metrics">
        <article>
          <ClipboardList />
          <span>{memberView ? "Assigned to me" : "Available problems"}</span>
          <strong>{problems.length}</strong>
          <small>Visible in your workspace</small>
        </article>
        <article>
          <Activity />
          <span>Live cases</span>
          <strong>{live}</strong>
          <small>Currently active</small>
        </article>
        <article>
          <UsersRound />
          <span>Teams</span>
          <strong>{workspace.teams.length}</strong>
          <small>Delivery groups</small>
        </article>
        <article>
          <CheckCircle2 />
          <span>Solutions</span>
          <strong>{workspace.solutions.length}</strong>
          <small>Submitted proposals</small>
        </article>
      </div>
      <div className="org-overview">
        <section>
          <div className="panel-title">
            <div>
              <h2>{memberView ? "My assigned queue" : "Live problem queue"}</h2>
              <p>Priority community needs</p>
            </div>
            <button onClick={() => onNavigate("/organization/problems")}>
              Open pipeline <ChevronRight />
            </button>
          </div>
          {problems.slice(0, 6).map((problem) => (
            <div className="queue-item" key={problem.id}>
              <span>
                <ClipboardList />
              </span>
              <div>
                <strong>{problem.title}</strong>
                <small>{problem.domain?.replaceAll("_", " ")}</small>
              </div>
              <b>{statusLabels[problem.status] || "Live"}</b>
            </div>
          ))}
          {!problems.length && (
            <Empty
              text={
                memberView
                  ? "No problems are assigned to your team yet."
                  : "No live problems available."
              }
            />
          )}
        </section>
        <section>
          <div className="panel-title">
            <div>
              <h2>Workspace activity</h2>
              <p>Recent organisation progress</p>
            </div>
          </div>
          {workspace.solutions.slice(0, 5).map((solution) => (
            <div className="activity-item" key={solution.id}>
              <i />
              <p>
                <strong>{solution.title}</strong>
                <span>Solution progress submitted · {solution.progress}%</span>
              </p>
            </div>
          ))}
          {!workspace.solutions.length && (
            <Empty text="Team activity will appear here." />
          )}
        </section>
      </div>
    </>
  );
}
function ProblemFilters({
  query,
  setQuery,
  district,
  setDistrict,
  status,
  setStatus,
}) {
  return (
    <div className="org-filters">
      <label>
        <Search />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or description"
        />
      </label>
      <label>
        <MapPin />
        <select value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">All districts</option>
          {districts.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      <label>
        <Filter />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.keys(statusLabels).map((value) => (
            <option value={value} key={value}>
              {statusLabels[value]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
function ProblemRow({ problem, teams, memberView, onAssign, onSolution }) {
  return (
    <article>
      <div className="problem-icon">
        <ClipboardList />
      </div>
      <div className="problem-copy">
        <small>
          {problem.id} · {problem.domain?.replaceAll("_", " ")}
        </small>
        <h3>{problem.title}</h3>
        <p>{problem.description?.split("\n")[0]}</p>
        <div>
          <span className={`crm-state ${problem.crmStatus || ""}`}>
            {problem.crmStatus?.replaceAll("_", " ") ||
              statusLabels[problem.status] ||
              "Live"}
          </span>
          {problem.teamId && (
            <span>
              Team:{" "}
              {teams.find((team) => team.id === problem.teamId)?.name ||
                "Assigned"}
            </span>
          )}
        </div>
      </div>
      <div className="problem-actions">
        {!memberView && (
          <select
            value={problem.teamId || ""}
            onChange={(e) => onAssign(problem.id, e.target.value)}
          >
            <option value="">Assign team</option>
            {teams.map((team) => (
              <option value={team.id} key={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        )}
        <button onClick={onSolution}>
          Research & solution <ChevronRight />
        </button>
      </div>
    </article>
  );
}
function Empty({ text }) {
  return (
    <div className="org-empty">
      <ListFilter />
      <p>{text}</p>
    </div>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div className="org-modal-bg" onMouseDown={onClose}>
      <div
        className="org-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="org-modal-close" onClick={onClose}>
          <X />
        </button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
