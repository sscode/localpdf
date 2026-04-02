import tempfile
import os
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from docling.document_converter import DocumentConverter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

converter = DocumentConverter()


@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        result = converter.convert(tmp_path)
        doc = result.document

        # Full text (markdown export)
        text = doc.export_to_markdown()

        # Tables
        tables = []
        for table in doc.tables:
            try:
                df = table.export_to_dataframe()
                rows = [list(df.columns)] + df.values.tolist()
                tables.append({"data": [[str(c) for c in row] for row in rows]})
            except Exception:
                pass

        # Structure: headings, paragraphs, captions, etc.
        structure = []
        for item, _ in doc.iterate_items():
            label = item.label.value if hasattr(item.label, "value") else str(item.label)
            text_val = item.text if hasattr(item, "text") else ""
            if text_val:
                structure.append({"type": label, "text": text_val})

        return {
            "text": text,
            "tables": tables,
            "structure": structure,
        }
    finally:
        os.unlink(tmp_path)
