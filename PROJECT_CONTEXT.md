# Aptitude Test Platform — Project Context

## Purpose
This repository implements an aptitude test portal with a React frontend and a Node.js/Express backend. The app supports student and admin authentication, exam creation and scheduling, test taking, answer saving/submission, result reporting, exam proctoring event tracking, and leaderboards.

## Repository Layout
- `/backend` — Express API server, MongoDB models, routes, controllers, services, middleware, validation.
- `/frontend` — React application built with Vite, styled with Tailwind CSS, and using React Router.
- `/package.json` — root metadata with convenience scripts.

## Current Git Status (as of analysis)
- Checked out branch: `main`
- The `feature/proctoring` branch has been merged into `main`.
- The admin dashboard (previously on the unmerged `feature/admin-dashboard` branch) has been restored and integrated into `main`.
- No unresolved merge conflicts are present.

## Backend Overview
- Stack: Node.js, Express, MongoDB/Mongoose
- Entrypoint: `backend/server.js`
- App configuration: `backend/src/app.js`
- Database connection: `backend/src/database/connectdb.js`
- Authentication middleware: `backend/src/Middleware/auth.middleware.js`
- Admin authorization middleware: `backend/src/Middleware/admin.middleware.js`

### Key Routes
- `POST /api/auth/student/signup` — register student
- `POST /api/auth/student/login` — student login
- `GET /api/auth/student/profile` — protected student profile
- `GET /api/auth/student/progress` — protected student progress
- `POST /api/auth/admin/signup` — register admin
- `POST /api/auth/admin/login` — admin login
- `POST /api/exams/create` — create exam
- `POST /api/exams/:examId/start` — start exam attempt
- `POST /api/exams/:examId/questions` — add questions to an exam
- `GET /api/exams/:examId/questions` — retrieve exam questions
- `POST /api/answers/save` — save or update student answer
- `GET /api/answers/attempt/:attemptId` — get saved answers
- `POST /api/answers/submit` — submit exam attempt
- `GET /api/answers/results/:attemptId` — get attempt result
- `POST /api/test-management/create` — create a test definition
- `PUT /api/test-management/:testId/settings` — update test settings
- `PUT /api/test-management/:testId/target` — update test target group
- `POST /api/test-management/:testId/schedule` — schedule test and assign students
- `POST /api/test-management/:testId/sections` — add test section
- `POST /api/test-management/sections/:sectionId/questions` — attach a question to a section
- `GET /api/test-management/student/assigned` — list tests assigned to a student
- `GET /api/test-management/admin/all` — list all tests (admin dashboard)
- `GET /api/test-management/:testId` — fetch full test details
- `POST /api/v1/proctoring/sessions` — create new proctoring session
- `GET /api/v1/proctoring/sessions/:sessionId` — fetch a session
- `POST /api/v1/proctoring/sessions/:sessionId/end` — end a session
- `POST /api/v1/proctoring/sessions/:sessionId/events` — record a proctoring event
- `GET /api/leaderboard/:examId` — get complete leaderboard
- `GET /api/leaderboard/:examId/student/:studentId` — get one student's rank

### Backend Components
- Controllers: `backend/src/Controllers/*.js`
  - `auth.controller.js` — student/admin auth, profile, progress
  - `Exam.controller.js` — exam creation and start logic
  - `question.controller.js` — question CRUD for exam
  - `answer.controller.js` — save answers, submit attempts, calculate results
  - `testManagement.controller.js` — test creation, settings, targeting, scheduling, section/question management
  - `proctoringSession.controller.js` — session lifecycle actions
  - `proctoringEvent.controller.js` — event recording
  - `leaderboard.controller.js` — leaderboard generation and retrieval
- Services:
  - `backend/src/services/proctoringSession.service.js`
  - `backend/src/services/proctoringEvent.service.js`
  - `backend/src/services/attempt.service.js` — shared attempt submission/grading logic
- Validators:
  - `backend/src/validators/proctoringEventValidator.js`
- Models:
  - `backend/src/model/user.model.js` — Student, Admin
  - `backend/src/model/question.model.js` — question schema + options
  - `backend/src/model/studentAnswer.model.js` — student answer persistence
  - `backend/src/model/leaderboard.model.js` — leaderboard entries
  - `backend/src/model/proctoring/proctoringSession.js`
  - `backend/src/model/proctoring/proctoringEvent.js`
  - `backend/src/model/testModel/test.model.js`
  - `backend/src/model/testModel/testSetting.model.js`
  - `backend/src/model/testModel/testTarget.model.js`
  - `backend/src/model/testModel/testSchedule.model.js`
  - `backend/src/model/testModel/testAssignment.model.js`
  - `backend/src/model/testModel/testAttempt.model.js`
  - `backend/src/model/sectionModel/section.model.js`
  - `backend/src/model/sectionModel/sectionQuestion.model.js`

### Backend Notes
- JWT tokens can be provided via cookie or `Authorization` header.
- Student/admin email is restricted to `@sasi.ac.in`.
- The backend contains logic for test assignment based on departments, batches, and specific roll numbers.
- Proctoring events currently update session counters and record severity.
- `backend/src/database/connectdb.js` tries to drop an old `rollNumber_1` index on startup.
- Admin-only routes are protected with `authenticate` + `requireAdmin` middleware.

## Frontend Overview
- Stack: React 18, Vite, Tailwind CSS, React Router DOM
- Entrypoint: `frontend/src/main.jsx`
- App router: `frontend/src/App.jsx`
- Axios API wrapper: `frontend/src/api/axios.js`
- Toast UI: `frontend/src/context/ToastContext.jsx`

### Frontend Pages
- `LoginPage.jsx` — student/admin login and registration
- `DashboardPage.jsx` — student summary, progress, leaderboard (renders AdminDashboardPage for admins)
- `AdminDashboardPage.jsx` — admin management console (test creation, questions, settings, scheduling)
- `ExamsPage.jsx` — assigned exams list and exam start action
- `ExamDetailPage.jsx` — exam detail, instructions, section info
- `ExamTakingPage.jsx` — test-taking flow with timer, answer selection, save/submit
- `ExamResultPage.jsx` — exam result and performance summary
- `ResultsPage.jsx` — result history table with filters
- `ProfilePage.jsx` — student profile view

### Frontend Layout
- `MainLayout.jsx` — sidebar + top bar wrapper
- `Sidebar.jsx` — navigation menu (shows Admin Console link for admins)
- `TopBar.jsx` — currently logged-in user and logout
- `Logo.jsx`, `StatCard.jsx`, `StatusPill.jsx` — common UI components
- `admin/AdminWorkflowVisualizer.jsx` — admin workflow diagram
- `admin/CreateTestWizardModal.jsx` — 5-step test creation wizard

### Frontend Behavior
- The frontend uses `localStorage` to store JWT token and user profile data.
- API requests are proxied to `http://localhost:3000/api` with credentials.
- The exam page fetches assigned tests and uses fallback mock data when backend responses fail.
- The exam-taking page initializes attempts and saves answer state via backend endpoints when available.
- Results and profile pages attempt backend fetches but gracefully fall back to saved local data.
- Admin users (detected via `localStorage.admin`) are redirected to the Admin Management Console.

## Run / Setup Instructions
1. Create required `.env` variables in `/backend`:
   - `PORT` (e.g. `3000`)
   - `MONGODB_URI`
   - `JWT_SECRET` or `JWT`
2. Install backend dependencies:
   - `cd backend && npm install`
3. Install frontend dependencies:
   - `cd frontend && npm install`
4. Run backend:
   - `cd backend && npm run dev`
5. Run frontend:
   - `cd frontend && npm run dev`
6. Open the app in browser using Vite dev server URL.

## Important Integration Details
- Frontend expects backend API base URL `http://localhost:3000/api`.
- Student progress and profile endpoints are protected and require valid JWT.
- Exam start flow may create or resume an attempt.
- Correct answers are hidden from API responses by excluding `correct_option_id`.
- Admin dashboard endpoints require both `authenticate` and `requireAdmin` middleware.

## Current Development Focus
- Admin dashboard restored and integrated: test creation wizard, workflow visualizer, admin console.
- Leaderboard module added: generation on submission, retrieval by exam, per-student rank.
- Proctoring session/event tracking is fully wired into the exam start flow.

## Suggested Next Questions for ChatGPT
- "How do I extend the proctoring event types and score logic?"
- "What is the correct way to unify the student answer model with exam questions?"
- "How can I handle token expiration and refresh in the React app?"
- "Is there any mismatch between frontend exam assumption and backend test schema?"
- "How can I wire the ResultsPage to real backend attempt history instead of mock data?"