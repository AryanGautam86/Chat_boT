################################
# agent.py
import os
from pathlib import Path
#from langchain_classic.chains import RetrievalQA
#from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv
######
from langchain_google_genai import ChatGoogleGenerativeAI
##########

load_dotenv()  # loads .env
#OPENROUTER_KEY = os.getenv("OPENAI_API_KEY")

# Global variables (this give one shared instance for all API calls)
vectorstore = None
llm = None
#qa_chain = None
embedding_model = None

# Initialize FAISS + LLM
def init_vectorstore():
    """
    Initialize FAISS vectorstore and QA chain.
    Must be called on startup or before first document.
    """
    # global vectorstore, qa_chain, embedding_model
    global vectorstore, embedding_model, llm

    # Initialize embeddings
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0,)

    if Path("faiss.index").exists():
        vectorstore = FAISS.load_local("faiss.index", embedding_model, allow_dangerous_deserialization=True)
############
        print("=" * 50)
        print("FAISS loaded successfully")
        print("Total vectors:", vectorstore.index.ntotal)
        print("=" * 50)
#################
        # qa_chain = RetrievalQA.from_chain_type(
        #     llm=ChatOpenAI(
        #         #model="tngtech/deepseek-r1t2-chimera:free",
        #         model="deepseek/deepseek-r1",
        #         temperature=0,
        #         openai_api_key=OPENROUTER_KEY,
        #         openai_api_base="https://openrouter.ai/api/v1",
        #     ),
        #     chain_type="stuff",
        #     retriever=vectorstore.as_retriever(),
        # )
        
    else:
        vectorstore = None
        #qa_chain = None


# Add a document to FAISS
def add_document(title: str, content: str):
    """
    Add a new document to the FAISS vectorstore and save index.
    """
    # global vectorstore, qa_chain, embedding_model
    global vectorstore, embedding_model

    if embedding_model is None:
        init_vectorstore()

    if vectorstore is None:
        # First document
        vectorstore = FAISS.from_texts([content], embedding=embedding_model, metadatas=[{"title": title}])
        # qa_chain = RetrievalQA.from_chain_type(
        #     llm=ChatOpenAI(
        #         #model="tngtech/deepseek-r1t2-chimera:free",
        #         model="deepseek/deepseek-r1",
        #         temperature=0,
        #         openai_api_key=OPENROUTER_KEY,
        #         openai_api_base="https://openrouter.ai/api/v1",
        #     ),
        #     chain_type="stuff",
        #     retriever=vectorstore.as_retriever(),
        # )
    else:
        # Add to existing vectorstore
        vectorstore.add_texts([content], metadatas=[{"title": title}])

    # Save index locally
    vectorstore.save_local("faiss.index")
    
#############
def ask_question(query: str):
    #global vectorstore
    global vectorstore, llm
    if llm is None:
        init_vectorstore()
    if vectorstore is None:
        return llm.invoke(query).content
    docs = vectorstore.similarity_search_with_score(query, k=3)
    relevant_docs = []
    for doc, score in docs:
        print("Score:", score)
        if score < 50:
            relevant_docs.append(doc)
    if len(relevant_docs) == 0:
        return llm.invoke(query).content
    context = "\n\n".join(doc.page_content for doc in relevant_docs)

    prompt = f"""
You are an intelligent AI assistant.

You have access to uploaded documents and your own knowledge.

Uploaded document:

{context}

User Question:
{query}

Instructions:
- If the uploaded document answers the question, answer using it.
- If it doesn't, answer using your own knowledge.
- If both are useful, combine them naturally.
- Mention when information comes from the uploaded document.
- Never reply with "I don't know based on the provided context."

Answer:
"""
    return llm.invoke(prompt).content
#############

# # Ask a question via RAG
# def ask_question(query: str):
#     global qa_chain
#     try:
#         response = qa_chain.invoke({"query": query})
#         return response["result"]
#     except Exception as e:
#         return str(e)
#     # """
    # Query the QA chain. Returns a string answer.
    # """
    # global qa_chain, vectorstore
    # if vectorstore is None or qa_chain is None:
    #     return "No documents have been added yet. Please upload documents first."
    # # try:
    # except Exception as e:
    #     # Catch any LLM or vectorstore errors
    #     return f"Error: {str(e)}"
        
############### AI generated

#from langchain_openai import ChatOpenAI
from typing import Dict
import subprocess
#import tempfile
import os
import uuid

LANGUAGE_CONFIG = {
    "python": {"cmd": ["python"], "ext": ".py"},
    "javascript": {"cmd": ["node"], "ext": ".js"},
    "cpp": {"compile": ["g++"], "ext": ".cpp"},
    "c": {"compile": ["gcc"], "ext": ".c"},
    "java": {"compile": ["javac"], "ext": ".java"}
}

def run_code(code: str, language: str) -> str:
    language = language.lower()

    if language not in LANGUAGE_CONFIG:
        return f"Execution not supported for language: {language}"

    config = LANGUAGE_CONFIG[language]

    file_id = str(uuid.uuid4())
    ext = config["ext"]
    filename = f"{file_id}{ext}"

    try:
        with open(filename, "w") as f:
            f.write(code)

        if language in ["python", "javascript"]:
            cmd = config["cmd"] + [filename]

        elif language in ["c", "cpp"]:
            exe = f"{file_id}.out"
            compile_cmd = config["compile"] + [filename, "-o", exe]
            subprocess.check_output(compile_cmd, stderr=subprocess.STDOUT, timeout=10)
            cmd = [f"./{exe}"]

        elif language == "java":
            subprocess.check_output(["javac", filename], stderr=subprocess.STDOUT, timeout=10)
            class_name = filename.replace(".java", "")
            cmd = ["java", class_name]

        output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, timeout=10)
        return output.decode()

    except subprocess.CalledProcessError as e:
        return e.output.decode()

    except Exception as e:
        return str(e)

    finally:
        for f in os.listdir():
            if f.startswith(file_id):
                os.remove(f)

def generate_code_from_prompt(user_task: str, language: str = "python", run_tests: bool = False) -> Dict:
    global llm

    if llm is None:
        init_vectorstore()
    """
    LLM-powered dynamic code generator using OpenRouter + DeepSeek.
    Supports multi-language execution.
     """

    # llm = ChatOpenAI(
    #     #model="tngtech/deepseek-r1t2-chimera:free",
    #     model="deepseek/deepseek-r1",
    #     temperature=0.2,
    #     openai_api_key=OPENROUTER_KEY,
    #     openai_api_base="https://openrouter.ai/api/v1",
    # )

    prompt = f"""
You are a senior software engineer.

Generate clean, correct, production-quality {language} code for the task below.

TASK:
{user_task}

Rules:
- Output ONLY code.
- No explanations.
- No markdown.
- Code must be directly runnable.
"""
    
    response = llm.invoke(prompt)
    code = response.content.strip()

    # result = {
    #     "code_or_questions": f"```{language}\n{code}\n```",
    #     #"notes": "AI-generated code using DeepSeek R1"
    #     "notes": "AI-generated code using Gemini 2.5 Flash"
    # }
    result = {
    "code": code,
    "notes": "AI-generated code using Gemini 2.5 Flash"}

    # Optional execution
    if run_tests:
        execution_output = run_code(code, language)
        result["execution_output"] = execution_output

    return result

###############################################################
# Explain Generated Code
###############################################################

def explain_code(code: str, language: str) -> Dict:
    """
    Explain AI-generated code in detail.
    Returns a structured markdown explanation.
    """
    global llm

    if llm is None:
        init_vectorstore()

    prompt = f"""
You are an expert Software Engineer and Technical Interviewer.

Explain the following {language} code.

Return your response in MARKDOWN.

Use EXACTLY these headings.

# 🎯 Purpose

Explain what this program does.

# ⚙️ Working

Explain how the code works step-by-step.

# ⏱ Time Complexity

Explain the time complexity and why.

# 💾 Space Complexity

Explain the space complexity and why.

# ▶ Dry Run

Show one example input and explain every important step.

# ⚠ Edge Cases

Mention important edge cases.

Code:

{code}
"""

    response = llm.invoke(prompt)

    return {
        "explanation": response.content
    }




    




    
