# LeetCode Mentor Chrome Extension

A smart, AI-enhanced Chrome extension that helps you solve, track, and master LeetCode problems — with personalized notes, helpful links, a stopwatch, and Gemini-powered insights

---

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Google Gemini API](https://img.shields.io/badge/Google%20Gemini-GenerativeAI-blue?logo=google&logoColor=white)
![Render](https://img.shields.io/badge/Render-303030?logo=render&logoColor=white)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/naodegdjgghbeppfefdjfpnpjindgfje?label=Chrome%20Extension&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/leetcode-mentor/naodegdjgghbeppfefdjfpnpjindgfje)


---

## 🌐 Published At

Chrome Web Store → [view on Web Store](https://chromewebstore.google.com/detail/leetcode-mentor/naodegdjgghbeppfefdjfpnpjindgfje)

---


## ✨ Features
- 📝 Custom Notes: Add personal notes for each LeetCode problem directly on the problem page. 
- 💾 Instant Save: Notes are automatically saved using chrome.storage.local and retrieved instantly.  
- ⏱ Stopwatch / Timer: Track problem-solving time with a built-in stopwatch.  
- 🔗 Helpful Links: Add problem-specific references or resources for quick access.
- 🤖 AI-Powered Insights using [Gemini-ask-api](https://github.com/tusharAgarwal2511/Gemini-ask-api) to:
  - Generate pseudocode for the problem.
  - Explain concepts in simple terms.
  - Suggest prerequisites before attempting the problem. 
  - Highlight real-world applications.
- 💡 Personalized Dashboard on Focus Area tab:
  - Difficulty Stats: Visual breakdown of problems solved by difficulty.
  - Contest Stats: Track contest performance, ratings, and percentile.
  - Topic Stats: See problems solved per topic (Fundamental → Intermediate → Advanced) with progress bars and detailed lists.
- 🔄 Smart Cache System: Minimizes redundant API calls by caching insights for 3 days.    
- ✉️ Seamless UI: Fully integrated with LeetCode’s native look and feel.  
- 🗑 Clear All Data: Easily reset all notes, insights, and timers with one click.

---

## 💻 Tech Stack

- [**JavaScript**](https://developer.mozilla.org/en-US/docs/Web/JavaScript) – Core frontend logic and Chrome extension behavior ✨  
- [**HTML/CSS**](https://developer.mozilla.org/en-US/docs/Web/HTML) – Popup/user interface styling ⚙️  
- [**Chrome Manifest V3**](https://developer.chrome.com/docs/extensions/mv3/) – Extension configuration & permissions 📄  
- [**Gemini Ask API (Custom Backend)**](https://github.com/tusharAgarwal2511/Gemini-ask-api) – Your own Node.js/Express microservice that connects to Google’s Gemini 🤖  
- [**Google Gemini API**](https://developers.generativeai.google/) – Generates AI-powered insights and explanations 🧠  

---

## 📸 Screenshots  

| | |
|---|---|
| ![Screenshot 01](images/Screenshot1.png) | ![Screenshot 02](images/Screenshot2.png) |
| ![Screenshot 03](images/Screenshot3.png) | ![Screenshot 04](images/Screenshot4.png) |
| ![Screenshot 05](images/Screenshot5.png) | |

---

## 🧩 System Architecture
High-level overview of how the Chrome extension communicates with backend services.

### 1. Flowchart (High-Level Process)
Illustrates the decision-based flow from popup load to rendering, highlighting caching and data fetching logic. Demonstrates performance optimization by caching AI insights for 3 days, reducing API calls.

```mermaid
graph TD
    A[LeetCode Page Load] --> B{Is Problem Page?}
    B -->|Yes| C[Load Notes & AI Insights]
    B -->|No| D{Is LeetCode Site?}
    D -->|Yes| E[Load Dashboard Data]
    D -->|No| F[Show Unavailable Sections]
    C --> G[Fetch Cached Insights]
    G --> H{Cache Valid?}
    H -->|Yes| I[Display Insights]
    H -->|No| J[Fetch from Gemini API]
    J --> K[Generate Pseudocode, Teaches, Prerequisites, Use Case]
    K --> L[Cache & Display]
    L --> I
    E --> M[Get Username via Script Injection]
    M --> N[GraphQL Query: Difficulty Stats]
    N --> O[Render Difficulty Bar Chart]
    M --> P[GraphQL Query: Contest Ranking]
    P --> Q[Render Contest Stats Card]
    M --> R[GraphQL Query: Topic Problem Counts]
    R --> S[Sort Topics by Solved]
    S --> T[Render Progress Bar, Labels, List for Each Level]
    T --> U[Add Toggle Functionality]
```

### 2. Component and Data Flow Diagram
Breaks down frontend components, backend interactions, and pipelines—emphasizing modularity and error handling.

```mermaid
flowchart LR
    subgraph "Frontend (Popup HTML/JS)"
        UI[Tabs: Notes, AI Insights, Dashboard]
        Notes[Notes Section: Textarea, Save, Clear]
        Insights[Insights Cards: Pseudocode, Teaches, Prereqs, Use Case]
        Dashboard[Dashboard: Difficulty Bar, Contest Card, Topic Cards]
        TabSwitch[Event Listeners for Tab Switching]
        LoadOnDemand[Load Data on Tab Activation]
    end
    
    subgraph "Backend Interactions"
        Cache[LocalStorage for Insights Cache 3 days]
        Storage[Chrome Storage for Notes]
        API[Gemini API via Render Proxy]
        GraphQL[LeetCode GraphQL API]
    end
    
    subgraph "Data Flow"
        Username[Extract Username from DOM]
        ProblemSlug[Extract from URL]
        InsightsFlow[ProblemSlug -> Cache Check -> API if Miss -> Display]
        NotesFlow[Load/Save Notes per Problem]
        StatsFlow[Username -> GraphQL Queries -> Render Charts]
    end
    
    UI --> TabSwitch
    TabSwitch --> LoadOnDemand
    LoadOnDemand --> InsightsFlow
    LoadOnDemand --> NotesFlow
    LoadOnDemand --> StatsFlow
    InsightsFlow --> Cache
    InsightsFlow --> API
    StatsFlow --> Username
    StatsFlow --> GraphQL
    NotesFlow --> Storage
```

### 3. Sequence Diagram (User Interaction Flow)
Highlights asynchronous interactions and error handling—demonstrating robust UX.

```mermaid
sequenceDiagram
    participant User
    participant Popup
    participant LeetCode
    participant Cache
    participant API
    
    User->>Popup: Open Extension Popup
    Popup->>LeetCode: Check URL & Extract Slug/Username
    alt Problem Page
        Popup->>Cache: Check Insights Cache
        alt Cache Hit
            Cache-->>Popup: Return Data
        else Cache Miss
            Popup->>API: Fetch Insights (Pseudocode etc.)
            API-->>Popup: AI Responses
            Popup->>Cache: Store with Timestamp
        end
        Popup-->>User: Display Insights Cards
        Popup->>Cache: Load/Save Notes
    else LeetCode Site
        Popup->>LeetCode: GraphQL Difficulty Query
        LeetCode-->>Popup: Stats Data
        Popup-->>User: Render Difficulty Bar
        Popup->>LeetCode: GraphQL Contest Query
        LeetCode-->>Popup: Ranking Data
        Popup-->>User: Render Contest Card
        Popup->>LeetCode: GraphQL Topics Query
        LeetCode-->>Popup: Tag Counts
        Popup-->>User: Render Topic Progress Bars
    end
```

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/tusharAgarwal2511/LeetCode-Mentor.git
cd LeetCode-Mentor
```

### 2 . Load locally into Chrome
• Go to chrome://extensions  
• Enable Developer Mode  
• Click “Load unpacked”  
• Select this project folder

# 3. (Optional) Ping backend API
https://gemini-ask-api.onrender.com


