# Final Assessment — Backend Development

**Weight:** 30% of final grade
**Duration:** 2 weeks
**Mode:** Individual project
**Stack (mandatory):** Node.js, Express.js, MySQL (with parameterized queries only), Redis

---

## Scenario — "MediBook" Clinic Appointment System

A community clinic wants a backend service for booking doctor appointments. Doctors see patients in fixed 30-minute slots during working hours (09:00–17:00), each doctor can handle at most **12 appointments per day**, and the clinic administrator needs reports. You will design the database, build the API, and handle the operational concerns (background jobs, logging, testing).

**Entity limit:** Your database must contain **exactly 3 entities**:

| Entity | Purpose |
|---|---|
| `patients` | People who book appointments |
| `doctors` | Doctors with a specialty, consultation fee, and room |
| `appointments` | A patient's booking with a doctor at a specific date/time (links the other two) |

You may add columns as needed, but no additional tables (lookup/locale JSON files don't count).

---

## Part A — Database Design & Normalization

The clinic currently tracks everything in this single spreadsheet:

| appt_ref | patient_name | patient_email | patient_phone | doctor_name | specialty | consultation_fee | room | appt_datetime | amount_paid | booked_on |
|---|---|---|---|---|---|---|---|---|---|---|
| AP-001 | Ama Mensah | ama@mail.com | 0244-111-222 | Dr. Boateng | Dermatology | 150.00 | R-12 | 2026-08-10 09:00 | 150.00 | 2026-07-01 |
| AP-002 | Kojo Owusu | kojo@mail.com | 0555-333-444 | Dr. Boateng | Dermatology | 150.00 | R-12 | 2026-08-10 09:30 | 120.00 | 2026-07-02 |
| AP-003 | Ama Mensah | ama@mail.com | 0244-111-222 | Dr. Adjei | Paediatrics | 100.00 | R-03 | 2026-08-15 10:00 | 100.00 | 2026-07-03 |

Study the spreadsheet, then produce a **database schema diagram** of your design in fully normalized form (up to 3NF). The diagram must show **everything**:

- all 3 entities with every column and its MySQL data type,
- primary keys and foreign keys, clearly marked,
- the relationships between the entities and their cardinality (1:N, etc.),
- every constraint that enforces a business rule (`NOT NULL`, `UNIQUE`, `CHECK`) — in particular, it must be visible from the diagram that *a doctor cannot have two appointments at the same date/time*.

Use any tool you like (dbdiagram.io, draw.io) and include it in your repository as `schema-diagram` (image or PDF).

## Part B — Database Implementation & Project Setup

1. **Table creation.** Translate your Part A diagram into a MySQL DDL script, `database/schema.sql`, that creates the database and the 3 tables — data types, primary keys, foreign keys, and every constraint shown on the diagram. The script must run cleanly on a fresh MySQL server. Also provide `database/seed.sql` with realistic sample data: at least 3 patients, 3 doctors (including one with no appointments), and 8 appointments (including one doctor-day at or near the 12-slot daily cap).

2. **Project structure.** Set up the Express project in a **models / controllers / routes** structure:

```
├── database/          schema.sql and seed.sql (Part B.1)
└── src/
    ├── models/        all application SQL lives here — nowhere else
    ├── controllers/   business logic; calls model functions, never the DB directly
    └── routes/        maps URLs and HTTP methods to controllers
```

Every SQL statement in the application must use **parameterized queries** (`?` placeholders via `mysql2`). SQL found in a controller or route file loses marks. **Do not use any ORM for this assignment.**

## Part C — Controllers & Endpoints

Implement endpoints for the operations below. **Designing the API is part of the assessment**: you choose the URL paths, the HTTP methods, and how the endpoints are grouped into controllers and routes — your choices should follow REST conventions and will be marked. The business rules listed are **requirements** — *how* you satisfy them is your design decision, and you will be asked to defend it at the viva.

1. **Basic CRUD** — standard **C**reate, **R**ead (one and all), **U**pdate, and **D**elete operations for patients and for doctors, with sensible validation. (Appointments get their create/delete behaviour from the two operations below — no separate CRUD needed there.)

2. **Book an appointment**. Rules that must always hold:
   - Appointments can only be booked in the future, within working hours (09:00–17:00), on a 30-minute slot boundary.
   - A doctor never exceeds 12 appointments in a day.
   - Two patients can never hold the same doctor slot — even when both requests arrive at the same instant.

3. **Cancel an appointment**. Rules:
   - The refund is computed by the server from the notice given: more than 48 hours → 100%; 24–48 hours → 50%; less than 24 hours → 0%. The response states the refund amount.
   - The cancellation and its refund record succeed or fail together.
   - A cancelled slot becomes bookable by another patient, while the cancellation record is kept for refund history.
   - A cancellation notifies the waitlist (Part E).

4. **Doctor statistics** — for a given doctor: revenue collected, upcoming appointment count, appointments per day for the next 7 days, and utilization % against the 12-slot daily cap.

Operations 5 and 6 are where your **advanced SQL** is assessed: the results must be produced by the SQL in your models (joins, aggregates, etc) — not fetched raw and computed in JavaScript.

5. **Doctors report** — every doctor's total appointments and revenue collected, including doctors with zero appointments.
6. **Busy days report** — every (doctor, date) where more than 80% of the 12-slot daily capacity is booked.

### General requirements (all endpoints)

Input validation with meaningful `400` messages; correct status codes (`201`, `404`, `409`, `422`); a central error-handling middleware.

## Part D — Node.js `fs` Module

**Audit log:** every successful booking and cancellation must be appended as a JSON line to `logs/audit.log` using the `fs` module (async, non-blocking — no `*Sync` calls inside request handlers). The logger must create the `logs/` directory on first run if it doesn't exist, and a logging failure must **not** fail the user's request.

## Part E — Queues & Redis

1. **Waitlist queue:** when the requested slot (or the doctor's whole day) is fully booked, offer the patient a waitlist spot — push them onto a queue (Redis list, or Bull/BullMQ). When a cancellation frees a slot, a **worker process** (separate from the web server) pops the first waitlisted patient and books them in. Think through: what happens if the promoted booking itself fails? The patient must not simply vanish from both the queue and the appointments table.
2. **Notification jobs:** every confirmed appointment enqueues a "confirmation SMS/email" job; the worker processes it by writing the message to the audit log (no real sending needed).

## Part F — Unit Testing

Using Jest, write **at least 6 meaningful unit tests**:

- The refund calculator from Part C.3 — cover all three tiers **and both boundaries** (exactly 24 hours, exactly 48 hours). Boundary behaviour must match your documented policy.
- One validation function of your choice — e.g., the slot-alignment/working-hours check — including at least one edge case (17:00 exactly? 09:15? a malformed date?).

Tests must not require a live MySQL or Redis connection — that's the point of extracting pure functions. `npm test` must run them.

## Part G — i18n & l10n: Course Feedback Page

Create a **simple HTML page** (served by your Express app at `GET /feedback`) containing a short course-feedback form with **exactly 5 essay questions** (each answered in a `<textarea>`):

1. Which topic in this course did you find most challenging, and why?
2. Describe one concept you understood only after the practical assignments. What made it click?
3. How has your approach to designing databases or APIs changed since the start of the trimester?
4. What would you improve about how this course was taught or assessed?
5. How do you plan to apply what you learned in this course going forward?

**i18n/l10n requirement (keep it simple):** the page title, instructions, and all 5 questions must be loaded from locale files (e.g., `locales/en.json` and `locales/fr.json` — English plus one other language of your choice). Visiting `/feedback?lang=fr` shows the translated page; the default is English, and an unsupported `lang` value must fall back to English rather than crash. Display today's date on the page formatted for the active locale (e.g., using `Intl.DateTimeFormat`).

---

## Submission Requirements

- Git repository (with meaningful commit history — a single "final commit" will be questioned) containing:
  - `schema-diagram` (image or PDF), `schema.sql`, and `seed.sql` (as specified in Part B)
  - Application source, worker process, tests, locale files
  - `README.md` with: setup steps, `.env.example`, and the short written justifications requested in Parts C, D, and E
- The app must start with `npm install && npm start` (plus documented MySQL/Redis setup) and tests with `npm test`.
- A short **viva/demo (10 minutes)** walkthrough.

**Automatic penalties:** SQL injection vector anywhere in the app (−15), secrets committed to the repo (−5), app does not start per README instructions (−10), work the student cannot explain in the video (or at a follow-up viva if called) | Academic integrity referral; affected criteria re-scored at Developing or below |





# Video Demo
https://drive.google.com/file/d/1wYqL_FpUfX_m2mowuFuOOlHFE-qowH68/view?usp=sharing







# Additional README Part: MediBook Clinic Appointment API

Backend for a community clinic that books doctors into fixed 30-minute slots (09:00–17:00), caps each doctor at 12 appointments a day, and keeps cancellation and refund history. Stack: Node.js, Express, MySQL (parameterized queries only, no ORM), Redis.

## Setup

Requirements: Node.js 18+, MySQL 8.0.16+ (CHECK constraints must be enforced), Redis.

```bash
npm install
copy .env.example .env
```

Create the database and load sample data (adjust the MySQL user if yours is not `root`):

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

`schema.sql` creates the `medibook` database and the three tables. `seed.sql` loads 5 patients, 3 doctors (Dr. Uwase has no appointments), and 15 appointments. Eleven of those are Dr. Boateng two days from the day you run the seed (11 of the 12 daily slots). Dates in the seed are relative to `CURDATE()`, so re-run `seed.sql` if the sample appointments have gone stale.

Start Redis, then the API and the worker in two terminals:

```bash
npm run dev
npm run worker
```

The API listens on `http://localhost:3000`. Tests do not need MySQL or Redis:

```bash
npm test
```

## Environment

Copy `.env.example` to `.env`. Do not commit `.env` (it is gitignored).

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | *(empty locally)* | MySQL password |
| `DB_NAME` | `medibook` | Database name |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis connection |

## Refund policy

Notice is the time from cancellation until the appointment starts.

| Notice | Refund |
|---|---|
| More than 48 hours | 100% |
| Exactly 48 hours, down to exactly 24 hours | 50% |
| Less than 24 hours | 0% |

The last bookable slot is 16:30. A 17:00 start is rejected because the slot would run past closing.

## API

All JSON bodies use camelCase. Errors look like `{ "error": { "message": "..." } }` and come from one error-handling middleware.

| Method | Path | What it does |
|---|---|---|
| `GET` | `/patients` | List patients |
| `POST` | `/patients` | Create a patient (`201`) |
| `GET` | `/patients/:id` | One patient |
| `PATCH` | `/patients/:id` | Partial update |
| `DELETE` | `/patients/:id` | Delete (`204`). `409` if they still have appointments |
| `GET` | `/doctors` | List doctors |
| `POST` | `/doctors` | Create a doctor (`201`) |
| `GET` | `/doctors/:id` | One doctor |
| `PATCH` | `/doctors/:id` | Partial update |
| `DELETE` | `/doctors/:id` | Delete (`204`). `409` if they still have appointments |
| `GET` | `/doctors/:id/stats` | Revenue, upcoming count, next 7 days, utilization % |
| `GET` | `/doctors/:id/waitlist?date=YYYY-MM-DD` | Waitlist for that doctor-day |
| `POST` | `/appointments` | Book. `201` booked, `202` waitlisted, `409` if the slot or day is full and `joinWaitlist` was not sent |
| `GET` | `/appointments/:id` | One appointment, including cancelled ones |
| `PATCH` | `/appointments/:id/cancel` | Cancel and return the refund |
| `GET` | `/reports/doctors` | Every doctor, appointment count and revenue (includes zeros) |
| `GET` | `/reports/busy-days` | Doctor-days booked above 80% of 12 slots |
| `GET` | `/feedback` | Course feedback form. `?lang=fr` for French; unknown `lang` falls back to English |
| `POST` | `/feedback` | Accepts the form and shows a confirmation page |

Patient body: `fullName`, `email`, `phone`. Doctor body: `fullName`, `specialty`, `consultationFee`, `room`. Booking body: `patientId`, `doctorId`, `appointmentDatetime` (`YYYY-MM-DDTHH:mm`), optional `joinWaitlist` (boolean).

## Design notes

**Booking and conflicts (Part C).** A booking runs in one transaction. The doctor row is locked (`SELECT ... FOR UPDATE`) so two requests for the same doctor cannot both pass the 12-a-day check. The slot itself is protected by `UNIQUE (doctor_id, active_slot)`. `active_slot` is a generated column: the appointment time while status is `booked`, and `NULL` once cancelled. MySQL allows many `NULL`s in a unique key, so a cancelled row stays for refund history and the time becomes bookable again. A duplicate insert becomes `409`. The same pattern stops one patient holding two appointments at the same time and also amount paid is copied from the doctor's fee at booking time so a later fee change does not rewrite history. Reports (doctor totals, busy days, the 7-day utilization) are SQL aggregates and joins in the models, including doctors with zero appointments via `LEFT JOIN`.

**Audit log (Part D).** Successful bookings and cancellations append one JSON line to `logs/audit.log` with `fs.promises.appendFile`. The logger creates `logs/` on first use. The call is not awaited in a way that can fail the HTTP response: a write error is logged to the console and the booking or cancellation still returns success. No `*Sync` fs calls run inside request handlers.

**Queues (Part E).** Redis lists, not an extra queue library. If the slot or the day is full, the API returns `409` and tells the client to resend with `"joinWaitlist": true`, which pushes the patient onto that doctor-day's list (`202`). A separate process (`npm run worker`) blocks on two lists: confirmation jobs and promotion jobs. Every confirmed booking enqueues a confirmation job; the worker writes the "SMS/email" text to the audit log. Cancellation enqueues a promotion for that doctor-day. The worker tries waitlisted patients in order and only removes someone from the list after a booking succeeds. If the slot is already taken it tries the next person. If the day is still full it stops and leaves the queue intact. If the booking throws an unexpected error, the job is retried up to 3 times and then moved to a failed-jobs list, so the patient is not dropped from both the queue and the appointments table.

## Tests

`npm test` runs 28 Jest tests with no database:

- Refund calculator: 100%, 50%, and 0% tiers, plus the 24-hour and 48-hour boundaries (exactly 48 hours is 50%; one minute more than 48 hours is 100%; exactly 24 hours is 50%; one minute under 24 hours is 0%).
- Slot validator: future-only, 30-minute boundaries, working hours, 16:30 accepted, 17:00 rejected, 09:15 rejected, malformed dates rejected.


## Postman checks

Set the request URL to `http://localhost:3000` plus the path below. For any request with a body, set the header `Content-Type` to `application/json` and paste the JSON into the raw body.

After a fresh seed, patient ids are 1–5 and doctor ids are 1 (Boateng, Dermatology, 150), 2 (Adjei, Paediatrics, 100), 3 (Uwase, Cardiology, 200, no appointments). `2027-03-02` only has to be a future time on a 30-minute mark between 09:00 and 16:30.

Reads, no body. Expect `200`.

| Method | Path |
|---|---|
| `GET` | `/patients` |
| `GET` | `/doctors` |
| `GET` | `/doctors/1/stats` |
| `GET` | `/reports/doctors` |
| `GET` | `/reports/busy-days` |

Create a patient. Expect `201`. Send the same body again and expect `409`.

`POST /patients`

```json
{
  "fullName": "Test Patient",
  "email": "test.patient@mail.com",
  "phone": "0788001122"
}
```

Missing fields. Expect `400`.


Book Dr. Uwase. Expect `201`. Use a real patient id (`5` is Grace Mukamana on a fresh seed). Copy `data.id` from the response; that is the appointment id for the cancel step.

`POST /appointments`

```json
{
  "patientId": 5,
  "doctorId": 3,
  "appointmentDatetime": "2027-03-02T09:00"
}
```

Same slot, different patient. Expect `409`.

`POST /appointments`

```json
{
  "patientId": 1,
  "doctorId": 3,
  "appointmentDatetime": "2027-03-02T09:00"
}
```

Join the waitlist. Expect `202` while Redis and the worker are running. Expect `503` if Redis is down.

`POST /appointments`

```json
{
  "patientId": 1,
  "doctorId": 3,
  "appointmentDatetime": "2027-03-02T09:00",
  "joinWaitlist": true
}
```

`GET /doctors/3/waitlist?date=2027-03-02` — expect `200` and patient 1 on the list.

Not on a 30-minute boundary. Expect `422`.

`POST /appointments`

```json
{
  "patientId": 2,
  "doctorId": 3,
  "appointmentDatetime": "2027-03-02T09:15"
}
```

Starts at closing time. Expect `422`.

`POST /appointments`

```json
{
  "patientId": 2,
  "doctorId": 3,
  "appointmentDatetime": "2027-03-02T17:00"
}
```

Cancel the appointment from the `201` response. No body. Replace `{id}` with that id. Expect `200` and a refund amount (`200.00`, 100%, for a date this far ahead).

`PATCH /appointments/{id}/cancel`

`GET /appointments/{id}` — the same row, now `status` `cancelled`.

If the worker is running, patient 1 is booked into `09:00` and `logs/audit.log` gains a `WAITLIST_PROMOTED` line.

Feedback is a browser page, not JSON: `http://localhost:3000/feedback`, `http://localhost:3000/feedback?lang=fr`, and `http://localhost:3000/feedback?lang=de` (still English).

What “working” looks like: `npm test` is green; a valid booking returns `201` and a line in `logs/audit.log`; the worker prints a confirmation; a duplicate slot returns `409`; cancel returns a refund and keeps the row as `cancelled`; `/reports/doctors` includes a doctor with zero appointments when you have not booked Dr. Uwase yet.
