# RegFlow AI

RegFlow AI is a full-stack regulatory workflow prototype for managing change requests, AI-generated reviews, document uploads, status transitions, and audit history.

## Features

- Create regulatory workflow requests
- Generate AI-powered compliance reviews
- Persist requests in SQLite
- Track request status transitions
- Maintain audit logs for compliance visibility
- Upload, download, and delete supporting documents
- View request-specific activity timelines
- Clear development database data

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express
- TypeScript
- SQLite
- Multer
- OpenAI API

## Architecture

```text
React Frontend
↓
Express REST API
↓
SQLite Database
↓
OpenAI AI Review Service
↓
Audit Logs + Document Management