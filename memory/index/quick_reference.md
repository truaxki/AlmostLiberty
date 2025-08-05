# Almost Liberty - Quick Reference

## 🎯 Essential Info

**Project**: Almost Liberty - AI-powered travel recommendation platform  
**Purpose**: Generate activity recommendations for real & fictional locations  
**AI**: Google Gemini 1.5-flash  
**Status**: Active development (rebuild in progress)  

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   AI Service    │
│                 │    │                  │    │                 │
│ • HTML/CSS/JS   │◄──►│ • Express.js     │◄──►│ • Gemini 1.5    │
│ • Cosmos Theme  │    │ • Two APIs       │    │ • JSON Output   │
│ • Spin Globe    │    │ • Caching        │    │ • Smart Parsing │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Data Sources    │
                       │                  │
                       │ • activities.json│
                       │ • AI Fallback    │
                       └──────────────────┘
```

## 🔗 Key API Endpoints

| Endpoint | Purpose | Input | Output |
|----------|---------|-------|---------|
| `/api/activity` | Get activity categories | `?location=NYC` | JSON: `{"Outdoor": [...], "Cultural": [...]}` |
| `/api/spot` | Find specific spots | `?location=NYC&activityString=hiking` | JSON: `[{name, description, features}]` |

## 📁 Critical Files

| File | Purpose | Size/Notes |
|------|---------|------------|
| `server.js` | Main Express server | 35 lines |
| `activities.json` | Predefined city data | 9,438 lines |
| `public/index.html` | Main frontend | Cosmos-themed UI |
| `public/script.js` | Frontend logic | 304 lines |
| `api/activity.js` | Activity API route | Gemini integration |
| `api/spot.js` | Spot finder API | Caching enabled |

## 🎲 Special Features

- **"Spin the Globe"**: 85+ locations (real + fictional)
- **Fictional Support**: Narnia, Westeros, Middle-earth, etc.
- **Smart Caching**: Performance optimization for AI calls
- **Dual Data**: Predefined for major cities, AI for everything else

## 🔧 Environment Setup

```bash
# Required environment variables
API_KEY=your_gemini_api_key_here

# Installation
npm install

# Dependencies
- @google/generative-ai: ^0.11.4
- express: ^4.19.2
- axios: ^1.7.2
- dotenv: ^16.4.5
```

## 🚀 Quick Commands

```bash
# Start development server
node server.js

# Deploy to Vercel
vercel deploy
```

## ⚠️ Current Issues

- Server errors during rebuild phase
- Welcome popup warns users about instability
- Recommendation: Reload page if errors occur

## 🎨 UI Theme

- **Background**: Cosmos space imagery
- **Colors**: Space/cosmic theme
- **Favicon**: Custom cosmos icon
- **Style**: Clean, minimal, responsive

## 📊 Data Strategy

1. **Check activities.json** (9,438 lines of predefined data)
2. **If found**: Return immediately (fast)
3. **If not found**: Generate with Gemini AI (flexible)
4. **Cache AI results**: Improve subsequent performance

## 🔍 Search Locations Include

**Real**: NYC, London, Paris, Tokyo, Sydney, Cape Town...  
**Fictional**: Narnia, Westeros, Middle-earth, Wakanda, Asgard...

---
*Last updated: [Current Session]*  
*Next review: After any major changes to architecture or features*