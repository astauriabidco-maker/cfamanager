FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# WeasyPrint needs: libpango-1.0-0, libpangoft2-1.0-0, libjpeg62-turbo-dev, zlib1g-dev
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
