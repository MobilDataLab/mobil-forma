"""
mobil-forma API — Analisis de cabida Autodesk Forma.
Envuelve el motor validado (engine/genera_cabida.py) sin modificarlo:
recibe un CSV exportado de Forma + n_subdivisiones y devuelve el Excel Cabida.
"""
import os
import sys
import shutil
import tempfile
import subprocess
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

BASE_DIR = Path(__file__).resolve().parent
ENGINE = BASE_DIR / "engine" / "genera_cabida.py"

app = FastAPI(title="mobil-forma API", version="1.8")

# CORS: ajustar allow_origins en produccion al dominio Vercel.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "engine": ENGINE.exists()}


@app.post("/cabida")
async def cabida(file: UploadFile = File(...), n_sub: int = Form(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Se espera un archivo .csv exportado de Forma.")
    if n_sub < 1:
        raise HTTPException(400, "n_sub debe ser >= 1.")

    work = Path(tempfile.mkdtemp(prefix="cabida_"))
    try:
        csv_path = work / "input.csv"
        with csv_path.open("wb") as f:
            shutil.copyfileobj(file.file, f)

        out_dir = work / "out"
        out_dir.mkdir()

        proc = subprocess.run(
            [sys.executable, str(ENGINE), str(csv_path), str(n_sub), str(out_dir)],
            capture_output=True, text=True, timeout=120,
        )
        if proc.returncode != 0:
            raise HTTPException(500, f"Motor fallo: {proc.stderr[-800:]}")

        xlsx = next(out_dir.glob("Cabida_*.xlsx"), None)
        if not xlsx:
            raise HTTPException(500, "El motor no genero ningun archivo Cabida.")

        # FileResponse necesita que el archivo persista hasta enviarse: lo copiamos a temp aparte.
        final = Path(tempfile.gettempdir()) / xlsx.name
        shutil.copy2(xlsx, final)
        return FileResponse(
            final,
            filename=xlsx.name,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    finally:
        shutil.rmtree(work, ignore_errors=True)
