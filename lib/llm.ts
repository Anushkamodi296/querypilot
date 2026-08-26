/**
 * LLM Service Layer for QueryPilot
 * Connects to local Ollama / Local AI endpoint with JSON guardrails and fallback smart engine.
 */

export interface LLMAnalysisResponse {
  is_ambiguous: boolean;
  clarification_questions?: string[];
  generated_sql?: string;
  explanation?: string;
  raw_response?: string;
}

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

/**
 * Stage 1 & 2: Analyzes prompt + schema + user clarifications to detect ambiguity or generate SQL
 */
export async function analyzeQueryWithLLM(
  userPrompt: string,
  schemaDDL: string,
  userClarifications?: Record<string, string>,
  previousContext?: string
): Promise<LLMAnalysisResponse> {
  const clarificationContext = userClarifications && Object.keys(userClarifications).length > 0
    ? `\nUser Clarifications Provided:\n` + Object.entries(userClarifications).map(([q, a]) => `- Question: "${q}" -> Answer: "${a}"`).join('\n')
    : '';

  const systemPrompt = `You are a SQL Architect for a SQLite database. Your task is to analyze user natural language questions and convert them into read-only SQL SELECT queries.

DATABASE SCHEMA:
${schemaDDL}

REQUIRMENTS:
1. Examine if the user's prompt is AMBIGUOUS or underspecified (e.g., missing metrics like "recent", "top sales", "active users", "best products" without defined limits or date ranges).
2. If AMBIGUOUS (and user clarification is not already provided), set "is_ambiguous": true and provide 1-3 concise clarification questions in "clarification_questions".
3. If CLEAR (or user clarification HAS resolved the ambiguity), set "is_ambiguous": false, generate valid SQLite SQL in "generated_sql", and explain it in "explanation".
4. Generate ONLY read-only SELECT or WITH statements. Do NOT write INSERT, UPDATE, DELETE, or DROP.
5. Return ONLY a valid JSON object matching this EXACT schema with no additional commentary:

{
  "is_ambiguous": boolean,
  "clarification_questions": ["Question 1", "Question 2"],
  "generated_sql": "SELECT ...",
  "explanation": "Brief explanation"
}`;

  const fullPrompt = `${systemPrompt}\n\nUSER PROMPT: ${userPrompt}${clarificationContext}\n${previousContext ? `PREVIOUS CONTEXT: ${previousContext}\n` : ''}\nOutput JSON:`;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.1 }
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data.response || '';
      const parsed = parseLLMJsonResponse(rawText);
      if (parsed) return parsed;
    }
  } catch (err) {
    console.warn('Ollama endpoint unreachable or timed out. Falling back to local smart engine.', err);
  }

  // Fallback Smart Heuristic Engine (Ensures application runs flawlessly even without Ollama running)
  return fallbackHeuristicEngine(userPrompt, userClarifications);
}

/**
 * Stage 3: Self-Correction Loop for failed SQL validation
 */
export async function autoCorrectSqlWithLLM(
  userPrompt: string,
  schemaDDL: string,
  failedSql: string,
  errorMessage: string
): Promise<{ sql: string; explanation: string }> {
  const prompt = `Fix the following SQLite SQL query that produced an error.
  
DATABASE SCHEMA:
${schemaDDL}

USER INTENT: ${userPrompt}
FAILED SQL: ${failedSql}
SQL ERROR: ${errorMessage}

Provide a corrected read-only SELECT query. Return ONLY a valid JSON object:
{
  "generated_sql": "SELECT ...",
  "explanation": "Fixed error by ..."
}`;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: 'json',
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (response.ok) {
      const data = await response.json();
      const parsed = parseLLMJsonResponse(data.response || '');
      if (parsed && parsed.generated_sql) {
        return {
          sql: parsed.generated_sql,
          explanation: parsed.explanation || 'Auto-corrected by LLM'
        };
      }
    }
  } catch (e) {
    console.warn('Auto-correct LLM call failed, applying heuristic correction.');
  }

  // Heuristic auto-correction cleanup
  let fixedSql = failedSql
    .replace(/["']/g, (m, offset, str) => (str[offset-1] === '=' ? `'` : m))
    .trim();

  // Basic syntax cleanups
  if (!fixedSql.toUpperCase().includes('FROM')) {
    fixedSql += ' FROM users';
  }

  return {
    sql: fixedSql,
    explanation: `Auto-corrected SQL syntax error: ${errorMessage}`
  };
}

/**
 * Robust JSON extraction helper
 */
function parseLLMJsonResponse(text: string): LLMAnalysisResponse | null {
  try {
    let clean = text.trim();
    // Strip markdown code fences if present
    if (clean.includes('```')) {
      clean = clean.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        is_ambiguous: Boolean(parsed.is_ambiguous),
        clarification_questions: Array.isArray(parsed.clarification_questions) ? parsed.clarification_questions : [],
        generated_sql: parsed.generated_sql || undefined,
        explanation: parsed.explanation || undefined,
        raw_response: text
      };
    }
  } catch (err) {
    console.error('Failed to parse LLM JSON response:', err);
  }
  return null;
}

/**
 * Fallback Smart Engine for instant testing when Ollama is offline
 */
function fallbackHeuristicEngine(
  userPrompt: string,
  userClarifications?: Record<string, string>
): LLMAnalysisResponse {
  const lower = userPrompt.toLowerCase();
  const hasClarifications = userClarifications && Object.keys(userClarifications).length > 0;

  // Ambiguity detection rule: Vague keywords without explicit limits/filters
  const isAmbiguousQuery = !hasClarifications && (
    (lower.includes('best') && !lower.includes('limit')) ||
    (lower.includes('recent') && !lower.includes('days') && !lower.includes('order_date')) ||
    (lower.includes('active') && !lower.includes('status')) ||
    (lower.includes('sales') && !lower.includes('total') && !lower.includes('count'))
  );

  if (isAmbiguousQuery) {
    if (lower.includes('best') || lower.includes('top')) {
      return {
        is_ambiguous: true,
        clarification_questions: [
          'Should "best/top" be defined by total revenue ($ spent) or highest total number of orders?',
          'What maximum number of records would you like returned (e.g., Top 5 vs Top 10)?'
        ],
        explanation: 'The query contains relative terms ("best"/"top") that require metric definition.'
      };
    }
    if (lower.includes('recent') || lower.includes('active')) {
      return {
        is_ambiguous: true,
        clarification_questions: [
          'Which order status should be included? (e.g. "completed", "shipped", or all statuses)',
          'Should we filter by orders placed in 2024 or order date range?'
        ],
        explanation: 'Query contains ambiguous timeframe/status parameters ("recent"/"active").'
      };
    }
    return {
      is_ambiguous: true,
      clarification_questions: [
        'Would you like results sorted by date or price?',
        'Do you want all records or a top 10 limit?'
      ],
      explanation: 'General query requires clarification on scope and sorting.'
    };
  }

  // Clear query routing
  let sql = 'SELECT * FROM users LIMIT 10;';
  let explanation = 'Retrieves sample user records from the users table.';

  if (lower.includes('user') || lower.includes('customer')) {
    if (lower.includes('order') || lower.includes('spend') || lower.includes('top')) {
      sql = `SELECT u.id, u.name, u.email, COUNT(o.id) AS total_orders, ROUND(SUM(o.total_price), 2) AS total_spent 
FROM users u 
JOIN orders o ON u.id = o.user_id 
WHERE o.status != 'cancelled'
GROUP BY u.id 
ORDER BY total_spent DESC 
LIMIT 5;`;
      explanation = 'Joins users and orders tables to compute total spent and order count per user.';
    } else {
      sql = `SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10;`;
      explanation = 'Lists recent users ordered by creation date.';
    }
  } else if (lower.includes('product') || lower.includes('stock') || lower.includes('item')) {
    if (lower.includes('low') || lower.includes('stock')) {
      sql = `SELECT p.id, p.title, c.name as category, p.price, p.stock 
FROM products p 
JOIN categories c ON p.category_id = c.id 
WHERE p.stock < 50 
ORDER BY p.stock ASC;`;
      explanation = 'Filters products with stock under 50 items joined with category name.';
    } else {
      sql = `SELECT p.id, p.title, c.name as category, p.price, p.stock 
FROM products p 
JOIN categories c ON p.category_id = c.id 
ORDER BY p.price DESC LIMIT 10;`;
      explanation = 'Lists top products sorted by price in descending order.';
    }
  } else if (lower.includes('order') || lower.includes('sale') || lower.includes('revenue')) {
    sql = `SELECT o.id as order_id, u.name as customer_name, p.title as product, o.quantity, o.total_price, o.status, o.order_date 
FROM orders o 
JOIN users u ON o.user_id = u.id 
JOIN products p ON o.product_id = p.id 
ORDER BY o.order_date DESC 
LIMIT 10;`;
    explanation = 'Returns recent orders with customer names and product details.';
  } else if (lower.includes('categor')) {
    sql = `SELECT c.id, c.name, COUNT(p.id) as product_count, ROUND(AVG(p.price), 2) as avg_price 
FROM categories c 
LEFT JOIN products p ON c.id = p.category_id 
GROUP BY c.id;`;
    explanation = 'Groups products by category to show product counts and average prices.';
  }

  // Incorporate user clarification answers if present
  if (userClarifications) {
    const answers = Object.values(userClarifications).join(' ').toLowerCase();
    if (answers.includes('5') || answers.includes('top 5')) {
      sql = sql.replace(/LIMIT \d+/i, 'LIMIT 5');
    } else if (answers.includes('10') || answers.includes('top 10')) {
      sql = sql.replace(/LIMIT \d+/i, 'LIMIT 10');
    }
    if (answers.includes('completed')) {
      if (!sql.includes('WHERE')) {
        sql = sql.replace('GROUP BY', "WHERE status = 'completed' GROUP BY");
      }
    }
  }

  return {
    is_ambiguous: false,
    generated_sql: sql,
    explanation: `${explanation}${hasClarifications ? ' (Incorporates user clarification feedback).' : ''}`,
    raw_response: 'Generated via fallback smart engine'
  };
}
