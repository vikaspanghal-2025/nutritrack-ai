# 🥗 NutriTrack AI

**An AI-powered nutrition and fitness platform that makes calorie tracking effortless.**

NutriTrack AI uses Claude (via Amazon Bedrock) to analyze any food you describe — from "2 aloo parathas with curd" to a photo of a thali — and returns accurate calorie and macronutrient breakdowns instantly. Combined with Apple Health integration, goal-based calorie targeting, and an AI fitness coach, it's a complete health companion built on AWS serverless infrastructure.

**🔗 Live App: [https://d3818r1vq8xm4o.cloudfront.net](https://d3818r1vq8xm4o.cloudfront.net)**

![React](https://img.shields.io/badge/React_18-TypeScript-blue) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-blue) ![AWS](https://img.shields.io/badge/AWS-Lambda%20|%20DynamoDB%20|%20Bedrock%20|%20CloudFront-orange) ![Claude](https://img.shields.io/badge/AI-Claude_Sonnet_(Bedrock)-purple)

---

## Why NutriTrack AI?

Most calorie tracking apps require you to search through massive food databases, manually select portion sizes, and guess at homemade meals. This is especially painful for Indian cuisine where a single thali can have 6+ items, each with varying preparation methods.

NutriTrack AI solves this by letting you:
- **Type naturally**: "I had dal makhani, 2 rotis, and raita" → Claude identifies each item and returns precise nutrition data
- **Snap a photo**: Take a picture of your plate → Claude's vision analyzes the food items
- **Sync automatically**: Apple Health pushes your daily active calories via an iOS Shortcut — no manual entry for the burn side
- **Get coached**: Ask the AI coach "How many more grams of protein do I need today?" and get a context-aware answer based on what you actually ate

---

## Use Cases

**For weight-conscious individuals**: Set a weight loss goal, log meals in natural language, and see exactly how many calories remain for the day. The AI coach suggests high-protein vegetarian options to fill macro gaps.

**For fitness enthusiasts**: Track workouts alongside nutrition. Apple Health integration automatically imports active calories burned. Weekly and monthly trend charts show your consistency over time.

**For Indian food lovers**: The AI is specifically tuned for Indian cuisine — it knows the difference between a plain dosa (120 cal) and a masala dosa (250 cal), and can estimate calories for complex dishes like biryani, chole, and paneer butter masala.

**For families and groups**: Google Sign-In means each family member has their own account with private data. Share the app link and everyone tracks independently.

---

## Features

### 🍽️ AI Food Analysis (Claude via Bedrock)
- Natural language input: describe any meal in plain English or Hindi food names
- Photo upload: snap a picture and Claude identifies individual food items
- Accurate macro breakdown: calories, protein, carbs, fats per item
- Quantity adjustment: AI suggests quantities, you confirm or tweak before logging
- 30+ Indian foods in the knowledge base, plus Claude's general food knowledge

### 📊 Dashboard
- Three calorie rings: Eaten, Burned, Remaining
- Macronutrient progress bars (Protein / Carbs / Fats)
- Meal breakdown by category (Breakfast, Lunch, Dinner, Snacks)
- Trend charts with Week / Month / Year toggle
- Motivational greetings based on time of day

### 🏋️ Activity Tracking
- 10 activity types with calorie burn estimation
- Duration and intensity controls
- Apple Health integration via iOS Shortcuts
- Per-day tracking with date navigation

### 🍎 Apple Health Integration
- iOS Shortcut reads HealthKit data (Active Energy) on-device
- Sends daily totals to NutriTrack API automatically
- Nightly automation at 10 PM — zero manual effort
- Step-by-step setup guide built into the app

### 🤖 AI Fitness Coach
- Conversational chat interface
- Context-aware: knows your daily intake, burn, and remaining targets
- Meal suggestions based on remaining calories
- Workout plans (e.g., "Build me a 4-week 5K plan")
- High-protein vegetarian recommendations

### 👤 Profile & Goals
- BMR calculation (Mifflin-St Jeor equation)
- TDEE with 5 activity levels
- Three goal modes: Weight Loss (-500 cal), Muscle Building (+300 cal), Endurance (+200 cal)
- Dynamic macro targets adjusted per goal

### 🔐 Authentication
- Google Sign-In for cross-device data sync
- Guest mode for trying the app without an account
- Per-user data isolation in DynamoDB

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                          │
│         React 18 + TypeScript + Tailwind CSS             │
│              Hosted on S3 + CloudFront                   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────────────┐
│                   API Gateway (HTTP)                      │
│                  CORS enabled, REST                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  Lambda (Node.js 20)                      │
│                                                          │
│  /api/profile      GET/PUT user profile                  │
│  /api/food         GET/POST/DELETE food entries           │
│  /api/activity     GET/POST/DELETE activities             │
│  /api/logs         GET weekly/monthly/yearly trends       │
│  /api/analyze-food POST → Claude Sonnet (Bedrock)        │
│  /api/health-sync  POST ← iOS Shortcut (Apple Health)    │
└─────────┬────────────────────┬──────────────────────────┘
          │                    │
          ▼                    ▼
┌──────────────────┐  ┌────────────────────┐
│    DynamoDB      │  │  Amazon Bedrock    │
│  (Single Table)  │  │  Claude Sonnet     │
│                  │  │                    │
│  PK: USER#email  │  │  Food analysis     │
│  SK: PROFILE     │  │  Photo recognition │
│  SK: FOOD#date#  │  │  Nutrition data    │
│  SK: ACTIVITY#   │  └────────────────────┘
│  SK: STEPS#date  │
└──────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  iOS Shortcut                             │
│  Find Health Samples → Calculate Statistics (Sum)         │
│  → POST to /api/health-sync (nightly at 10 PM)           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│               Google Identity Services                    │
│  OAuth 2.0 client-side sign-in                           │
│  Email used as stable user ID across devices              │
└──────────────────────────────────────────────────────────┘
```

### AWS Services Used

| Service | Purpose |
|---------|---------|
| **Amazon DynamoDB** | Single-table design storing user profiles, food logs, activities, and steps. Pay-per-request billing. |
| **AWS Lambda** | Node.js 20 function handling all API operations. 60s timeout for Bedrock calls. |
| **Amazon API Gateway** | HTTP API with CORS, routes all requests to Lambda. |
| **Amazon Bedrock** | Claude Sonnet model for food analysis — text-to-nutrition and image-to-nutrition. |
| **Amazon S3** | Static frontend asset hosting. |
| **Amazon CloudFront** | CDN with HTTPS, Origin Access Control for private S3 bucket. |
| **AWS IAM** | Lambda execution role with DynamoDB and Bedrock permissions. |

### DynamoDB Data Model

Single-table design with composite keys:

| PK | SK | Description |
|----|-----|-------------|
| `USER#{email}` | `PROFILE` | User profile (name, age, weight, goal) |
| `USER#{email}` | `FOOD#{date}#{id}` | Food entry for a specific date |
| `USER#{email}` | `ACTIVITY#{date}#{id}` | Activity entry for a specific date |
| `USER#{email}` | `STEPS#{date}` | Daily step count from Apple Health |

All dates use PST (America/Los_Angeles) timezone.

---

## Getting Started

### Prerequisites
- Node.js 18+
- AWS CLI configured with appropriate permissions
- Google Cloud Console project (for OAuth)

### Local Development

```bash
git clone https://github.com/vikaspanghal-2025/nutritrack-ai.git
cd nutritrack-ai
npm install
npm run dev
```

Without environment variables, the app runs in local mode (localStorage, no AI analysis, guest login).

### Environment Variables

Create a `.env` file:

```
VITE_API_URL=https://your-api-gateway.execute-api.us-east-1.amazonaws.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Deploy to AWS

```bash
cd backend
npm install
node deploy.js
```

This creates: DynamoDB table, IAM role, Lambda function, API Gateway. Then set up CloudFront manually pointing to the S3 bucket.

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application)
3. Add your CloudFront domain and `http://localhost:5173` as Authorized JavaScript Origins
4. Set the Client ID in `.env`

### Apple Health Setup

See the in-app guide under Profile → Apple Health, or follow these steps:

1. Create an iOS Shortcut with: Find Health Samples (Active Energy, today) → Calculate Statistics (Sum) → Set Variable → Text (JSON body) → Get Contents of URL (POST to API)
2. Set up nightly automation at 10 PM
3. Allow "Sharing Large Amounts of Data" in Settings → Shortcuts

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profile` | Get user profile |
| `PUT` | `/api/profile` | Save/update profile |
| `GET` | `/api/food?date=YYYY-MM-DD` | Get food entries for a date |
| `POST` | `/api/food` | Log a food entry |
| `DELETE` | `/api/food/{id}?date=YYYY-MM-DD` | Remove a food entry |
| `GET` | `/api/activity?date=YYYY-MM-DD` | Get activities for a date |
| `POST` | `/api/activity` | Log an activity |
| `DELETE` | `/api/activity/{id}?date=YYYY-MM-DD` | Remove an activity |
| `GET` | `/api/logs?days=N` | Get N days of logs (for trends) |
| `POST` | `/api/analyze-food` | AI food analysis via Claude |
| `POST` | `/api/health-sync` | Receive Apple Health data from iOS Shortcut |

All endpoints use `X-User-Id` header for user isolation.

---

## Project Structure

```
nutritrack-ai/
├── src/
│   ├── components/          # UI components
│   │   ├── BottomNav.tsx    # Mobile bottom navigation
│   │   ├── DateNav.tsx      # Date picker (PST-aware)
│   │   ├── FitnessSync.tsx  # Apple Health integration UI
│   │   ├── MacroBar.tsx     # Macro progress bars
│   │   ├── ProgressRing.tsx # Calorie ring charts
│   │   └── Sidebar.tsx      # Desktop sidebar navigation
│   ├── context/
│   │   ├── AppContext.tsx    # App state (food, activities, targets)
│   │   └── AuthContext.tsx   # Google Sign-In authentication
│   ├── pages/
│   │   ├── Activity.tsx     # Activity tracking with date nav
│   │   ├── Coach.tsx        # AI fitness coach chat
│   │   ├── Dashboard.tsx    # Main dashboard with trends
│   │   ├── FoodLog.tsx      # AI food logging (text + photo)
│   │   ├── Login.tsx        # Google Sign-In + guest mode
│   │   ├── Onboarding.tsx   # First-time profile setup
│   │   └── Profile.tsx      # Profile, goals, fitness sync
│   ├── utils/
│   │   ├── api.ts           # API client (DynamoDB or localStorage)
│   │   ├── dateUtils.ts     # PST timezone helpers
│   │   ├── nutrition.ts     # BMR/TDEE calculations
│   │   └── storage.ts       # localStorage helpers
│   ├── types.ts             # TypeScript interfaces
│   ├── App.tsx              # Root with auth + routing
│   └── main.tsx             # Entry point
├── backend/
│   ├── lambda/
│   │   └── index.mjs        # Lambda handler (all API routes + Bedrock)
│   └── deploy.js            # AWS infrastructure deployment script
├── .env                     # Environment variables (not committed)
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS 3.4 (mobile-first, responsive) |
| Charts | Recharts |
| Icons | Lucide React |
| Auth | Google Identity Services (OAuth 2.0) |
| AI | Claude Sonnet via Amazon Bedrock |
| API | AWS Lambda (Node.js 20) + API Gateway |
| Database | Amazon DynamoDB (single-table, pay-per-request) |
| Hosting | Amazon S3 + CloudFront (HTTPS) |
| Health Data | Apple HealthKit via iOS Shortcuts |

---

## License

MIT
