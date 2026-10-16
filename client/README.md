# AI Mock Interview Coach - Frontend

Modern, clean, minimal React (Vite + Tailwind CSS) client for the AI Mock Interview Coach.

## Features

- **Authentication Screen (`AuthScreen.jsx`)**: Minimal form for Login & Registration (`/api/auth/login` and `/api/auth/register`), stores JWT token in `localStorage`, and updates app session state.
- **Question Picker (`QuestionPicker.jsx`)**: Fetches questions from `/api/questions`, groups by category (Behavioral, Technical-lite, etc.), supports category pills and quick search.
- **Recorder Component (`Recorder.jsx`)**: Captures microphone audio using the browser's native Web Speech API with live transcription, recording duration timer, word counter, and submits transcript to `/api/analyze`.
- **Results Card (`ResultsCard.jsx`)**: Displays STAR framework score, clarity score, filler words count, pace (WPM), overall score (0-100), and actionable suggestions.
- **History Tab (`HistoryTab.jsx`)**: Fetches past interview sessions from `/api/history`, lists past scores, suggestions, and full transcripts, with deletion support.
- **Automatic JWT Bearer Token**: Configured Axios client (`src/services/api.js`) attaches `Authorization: Bearer <token>` to every protected endpoint.

## Development

Run development server:
```bash
npm run dev
# or from root:
npm run client
```

Build production bundle:
```bash
npm run build
```
