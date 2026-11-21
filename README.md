# Vanguard

A React campus maintenance app with a community feed, issue reporting, profiles, and administrator tools. The default workspace uses fictional Westbridge University data and saves changes in your browser. No account or Django server is needed to explore it.

## Run the app

Use Node.js 20.19+ or 22.12+.

```sh
npm install
cp .env.example .env
npm run dev
```

Open the Local URL printed by Vite, normally `http://localhost:5173`. Select **Community member** or **Administrator**, then **Enter demo workspace**. You can leave the email blank in demo mode. Sign out using the icon beside your name to switch roles.

```sh
npm test       # Check mock permissions, read state, submissions, and status transitions
npm run build # Create production files in dist/
npm run preview
```

For production hosting, serve `dist/` and rewrite application routes to `index.html` so refreshing a ticket URL works.

## Report and follow an issue

Choose **Report an issue**. Enter a title, description, category, building, location, and priority. You can enter a building that is not in the suggestions. Add an optional image, budget, or map location, then select **Submit issue**. The confirmation shows your ticket and pending status.

Open a card to see the conversation, status history, location, and supporting documentation. Select **Post comment** to add an update. **Mark as read** toggles your feed preference. Find your points, level progress, and contribution history under **My profile**.

Map tiles, campus photos, and web fonts use external services (OpenStreetMap, Unsplash, and Google Fonts). They require internet access; reporting works without choosing a map location. Map coordinates start at a fictional demonstration location in Manila. Click the map or drag the marker to choose another location. The building and location you type identify the address; no geocoder is configured.

## Review and complete work

Sign in as an administrator. Open **Ticket queue**, search or filter the reports, then open a ticket. Move it through **Pending → Verified → Ongoing → Completed**. Upload a progress image or PDF before completing the work. The form validates this requirement; the supplied Django backend enforces it independently. The original issue image does not count as progress documentation in live mode.

**Reports & insights** provides daily and monthly views, category/status/priority breakdowns, a submission timeline, and CSV export. **Reward settings** lets you change reward amounts. The backend supplies the level thresholds; this screen displays them without editing them.

## Connect the Django backend

The adapter matches the Django project in `../backend`, including its session authentication, field names, paginated responses, multipart uploads, reward rules, and ordered status workflow. Follow that project's README to migrate the database, create or seed users, and start Django.

Set these values in `.env`, then restart Vite:

```dotenv
VITE_MOCK_MODE=false
VITE_API_BASE_URL=http://localhost:8000/api
```

| Variable            | Purpose                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| `VITE_MOCK_MODE`    | Defaults to mock mode. Set exactly `false` to use Django.                  |
| `VITE_API_BASE_URL` | API root without an ending slash. Defaults to `http://localhost:8000/api`. |

Add `http://localhost:5173` (or Vite's actual origin) to Django's `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`. Enable credentialed CORS. Use the same hostname for both services: avoid mixing `localhost` with `127.0.0.1`. For cross-site production cookies, configure HTTPS, secure cookies, and SameSite settings as described in the backend README.

In live mode, enter your Django **username** and password. The seeded usernames are `alex.demo` and `sam.admin`; use the password you supplied when running the backend seed command. Mock role selection is not available in live mode.

The shared client fetches `/auth/csrf/`, sends credentials and `X-CSRFToken` on writes, and replaces its token after login rotates it. It uses no JWT. Unauthenticated sessions return to sign-in. The UI hides administrator routes from community members; Django remains responsible for permissions.

### API coverage

| Task                          | Django endpoint                                                              |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Session and profile           | `/auth/csrf/`, `/auth/login/`, `/auth/logout/`, `/me/`                       |
| Category and workflow choices | `/categories/`, `OPTIONS /issues/`                                           |
| Feed and reporting            | `/issues/`, `/issues/{id}/`                                                  |
| Conversation and read receipt | `/issues/{id}/comments/`, `/issues/{id}/read/`                               |
| Attachments and workflow      | `/issues/{id}/attachments/`, `/issues/{id}/status/`, `/issues/{id}/history/` |
| Points, levels, and rewards   | `/points/ledger/`, `/levels/`, `/reward-settings/`                           |
| Administrator statistics      | `/dashboard/`                                                                |

The adapter follows paginated lists and maps API data to presentation fields. Filters operate across the fetched issue list. The prototype also fetches each issue's comments/history/attachments so card counts and detail data agree. For a large campus deployment, add counts and read state to the feed serializer and move filters to server queries to reduce requests. Submission UUIDs are retained while the form stays open so a failed submission can be retried safely.

The existing backend does not return status choices through its read-only serializer or provide a building directory. The adapter keeps workflow fallback values in one place, reads severity choices from OPTIONS, and offers building suggestions from existing reports. Categories, reward amounts, and level thresholds come from Django.

### Read/unread limitation

The supplied Django backend records permanent read receipts and does not expose an unread endpoint or return read state. Live mode posts the first read to Django, then stores the visible read/unread preference per user in this browser. Marking unread changes that browser preference and does not delete the backend receipt or reverse points. The preference does not sync across browsers. Add a read-state field and an unread endpoint to Django if you need shared read/unread state.

### Points and AI assessments

Django is the source of truth for points. Profiles refresh after reporting, comments, read changes, and status updates. The frontend never calculates or awards live points. Demo points are fixed fictional profile data; changing mock reward rules does not award points.

Seed issues contain clearly labeled fictional AI scores and estimated budgets. New demo reports have no AI assessment. In live mode, assessments display only when Django returns them; configure the backend's AI provider to generate real estimates. Reporter budgets remain optional. No frontend AI service is included.

## Find a page

| Route                | Page                                 |
| -------------------- | ------------------------------------ |
| `/signin`            | Prototype or Django sign-in          |
| `/`                  | Campus feed                          |
| `/issues/:id`        | Issue details and conversation       |
| `/submit`            | Report an issue                      |
| `/profile`           | Profile, points, and activity        |
| `/admin`             | Administrator overview               |
| `/admin/tickets`     | Ticket queue                         |
| `/admin/tickets/:id` | Ticket review and workflow           |
| `/admin/reports`     | Daily/monthly reports and CSV export |
| `/admin/settings`    | Reward rules and level milestones    |

## Fix connection or submission problems

- **Connection screen or failed request:** Check the API URL and start Django. Confirm the browser can reach the API. The app does not silently fall back to mock mode.
- **403 on sign-in or writes:** Check Django's trusted origins, credentialed CORS, and cookie settings. Refresh the page to obtain a new CSRF token, then sign in again.
- **Validation error:** The form displays the server's field errors. Correct the values and retry without closing the form.
- **Completion rejected:** Upload administrator progress evidence first, and follow the ordered status sequence. Django rejects skipped or reversed transitions.
- **Storage full in demo mode:** Use a smaller image or clear this site's browser storage. Clearing storage removes demo reports, comments, and your demo session.

The frontend limits uploads to 5 MB per file. Report images accept image formats; the Django backend validates JPEG, PNG, and WebP. Progress attachments accept images and PDFs. A server rejection remains authoritative even if a browser accepts a file.

## Project structure

- `src/api/client.js`: shared session/CSRF HTTP client and error handling.
- `src/api/index.js`: Django adapter and mock-mode selection.
- `src/api/mock.js`, `seed.js`: isolated browser-persisted demo service and fixtures.
- `src/components/`: shared layout, cards, filters, map, and form controls.
- `src/pages/`: feed, report, detail, profile, sign-in, and administration views.
- `tests/`: mock workflow and permission checks.

The production build and automated mock checks can run without a browser. Browser visual QA and a full live Django session still need verification in your environment.
