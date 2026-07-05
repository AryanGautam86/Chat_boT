# ===============================
# Stage 1 - Build React
# ===============================

FROM node:20 AS frontend-builder

WORKDIR /frontend

COPY Frontend/package*.json ./

RUN npm install

COPY Frontend .

RUN npm run build


# ===============================
# Stage 2 - FastAPI
# ===============================

FROM python:3.12-slim

WORKDIR /app

COPY Backend/requirements.txt .

RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY Backend .

COPY --from=frontend-builder /frontend/dist ./Frontend/dist

EXPOSE 8000

CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8000"]