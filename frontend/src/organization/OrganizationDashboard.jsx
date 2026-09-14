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
  FileText,
  FileSearch,
  Filter,
  Home,
  LayoutDashboard,
  Lightbulb,
  Link2,
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
import "./SolutionsWorkspace.css";
import "./UniversityProfile.css";
import "./FacultyProfile.css";
import "./FacultyDirectory.css";
import "./ResearchLibrary.css";
import "./OrganizationOverview.css";

const workspaceKey = (user) => `pragatix-org-workspace-${user?.id || "guest"}`;
const teamDirectoryKey='samadhansetu-college-team-directory';
const readLocal=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}};
const normalizeTeam=team=>({...team,members:Array.isArray(team?.members)?team.members:[],problemIds:Array.isArray(team?.problemIds)?team.problemIds:[],ideas:Array.isArray(team?.ideas)?team.ideas:[],updates:Array.isArray(team?.updates)?team.updates:[],progress:Number(team?.progress)||0});
const loadWorkspace = (user) => {
  const personal=readLocal(workspaceKey(user),{});
  const directory=readLocal(teamDirectoryKey,[]).map(normalizeTeam);
  const memberTeams=user?.role==='STUDENT'?directory.filter(team=>team.members.some(member=>member.email?.toLowerCase()===user.email?.toLowerCase())):null;
  const ownedTeams=directory.filter(team=>team.ownerId===user?.id);
  const personalTeams=Array.isArray(personal.teams)?personal.teams.map(normalizeTeam):[];
  const syncedTeams=memberTeams||(ownedTeams.length?[...personalTeams.filter(team=>!ownedTeams.some(current=>current.id===team.id)),...ownedTeams]:personalTeams);
  return ({
  teams: [],
  cases: {},
  solutions: [],
  profile: {},
  faculty: {},
  facultyProfiles: [],
  applications: [],
  industryProfile: {},
  collaborations: [],
  fundingCommitments: [],
  technologyMatches: [],
  researchLibrary: [],
  ...personal,
  ...(syncedTeams?{teams:syncedTeams}:{}),
})};

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
  const [selectedTeamId,setSelectedTeamId]=useState(null);
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
    if(next.teams){const directory=readLocal(teamDirectoryKey,[]);const changedIds=new Set(next.teams.map(team=>team.id));localStorage.setItem(teamDirectoryKey,JSON.stringify([...directory.filter(team=>!changedIds.has(team.id)),...next.teams]));}
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
        const [name, role, discipline, collegeId, email] = line
          .split("|")
          .map((value) => value?.trim());
        return { id:`MEM-${Date.now()}-${collegeId}`, name, role:role || 'Student', discipline, collegeId, email };
      })
      .filter((member) => member.collegeId && member.name);
    const team = {
      id: `TEAM-${Date.now()}`,
      name: data.get("name"),
      focus: data.get("focus"),
      mentor: data.get("mentor"),
      mentorCollegeId:data.get('mentorCollegeId'),
      members,
      problemIds:[],
      ideas:[],
      updates:[],
      progress:0,
      ownerId:user?.id,
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
  const updateTeam=(teamId,change)=>save({...workspace,teams:workspace.teams.map(team=>team.id===teamId?{...team,...change}:team)});
  const addTeamMember=(teamId,event)=>{event.preventDefault();const data=new FormData(event.currentTarget);const team=workspace.teams.find(item=>item.id===teamId);const collegeId=String(data.get('collegeId')).trim();if(team.members.some(member=>member.collegeId?.toLowerCase()===collegeId.toLowerCase()))return setError('This college ID is already part of the team.');const member={id:`MEM-${Date.now()}`,name:data.get('name'),role:data.get('role'),discipline:data.get('discipline'),collegeId,email:data.get('email')};updateTeam(teamId,{members:[...team.members,member]});event.currentTarget.reset();setError('')};
  const assignTeamProblem=(teamId,event)=>{event.preventDefault();const problemId=new FormData(event.currentTarget).get('problemId');if(!problemId)return;const next={...workspace,teams:workspace.teams.map(team=>team.id===teamId?{...team,problemIds:[...new Set([...(team.problemIds||[]),problemId])]}:team),cases:{...workspace.cases,[problemId]:{...(workspace.cases[problemId]||{}),teamId,crmStatus:'ACTIVE'}}};save(next)};
  const addTeamIdea=(teamId,event)=>{event.preventDefault();const data=new FormData(event.currentTarget);const team=workspace.teams.find(item=>item.id===teamId);const idea={id:`TIDEA-${Date.now()}`,problemId:data.get('problemId'),title:data.get('title'),description:data.get('description'),submittedBy:data.get('submittedBy'),collegeId:data.get('collegeId'),createdAt:new Date().toISOString()};updateTeam(teamId,{ideas:[idea,...(team.ideas||[])]});event.currentTarget.reset()};
  const addTeamUpdate=(teamId,event)=>{event.preventDefault();const data=new FormData(event.currentTarget);const team=workspace.teams.find(item=>item.id===teamId);const progress=Number(data.get('progress'));const update={id:`UPD-${Date.now()}`,problemId:data.get('problemId'),summary:data.get('summary'),progress,submittedBy:data.get('submittedBy'),collegeId:data.get('collegeId'),createdAt:new Date().toISOString()};updateTeam(teamId,{progress,updates:[update,...(team.updates||[])]});event.currentTarget.reset()};
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
      problemTitle:solutionProblem.title,
      teamId:solutionProblem.teamId||'',
      milestones:[],
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
  const updateSolution=(solutionId,values)=>save({...workspace,solutions:workspace.solutions.map(solution=>solution.id===solutionId?{...solution,...values}:solution)});
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
            "facilities",
            "accreditations",
            "specializations",
            "collaborationInterests",
          ]
        : field === "industryProfile"
          ? ["technicalExpertise", "csrFocus", "fundingCapacity", "mentorshipAreas", "availableTechnologies", "labs", "equipment", "pastProjects", "preferredDistricts"]
          : ["skills", "publications", "projects", "patents", "availableDomains"];
    if(field==='faculty')arrays.push('qualifications','subjects','professionalMemberships','mentorshipTypes','preferredDistricts');
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
  const saveResearch=(record)=>save({...workspace,researchLibrary:[record,...(workspace.researchLibrary||[])]});
  const saveFacultyMember=(event,facultyId)=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.currentTarget));['skills','publications','projects','patents','availableDomains','qualifications','subjects','professionalMemberships','mentorshipTypes','preferredDistricts'].forEach(key=>{values[key]=(values[key]||'').split(',').map(value=>value.trim()).filter(Boolean)});values.mentorship=values.mentorship==='on';const member={...values,id:facultyId||`FAC-${Date.now()}`,updatedAt:new Date().toISOString()};const existing=workspace.facultyProfiles?.length?workspace.facultyProfiles:(workspace.faculty?.name?[{...workspace.faculty,id:workspace.faculty.id||'FAC-LEGACY'}]:[]);save({...workspace,facultyProfiles:facultyId?existing.map(item=>item.id===facultyId?member:item):[member,...existing],faculty:{}})};
  const removeFacultyMember=facultyId=>{const existing=workspace.facultyProfiles?.length?workspace.facultyProfiles:(workspace.faculty?.name?[{...workspace.faculty,id:workspace.faculty.id||'FAC-LEGACY'}]:[]);save({...workspace,facultyProfiles:existing.filter(item=>item.id!==facultyId),faculty:{}})};

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
          {!industryView && nav("teams", <UsersRound />, memberView ? "My Team" : "Teams")}
          {nav("solutions", <Lightbulb />, "Solutions")}
          {!memberView && !industryView && nav("profile", <Building2 />, "University Profile")}
          {!memberView && !industryView && nav("faculty", <UserRoundCog />, "Faculty Profile")}
          {industryView && nav("industry-profile", <Building2 />, "Industry Profile")}
          {nav("research-library", <FileSearch />, "Research Library")}
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
              <div className="challenge-grid">{visible.map(problem => <article key={problem.id}><div className="challenge-code">#{problem.id.slice(0,8).toUpperCase()}<span>{statusLabels[problem.status] || 'Open'}</span></div><h2>{problem.title}</h2><dl><div><dt>Domain</dt><dd>{problem.domain?.replaceAll('_',' ')}</dd></div><div><dt>Location</dt><dd>{problem.description?.match(/District: ([^\n]+)/)?.[1] || 'Jharkhand'}</dd></div><div><dt>Difficulty</dt><dd>{problem.severityScore >= 7 ? 'High' : problem.severityScore >= 4 ? 'Medium' : 'Open level'}</dd></div><div><dt>Ideas submitted</dt><dd>{problem._count?.comments||0}</dd></div></dl><div className="skill-tags"><span>Research</span><span>Field study</span><button onClick={()=>onNavigate(`/challenges/${problem.id}/solution`)}>View citizen ideas</button></div><button className="org-primary" onClick={()=>setApplyProblem(problem)}>Apply to challenge <ChevronRight/></button></article>)}</div>
            </>
          )}
          {page === "industry-challenges" && industryView && <><PageHead eyebrow="Industry collaboration" title="Validated Challenges" note="Discover government-validated problems where your organisation can contribute capability, capital or deployment support."/><ProblemFilters query={query} setQuery={setQuery} district={district} setDistrict={setDistrict} status={status} setStatus={setStatus}/><div className="challenge-grid industry-challenges">{validated.map(problem=><article key={problem.id}><div className="challenge-code">#{problem.id.slice(0,8).toUpperCase()}<span>Validated</span></div><h2>{problem.title}</h2><dl><div><dt>Domain</dt><dd>{problem.domain?.replaceAll('_',' ')}</dd></div><div><dt>District</dt><dd>{problem.description?.match(/District: ([^\n]+)/)?.[1] || 'Jharkhand'}</dd></div><div><dt>People affected</dt><dd>{problem.peopleAffected || 'Assessment pending'}</dd></div><div><dt>Status</dt><dd>{statusLabels[problem.status]}</dd></div></dl><button className="org-primary" onClick={()=>setCollaborationProblem(problem)}>Interested in collaboration <ChevronRight/></button></article>)}{!validated.length&&<Empty text="No validated challenges match the selected filters."/>}</div></>}
          {page === "collaborations" && industryView && <><PageHead eyebrow="Partnership pipeline" title="My Collaborations" note="Track every expression of interest and the capabilities offered by your organisation."/><div className="application-list">{workspace.collaborations.map(item=><article key={item.id}><span><Send/></span><div><small>{item.id} · {new Date(item.createdAt).toLocaleDateString()}</small><h3>{item.problemTitle}</h3><p>{item.contributionTypes.join(' · ')}</p></div><b>{item.status.replaceAll('_',' ')}</b></article>)}{!workspace.collaborations.length&&<Empty text="No collaboration interests submitted yet."/>}</div></>}
          {page === "csr-funding" && industryView && <CsrFunding problems={validated} commitments={workspace.fundingCommitments} onFund={setFundingProblem} onAdvance={advanceFunding}/>} 
          {page === "technology-matching" && industryView && <StartupParticipation problems={validated} matches={workspace.technologyMatches} technologies={workspace.industryProfile.availableTechnologies || []} onMatch={setTechnologyProblem}/>} 
          {page === "industry-profile" && industryView && <ProfileEditor title="Industry Profile" note="Show government and delivery partners exactly where your organisation can contribute." values={workspace.industryProfile} type="industryProfile" onSubmit={saveProfile}/>} 
          {page === "applications" && memberView && <><PageHead eyebrow="Student applications" title="My Applications" note="Follow applications submitted to open innovation challenges."/><div className="application-list">{workspace.applications.map(item=><article key={item.id}><span><Send/></span><div><small>{item.id} · {new Date(item.createdAt).toLocaleDateString()}</small><h3>{item.problemTitle}</h3><p>Skills: {item.skills} · Preferred team: {item.teamSize}</p></div><b>{item.status}</b></article>)}{!workspace.applications.length&&<Empty text="You have not applied to an open challenge yet."/>}</div></>}
          {page === "profile" && !memberView && <ProfileEditor title="University Profile" note="Keep institutional capabilities visible for accurate challenge matching." values={workspace.profile} type="profile" onSubmit={saveProfile}/>} 
          {page === "faculty" && !memberView && <FacultyDirectory profiles={workspace.facultyProfiles?.length?workspace.facultyProfiles:(workspace.faculty?.name?[{...workspace.faculty,id:workspace.faculty.id||'FAC-LEGACY'}]:[])} onSave={saveFacultyMember} onRemove={removeFacultyMember}/>}
          {page === "teams" && !industryView && (
            <>
              <PageHead
                eyebrow={memberView ? "College team workspace" : "Organisation structure"}
                title={memberView ? "My Team" : "Teams"}
                note={memberView ? "Submit ideas, research work and progress for problems assigned to your team." : "Create focused groups and assign multiple problems to the right expertise."}
                action={!memberView &&
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
                    <small>Faculty mentor: {team.mentor || 'Not assigned'}{team.mentorCollegeId&&` · ${team.mentorCollegeId}`}</small>
                    <strong>{team.members.length} members</strong>
                    <ul>
                      {team.members.slice(0, 4).map((member) => (
                        <li key={member.id||member.email}><b>{member.name || member.email}</b>{` · ${member.role||'Student'}`}{member.collegeId&&` · ${member.collegeId}`}</li>
                      ))}
                    </ul>
                    <div className="team-card-stats"><span>{(team.problemIds||[]).length}<small>Problems</small></span><span>{(team.ideas||[]).length}<small>Ideas</small></span><span>{team.progress||0}%<small>Progress</small></span></div>
                    <button className="team-manage" onClick={()=>setSelectedTeamId(team.id)}>Manage team <ChevronRight/></button>
                  </article>
                ))}
                {!workspace.teams.length && (
                  <Empty text="No teams yet. Create your first delivery team." />
                )}
              </div>
              {selectedTeamId&&<TeamWorkspace team={workspace.teams.find(team=>team.id===selectedTeamId)} problems={problems} memberView={memberView} user={user} onClose={()=>setSelectedTeamId(null)} onAddMember={addTeamMember} onAssign={assignTeamProblem} onIdea={addTeamIdea} onUpdate={addTeamUpdate}/>}
            </>
          )}
          {page === "solutions" && (
            <SolutionsWorkspace solutions={workspace.solutions} problems={cases} teams={workspace.teams} onCreate={setSolutionProblem} onUpdate={updateSolution}/>
          )}
          {page === "research-library"&&<ResearchLibrary records={workspace.researchLibrary||[]} problems={cases} teams={workspace.teams} solutions={workspace.solutions} onSave={saveResearch}/>}
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
            <label>Faculty college ID<input name="mentorCollegeId" required placeholder="e.g. FAC-JUT-1042"/></label>
            <label>
              Initial faculty and student members
              <textarea
                name="members"
                rows="6"
                placeholder={'Name | Role | Department | College ID | Email\nAsha | Student | Computer Science | STU-2026-014 | asha@college.edu\nDr Ravi | Faculty | Agriculture | FAC-008 | ravi@college.edu'}
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

const researchGuides=[
  {id:'GUIDE-01',type:'Field guide',title:'Community problem validation checklist',summary:'A practical checklist for stakeholder interviews, site observation, evidence quality and root-cause validation.',domain:'All domains',tags:['Field research','Validation'],source:'SamadhanSetu Knowledge Centre'},
  {id:'GUIDE-02',type:'Template',title:'Prototype testing and evidence plan',summary:'Define test users, success measures, risks, consent, observations and iteration decisions before a field pilot.',domain:'All domains',tags:['Prototype','Pilot'],source:'Innovation Practice Guide'},
  {id:'GUIDE-03',type:'Framework',title:'Social impact measurement framework',summary:'Connect outputs to outcomes using reach, adoption, accessibility, cost, sustainability and community feedback.',domain:'Public Administration',tags:['Impact','Evaluation'],source:'Impact Measurement Desk'},
  {id:'GUIDE-04',type:'Guide',title:'Responsible research with communities',summary:'Simple safeguards for informed participation, privacy, inclusive design and respectful documentation.',domain:'Healthcare',tags:['Ethics','Community'],source:'Research Ethics Guide'},
];
function ResearchLibrary({records,problems,teams,solutions,onSave}){
  const [query,setQuery]=useState('')
  const [type,setType]=useState('All types')
  const [showForm,setShowForm]=useState(false)
  const items=useMemo(()=>[...records,...researchGuides],[records])
  const types=['All types',...new Set(items.map(item=>item.type))]
  const filtered=useMemo(()=>items.filter(item=>(type==='All types'||item.type===type)&&`${item.title} ${item.summary} ${item.domain} ${(item.tags||[]).join(' ')}`.toLowerCase().includes(query.toLowerCase())),[items,type,query])
  const submit=event=>{event.preventDefault();const data=new FormData(event.currentTarget);const problem=problems.find(item=>item.id===data.get('problemId'));onSave({id:`RES-${Date.now()}`,title:data.get('title'),type:data.get('type'),summary:data.get('summary'),findings:data.get('findings'),source:data.get('source'),url:data.get('url'),problemId:data.get('problemId'),problemTitle:problem?.title,domain:problem?.domain?.replaceAll('_',' ')||'General',tags:String(data.get('tags')||'').split(',').map(item=>item.trim()).filter(Boolean),addedBy:data.get('addedBy'),createdAt:new Date().toISOString()});event.currentTarget.reset();setShowForm(false)}
  return <div className="research-library-page"><PageHead eyebrow="Evidence and learning" title="Research Library" note="Collect useful evidence, field findings and references where teams can turn knowledge into better solutions." action={<button className="org-primary" onClick={()=>setShowForm(true)}><Plus/>Add research</button>}/>
    <div className="research-metrics"><article><span><FileText/></span><div><strong>{records.length}</strong><small>Institution records</small></div></article><article><span><ClipboardList/></span><div><strong>{new Set(records.map(item=>item.problemId).filter(Boolean)).size}</strong><small>Challenges supported</small></div></article><article><span><UsersRound/></span><div><strong>{teams.length}</strong><small>Research teams</small></div></article><article><span><Lightbulb/></span><div><strong>{solutions.length}</strong><small>Solution proposals</small></div></article></div>
    <section className="research-purpose"><span><BookOpen/></span><div><strong>Research should answer a decision.</strong><p>Save what the team learned, where it came from, and how it changes the proposed solution—not just files without context.</p></div><ol><li>Understand the problem</li><li>Collect evidence</li><li>Test assumptions</li><li>Inform the solution</li></ol></section>
    <div className="research-toolbar"><label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search research, findings, domain or tag…"/></label><select value={type} onChange={event=>setType(event.target.value)}>{types.map(item=><option key={item}>{item}</option>)}</select><span>{filtered.length} resources</span></div>
    <div className="research-layout"><aside><h2>Quick collections</h2>{['All resources','Field research','Literature review','Prototype evidence','Community feedback','Policy and standards'].map((item,index)=><button className={index===0?'active':''} key={item}><span>{index+1}</span>{item}<b>{index===0?items.length:'—'}</b></button>)}<div><strong>Good research record</strong><p>Include the question, method, source, key finding and implication for the solution.</p></div></aside><section className="research-cards">{filtered.map(item=><article key={item.id}><header><span>{item.type}</span><small>{item.createdAt?new Date(item.createdAt).toLocaleDateString():item.source}</small></header><h2>{item.title}</h2><p>{item.summary}</p>{item.findings&&<blockquote><strong>Key finding</strong>{item.findings}</blockquote>}<div className="research-tags">{(item.tags||[]).map(tag=><span key={tag}>{tag}</span>)}</div><footer><span>{item.problemTitle?<><ClipboardList/>{item.problemTitle}</>:<><BookOpen/>{item.domain}</>}</span>{item.url&&<a href={item.url} target="_blank" rel="noreferrer"><Link2/>Open source</a>}</footer></article>)}{!filtered.length&&<div className="research-empty"><FileSearch/><h3>No research matches your search</h3><p>Try another keyword or add a new evidence record.</p></div>}</section></div>
    {showForm&&<div className="org-modal-bg" onMouseDown={()=>setShowForm(false)}><section className="org-modal research-modal" onMouseDown={event=>event.stopPropagation()}><button className="org-modal-close" onClick={()=>setShowForm(false)}><X/></button><h2>Add to research library</h2><p>Record a useful source or finding and connect it to the problem it informs.</p><form onSubmit={submit}><div><label>Resource type<select name="type" required><option>Field research</option><option>Literature review</option><option>Community feedback</option><option>Dataset</option><option>Policy / standard</option><option>Prototype evidence</option><option>Case study</option></select></label><label>Related challenge<select name="problemId" defaultValue=""><option value="">General research</option>{problems.map(problem=><option key={problem.id} value={problem.id}>{problem.title}</option>)}</select></label></div><label>Research title<input name="title" required placeholder="e.g. Water quality observations from five villages"/></label><label>Purpose and method<textarea name="summary" required rows="3" placeholder="What question was studied, how evidence was collected and who participated?"/></label><label>Key finding and solution implication<textarea name="findings" required rows="4" placeholder="What did the team learn, and what should change in the proposed solution?"/></label><div><label>Source / publisher<input name="source" required placeholder="e.g. Team field survey, WHO, journal name"/></label><label>Source link<input name="url" type="url" placeholder="https://…"/></label></div><div><label>Tags<input name="tags" placeholder="water quality, sensors, field data"/></label><label>Added by<input name="addedBy" required placeholder="Name or college ID"/></label></div><button className="org-primary"><CheckCircle2/>Save research record</button></form></section></div>}
  </div>
}

const solutionStages=['DRAFT','SUBMITTED','UNDER_REVIEW','PROTOTYPE','PILOT_TESTING','APPROVED','DEPLOYED'];
function SolutionsWorkspace({solutions,problems,teams,onCreate,onUpdate}){
  const [selectedId,setSelectedId]=useState(null)
  const [filter,setFilter]=useState('ALL')
  const selected=solutions.find(solution=>solution.id===selectedId)
  const teamProblemIds=new Set(teams.flatMap(team=>team.problemIds||[]))
  const assigned=problems.filter(problem=>problem.teamId||teamProblemIds.has(problem.id))
  const visible=filter==='ALL'?solutions:solutions.filter(solution=>(solution.status||'SUBMITTED')===filter)
  const average=solutions.length?Math.round(solutions.reduce((sum,item)=>sum+Number(item.progress||0),0)/solutions.length):0
  const advance=(solution,event)=>{event.preventDefault();const data=new FormData(event.currentTarget);const milestone={id:`MS-${Date.now()}`,title:data.get('milestone'),note:data.get('note'),progress:Number(data.get('progress')),createdAt:new Date().toISOString()};onUpdate(solution.id,{progress:milestone.progress,status:data.get('status'),milestones:[milestone,...(solution.milestones||[])]});event.currentTarget.reset()}
  return <div className="solutions-workspace"><PageHead eyebrow="Research and delivery" title="Solution Workspace" note="Turn assigned community problems into reviewed, tested and deployable solutions."/>
    <div className="solution-metrics"><article><span>Solution proposals</span><strong>{solutions.length}</strong><small>Formal submissions</small></article><article><span>Average progress</span><strong>{average}%</strong><small>Across all active solutions</small></article><article><span>Under review</span><strong>{solutions.filter(item=>item.status==='UNDER_REVIEW').length}</strong><small>Awaiting evaluation</small></article><article><span>Pilot or deployed</span><strong>{solutions.filter(item=>['PILOT_TESTING','APPROVED','DEPLOYED'].includes(item.status)).length}</strong><small>Moving into implementation</small></article></div>
    <section className="solution-ready"><div><span><Lightbulb/></span><div><h2>Problems ready for solution development</h2><p>Start a structured proposal from a problem assigned to a college team.</p></div></div><div>{assigned.filter(problem=>!solutions.some(solution=>solution.problemId===problem.id)).slice(0,3).map(problem=>{const team=teams.find(item=>item.id===problem.teamId||(item.problemIds||[]).includes(problem.id));return <button key={problem.id} onClick={()=>onCreate({...problem,teamId:team?.id})}><span>{problem.title}</span><small>{team?.name||'Assigned team'}</small><Plus/></button>})}{!assigned.length&&<small>Assign a problem to a team before creating a formal solution.</small>}</div></section>
    <div className="solution-toolbar"><div><h2>Proposal pipeline</h2><p>Review documentation, milestones and delivery readiness.</p></div><select value={filter} onChange={event=>setFilter(event.target.value)}><option value="ALL">All stages</option>{solutionStages.map(stage=><option value={stage} key={stage}>{stage.replaceAll('_',' ')}</option>)}</select></div>
    <div className="solution-records">{visible.map(solution=>{const problem=problems.find(item=>item.id===solution.problemId);const team=teams.find(item=>item.id===(solution.teamId||problem?.teamId));return <article key={solution.id}><div className="solution-record-head"><span>{solution.id}</span><b className={`solution-stage stage-${(solution.status||'submitted').toLowerCase()}`}>{(solution.status||'SUBMITTED').replaceAll('_',' ')}</b></div><h3>{solution.title}</h3><p>{solution.proposedSolution||solution.proposal}</p><dl><div><dt>Challenge</dt><dd>{solution.problemTitle||problem?.title||'Linked problem'}</dd></div><div><dt>Team</dt><dd>{team?.name||solution.submittedBy||'Organisation team'}</dd></div><div><dt>Estimated cost</dt><dd>{solution.estimatedCost||'Under assessment'}</dd></div><div><dt>Last updated</dt><dd>{new Date(solution.milestones?.[0]?.createdAt||solution.createdAt).toLocaleDateString()}</dd></div></dl><div className="solution-progress"><div><span>Delivery progress</span><strong>{solution.progress||0}%</strong></div><div><i style={{width:`${solution.progress||0}%`}}/></div></div><button onClick={()=>setSelectedId(solution.id)}>Open proposal <ChevronRight/></button></article>})}{!visible.length&&<div className="solution-empty"><Lightbulb/><h3>{solutions.length?'No proposals at this stage':'No solution proposals yet'}</h3><p>{solutions.length?'Choose another pipeline stage.':'Assign a problem to a team, then create its structured solution proposal.'}</p></div>}</div>
    {selected&&<div className="solution-detail-bg" onMouseDown={()=>setSelectedId(null)}><section className="solution-detail" onMouseDown={event=>event.stopPropagation()}><button className="org-modal-close" onClick={()=>setSelectedId(null)}><X/></button><header><span>{selected.id} · {(selected.status||'SUBMITTED').replaceAll('_',' ')}</span><h2>{selected.title}</h2><p>{selected.problemTitle||problems.find(item=>item.id===selected.problemId)?.title}</p></header><div className="solution-detail-body"><section><SolutionField title="Problem understanding" value={selected.problemUnderstanding}/><SolutionField title="Proposed solution" value={selected.proposedSolution||selected.proposal}/><div className="solution-detail-grid"><SolutionField title="Technology" value={selected.technology}/><SolutionField title="Architecture" value={selected.architecture}/><SolutionField title="Innovation" value={selected.innovation}/><SolutionField title="Expected impact" value={selected.expectedImpact}/><SolutionField title="Implementation plan" value={selected.implementationPlan}/><SolutionField title="Prototype plan" value={selected.prototypePlan}/><SolutionField title="Risk analysis" value={selected.riskAnalysis}/><SolutionField title="Required resources" value={selected.requiredResources}/><SolutionField title="Scalability" value={selected.scalability}/><SolutionField title="Sustainability" value={selected.sustainability}/></div></section><aside><form onSubmit={event=>advance(selected,event)}><h3>Add milestone update</h3><label>Lifecycle stage<select name="status" defaultValue={selected.status||'SUBMITTED'}>{solutionStages.map(stage=><option value={stage} key={stage}>{stage.replaceAll('_',' ')}</option>)}</select></label><label>Progress (%)<input name="progress" type="number" min="0" max="100" defaultValue={selected.progress||0} required/></label><label>Milestone achieved<input name="milestone" required placeholder="e.g. Field prototype completed"/></label><label>Evidence / update<textarea name="note" rows="4" required/></label><button className="org-primary"><Send/>Save milestone</button></form><div className="solution-timeline"><h3>Milestone history</h3>{(selected.milestones||[]).map(item=><div key={item.id}><i/><p><strong>{item.progress}% · {item.title}</strong><span>{item.note}</span><small>{new Date(item.createdAt).toLocaleDateString()}</small></p></div>)}{!(selected.milestones||[]).length&&<p className="no-milestones">No milestone updates yet.</p>}</div></aside></div></section></div>}
  </div>
}
function SolutionField({title,value}){return value&&<article className="solution-field"><h3>{title}</h3><p>{value}</p></article>}

function TeamWorkspace({team,problems,onClose,onAddMember,onAssign,onIdea,onUpdate}){
  const [tab,setTab]=useState('members')
  if(!team)return null
  const assigned=(team.problemIds||[]).map(id=>problems.find(problem=>problem.id===id)).filter(Boolean)
  const problemTitle=id=>problems.find(problem=>problem.id===id)?.title||'Assigned problem'
  return <div className="team-workspace-bg" onMouseDown={onClose}><section className="team-workspace" onMouseDown={event=>event.stopPropagation()}><button className="org-modal-close" onClick={onClose}><X/></button><header><span><UsersRound/></span><div><small>{team.id}</small><h2>{team.name}</h2><p>{team.focus} · Faculty mentor: {team.mentor}</p></div><strong>{team.progress||0}%<small>Overall progress</small></strong></header><nav>{[['members','Members'],['problems','Assigned problems'],['ideas','Idea submissions'],['progress','Work & progress']].map(([id,label])=><button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}>{label}<b>{id==='members'?team.members.length:id==='problems'?assigned.length:id==='ideas'?(team.ideas||[]).length:(team.updates||[]).length}</b></button>)}</nav>
    {tab==='members'&&<div className="team-workspace-body"><div className="team-member-list">{team.members.map(member=><article key={member.id||member.email}><span>{member.name?.[0]||'M'}</span><div><strong>{member.name}</strong><small>{member.role||'Student'} · {member.discipline||'Multidisciplinary'}</small></div><p><b>{member.collegeId}</b><small>{member.email||'Email not provided'}</small></p></article>)}</div><form className="team-side-form" onSubmit={event=>onAddMember(team.id,event)}><h3>Add team member</h3><p>Use an official college ID for faculty and students.</p><label>Full name<input name="name" required/></label><div><label>Role<select name="role"><option>Student</option><option>Faculty</option><option>Research Scholar</option></select></label><label>College ID<input name="collegeId" required placeholder="STU-2026-014"/></label></div><label>Department / discipline<input name="discipline" required/></label><label>College email<input name="email" type="email" placeholder="name@college.edu"/></label><button className="org-primary"><Plus/>Add member</button></form></div>}
    {tab==='problems'&&<div className="team-workspace-body"><div className="team-assignment-list">{assigned.map(problem=><article key={problem.id}><span><ClipboardList/></span><div><small>{problem.id} · {problem.domain?.replaceAll('_',' ')}</small><h3>{problem.title}</h3><p>{statusLabels[problem.status]||problem.status}</p></div></article>)}{!assigned.length&&<Empty text="No problems assigned to this team yet."/>}</div><form className="team-side-form" onSubmit={event=>onAssign(team.id,event)}><h3>Assign a problem</h3><p>Connect this multidisciplinary team to a verified community need.</p><label>Problem<select name="problemId" required defaultValue=""><option value="">Select problem</option>{problems.filter(problem=>!(team.problemIds||[]).includes(problem.id)).map(problem=><option value={problem.id} key={problem.id}>{problem.title}</option>)}</select></label><button className="org-primary"><CheckCircle2/>Assign to team</button></form></div>}
    {tab==='ideas'&&<div className="team-workspace-body"><div className="team-idea-list">{(team.ideas||[]).map(idea=><article key={idea.id}><small>{problemTitle(idea.problemId)} · {new Date(idea.createdAt).toLocaleDateString()}</small><h3>{idea.title}</h3><p>{idea.description}</p><b>{idea.submittedBy} · {idea.collegeId}</b></article>)}{!(team.ideas||[]).length&&<Empty text="Team members have not submitted an idea yet."/>}</div><form className="team-side-form" onSubmit={event=>onIdea(team.id,event)}><h3>Submit a team idea</h3><p>Faculty and students can record early approaches before a full proposal.</p><label>Assigned problem<select name="problemId" required>{assigned.map(problem=><option value={problem.id} key={problem.id}>{problem.title}</option>)}</select></label><label>Idea title<input name="title" required/></label><label>Idea description<textarea name="description" rows="5" required/></label><div><label>Submitted by<input name="submittedBy" required/></label><label>College ID<input name="collegeId" required/></label></div><button className="org-primary" disabled={!assigned.length}><Lightbulb/>Submit idea</button></form></div>}
    {tab==='progress'&&<div className="team-workspace-body"><div className="team-progress-list">{(team.updates||[]).map(update=><article key={update.id}><div><span style={{width:`${update.progress}%`}}/></div><strong>{update.progress}% · {problemTitle(update.problemId)}</strong><p>{update.summary}</p><small>{update.submittedBy} · {update.collegeId} · {new Date(update.createdAt).toLocaleDateString()}</small></article>)}{!(team.updates||[]).length&&<Empty text="No research or progress updates submitted yet."/>}</div><form className="team-side-form" onSubmit={event=>onUpdate(team.id,event)}><h3>Add work update</h3><p>Record research, prototype and field-work progress.</p><label>Assigned problem<select name="problemId" required>{assigned.map(problem=><option value={problem.id} key={problem.id}>{problem.title}</option>)}</select></label><label>Progress (%)<input name="progress" type="number" min="0" max="100" required defaultValue={team.progress||10}/></label><label>Work completed<textarea name="summary" rows="5" required placeholder="Research completed, prototype changes, findings or blockers"/></label><div><label>Submitted by<input name="submittedBy" required/></label><label>College ID<input name="collegeId" required/></label></div><button className="org-primary" disabled={!assigned.length}><Send/>Post update</button></form></div>}
  </section></div>
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
  if(type==='profile')return <UniversityProfileForm values={values} onSubmit={event=>onSubmit(event,type)}/>
  if(type==='faculty')return <FacultyProfileForm values={values} onSubmit={event=>onSubmit(event,type)}/>
  const universityFields = [['name','Institution name'],['location','Location / address'],['district','District'],['institutionType','Institution type'],['departments','Departments'],['courses','Courses'],['researchAreas','Research areas'],['labs','Labs'],['incubators','Incubators'],['innovationCentres','Innovation centres'],['patents','Patents'],['startups','Startups'],['previousProjects','Previous projects']]
  const facultyFields = [['name','Faculty name'],['department','Department'],['researchArea','Research area'],['skills','Skills'],['publications','Publications'],['projects','Projects'],['patents','Patents'],['availableDomains','Available domains']]
  const industryFields = [['organization','Organization'],['industry','Industry'],['sector','Sector'],['location','Location'],['technicalExpertise','Technical expertise'],['csrFocus','CSR focus'],['fundingCapacity','Funding capacity'],['mentorshipAreas','Mentorship areas'],['availableTechnologies','Available technologies'],['labs','Labs'],['equipment','Equipment'],['pastProjects','Past projects'],['preferredDistricts','Preferred districts']]
  const fields = type === 'profile' ? universityFields : type === 'industryProfile' ? industryFields : facultyFields
  const eyebrow = type === 'profile' ? 'Institution information' : type === 'industryProfile' ? 'Industry capabilities' : 'Academic expertise'
  return <><PageHead eyebrow={eyebrow} title={title} note={note}/><form className="profile-form" onSubmit={event=>onSubmit(event,type)}><div className="profile-form-grid">{fields.map(([name,label])=><label key={name}>{label}{name === 'district' ? <select name={name} defaultValue={values[name] || ''}><option value="">Select district</option>{districts.map(item=><option key={item}>{item}</option>)}</select> : name === 'institutionType' ? <select name={name} defaultValue={values[name] || ''}><option value="">Select type</option><option>Central University</option><option>State University</option><option>Private University</option><option>Engineering College</option><option>Medical College</option><option>Research Institute</option></select> : <textarea name={name} rows={['location','previousProjects','publications','projects','pastProjects'].includes(name) ? 3 : 2} defaultValue={Array.isArray(values[name]) ? values[name].join(', ') : values[name] || ''} placeholder={['name','organization','industry','sector','location','researchArea','department'].includes(name) ? `Enter ${label.toLowerCase()}` : 'Separate multiple entries with commas'}/>}</label>)}</div>{type === 'faculty' && <label className="mentor-check"><input type="checkbox" name="mentorship" defaultChecked={values.mentorship}/> Available for mentorship</label>}<button className="org-primary"><CheckCircle2/> Save profile</button></form></>
}

function FacultyDirectory({profiles,onSave,onRemove}){
  const [editing,setEditing]=useState(null)
  const available=profiles.filter(item=>item.mentorship&&item.mentorshipStatus!=='UNAVAILABLE').length
  const departments=new Set(profiles.map(item=>item.department).filter(Boolean)).size
  return <div className="faculty-directory"><PageHead eyebrow="Academic expertise network" title="Faculty Directory" note="Maintain individual profiles for faculty mentors, researchers and domain experts." action={<button className="org-primary" onClick={()=>setEditing({})}><Plus/>Add faculty member</button>}/><div className="faculty-directory-metrics"><article><span>Total faculty</span><strong>{profiles.length}</strong><small>Expert profiles</small></article><article><span>Available mentors</span><strong>{available}</strong><small>Accepting challenge teams</small></article><article><span>Departments</span><strong>{departments}</strong><small>Academic disciplines represented</small></article><article><span>Research outputs</span><strong>{profiles.reduce((sum,item)=>sum+(item.publications?.length||0)+(item.patents?.length||0),0)}</strong><small>Publications and patents listed</small></article></div><div className="faculty-directory-grid">{profiles.map(member=><article key={member.id}><header><span>{member.name?.split(' ').filter(Boolean).slice(0,2).map(part=>part[0]).join('')||'FM'}</span><div><small>{member.collegeId||'Faculty ID not added'}</small><h2>{member.name}</h2><p>{member.designation||'Faculty member'} · {member.department||'Department not added'}</p></div><b className={member.mentorship&&member.mentorshipStatus!=='UNAVAILABLE'?'available':'unavailable'}>{member.mentorship&&member.mentorshipStatus!=='UNAVAILABLE'?'Available':'Unavailable'}</b></header><div className="faculty-card-body"><div><strong>Research focus</strong><p>{Array.isArray(member.researchArea)?member.researchArea.join(' · '):member.researchArea||'Not specified'}</p></div><div><strong>Expertise</strong><p>{(member.skills||[]).slice(0,4).map(skill=><span key={skill}>{skill}</span>)}</p></div></div><footer><span>{member.experienceYears||'Experience not added'}</span><button onClick={()=>setEditing(member)}>View and edit <ChevronRight/></button></footer></article>)}{!profiles.length&&<div className="faculty-directory-empty"><UserRoundCog/><h2>Add your first faculty expert</h2><p>Create separate profiles for mentors and researchers so challenges can be matched to the right expertise.</p><button className="org-primary" onClick={()=>setEditing({})}><Plus/>Add faculty member</button></div>}</div>{editing&&<div className="faculty-editor-bg" onMouseDown={()=>setEditing(null)}><section className="faculty-editor" onMouseDown={event=>event.stopPropagation()}><button className="org-modal-close" onClick={()=>setEditing(null)}><X/></button><div className="faculty-editor-title"><span>{editing.id?'EDIT FACULTY PROFILE':'NEW FACULTY PROFILE'}</span><h2>{editing.id?editing.name:'Add faculty member'}</h2><p>Record verified academic expertise and mentorship availability.</p></div><FacultyProfileForm embedded values={editing} onSubmit={event=>{onSave(event,editing.id);setEditing(null)}}/>{editing.id&&<button className="faculty-remove" onClick={()=>{if(window.confirm(`Remove ${editing.name} from the faculty directory?`)){onRemove(editing.id);setEditing(null)}}}>Remove faculty profile</button>}</section></div>}</div>
}

function FacultyProfileForm({values,onSubmit,embedded=false}){
  const field=(name,label,placeholder,type='text')=><label>{label}<input name={name} type={type} defaultValue={values[name]||''} placeholder={placeholder}/></label>
  const list=(name,label,placeholder,rows=2)=><label>{label}<textarea name={name} rows={rows} defaultValue={Array.isArray(values[name])?values[name].join(', '):values[name]||''} placeholder={placeholder}/><small>Separate multiple entries with commas</small></label>
  const essentials=['name','collegeId','department','designation','researchArea','skills','officialEmail','availableDomains'];
  const completed=essentials.filter(name=>values[name]?.length).length
  return <div className={`faculty-profile-page ${embedded?'embedded':''}`}>{!embedded&&<PageHead eyebrow="Academic expertise" title="Faculty Profile" note="Present your expertise clearly so teams and community challenges can find the right mentor."/>}{!embedded&&<div className="faculty-profile-hero"><div className="faculty-profile-avatar"><UserRoundCog/></div><div><span>FACULTY CAPABILITY PROFILE</span><h2>{values.name||'Your academic profile'}</h2><p>{values.designation||'Faculty member'}{values.department&&` · ${values.department}`}</p></div><aside><strong>{Math.round(completed/essentials.length*100)}%</strong><div><i style={{width:`${completed/essentials.length*100}%`}}/></div><small>Profile completion</small></aside></div>}
    <form className="faculty-profile-form" onSubmit={onSubmit}>
      <section><header><span>01</span><div><h2>Faculty identity</h2><p>Official academic and institutional information.</p></div></header><div className="faculty-fields">{field('name','Faculty name','e.g. Dr. Ananya Sinha')}{field('collegeId','Faculty / employee ID','e.g. FAC-JUT-1042')}{field('designation','Designation','e.g. Associate Professor')} {field('department','Department','e.g. Computer Science and Engineering')}{field('officialEmail','Official email','e.g. ananya.sinha@university.ac.in','email')}{field('phone','Contact number','e.g. +91 98765 43210','tel')}{field('orcid','ORCID','e.g. 0000-0002-1825-0097')}{field('googleScholar','Google Scholar profile','e.g. https://scholar.google.com/citations?...','url')}</div></section>
      <section><header><span>02</span><div><h2>Academic expertise</h2><p>Help the platform match you with relevant problems and teams.</p></div></header><div className="faculty-fields">{list('qualifications','Qualifications','e.g. PhD in Computer Science, M.Tech in Information Technology')}{list('subjects','Subjects taught','e.g. Machine Learning, Data Structures, IoT')}{list('researchArea','Primary research areas','e.g. Artificial Intelligence, Rural Healthcare, Edge Computing',3)}{list('skills','Technical and professional skills','e.g. Python, GIS, Embedded Systems, Design Research',3)}{list('availableDomains','Available challenge domains','e.g. Healthcare, Agriculture, Digital Governance')}{list('preferredDistricts','Preferred field-work districts','e.g. Ranchi, Khunti, Gumla')}</div></section>
      <section><header><span>03</span><div><h2>Research and innovation</h2><p>Summarise work that demonstrates your research capability.</p></div></header><div className="faculty-fields">{list('publications','Selected publications','e.g. Offline-first health monitoring for rural clinics — IEEE, 2025',4)}{list('projects','Research and community projects','e.g. Smart irrigation pilot — Principal Investigator — 2024',4)}{list('patents','Patents and intellectual property','e.g. Low-cost water quality sensor — Patent granted 2025',3)}{list('professionalMemberships','Professional memberships','e.g. IEEE, CSI, Institution of Engineers India')}{field('publicationCount','Total publications','e.g. 24','number')}{field('experienceYears','Teaching / research experience','e.g. 12 years')}</div></section>
      <section><header><span>04</span><div><h2>Mentorship availability</h2><p>Define how and when students or multidisciplinary teams can engage you.</p></div></header><div className="faculty-fields"><label>Mentorship status<select name="mentorshipStatus" defaultValue={values.mentorshipStatus||'AVAILABLE'}><option value="AVAILABLE">Available for mentorship</option><option value="LIMITED">Limited availability</option><option value="UNAVAILABLE">Currently unavailable</option></select></label>{field('weeklyHours','Hours available per week','e.g. 4','number')}{list('mentorshipTypes','Mentorship offered','e.g. Research guidance, Prototype review, Field testing, Startup mentoring')}{field('consultationMode','Preferred consultation mode','e.g. Campus meetings and video calls')}{field('availabilityNote','Availability note','e.g. Tuesday and Thursday, 3–5 PM')}<label className="faculty-check"><input type="checkbox" name="mentorship" defaultChecked={values.mentorship}/><span><strong>Accept new challenge teams</strong><small>Allow coordinators to invite you as faculty mentor.</small></span></label></div></section>
      <section><header><span>05</span><div><h2>Short professional introduction</h2><p>This summary appears when teams review potential mentors.</p></div></header><div className="faculty-fields"><label className="wide-field">Faculty bio<textarea name="bio" rows="5" defaultValue={values.bio||''} placeholder="e.g. I work at the intersection of AI, public health and accessible technology, with 12 years of experience mentoring field-oriented student projects."/></label><label className="wide-field">Current research interest<textarea name="currentResearch" rows="4" defaultValue={values.currentResearch||''} placeholder="e.g. Developing offline diagnostic support tools for primary healthcare centres in low-connectivity districts."/></label></div></section>
      <div className="faculty-form-actions"><div><ShieldCheck/><span><strong>Use verified academic information</strong><small>Your profile supports mentor and challenge matching.</small></span></div><button className="org-primary"><CheckCircle2/>{values.id?'Update faculty profile':'Add faculty member'}</button></div>
    </form>
  </div>
}

function UniversityProfileForm({values,onSubmit}){
  const text=(name,label,placeholder,type='text')=><label>{label}<input name={name} type={type} defaultValue={values[name]||''} placeholder={placeholder}/></label>
  const list=(name,label,placeholder,rows=2)=><label>{label}<textarea name={name} rows={rows} defaultValue={Array.isArray(values[name])?values[name].join(', '):values[name]||''} placeholder={placeholder}/><small>Separate multiple entries with commas</small></label>
  const completion=['name','institutionType','district','website','departments','courses','researchAreas'].filter(field=>values[field]?.length).length
  return <div className="university-profile-page"><PageHead eyebrow="Institution information" title="University Profile" note="Build a complete capability profile so relevant community challenges reach the right departments and experts."/><div className="university-profile-banner"><div><span><Building2/></span><div><small>PROFILE COMPLETION</small><strong>{values.name||'Your institution'}</strong><p>Complete academic, research and contact details to improve challenge matching.</p></div></div><div><strong>{Math.round(completion/7*100)}%</strong><span><i style={{width:`${completion/7*100}%`}}/></span><small>{completion} of 7 essential sections available</small></div></div>
    <form className="university-profile-form" onSubmit={onSubmit}>
      <section><header><span>01</span><div><h2>Institution identity</h2><p>Official details used across the portal.</p></div></header><div className="university-fields">{text('name','University / college name','e.g. Birla Institute of Technology, Mesra')}{text('shortName','Short name','e.g. BIT Mesra')}<label>Institution type<select name="institutionType" defaultValue={values.institutionType||''} required><option value="">Select institution type</option><option>Central University</option><option>State University</option><option>Private University</option><option>Deemed University</option><option>Autonomous College</option><option>Affiliated College</option><option>Engineering College</option><option>Medical College</option><option>Research Institute</option></select></label>{text('establishedYear','Established year','e.g. 1955','number')}{text('affiliation','Affiliation / governing university','e.g. Jharkhand University of Technology')}{text('aisheCode','AISHE institution code','e.g. U-0202')}{text('ugcRecognition','UGC recognition','e.g. Recognised under Section 2(f) and 12(B)')}</div></section>
      <section><header><span>02</span><div><h2>Contact and location</h2><p>Help government departments and collaborators reach the institution.</p></div></header><div className="university-fields">{text('website','Official website','e.g. https://www.bitmesra.ac.in','url')}{text('officialEmail','Official email','e.g. innovation@university.ac.in','email')}{text('phone','Contact number','e.g. +91 651 227 5444','tel')}<label>District<select name="district" defaultValue={values.district||''} required><option value="">Select district</option>{districts.map(item=><option key={item}>{item}</option>)}</select></label><label className="wide-field">Campus address<textarea name="location" rows="3" defaultValue={values.location||''} placeholder="e.g. Mesra, Ranchi, Jharkhand 835215"/></label>{text('state','State','Jharkhand')}{text('pincode','PIN code','e.g. 835215')}</div></section>
      <section><header><span>03</span><div><h2>Academics and people</h2><p>Describe teaching strengths and available disciplines.</p></div></header><div className="university-fields">{list('departments','Departments','e.g. Computer Science, Civil Engineering, Agriculture, Management',3)}{list('courses','Courses offered','e.g. B.Tech, M.Tech, MBA, B.Sc Agriculture, PhD',3)}{list('specializations','Key specializations','e.g. Artificial Intelligence, Water Resources, Rural Management')}{text('facultyCount','Number of faculty','e.g. 320','number')}{text('studentCount','Number of students','e.g. 6500','number')}{text('researchScholarCount','Research scholars','e.g. 240','number')}</div></section>
      <section><header><span>04</span><div><h2>Research and innovation</h2><p>Capabilities used to match real-world challenges.</p></div></header><div className="university-fields">{list('researchAreas','Research areas','e.g. IoT, Public Health, Renewable Energy, Tribal Studies',3)}{list('labs','Laboratories','e.g. IoT Lab, Water Quality Lab, AI Research Lab',3)}{list('incubators','Incubators','e.g. Technology Business Incubator')}{list('innovationCentres','Innovation centres','e.g. Institution Innovation Council, Design Innovation Centre')}{list('patents','Patents and IP','e.g. 18 granted patents, 7 applications')}{list('startups','Supported startups','e.g. AquaSense, RuralHealth AI')}</div></section>
      <section><header><span>05</span><div><h2>Quality, facilities and experience</h2><p>Show readiness for research, prototyping and field deployment.</p></div></header><div className="university-fields">{list('accreditations','Accreditations and rankings','e.g. NAAC A+, NBA accredited, NIRF rank 53')}{list('facilities','Major facilities and equipment','e.g. Fabrication lab, 3D printers, GIS centre, testing facility',3)}{list('previousProjects','Previous community or industry projects','e.g. Solar irrigation pilot in Ranchi; tribal-language learning platform',4)}{list('collaborationInterests','Preferred collaboration areas','e.g. Mentorship, Prototyping, Field Testing, Technology Transfer')}</div></section>
      <div className="university-form-actions"><div><ShieldCheck/><span><strong>Institutional information</strong><small>Use verified and officially approved details.</small></span></div><button className="org-primary"><CheckCircle2/>Save university profile</button></div>
    </form>
  </div>
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
  const teams=workspace.teams||[];const solutions=workspace.solutions||[];const research=workspace.researchLibrary||[]
  const live=problems.filter(problem=>!["RESOLVED","REJECTED"].includes(problem.status)).length
  const assigned=problems.filter(problem=>problem.teamId||teams.some(team=>(team.problemIds||[]).includes(problem.id))).length
  const avgProgress=solutions.length?Math.round(solutions.reduce((sum,item)=>sum+Number(item.progress||0),0)/solutions.length):0
  const members=teams.reduce((sum,team)=>sum+(team.members?.length||0),0)
  const ideas=teams.reduce((sum,team)=>sum+(team.ideas?.length||0),0)
  const updates=teams.reduce((sum,team)=>sum+(team.updates?.length||0),0)
  const domainData=Object.entries(problems.reduce((counts,problem)=>{const domain=(problem.domain||'OTHER').replaceAll('_',' ');counts[domain]=(counts[domain]||0)+1;return counts},{})).sort((a,b)=>b[1]-a[1]).slice(0,5)
  const maxDomain=Math.max(...domainData.map(([,count])=>count),1)
  const readiness=problems.length?Math.round(((assigned/problems.length)*45)+(Math.min(solutions.length/Math.max(assigned,1),1)*35)+(Math.min(research.length/Math.max(solutions.length,1),1)*20)):0
  const recent=[...solutions.map(item=>({id:item.id,title:item.title,text:`Solution moved to ${(item.status||'SUBMITTED').replaceAll('_',' ').toLowerCase()} · ${item.progress||0}%`,date:item.milestones?.[0]?.createdAt||item.createdAt,type:'solution'})),...teams.flatMap(team=>(team.updates||[]).map(item=>({id:item.id,title:team.name,text:`${item.summary} · ${item.progress}%`,date:item.createdAt,type:'update'}))),...research.map(item=>({id:item.id,title:item.title,text:`Research added · ${item.type}`,date:item.createdAt,type:'research'}))].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5)
  return <div className="org-analytics-overview">
    <section className="org-overview-hero"><div><span>{memberView?'TEAM INNOVATION WORKSPACE':'ORGANISATION COMMAND CENTRE'}</span><h1>{memberView?'Turn research into impact.':'From challenge to measurable impact.'}</h1><p>{memberView?'See assigned work, team progress and what needs your contribution next.':'Monitor institutional capacity, challenge assignments, research and solution delivery in one place.'}</p><div><button onClick={()=>onNavigate(memberView?'/organization/teams':'/organization/problems')}>{memberView?'Open my team':'Review problem pipeline'} <ChevronRight/></button><button onClick={()=>onNavigate('/organization/solutions')}>Solution workspace</button></div></div><aside><span>Delivery readiness</span><strong>{readiness}%</strong><div><i style={{width:`${readiness}%`}}/></div><small>Based on assignments, proposals and supporting research</small></aside></section>
    <div className="org-analytics-metrics"><article><span><ClipboardList/>Active challenges</span><strong>{live}</strong><small>{assigned} assigned to teams</small></article><article><span><UsersRound/>Team capacity</span><strong>{members}</strong><small>{teams.length} multidisciplinary teams</small></article><article><span><Lightbulb/>Solution progress</span><strong>{avgProgress}%</strong><small>{solutions.length} formal proposals</small></article><article><span><FileSearch/>Research evidence</span><strong>{research.length}</strong><small>Supporting {new Set(research.map(item=>item.problemId).filter(Boolean)).size} challenges</small></article></div>
    <div className="org-analytics-grid"><section className="org-analytic-panel"><div className="org-analytic-head"><div><h2>Challenge portfolio</h2><p>Where institutional attention is currently focused</p></div><button onClick={()=>onNavigate('/organization/problems')}>View pipeline <ChevronRight/></button></div><div className="org-domain-bars">{domainData.map(([domain,count])=><div key={domain}><div><span>{domain.toLowerCase().replace(/\b\w/g,char=>char.toUpperCase())}</span><strong>{count}</strong></div><div><i style={{width:`${count/maxDomain*100}%`}}/></div></div>)}{!domainData.length&&<div className="org-analytic-empty">Challenge distribution will appear when problems become available.</div>}</div></section><section className="org-analytic-panel"><div className="org-analytic-head"><div><h2>Innovation activity</h2><p>Useful outputs created by your teams</p></div></div><div className="innovation-score-grid"><div><strong>{ideas}</strong><span>Team ideas</span><small>Early approaches submitted</small></div><div><strong>{updates}</strong><span>Work updates</span><small>Research and prototype progress</small></div><div><strong>{solutions.filter(item=>['PILOT_TESTING','APPROVED','DEPLOYED'].includes(item.status)).length}</strong><span>Pilot ready</span><small>Solutions nearing implementation</small></div><div><strong>{solutions.reduce((sum,item)=>sum+(item.milestones?.length||0),0)}</strong><span>Milestones</span><small>Documented delivery outcomes</small></div></div></section></div>
    <div className="org-analytics-bottom"><section className="org-analytic-panel"><div className="org-analytic-head"><div><h2>Priority work queue</h2><p>Challenges that need assignment or solution development</p></div><button onClick={()=>onNavigate('/organization/problems')}>Manage <ChevronRight/></button></div><div className="analytic-queue">{problems.slice(0,5).map(problem=>{const team=teams.find(item=>item.id===problem.teamId||(item.problemIds||[]).includes(problem.id));const solution=solutions.find(item=>item.problemId===problem.id);return <article key={problem.id}><span><ClipboardList/></span><div><small>{problem.domain?.replaceAll('_',' ')} · {statusLabels[problem.status]||'Live'}</small><strong>{problem.title}</strong></div><p><b>{team?.name||'Unassigned'}</b><small>{solution?`${solution.progress||0}% solution progress`:'Solution not started'}</small></p></article>})}{!problems.length&&<div className="org-analytic-empty">No challenges currently require action.</div>}</div></section><section className="org-analytic-panel"><div className="org-analytic-head"><div><h2>Recent activity</h2><p>Latest evidence and delivery updates</p></div></div><div className="analytic-activity">{recent.map(item=><article key={item.id}><i className={item.type}/><div><strong>{item.title}</strong><span>{item.text}</span><small>{item.date?new Date(item.date).toLocaleDateString():'Recently'}</small></div></article>)}{!recent.length&&<div className="org-analytic-empty">Team ideas, research and solution updates will appear here.</div>}</div></section></div>
  </div>
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
