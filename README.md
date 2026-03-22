# FixTrack —  Issue Reporting & Resolution Portal

A web application for reporting, tracking and resolving infrastructure issues across engineering departments. Students and faculty can submit issues without login, while admins and assistants manage and resolve them through dedicated dashboards.

---

## Tech Stack

<p>
  <img src="https://skillicons.dev/icons?i=react,tailwind,vite,nodejs,appwrite" />
</p>

---

## Getting Started

### Clone & Install

```bash
git clone https://github.com/rashiwawale/FixTrack.git
cd FixTrack
npm install
```

### Environment Setup

Create a `.env` file in the root — get the values from the project owner.

```
VITE_APPWRITE_ENDPOINT=
VITE_APPWRITE_PROJECT_ID=
VITE_APPWRITE_DB_ID=
VITE_APPWRITE_BUCKET_ID=
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_DB_ID=
APPWRITE_API_KEY=
```

### Run

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
npm run server
```

---

## Contributing

⚠️ Branch protection is not enforced because this private repository is on GitHub free plan, so contributors must manually follow the workflow below.

1. Create a new branch from `main`
```bash
git checkout -b your-branch-name
```

2. Make your changes and commit
```bash
git add .
git commit -m "describe your changes"
git push origin your-branch-name
```

3. Open a Pull Request on GitHub and merge only after review

⚠️ Do not push directly to `main`
