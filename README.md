---

## Key Features

### Role-Based Interfaces
Separate dashboards and experiences for students, teachers, and admins, each with tailored UI and permissions.

### Course Player
Inline video, PDF, text, and assessments with real-time progress tracking across all content types.

### Boss Exam IDE
Built-in CodeMirror editor featuring:
- Syntax highlighting & autocomplete
- Emmet support
- AI-powered grading & feedback

### Gamification System
- XP bar & level progression
- Badges & achievements
- Leaderboard rankings
- Skill tree visualization

### Adaptive Onboarding
Placement test with a step-by-step UI to assess and place students at the right learning level.

### Teacher Analytics
- Failure point detection
- Student progress tracking
- Drag-and-drop course builder

### Admin Panel
Full user & course management with platform-wide settings control.

### FAQ Chatbot
Keyword matching engine with an AI fallback for personalised, context-aware answers.

### Responsive Design
Optimised for desktop and tablet experiences.

---

## How to Test

1. Start the backend (see [Dzire Backend](#related-repositories)) on `http://localhost:3000`.
2. Open the landing page (`index.html`) and navigate using the signup/login buttons.
3. **Student flow** — Create a student account, complete the onboarding placement test, explore available courses and assessments.
4. **Teacher flow** — Create a teacher account, build a course with chapters, lessons, and assessments using the course builder.
5. **Admin panel** — Default credentials: `admin@dzire.com` / `admin123` *(configured in the backend)*. Manage users, courses, and platform settings.
6. **Boss Exam** — As a teacher, create a coding challenge (Boss Exam type). As a student, open it from the course player, write code, run sample tests, and submit for AI grading.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| API calls fail with `ERR_CONNECTION_REFUSED` | The backend is not running. Start it with `npm start` in the backend folder. |
| CodeMirror editor not showing | Hard-refresh the browser (`Ctrl+Shift+R`) and ensure the CDN links in `course-player.html` are correct. |
| Boss Exam submission returns `500` | Check the backend terminal for errors. Common fix: ensure `studentService` is imported in `courseService.js`. |
| Assessments table is empty | The inline script in `student-assessments.html` needs to run. Check the browser console for errors. |
| Notifications not loading | Backend route `/api/notifications` may be missing. Verify `notificationRoutes` is mounted in `server.js`. |

---

## Related Repositories

- [Dzire Backend](https://github.com/Kha2alil) – Node.js / Express REST API
- [Dzire API Documentation](https://github.com/Kha2alil) – Full API reference

---

## Authors

- **Khalil Khalfi** – Full-stack developer & architect — [GitHub](https://github.com/Kha2alil)

---

## License

This project is proprietary. All rights reserved © Dzire.
