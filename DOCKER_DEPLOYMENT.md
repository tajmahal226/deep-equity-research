# 🐳 Docker Deployment Guide

Complete guide to deploy TJ Deep Research using Docker with all AI providers tested and working.

## 📋 Prerequisites

- Docker installed and running
- API keys for at least one AI provider and Tavily search
- 8GB+ RAM recommended for optimal performance

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone and Navigate
```bash
git clone https://github.com/tajmahal226/deep-equity-research.git
cd deep-equity-research
```

### Step 2: Configure Environment
```bash
# Copy the template
cp .env.example .env.docker

# Edit with your API keys
nano .env.docker
```

**Required Keys (minimum):**
```bash
OPENAI_API_KEY=sk-your-openai-key-here
TAVILY_API_KEY=tvly-your-tavily-key-here
```

### Step 3: Build and Run
```bash
# Build the Docker image
docker build -t deep-equity-research .

# Run the container
docker run -d -p 3000:3000 --env-file .env.docker --name deep-equity-research deep-equity-research
```

### Step 4: Access Your App
Open **http://localhost:3000** in your browser.

## 🔓 Universal AI Provider Support

**This platform works with ANY AI models you have access to:**

| Provider | What You Need | Models Available |
|----------|--------------|------------------|
| **OpenAI** | Your API key | Any models on your account (GPT-3.5, GPT-4, etc.) |
| **Anthropic** | Your API key | Any Claude models you can access |
| **DeepSeek** | Your API key | All DeepSeek models |
| **xAI** | Your API key | Grok models available to you |
| **Mistral** | Your API key | All Mistral models |
| **Google** | Your API key | Gemini models |
| **Ollama** | Local install | Any models running locally (FREE) |
| **OpenRouter** | Your API key | 200+ models through unified API |
| **Custom** | Your endpoint | Any self-hosted models |

**✨ The app automatically detects and uses whatever models YOUR API keys provide access to.**

## 🔑 API Key Configuration

### Required (Minimum Setup)
```bash
# AI Provider (choose one)
OPENAI_API_KEY=sk-your-key
# OR
ANTHROPIC_API_KEY=sk-ant-your-key

# Search Provider (required)
TAVILY_API_KEY=tvly-your-key
```

### Optional (Enhanced Features)
```bash
# Additional AI Providers
DEEPSEEK_API_KEY=sk-your-key
XAI_API_KEY=xai-your-key
MISTRAL_API_KEY=your-key
COHERE_API_KEY=your-key
GROQ_API_KEY=gsk-your-key

# Additional Search Providers
FIRECRAWL_API_KEY=fc-your-key
EXA_API_KEY=your-key

# Financial Data
FINANCIAL_DATASETS_API_KEY=your-key
```

## 🎯 Research Modes Available

1. **Free-Form Deep Research** - Open-ended queries
2. **Company Deep Dive** - Comprehensive company analysis  
3. **Bulk Company Research** - Multiple companies at once
4. **Market Research** - Industry and sector analysis
5. **Company Discovery** - Find companies by criteria
6. **Case Studies** - Business case analysis
7. **Doc Storage** - Upload and analyze documents
8. **Prompt Library** - Pre-configured research templates

## 🛠 Docker Commands Reference

### Basic Operations
```bash
# Build image
docker build -t deep-equity-research .

# Run container
docker run -d -p 3000:3000 --env-file .env.docker --name deep-equity-research deep-equity-research

# Check status
docker ps

# View logs
docker logs deep-equity-research

# Stop container
docker stop deep-equity-research

# Remove container
docker rm deep-equity-research
```

### Development Mode
```bash
# Run with volume mounting for development
docker run -d -p 3000:3000 \
  --env-file .env.docker \
  -v $(pwd):/app \
  --name deep-equity-research-dev \
  deep-equity-research
```

### Custom Port
```bash
# Run on different port (e.g., 3001)
docker run -d -p 3001:3000 --env-file .env.docker --name deep-equity-research deep-equity-research
```

## 🏥 Health Check

The container includes automatic health monitoring:

```bash
# Check health
curl http://localhost:3000/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-09-04T08:36:54.002Z", 
  "version": "0.0.1",
  "uptime": 127.716730939
}
```

## 🔧 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs deep-equity-research

# Common issues:
# 1. Port 3000 already in use - use different port: -p 3001:3000
# 2. Invalid API keys - check .env.docker format
# 3. Insufficient memory - ensure 8GB+ RAM available
```

### API Errors
```bash
# Test individual providers
curl -X POST http://localhost:3000/api/sse \
  -H "Content-Type: application/json" \
  -d '{"query":"Test query","provider":"openai","thinkingModel":"gpt-4o","taskModel":"gpt-4o","searchProvider":"tavily"}'
```

### Performance Issues
```bash
# Monitor resource usage
docker stats deep-equity-research

# Increase memory if needed
docker run -d -p 3000:3000 --memory="8g" --env-file .env.docker --name deep-equity-research deep-equity-research
```

## 📊 Production Deployment

### Docker Compose (Recommended)
Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  deep-equity-research:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.docker
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          memory: 8G
        reservations:
          memory: 4G
```

Run with:
```bash
docker-compose up -d
```

### Environment Security
For production, use secure environment variable injection instead of `.env.docker` files:

```bash
docker run -d -p 3000:3000 \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  -e TAVILY_API_KEY="$TAVILY_API_KEY" \
  --name deep-equity-research \
  deep-equity-research
```

## 📈 Performance Optimization

### Memory Settings
```bash
# For high-volume research
docker run -d -p 3000:3000 \
  --memory="16g" \
  --memory-swap="20g" \
  --env-file .env.docker \
  --name deep-equity-research \
  deep-equity-research
```

### CPU Settings
```bash
# Limit CPU usage
docker run -d -p 3000:3000 \
  --cpus="4.0" \
  --env-file .env.docker \
  --name deep-equity-research \
  deep-equity-research
```

## 🔄 Updates and Maintenance

### Update to Latest Version
```bash
# Pull latest changes
git pull origin main

# Rebuild image
docker build -t deep-equity-research .

# Stop and remove old container
docker stop deep-equity-research
docker rm deep-equity-research

# Start new container
docker run -d -p 3000:3000 --env-file .env.docker --name deep-equity-research deep-equity-research
```

### Backup Data
```bash
# Export research history (if persisted)
docker exec deep-equity-research tar -czf /tmp/backup.tar.gz /app/data

# Copy to host
docker cp deep-equity-research:/tmp/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz
```

## 📞 Support

- **Documentation**: See CLAUDE.md for detailed development info
- **Issues**: https://github.com/tajmahal226/deep-equity-research/issues
- **Health Check**: http://localhost:3000/api/health

---

**✅ All AI providers tested and working as of September 4, 2025**