/**
 * Client-Side AI/ML Engine & Provider Manager for QueryPilot
 * Stores configuration strictly in localStorage to maintain 100% client-side privacy.
 */

export type AIProvider = 'mock' | 'openai' | 'groq' | 'ollama' | 'deepseek';

export interface AISettings {
  provider: AIProvider;
  openaiApiKey: string;
  openaiModel: string;
  groqApiKey: string;
  groqModel: string;
  deepseekApiKey: string;
  deepseekModel: string;
  ollamaUrl: string;
  ollamaModel: string;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'mock',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  groqApiKey: '',
  groqModel: 'llama-3.3-70b-versatile',
  deepseekApiKey: '',
  deepseekModel: 'deepseek-chat',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3',
};

const STORAGE_KEY = 'querypilot_ai_settings_v1';

export function getStoredAISettings(): AISettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load AI settings from localStorage:', e);
  }
  return DEFAULT_AI_SETTINGS;
}

export function saveStoredAISettings(settings: AISettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save AI settings to localStorage:', e);
  }
}

export interface SqlGenerationResult {
  sql: string;
  explanation: string;
  latencyMs: number;
  tablesCount: number;
  tablesUsed: string[];
  providerUsed: string;
}

export interface QueryExplanationResult {
  summary: string;
  intent: string;
  tables: string[];
  joins: string[];
  filters: string[];
  aggregations: string[];
  optimizations: string[];
  latencyMs: number;
  providerUsed: string;
}

/**
 * Client-Side Text-to-SQL Generation Engine
 */
export async function generateSqlFromPrompt(
  prompt: string,
  schemaDDL: string,
  customSettings?: AISettings
): Promise<SqlGenerationResult> {
  const startTime = performance.now();
  const settings = customSettings || getStoredAISettings();
  const tableNames = extractTableNamesFromDDL(schemaDDL);

  // If Mock AI or no key available for selected provider, use Mock Engine
  if (settings.provider === 'mock' || isMissingKey(settings)) {
    const mockRes = mockTextToSql(prompt, schemaDDL);
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      sql: mockRes.sql,
      explanation: mockRes.explanation,
      latencyMs: Math.max(120, latencyMs),
      tablesCount: tableNames.length,
      tablesUsed: extractUsedTables(mockRes.sql, tableNames),
      providerUsed: 'Built-in Mock AI Engine',
    };
  }

  try {
    let result: { sql: string; explanation: string };
    let providerName = 'AI Provider';

    if (settings.provider === 'openai') {
      providerName = `OpenAI (${settings.openaiModel || 'gpt-4o-mini'})`;
      result = await callOpenAICompatible(
        'https://api.openai.com/v1/chat/completions',
        settings.openaiApiKey,
        settings.openaiModel || 'gpt-4o-mini',
        prompt,
        schemaDDL
      );
    } else if (settings.provider === 'groq') {
      providerName = `Groq (${settings.groqModel || 'llama-3.3-70b-versatile'})`;
      result = await callOpenAICompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        settings.groqApiKey,
        settings.groqModel || 'llama-3.3-70b-versatile',
        prompt,
        schemaDDL
      );
    } else if (settings.provider === 'deepseek') {
      providerName = `DeepSeek (${settings.deepseekModel || 'deepseek-chat'})`;
      result = await callOpenAICompatible(
        'https://api.deepseek.com/v1/chat/completions',
        settings.deepseekApiKey,
        settings.deepseekModel || 'deepseek-chat',
        prompt,
        schemaDDL
      );
    } else if (settings.provider === 'ollama') {
      providerName = `Ollama (${settings.ollamaModel || 'llama3'})`;
      const url = `${settings.ollamaUrl.replace(/\/$/, '')}/api/generate`;
      result = await callOllama(url, settings.ollamaModel || 'llama3', prompt, schemaDDL);
    } else {
      result = mockTextToSql(prompt, schemaDDL);
      providerName = 'Built-in Mock AI Engine';
    }

    const latencyMs = Math.round(performance.now() - startTime);
    return {
      sql: result.sql,
      explanation: result.explanation,
      latencyMs,
      tablesCount: tableNames.length,
      tablesUsed: extractUsedTables(result.sql, tableNames),
      providerUsed: providerName,
    };
  } catch (err: any) {
    console.warn('API call failed, falling back to Built-in Mock AI Engine:', err);
    const mockRes = mockTextToSql(prompt, schemaDDL);
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      sql: mockRes.sql,
      explanation: `${mockRes.explanation} (Note: Provider API call failed/timed out, fell back to Mock AI).`,
      latencyMs,
      tablesCount: tableNames.length,
      tablesUsed: extractUsedTables(mockRes.sql, tableNames),
      providerUsed: 'Built-in Mock AI Engine (Fallback)',
    };
  }
}

/**
 * Client-Side AI Query Explainer & Optimizer Engine
 */
export async function explainAndOptimizeQuery(
  sql: string,
  schemaDDL: string,
  customSettings?: AISettings
): Promise<QueryExplanationResult> {
  const startTime = performance.now();
  const settings = customSettings || getStoredAISettings();

  if (settings.provider === 'mock' || isMissingKey(settings)) {
    const mockExplain = mockExplainQuery(sql, schemaDDL);
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      ...mockExplain,
      latencyMs: Math.max(140, latencyMs),
      providerUsed: 'Built-in Mock AI Explainer',
    };
  }

  try {
    const systemPrompt = `You are a SQLite Database Administrator and Query Optimization Specialist.
Analyze the provided SQLite query against the database schema DDL.
Provide a clear breakdown and performance optimization suggestions in valid JSON format ONLY:
{
  "summary": "High-level summary of what this query computes",
  "intent": "Plain English intent statement",
  "tables": ["table1", "table2"],
  "joins": ["Description of join 1", "Description of join 2"],
  "filters": ["Filter condition 1", "Filter condition 2"],
  "aggregations": ["Aggregation 1", "Grouping 1"],
  "optimizations": ["Optimization advice 1", "Optimization advice 2", "Indexing suggestion"]
}`;

    const userPrompt = `SCHEMA DDL:\n${schemaDDL}\n\nSQL QUERY TO EXPLAIN & OPTIMIZE:\n${sql}`;

    let jsonRaw = '';
    let providerName = 'Built-in Mock AI Explainer';

    if (settings.provider === 'openai' || settings.provider === 'groq' || settings.provider === 'deepseek') {
      const apiKey = settings.provider === 'openai' ? settings.openaiApiKey : settings.provider === 'groq' ? settings.groqApiKey : settings.deepseekApiKey;
      const model = settings.provider === 'openai' ? settings.openaiModel : settings.provider === 'groq' ? settings.groqModel : settings.deepseekModel;
      const baseUrl = settings.provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : settings.provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.deepseek.com/v1/chat/completions';

      providerName = `${settings.provider.toUpperCase()} AI Explainer`;

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        jsonRaw = data.choices?.[0]?.message?.content || '';
      }
    }

    if (jsonRaw) {
      const parsed = parseJsonClean(jsonRaw);
      if (parsed && parsed.summary) {
        return {
          summary: parsed.summary || 'SQL Query Breakdown',
          intent: parsed.intent || 'Retrieves data matching specified criteria.',
          tables: Array.isArray(parsed.tables) ? parsed.tables : [],
          joins: Array.isArray(parsed.joins) ? parsed.joins : [],
          filters: Array.isArray(parsed.filters) ? parsed.filters : [],
          aggregations: Array.isArray(parsed.aggregations) ? parsed.aggregations : [],
          optimizations: Array.isArray(parsed.optimizations) ? parsed.optimizations : [],
          latencyMs: Math.round(performance.now() - startTime),
          providerUsed: providerName,
        };
      }
    }
  } catch (err) {
    console.warn('API Explain call failed, using mock explainer:', err);
  }

  const mockExplain = mockExplainQuery(sql, schemaDDL);
  return {
    ...mockExplain,
    latencyMs: Math.round(performance.now() - startTime),
    providerUsed: 'Built-in Mock AI Explainer',
  };
}

/* Helper Functions & External API Wrappers */

function isMissingKey(settings: AISettings): boolean {
  if (settings.provider === 'openai' && !settings.openaiApiKey) return true;
  if (settings.provider === 'groq' && !settings.groqApiKey) return true;
  if (settings.provider === 'deepseek' && !settings.deepseekApiKey) return true;
  return false;
}

async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  userPrompt: string,
  schemaDDL: string
): Promise<{ sql: string; explanation: string }> {
  const systemMessage = `You are a SQLite Expert and Text-to-SQL generator. Convert natural language questions into valid, clean SQLite SELECT queries based ONLY on the provided schema DDL.
Do NOT write INSERT, UPDATE, DELETE, or DROP statements. Return ONLY a JSON object:
{
  "sql": "SELECT ...",
  "explanation": "Brief step-by-step logic summary"
}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: `SCHEMA:\n${schemaDDL}\n\nQUESTION: ${userPrompt}` }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${endpoint}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  const parsed = parseJsonClean(text);
  if (parsed && parsed.sql) {
    return {
      sql: sanitizeSql(parsed.sql),
      explanation: parsed.explanation || 'Generated clean SQLite query.',
    };
  }
  throw new Error('Failed to parse response JSON from AI provider.');
}

async function callOllama(
  endpoint: string,
  model: string,
  userPrompt: string,
  schemaDDL: string
): Promise<{ sql: string; explanation: string }> {
  const promptText = `Convert natural language into SQLite SQL.
SCHEMA:
${schemaDDL}

QUESTION: ${userPrompt}

Return ONLY JSON:
{
  "sql": "SELECT ...",
  "explanation": "Explanation here"
}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama3',
      prompt: promptText,
      stream: false,
      format: 'json',
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from Ollama`);
  }

  const data = await response.json();
  const parsed = parseJsonClean(data.response || '');
  if (parsed && parsed.sql) {
    return {
      sql: sanitizeSql(parsed.sql),
      explanation: parsed.explanation || 'Generated by Ollama local LLM.',
    };
  }
  throw new Error('Invalid Ollama response.');
}

function parseJsonClean(text: string): any {
  try {
    let clean = text.trim();
    if (clean.includes('```')) {
      clean = clean.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (e) {
    console.warn('parseJsonClean error:', e);
  }
  return null;
}

function sanitizeSql(sql: string): string {
  let s = sql.trim();
  if (s.startsWith('```sql')) s = s.replace(/^```sql/i, '');
  if (s.startsWith('```')) s = s.replace(/^```/, '');
  if (s.endsWith('```')) s = s.slice(0, -3);
  s = s.trim();
  if (!s.endsWith(';')) s += ';';
  return s;
}

function extractTableNamesFromDDL(ddl: string): string[] {
  const matches = ddl.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([a-zA-Z0-9_]+)["`]?/gi);
  if (!matches) return ['categories', 'users', 'products', 'orders'];
  return matches.map(m => {
    const parts = m.split(/\s+/);
    return parts[parts.length - 1].replace(/["`]/g, '');
  });
}

function extractUsedTables(sql: string, knownTables: string[]): string[] {
  return knownTables.filter(t => new RegExp(`\\b${t}\\b`, 'i').test(sql));
}

/* Smart Built-in Mock AI Engine Implementation */

function mockTextToSql(prompt: string, schemaDDL: string): { sql: string; explanation: string } {
  const lower = prompt.toLowerCase();

  if (lower.includes('low stock') && (lower.includes('revenue') || lower.includes('total') || lower.includes('top'))) {
    return {
      sql: `SELECT p.id, p.title, c.name AS category, p.price, p.stock, COALESCE(SUM(o.total_price), 0) AS total_revenue
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN orders o ON p.id = o.product_id AND o.status != 'cancelled'
WHERE p.stock < 50
GROUP BY p.id
ORDER BY p.stock ASC, total_revenue DESC
LIMIT 5;`,
      explanation: 'Joins products with categories and completed orders to compute total revenue generated by items with stock under 50, sorted by lowest stock and highest revenue.'
    };
  }

  if (lower.includes('low stock') || lower.includes('stock under') || lower.includes('inventory')) {
    return {
      sql: `SELECT p.id, p.title, c.name AS category_name, p.price, p.stock, p.created_at
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.stock < 50
ORDER BY p.stock ASC;`,
      explanation: 'Queries products with inventory stock under 50 items along with category details, sorted by lowest stock count.'
    };
  }

  if (lower.includes('sales data') || lower.includes('summarize sales') || lower.includes('sales summary')) {
    return {
      sql: `SELECT 
  COUNT(o.id) AS total_orders,
  ROUND(SUM(o.total_price), 2) AS gross_revenue,
  ROUND(AVG(o.total_price), 2) AS avg_order_value,
  SUM(o.quantity) AS total_items_sold,
  COUNT(DISTINCT o.user_id) AS unique_buyers
FROM orders o
WHERE o.status != 'cancelled';`,
      explanation: 'Aggregates sales performance across completed and shipped orders to calculate gross revenue, average order value, items sold, and unique buyer count.'
    };
  }

  if (lower.includes('duplicate') || lower.includes('find duplicates')) {
    return {
      sql: `SELECT email, COUNT(*) AS duplicate_count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;`,
      explanation: 'Groups users by email address to detect any duplicate user accounts with matching email credentials.'
    };
  }

  if (lower.includes('rank top customer') || lower.includes('top customer') || lower.includes('highest spending')) {
    return {
      sql: `SELECT u.id, u.name, u.email, COUNT(o.id) AS total_orders, ROUND(SUM(o.total_price), 2) AS total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status != 'cancelled'
GROUP BY u.id
ORDER BY total_spent DESC
LIMIT 5;`,
      explanation: 'Joins users and orders, calculating total expenditure and order count per customer, ranking top 5 spenders.'
    };
  }

  if (lower.includes('category') || lower.includes('categories')) {
    return {
      sql: `SELECT c.id, c.name AS category_name, COUNT(p.id) AS product_count, ROUND(AVG(p.price), 2) AS avg_price, SUM(p.stock) AS total_stock
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id
ORDER BY product_count DESC;`,
      explanation: 'Groups products by category to calculate total catalog count, average price, and total stock per category.'
    };
  }

  if (lower.includes('order') || lower.includes('recent order') || lower.includes('purchases')) {
    return {
      sql: `SELECT o.id AS order_id, u.name AS customer, p.title AS product, o.quantity, o.total_price, o.status, o.order_date
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON o.product_id = p.id
ORDER BY o.order_date DESC
LIMIT 10;`,
      explanation: 'Fetches the 10 most recent orders with full customer and product line-item information.'
    };
  }

  // Fallback generic query
  return {
    sql: `SELECT u.id, u.name, u.email, u.role, u.created_at
FROM users u
ORDER BY u.created_at DESC
LIMIT 10;`,
    explanation: 'Generates a clean read-only SELECT query retrieving sample user accounts.'
  };
}

function mockExplainQuery(sql: string, ddl: string): Omit<QueryExplanationResult, 'latencyMs' | 'providerUsed'> {
  const cleanSql = sql.trim();

  // Extract tables mentioned
  const tables = ['categories', 'users', 'products', 'orders'].filter(t => 
    new RegExp(`\\b${t}\\b`, 'i').test(cleanSql)
  );

  // Extract joins
  const joinMatches = cleanSql.match(/(?:LEFT|INNER|RIGHT|CROSS)?\s*JOIN\s+[a-zA-Z0-9_]+\s+(?:AS\s+[a-zA-Z0-9_]+\s+)?ON\s+[^;\n\r]+/gi) || [];
  const joins = joinMatches.map(j => j.trim());
  if (joins.length === 0 && tables.length > 1) {
    joins.push(`Implicit join across tables: ${tables.join(', ')}`);
  }

  // Extract filters
  const whereMatch = cleanSql.match(/WHERE\s+([^;\n\r]+?)(?:GROUP BY|ORDER BY|LIMIT|$)/i);
  const filters: string[] = [];
  if (whereMatch) {
    filters.push(whereMatch[1].trim());
  } else {
    filters.push('No WHERE filtering clause (scans table dataset)');
  }

  // Extract aggregations
  const aggregations: string[] = [];
  if (/SUM|AVG|COUNT|MIN|MAX/i.test(cleanSql)) {
    const aggMatches = cleanSql.match(/(?:SUM|AVG|COUNT|MIN|MAX)\([^)]+\)/gi) || [];
    aggregations.push(...aggMatches);
  }
  if (/GROUP BY/i.test(cleanSql)) {
    const groupMatch = cleanSql.match(/GROUP BY\s+([^;\n\r]+?)(?:HAVING|ORDER BY|LIMIT|$)/i);
    if (groupMatch) aggregations.push(`Grouping: ${groupMatch[1].trim()}`);
  }

  // Build performance optimization suggestions
  const optimizations: string[] = [];

  if (tables.includes('orders') && (joins.some(j => j.includes('user_id')) || cleanSql.includes('user_id'))) {
    optimizations.push('💡 Indexing Recommendation: Ensure an index exists on `orders(user_id)` to optimize JOIN lookups.');
  }
  if (tables.includes('orders') && (joins.some(j => j.includes('product_id')) || cleanSql.includes('product_id'))) {
    optimizations.push('⚡ Indexing Recommendation: Create an index on `orders(product_id)` to speed up product sales aggregation.');
  }
  if (tables.includes('products') && cleanSql.includes('category_id')) {
    optimizations.push('🚀 Foreign Key Index: Index `products(category_id)` to accelerate category grouping and joining.');
  }
  if (!/LIMIT/i.test(cleanSql)) {
    optimizations.push('⚠️ Pagination Guard: Add a `LIMIT` clause (e.g., LIMIT 50) to prevent oversized in-memory buffer allocations on client-side WebAssembly.');
  }
  if (cleanSql.includes('*')) {
    optimizations.push('🎯 Column Selection: Specify explicit column names instead of `SELECT *` to reduce WASM serialization overhead.');
  }
  if (optimizations.length === 0) {
    optimizations.push('✅ Query Structure: Query uses indexed primary keys and explicit column projections cleanly.');
  }

  return {
    summary: `Analyzes data from ${tables.length > 0 ? tables.join(', ') : 'database tables'} using SQLite WebAssembly engine.`,
    intent: `Retrieves ${tables.join(' and ')} records with specified filters and ordering.`,
    tables: tables.length > 0 ? tables : ['unknown_table'],
    joins: joins.length > 0 ? joins : ['Single table query (No JOINs required)'],
    filters: filters,
    aggregations: aggregations.length > 0 ? aggregations : ['Row-level projection (No aggregations)'],
    optimizations,
  };
}
