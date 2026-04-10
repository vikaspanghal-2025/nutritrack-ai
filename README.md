# 🥗 NutriTrack AI

An intelligent health and fitness platform that combines AI-powered food recognition with activity tracking to provide a personalized path toward your fitness goals.

**Live App:** [https://d3818r1vq8xm4o.cloudfront.net](https://d3818r1vq8xm4o.cloudfront.net)

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-blue) ![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20DynamoDB%20%7C%20S3%20%7C%20CloudFront-orange)

---

## Features

### 📊 Dashboard
- Daily calorie progress ring (Calories In vs Out)
- Macronutrient breakdown (Protein / Carbs / Fats) with visual bars and pie chart
- Meal-by-meal calorie summary (Breakfast, Lunch, Dinner, Snacks)
- Weekly trend chart showing calories eaten vs burned

### 🍽️ AI-Powered Food Logging
- **Natural Language Input** — Type "2 aloo parathas with a bowl of curd" and the AI parses it into individual food items with accurate calorie/macro data
- **Photo Upload** — Take a photo of your plate; the system identifies food items and estimates portions (Indian thali detection built-in)
- **30+ Indian Foods Database** — Dal Makhani, Paneer Tikka, Dosa, Idli, Biryani, Khichdi, Makhana, and more with accurate nutritional data
- **Quantity Refinement** — Quick-confirm UI to adjust AI-detected quantities before logging
- **Meal Categorization** — Auto-sort into Breakfast, Lunch, Dinner, or Snacks

### 🏋️ Activity Tracking
- 10 activity types: Running, Walking, Yoga, Weightlifting, Cycling, Swimming, HIIT, Dancing, Cricket, Badminton
- Duration slider and intensity selector (Low / Moderate / High)
- Automatic calorie burn estimation based on activity type, duration, and intensity
- Fitness app sync UI for Strava, Google Fit, Fitbit, and Apple Health

### 🤖 AI Fitness Coach
- Conversational chat interface with context-aware responses
- Knows what you ate today, how much you worked out, and your remaining targets
- Capabilities:
  - "How many more grams of protein do I need today?"
  - "Suggest a vegetarian dinner under 500 calories"
  - "What high-protein veg snack can I have?"
  - "Build me a 4-week plan to run a 5k"
  - "Am I on track with my goals today?"

### 👤 Profile & Goal Setting
- BMR calculation (Mifflin-St Jeor equation)
- TDEE calculation with 5 activity levels
- Three goal modes: Weight Loss, Muscle Building, Endurance
- Dynamic macro targets adjusted per goal
- Vegetarian-focused recommendations (Tofu, Paneer, Lentils, Tempeh)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (mobile-first, responsive) |
| Charts | Recharts |
| Icons | Lucide React |
| Backend API | AWS Lambda (Node.js 20) + API Gateway (HTTP) |
| Database | Amazon DynamoDB (single-table design, pay-per-request) |
| Hosting | Amazon S3 + CloudFront (HTTPS) |
| State | React Context + localStorage fallback |

### Architecture

```
Browser → CloudFront → S3 (static assets)
       → API Gateway → Lambda → DynamoDB
```

DynamoDB uses a single-table design:
- `PK`: `USER#{userId}` — partition per user
- `SK`: `PROFILE`, `FOOD#{date}#{id}`, `ACTIVITY#{date}#{id}` — sort key for entity type

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- AWS CLI configured (for deployment)

### Local Development

```bash
# Clone the repo
git clone https://github.com/vikaspanghal-2025/nutritrack-ai.git
cd nutritrack-ai

# Install dependencies
npm install

# Run locally (uses localStorage, no AWS needed)
npm run dev
```

The app runs at `http://localhost:5173`. Without a `VITE_API_URL` in `.env`, it falls back to localStorage for all data persistence.

### Connect to AWS Backend

```bash
# Create .env file
echo "VITE_API_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com" > .env

# Rebuild
npm run build
```

### Deploy to AWS

```bash
# Install backend dependencies
cd backend
npm install

# Deploy (creates DynamoDB table, Lambda, API Gateway, S3 bucket, uploads frontend)
node deploy.js
```

This creates:
- DynamoDB table (`NutriTrackData`)
- IAM role for Lambda
- Lambda function (`nutritrack-api`)
- HTTP API Gateway with CORS
- S3 bucket with frontend assets

Then set up CloudFront manually or via the AWS Console pointing to the S3 bucket.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Save/update profile |
| GET | `/api/food?date=YYYY-MM-DD` | Get food entries for a date |
| POST | `/api/food` | Log a food entry |
| DELETE | `/api/food/{id}?date=YYYY-MM-DD` | Remove a food entry |
| GET | `/api/activity?date=YYYY-MM-DD` | Get activities for a date |
| POST | `/api/activity` | Log an activity |
| DELETE | `/api/activity/{id}?date=YYYY-MM-DD` | Remove an activity |
| GET | `/api/logs?days=7` | Get weekly summary |

All endpoints require `X-User-Id` header for user isolation.

---

## Project Structure

```
nutritrack-ai/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── BottomNav.tsx
│   │   ├── FitnessSync.tsx
│   │   ├── MacroBar.tsx
│   │   └── ProgressRing.tsx
│   ├── context/
│   │   └── AppContext.tsx  # Global state management
│   ├── pages/
│   │   ├── Dashboard.tsx   # Main dashboard with charts
│   │   ├── FoodLog.tsx     # Food logging (text + photo)
│   │   ├── Activity.tsx    # Activity tracking
│   │   ├── Coach.tsx       # AI fitness coach chat
│   │   ├── Profile.tsx     # Profile & goals
│   │   └── Onboarding.tsx  # First-time setup
│   ├── utils/
│   │   ├── api.ts          # API client (DynamoDB or localStorage)
│   │   ├── nutrition.ts    # BMR/TDEE calculations, food DB
│   │   └── storage.ts      # localStorage helpers
│   ├── types.ts
│   ├── App.tsx
│   └── main.tsx
├── backend/
│   ├── lambda/
│   │   └── index.mjs       # Lambda handler (CRUD for DynamoDB)
│   └── deploy.js           # AWS deployment script
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## License

MIT
