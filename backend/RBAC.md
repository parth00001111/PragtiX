# Access control

Every problem API and attachment download requires an access token in
`Authorization: Bearer <accessToken>`. The backend reads the current role and
account status from the database on each protected request.

| Operation | CITIZEN, FACULTY, STUDENT, INDUSTRY | OFFICIAL | DEPT_ADMIN, SUPER_ADMIN |
| --- | --- | --- | --- |
| Submit a problem | Allowed | Allowed | Allowed |
| List, read, download attachments | Public problems and own private problems | All problems | All problems |
| Comment, upvote, give feedback | Problems the user can read | All problems | All problems |
| Edit ordinary problem fields | Own problems | All problems | All problems |
| Change status or scores | Denied, including own problems | Allowed | Allowed |
| Verify or reject as duplicate | Denied | Allowed | Allowed |
| Delete a problem | Own problems | Own problems | All problems |

Deleted problems are inaccessible to every role through these routes.
Staff permissions are currently platform-wide, matching the existing controller
rules; `districtId` and `departmentId` do not limit staff access.

## Code locations

- `src/config/rbac.js`: role groups, problem visibility, ownership rules and
  fields reserved for staff.
- `src/middleware/authMiddleware.js`: token verification, current database role,
  inactive/deleted account checks and `authorize()`.
- `src/routes/problemRoutes.js`: authentication and role/resource guards for
  every problem route; verification is restricted to staff.
- `src/middleware/problemAccessMiddleware.js`: ownership and private-problem
  access checks, staff-only status/score updates and attachment permissions.
- `src/controller/problemController.js`: list and count queries use the same
  visibility filter, combined with search and other filters.
- `index.js`: attachment downloads pass authorization before serving files.
- `src/validations/authValidation.js`: public signup allows only CITIZEN,
  FACULTY, STUDENT and INDUSTRY. Staff roles must be assigned through trusted
  database administration; this application has no role-assignment endpoint.

Login and registration remain public. Refresh and logout require a refresh
token; `/api/auth/me` requires an access token. Missing/invalid access tokens
return 401; forbidden operations return 403. Inaccessible private problems and
attachments return 404 to avoid revealing their existence.

Run `npm test` from `backend` for the RBAC route tests. They use mocked database
records, real JWT validation and local HTTP requests; they do not change the
application database.
