# MedQ - Medical Question Bank Application

## Tech Stack
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Language:** TypeScript

## Folder Structure
- `/app/page.tsx`: Main Controller. Manages "Modes" (Dashboard -> Setup -> Exam).
- `/app/components/ExamSetup.tsx`: Settings screen (Category, Timer, Feedback options).
- `/app/components/ExamRunner.tsx`: The Logic Engine. Handles answering, scoring, and navigation.
- `/app/components/QuestionCard.tsx`: Display component. Stateless (controlled by Runner).

## Features
- **Dark Mode:** System-wide support.
- **Modes:** Mixed Exam or Category-Specific.
- **Feedback:** Instant (Red/Green) or Delayed (Summary at end).
- **Navigation:** Backtracking allowed/disallowed options.