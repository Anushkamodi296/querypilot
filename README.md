# QueryPilot: AI Text-to-SQL with Clarification Engine

QueryPilot is a production-ready full-stack application built with Next.js (App Router), React, Tailwind CSS, SQLite, and local AI (Ollama). It translates natural language questions into executable SQLite SQL queries through a robust 4-Stage Execution Engine.

---

## 4-Stage Execution Engine

1. **Stage 1: Schema Injection & Ambiguity Detection**
   - Automatically extracts table DDL definitions (`users`, `products`, `categories`, `orders`).
   - Sends database schema + prompt + context to local LLM / Smart Engine.
   - Detects underspecified or ambiguous queries.

2. **Stage 2: Interactive Clarification Loop**
   - If ambiguity is detected (`is_ambiguous: true`), pauses execution and renders a modern clarification dialog with specific questions.
   - Resubmits prompt + user clarification answers back to Stage 1.

3. **Stage 3: SQL Safety Gate & Syntax Validation**
   - **Safety Check**: Restricts queries strictly to read-only `SELECT` / `WITH` statements. Blocks `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`.
   - **Syntax Validation**: Executes `EXPLAIN QUERY PLAN <sql>` against SQLite.
   - **Auto-Self-Correction**: Automatically invokes LLM correction if a syntax error occurs (up to 2 retries).

4. **Stage 4: Execution & Data Visualization**
   - Executes validated query against local SQLite database.
   - Measures execution latency in milliseconds, row count, and target tables.
   - Renders interactive data table grid with pagination, search filtering, SQL code viewer with syntax highlighting & copy button, and CSV export.

---

## Getting Started

### 1. Install Dependencies & Run Dev Server
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Optional: Connect Local Ollama AI Engine
By default, QueryPilot includes a smart fallback engine so it works 100% out of the box. To connect local Ollama:

```bash
ollama run llama3
```

QueryPilot connects directly to `http://localhost:11434/api/generate`.

---

## Database Seed Data
Pre-populated SQLite database (`querypilot.db`) includes:
- `users` (id, name, email, role, created_at)
- `products` (id, title, category_id, price, stock, created_at)
- `categories` (id, name)
- `orders` (id, user_id, product_id, quantity, total_price, status, order_date)
