# localpdf

Extract text, tables, and structure from any PDF — runs entirely on your computer. No cloud services, no API keys, no sign-ups.

## What you get

Upload a PDF and instantly get back:

- **Full text** as clean, readable markdown
- **Tables** with rows and columns preserved
- **Document structure** — headings, paragraphs, captions, and more

Everything runs locally using [Docling](https://github.com/DS4SD/docling), an open-source PDF parser.

## Setup

You'll need two things installed on your machine before starting:

1. **Python 3.10 or newer** — [Download Python](https://www.python.org/downloads/)
2. **Node.js 18 or newer** — [Download Node.js](https://nodejs.org/)

Not sure if you already have them? Open your terminal and run:

```bash
python3 --version
node --version
```

If both print a version number, you're good to go.

### Step 1: Set up the backend

Open your terminal, navigate to the project folder, and run:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> This creates an isolated Python environment and installs the dependencies. The first install may take a few minutes.

### Step 2: Set up the frontend

In a new terminal window (or go back to the project root):

```bash
cd frontend
npm install
```

### Step 3: Start the app

From the project root:

```bash
./start.sh
```

Then open **http://localhost:5173** in your browser. That's it — upload a PDF and see the results.

To stop the app, press `Ctrl+C` in the terminal.

## License

MIT — see [LICENSE](LICENSE).
