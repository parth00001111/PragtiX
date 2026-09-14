export const PUBLIC_ROLES = ["CITIZEN", "FACULTY", "STUDENT", "INDUSTRY"];
export const STAFF_ROLES = ["OFFICIAL", "DEPT_ADMIN", "SUPER_ADMIN"];
export const ADMIN_ROLES = ["DEPT_ADMIN", "SUPER_ADMIN"];
export const ALL_ROLES = [...PUBLIC_ROLES, ...STAFF_ROLES];

export const MODERATION_FIELDS = [
  "status", "severityScore", "urgencyScore", "geographicImpactScore",
  "feasibilityScore", "communitySupportScore",
];

export const problemVisibilityWhere = (user) => ({
  deletedAt: null,
  ...(!STAFF_ROLES.includes(user.role) && {
    OR: [{ isPublic: true }, { submittedById: user.id },
      ...(user.role === 'FACULTY' ? [{assignments:{some:{university:{userId:user.id}}}}] : []),
      ...(['FACULTY','STUDENT'].includes(user.role) ? [{assignments:{some:{project:{team:{members:{some:{userId:user.id,role:user.role==='FACULTY'?'FACULTY_MENTOR':{in:['STUDENT_LEAD','STUDENT_MEMBER']}}}}}}}}] : []),
      ...(user.role === 'INDUSTRY' ? [{assignments:{some:{project:{partnerships:{some:{industry:{userId:user.id}}}}}}}] : [])
    ],
  }),
});

export const canAccessProblem = (user, problem, action = "read") => {
  if (!user || !ALL_ROLES.includes(user.role) || !problem || problem.deletedAt) return false;
  const isOwner = problem.submittedById === user.id;
  if (action === "read") return problem.isPublic || isOwner || STAFF_ROLES.includes(user.role);
  if (action === "update") return isOwner || STAFF_ROLES.includes(user.role);
  if (action === "delete") return isOwner || ADMIN_ROLES.includes(user.role);
  return false;
};
