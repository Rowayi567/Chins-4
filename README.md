# Chins App — Deploy to Vercel

## What's in this folder
```
chins-deploy/
├── index.html          ← entry point
├── package.json        ← dependencies
├── vite.config.js      ← build config
└── src/
    ├── main.jsx        ← React mount
    └── App.jsx         ← the entire app
```

## How to deploy (no coding required)

### Step 1 — Upload to GitHub
1. Go to github.com and sign in (or create a free account)
2. Click **+** → **New repository**
3. Name it `chins-app`, set to **Private**, click **Create repository**
4. On the next page click **uploading an existing file**
5. Drag ALL files from this folder into the upload area
   - Make sure to also drag the `src` folder (with App.jsx and main.jsx inside)
6. Click **Commit changes**

### Step 2 — Deploy on Vercel
1. Go to vercel.com and sign in with your GitHub account
2. Click **Add New Project**
3. Find `chins-app` in the list and click **Import**
4. Vercel will auto-detect it as a Vite project — don't change anything
5. Click **Deploy**
6. Wait ~60 seconds — you'll get a live URL like `chins-app.vercel.app`

### Step 3 — Add to your home screen
1. Open the URL on your iPhone in Safari
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add** — it appears on your home screen like a real app

## Notes
- The app calls the Anthropic API directly. This is fine for personal testing.
- If you want to share with others, ask Claude to set up a backend proxy first.
