# ✏️ Marble Note

A beautiful, offline-first note-taking app built with Next.js.  
No login. No server. Your notes live in your browser's `localStorage`.  
Sync across devices by **exporting** and **importing** a JSON file.

---

## 🚀 Deploy to Vercel (one-click)

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your repo — Vercel auto-detects Next.js
4. Click **Deploy** — done!

---

## 🛠 Local Development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

---

## 📦 Build for Production

```bash
npm run build
npm start
```

---

## 💾 How Data Works

- All notes and folders are stored in `localStorage` — no backend needed.
- **Export JSON** → downloads a snapshot of all your data.
- **Import JSON** → restores from a previously exported file.
- Use Export/Import to sync between devices or back up your notes.

---

## 📁 Project Structure

```
marble-note/
├── app/
│   ├── globals.css       # Global styles & keyframe animations
│   ├── layout.js         # Root layout with font imports
│   └── page.js           # Home page
├── components/
│   └── MarbleNote.jsx    # Main app component (all UI + logic)
├── public/               # Static assets
├── next.config.mjs
└── package.json
```

---

## ✨ Features

- 📁 Folders with custom emoji & color
- 📝 Notes with emoji, title, body, auto-save
- ⭐ Pin notes
- 🔍 Full-text search
- ⬆️ Export / ⬇️ Import JSON for offline sync
- 💾 Persistent via `localStorage`
- 🎨 Formatting toolbar (bold, italic, bullets, checkboxes…)
