# Interview Suite

A private, local Amazon-style SDE I/SDE II mock interview application.

## Included

- Live OpenAI Realtime voice interviewer over WebRTC
- Natural interruption and semantic voice activity detection
- Phone screen combining Leadership Principles and coding
- Dedicated DSA, HLD/LLD system-design, and production-debugging rounds
- Python and Java execution with bounded local test harnesses
- Optional external-window screen sharing and periodic visual analysis
- Structured, evidence-grounded AI evaluation
- Locally persisted interview history and improvement reports
- Responsive desktop UI and production build

## Run

The API key is loaded from the parent workspace `.env.local` file. Start the app with:

```bash
npm run dev
```

Then open `http://localhost:4173/` and allow microphone access when starting voice. Screen sharing is optional and only begins after selecting a window in the browser picker.

## Deploy

The included Dockerfile installs Node.js, Python, and Java so both code runners work in production. Deploy it as a Docker web service, set `OPENAI_API_KEY` as a secret environment variable, and use `/api/health` for readiness checks.

## Privacy and security

- The OpenAI API key remains server-side.
- Interview history is stored locally in `data/sessions.json`.
- Shared-screen frames are sent to the configured OpenAI API only while sharing is active and voice is connected.
- Code execution is intended for this private single-user local application. It uses time and memory bounds, but it is not a hardened multi-tenant sandbox and must not execute untrusted third-party code.
