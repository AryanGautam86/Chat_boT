# main.py
##########
from fastapi.middleware.cors import CORSMiddleware
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["KMP_WARNINGS"] = "0"
import logging
logging.getLogger("tensorflow").setLevel(logging.ERROR)
#########
from fastapi import FastAPI, Form, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from sqlalchemy.orm import Session
from models import Document, SessionLocal
# from agent import add_document, ask_question, init_vectorstore
from agent import (
    add_document,
    ask_question,
    init_vectorstore,
    generate_code_from_prompt,
    explain_code,
)

app = FastAPI()

##
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite React
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],)
##

# Initialize FAISS/QA on startup
@app.on_event("startup")
def startup_event():
    init_vectorstore()


# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Root endpoint
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR / "Frontend" / "dist"

# @app.get("/")
# def serve_frontend():
#     index_file = FRONTEND_DIST / "index.html"

#     if index_file.exists():
#         return FileResponse(index_file)

#     return {
#         "message": "Frontend not built yet. Run npm run build inside Frontend."
#     }


# Upload document endpoint
@app.post("/upload")
async def upload_document(title: str = Form(...),content: str = Form(...),db: Session = Depends(get_db)):
    # Save to database
    doc = Document(title=title, content=content)
    db.add(doc)
    db.commit()

    # Add to FAISS
    add_document(title, content)

    return {"message": "Document added successfully"}


# Query endpoint
@app.get("/query")
def query(q: str):
    answer = ask_question(q)
    return {"question": q, "answer": answer}
############
@app.post("/generate_code")
def AI_generate_code_endpoint(user_task: str = Form(...),language: str = Form("python"),run_tests: bool = Form(False)):
    return generate_code_from_prompt(
        user_task=user_task,
        language=language,
        run_tests=run_tests )
    
#############
#############
@app.post("/explain_code")
def explain_code_endpoint(
    code: str = Form(...),
    language: str = Form(...)
):
    return explain_code(
        code=code,
        language=language,
    )
#############
if FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="assets",
    )


@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    index_file = FRONTEND_DIST / "index.html"

    if index_file.exists():
        return FileResponse(index_file)

    return {
        "message": "Frontend not built. Run npm run build."
    }
# Run uvicorn safely on Windows
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)



