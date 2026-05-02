## Project Overview
**EduQuest** is a comprehensive educational platform with AI-powered learning features, gamification, and multi-role support (Students, Teachers, Administrators).

## System Architecture
- **Frontend**: React Native/Expo mobile app
- **Backend**: Spring Boot (Java) + Python FastAPI (AI services)
- **Database**: PostgreSQL with pgvector for AI embeddings
- **AI Integration**: Google Gemini 2.5 Flash Lite + OpenAI Whisper

## Quick Start Setup

### Prerequisites
- Node.js 22
- Python 3.13
- Java 17+
- PostgreSQL
- Ollama (for local embeddings)

### Installation Steps

1. **Frontend Setup**
```bash
-- In the project
cd expofrontend
```
```bash
-- Run
npm install
npx expo start
```

2. **Python Backend Setup**
```bash
-- Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
```
```bash
-- Set .env file
GEMINI_API_KEY=your-google-api-key
GEMINI_MODEL=your-model
```
```bash
-- In the project
cd pythonbackend
pip install -r requirements.txt
```
```bash
-- Run
uvicorn main:app --host 0.0.0.0 --port 8000
```

3. **Spring Backend Setup**
```bash
-- In the project
cd springbackend
```
```bash
-- Run
./gradlew bootRun
```

4. **Database Setup**
```bash
-- Create the database
CREATE DATABASE eduquestdb;
```
```bash
-- Create the application user
CREATE USER eduquestuser WITH PASSWORD 'eduquestpass';
```
```bash
-- Grant access to the database
GRANT ALL PRIVILEGES ON DATABASE eduquestdb TO eduquestuser;
```
```bash
-- Connect to the database to configure schema permissions
\c eduquestdb
```
```bash
-- Ensure the user can create tables in the public schema
GRANT ALL PRIVILEGES ON SCHEMA public TO eduquestuser;
```

5. **Ollama Setup**
```bash
-- After installed ollama
ollama run nomic-embed-text
```

### App Testing

#### 1. **Student Experience Flow**
1. **Login** with student credentials
2. **Home Dashboard** - View XP, level, daily quests
3. **Subject Games** - Test Math, English, Science, Chinese games
4. **AI Chatbot** - Ask educational questions
5. **Profile Customization** - Change avatar, badges, backgrounds
6. **Leaderboard** - View rankings and achievements
7. **Shop/Inventory** - Purchase items with points

#### 2. **Teacher Dashboard Flow**
1. **Login** with teacher credentials
2. **Dashboard Overview** - View class statistics
3. **Student Management** - Add/remove students, view progress
4. **Class Analytics** - Monitor performance trends
5. **AI Analysis** - Generate student performance reports
6. **Game Scores** - Review individual student results

#### 3. **Administrator Functions**
1. **Role Management** - Approve teacher requests
2. **User Administration** - Manage all system users
3. **System Analytics** - View platform-wide statistics
