# Future Enhancements

A planning and execution guide for upcoming features and improvements.

---

## Personalized Learning

### Contextual Video Resources
**Current**: Text-based lessons only
**Goal**: Curated video content that reinforces concepts

- Embed relevant tutorial videos within lesson content
- Match videos to specific coding problems/concepts
- Short clips (2-5 min) for quick reinforcement
- Full tutorials for deeper exploration
- Sources: YouTube educational channels, custom recordings

### Adaptive Topic Progression
**Current**: Fixed linear curriculum
**Goal**: Dynamic path based on learner readiness

- Start with ONE core concept per session
- Assess comprehension before introducing new material
- Detect mastery signals (speed, accuracy, confidence)
- Unlock next topic only when current is solid
- Avoid overwhelming with multiple concepts at once

### Interest-Based Next Steps
**Current**: Predetermined lesson order
**Goal**: Suggest what will engage the learner most

- Track which exercises sparked curiosity (time spent, re-attempts)
- Identify patterns: does learner prefer logic puzzles, visual output, real-world apps?
- Recommend next lesson based on interest signals
- "You might enjoy this next..." suggestions
- Balance interest with foundational requirements

---

## MVP Expansion Features

### Multi-Language Support
**Current**: JavaScript only
**Goal**: Add Python, TypeScript, and potentially Java

- Language selector in editor
- Language-specific sandbox execution (Worker-based for isolation)
- Curriculum content per language
- Syntax highlighting and IntelliSense per language

### Mobile Optimization
**Current**: Desktop-first
**Goal**: Responsive experience across devices

- Collapsible panels for lesson content, editor, and tutor
- Touch-friendly code editor controls
- Bottom sheet for tutor on mobile
- Swipe gestures for panel navigation

### Branching Lesson Paths
**Current**: Linear lesson flow
**Goal**: Adaptive, non-linear curriculum

- Prerequisite system for lessons
- Dynamic difficulty adjustment based on performance
- Optional challenge exercises
- "Choose your path" decision points

### Gamification
**Current**: None
**Goal**: Engagement and motivation features

- Daily streak counter
- Achievement badges (first lesson, streak milestones, etc.)
- XP/points system tied to completion and accuracy
- Optional leaderboard (anonymous or private)

### Social Features
**Current**: None
**Goal**: Community and peer learning

- Share progress/solutions with privacy controls
- Study groups
- Per-lesson discussion threads
- Peer code review (optional)

---

## Technical Improvements

### Testing Infrastructure
**Current**: No tests
**Priority**: High

- Unit tests for critical modules (`sandbox.ts`, `access-code.ts`, `useTutorChat.ts`)
- E2E tests for core flows (login → onboarding → lesson completion)
- Integration tests for Supabase queries and Edge Functions
- Consider: Vitest + Testing Library + Playwright

### Caching & State Management
**Current**: Fresh fetches on every navigation
**Priority**: High

- Implement React Query or SWR for lesson/module data
- Background revalidation for stale data
- localStorage fallback for tutor messages (offline access)
- Optimistic updates for progress tracking

### Error Handling
**Current**: Basic try-catch with generic messages
**Priority**: High

- Categorize errors (syntax, runtime, network, auth)
- Retry logic with exponential backoff for API calls
- User-friendly error messages with recovery suggestions
- Structured error logging for debugging

### Security Hardening
**Current**: Basic validation
**Priority**: Medium

- Rate limiting on access code validation (prevent brute force)
- Worker-based code execution for true process isolation
- Input sanitization for user-submitted code
- Audit logging for sensitive actions

### Performance Optimization
**Current**: Sequential queries, some artificial delays
**Priority**: Medium

- Batch/RPC calls to reduce database round trips
- React 19 `useTransition` for non-blocking UI updates
- Code splitting for lesson content
- Image optimization with lazy loading

---

## AI Tutor Enhancements

### Improved Response Quality
- Few-shot examples in system prompt for consistency
- Include learning style preference from onboarding in context
- Confidence scoring for AI responses
- Track hint effectiveness for strategy adjustment

### Contextual Awareness
- Use exercise attempt history to inform hints
- Detect common error patterns and proactively address them
- Reference previous successful solutions for encouragement
- Adapt verbosity based on student frustration signals

### Conversation Features
- Follow-up question suggestions
- "Explain like I'm 5" mode toggle
- Code annotation (AI highlights specific lines)
- Voice input/output (accessibility)

---

## Accessibility

### Keyboard Navigation
- `Ctrl+Enter` to run code
- `Ctrl+R` to reset editor
- `Escape` to close tutor panel
- Tab navigation through all interactive elements

### Screen Reader Support
- ARIA labels for code output and errors
- Live regions for dynamic content updates
- Semantic HTML for lesson content

### Visual Accessibility
- High contrast mode toggle
- Configurable font size in editor
- Reduced motion mode
- Focus indicators for all interactive elements

---

## Analytics & Monitoring

### Learning Analytics
- Event tracking: lesson start, code execution, hint requests, completion
- Time-to-completion metrics
- Failure pattern analysis
- Hint usage correlation to success rates

### Observability
- Structured logging (JSON format) for production
- Error tracking integration (Sentry/LogRocket)
- Core Web Vitals monitoring
- OpenAI API cost tracking and usage alerts

---

## DevOps & Infrastructure

### CI/CD
- GitHub Actions for lint, test, build on PR
- Automated deployment to Vercel on merge
- Database migration automation
- Environment-specific configs (staging/production)

### Developer Experience
- Pre-commit hooks (lint, type-check)
- Storybook for component documentation
- API mocking (MSW) for local development
- Constants file for magic numbers

---

## How to Use This Document

### Adding a New Enhancement
1. Add it under the appropriate category
2. Include: current state, goal, and bullet points for scope
3. Mark priority if known (High/Medium/Low)

### Planning Implementation
When picking up an enhancement:
1. Create a detailed implementation plan
2. Break into discrete tasks
3. Identify affected files and dependencies
4. Consider backward compatibility

### Tracking Progress
- [ ] Not started
- [x] Completed
- 🚧 In progress

---

*Last updated: December 2024*
