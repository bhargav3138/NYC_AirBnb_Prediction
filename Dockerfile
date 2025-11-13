FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ml_models/ ./ml_models/
COPY backend/ ./backend/

ENV PYTHONUNBUFFERED=1

EXPOSE 5000

CMD ["python", "backend/app.py"]
