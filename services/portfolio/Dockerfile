# uportfolio Service Dockerfile

FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY services/portfolio/requirements.txt /app/services/portfolio/

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/services/portfolio/requirements.txt

# Copy application code
COPY app /app/app/
COPY services/portfolio /app/services/portfolio/

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose HTTP port
EXPOSE 8002

# Run the service
CMD ["python", "-m", "services.portfolio.main"]
