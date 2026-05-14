# 🚀 ProdAI Assistant- AI-Powered Workplace Productivity Assistant

![ProdAI Dashboard](https://prodai-assist-hubf.lovable.app/)

**🌐 Live Demo:** [https://prodai-assist-hubf.lovable.app/](https://prodai-assist-hubf.lovable.app/)

## 📌 Problem Statement
Professionals across industries, especially in South Africa’s dynamic job market, spend excessive time on repetitive tasks such as drafting emails, summarizing meetings, planning schedules, and task management. ProdAI Assistant solves this by providing one integrated AI platform that automates these workflows, potentially saving users 10–15 hours per week.

## ✨ Solution Overview
ProdAI is a modern, responsive SaaS-style web application built with Lovable.dev. It features a clean, professional dashboard with four fully integrated AI tools.

## 🔥 Key Features

### 1. 📧 Smart Email Generator

- Context-aware professional emails
- Tone selection (Formal, Collaborative, Persuasive, Urgent)
- Audience adaptation
- One-click copy & export
  
### 2. 📝 Meeting Notes Summarizer

- Transforms raw notes into structured outputs
- Extracts decisions, action items with owners & deadlines
- Buttons: "Create Tasks" + "Draft Follow-up Email"
  
### 3. 📅 AI Task Planner / Scheduler

- Intelligent prioritization using Eisenhower principles
- Time-blocked daily/weekly schedules
- Optimization suggestions
  
### 4. 💬 AI Chatbot Interface

- Central proactive assistant
- Session memory across tools
- Handles any productivity query
  
## 💡 Innovation Highlights

- Cross-tool integration (e.g., Meeting → Tasks → Email)
- Session context memory
- Productivity Insights dashboard
- Editable outputs + export options
  
## 🧠 Prompt Engineering

All tools use **highly structured prompts** following best practices (Role, Task, Constraints, Output Format, Chain-of-Thought).

**Email Generator Prompt:** [You are an expert Executive Communication Strategist with 15+ years of experience in professional business writing.

Generate a professional email with:
- Recipient Role/Audience: {audience}
- Context/Background: {context}
- Key Points to Cover: {points}
- Desired Tone: {tone} (options: Formal, Collaborative, Persuasive, Urgent)
- Additional Instructions: {instructions}

Requirements:
- Compelling Subject Line (max 60 chars)
- Proper structure: Greeting, Context, Main Message, Call-to-Action, Polite Close
- Concise (120-180 words unless specified)
- Culturally aware and inclusive language
- Flag any assumptions made

Output in clean Markdown with a separate Subject field.]

**Meeting Summarizer Prompt:** [You are a professional Meeting Documentation Specialist.

Analyze the provided meeting notes/transcript and output in this exact structure:

1. **Executive Summary** (2-4 sentences)
2. **Key Decisions** (bullet list)
3. **Action Items** (format: • [Task] → Owner - Deadline - Priority)
4. **Key Insights & Risks**
5. **Open Questions / Follow-ups**
6. **Suggested Next Steps**

Notes: {paste notes}

Be objective, accurate, and concise. Highlight any ambiguities or missing information. Use professional yet accessible language.]

**Task Planner Prompt:** [You are a Senior Productivity Coach and Executive Assistant using Eisenhower Matrix principles.

Create an optimized plan for:
Tasks/Goals: {list}
Timeframe: {today / this week}
Constraints: {e.g., meetings, deadlines}

Output:
- Prioritized Task List (High/Medium/Low with reasoning)
- Suggested Time-Blocked Schedule
- Optimization Tips (focus blocks, breaks, delegation)
- Potential Roadblocks & Mitigations

Make it realistic and actionable for a busy professional.]

**Chatbot System Prompt:** [You are ProdAI, a proactive Workplace Productivity Assistant. You have full context of the user's current session (emails, summaries, tasks). 

Be helpful, concise, and action-oriented. Suggest relevant tools from the dashboard when appropriate. Always end responses with clear next actions.]

# 🛠️ Tools & Technologies Used

| Technology | Purpose |
|---|---|
| React 19 | Frontend UI framework |
| TanStack Start | Full-stack React framework |
| TanStack Router | File-based routing |
| TanStack Query | Server state management |
| Tailwind CSS v4 | Styling and responsiveness |
| Radix UI | Accessible UI primitives |
| Lucide React | Icon library |
| Sonner | Toast notifications |
| TypeScript | Type safety |
| Vite | Build tool |
| Lovable.dev | AI development + API gateway |
| Cloudflare Workers | Scalable edge deployment |

---

# 📂 Project Structure

```bash
src/
├── components/
│   ├── ui/
│   ├── AppLayout.tsx
│   ├── HistoryPanel.tsx
│   ├── OutputPanel.tsx
│   └── ToolShell.tsx
├── hooks/
│   ├── use-mobile.tsx
│   └── use-theme.ts
├── lib/
│   ├── ai-client.ts
│   └── use-tool-history.ts
├── routes/
│   ├── api/ai.ts
│   ├── __root.tsx
│   ├── index.tsx
│   ├── email.tsx
│   ├── summarize.tsx
│   ├── planner.tsx
│   ├── writer.tsx
│   ├── translate.tsx
│   └── chat.tsx
└── styles.css
```

---


# ⚖️ Responsible AI Practices

- Clear disclaimer on every AI-generated output:

> ⚠️ AI-Generated Content • Please review for accuracy, tone, and facts before using. May contain errors.

- Limitations documented (hallucinations, context limits, bias awareness)
- User can always edit outputs
- No storage of sensitive data
- Transparency through visible prompt structures
- Ethical and inclusive prompt engineering practices

---

# 🧩 Challenges & Solutions

| Challenge | Solution |
|---|---|
| Inconsistent output formatting | Structured prompts with exact templates |
| Generic AI tone | Role-based prompts + tone controls |
| Lack of workflow continuity | Cross-tool integration |
| Managing API cost | Token-efficient prompts |
| Responsive UI complexity | Tailwind CSS responsive layouts |
| State persistence | localStorage-based history management |

---

# 📈 Productivity Impact

| Workflow | Estimated Time Saved |
|---|---|
| Email Writing | ~45 mins/day |
| Meeting Follow-up | ~30 mins/day |
| Task Planning | ~20 mins/day |
| Content Creation | ~25 mins/day |
| Translation Tasks | ~15 mins/day |

## ✅ Total Estimated Savings:

# **10–15 hours per week**

---

# 🌙 Additional Capabilities

- Dark / Light mode toggle with persistence
- Mobile responsive dashboard
- Local history storage (up to 30 entries per tool)
- Copy output instantly
- Download generated outputs as files
- Fast and scalable architecture
- Clean SaaS-style UI/UX
- Edge-ready deployment architecture

---

# ⚡ Scalability Notes

- Stateless server architecture
- Thin `/api/ai` proxy layer
- No database required
- LocalStorage-powered history system
- Cloudflare Workers global edge deployment
- Modular route architecture for easy feature expansion

---

# 📱 Setup & Usage

## 1. Clone the Repository

```bash
git clone https://github.com/Irishtheboy/smart-work-companion.git
cd smart-work-companion
```

---

## 2. Install Dependencies

```bash
npm install
```

or

```bash
bun install
```

---

## 3. Configure Environment Variables

```bash
cp .env.example .env
```

Inside `.env`:

```env
LOVABLE_API_KEY=your_api_key_here
```

Get your API key from Lovable.dev Workspace Settings.

---

## 4. Run Development Server

```bash
npm run dev
```

or

```bash
bun dev
```

Open:

```txt
http://localhost:3000
```

---

## 5. Build for Production

```bash
npm run build
```

---

## 6. Deploy to Cloudflare Workers

```bash
npx wrangler deploy
```

---
   
📸 Screenshots

## Dashboard

*Add screenshot here*

## Smart Email Generator

*Add screenshot here*

## Meeting Notes Summarizer

*Add screenshot here*

## AI Task Planner

*Add screenshot here*

## Content Writer

*Add screenshot here*

## AI Translator

*Add screenshot here*

## AI Chatbot

*Add screenshot here*

## Prompt Library

*Add screenshot here*

---

