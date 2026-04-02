# pdfai

A local PDF extraction tool that converts PDFs to structured markdown, tables, and document structure — no cloud, no API keys.

## What it does

Upload a PDF and get back:
- **Full text** — exported as clean markdown
- **Tables** — extracted as structured row/column data
- **Document structure** — headings, paragraphs, captions, and more

Powered by [Docling](https://github.com/DS4SD/docling) for high-quality PDF parsing.

## Stack

- **Backend** — FastAPI + Docling (Python)
- **Frontend** — Vanilla JS + Vite

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

### Run

```bash
./start.sh
```

Then open [http://localhost:5173](http://localhost:5173).

## API

`POST /extract` — multipart form upload with a `file` field (PDF only).

Returns:

```json
{
  "text": "...",
  "tables": [{ "data": [["col1", "col2"], ["val1", "val2"]] }],
  "structure": [{ "type": "heading", "text": "..." }]
}
```

## License

MIT — see [LICENSE](LICENSE).
