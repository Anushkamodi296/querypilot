import { NextRequest, NextResponse } from 'next/server';
import { getSchemaDDL, validateQuerySafety, validateQuerySyntax, executeQuery, QueryExecutionResult } from '@/lib/db';
import { analyzeQueryWithLLM, autoCorrectSqlWithLLM, LLMAnalysisResponse } from '@/lib/llm';

export interface PipelineStageStep {
  stage: 1 | 2 | 3 | 4;
  name: string;
  status: 'pending' | 'in_progress' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface QueryApiResponse {
  status: 'SUCCESS' | 'AMBIGUOUS_NEEDS_INPUT' | 'VALIDATION_FAILED' | 'ERROR';
  stages: PipelineStageStep[];
  is_ambiguous: boolean;
  clarification_questions?: string[];
  generated_sql?: string;
  explanation?: string;
  execution?: QueryExecutionResult;
  error?: string;
  retriesAttempted?: number;
}

export async function POST(req: NextRequest) {
  const stages: PipelineStageStep[] = [];
  
  try {
    const body = await req.json();
    const { prompt, userClarifications, previousContext } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json({
        status: 'ERROR',
        stages: [],
        is_ambiguous: false,
        error: 'Prompt is required.'
      }, { status: 400 });
    }

    // STAGE 1: Schema Injection & Ambiguity Detection
    stages.push({
      stage: 1,
      name: 'Schema Injection & Ambiguity Detection',
      status: 'in_progress',
      message: 'Extracting database DDL and analyzing prompt for ambiguity...'
    });

    const schemaDDL = await getSchemaDDL();
    const llmAnalysis: LLMAnalysisResponse = await analyzeQueryWithLLM(
      prompt.trim(),
      schemaDDL,
      userClarifications,
      previousContext
    );

    // If query is ambiguous and no clarifications resolved it yet
    if (llmAnalysis.is_ambiguous) {
      stages[0].status = 'warning';
      stages[0].message = 'Ambiguity detected in user prompt. Input required.';
      
      // STAGE 2: Clarification Loop
      stages.push({
        stage: 2,
        name: 'Clarification Loop Required',
        status: 'warning',
        message: 'Paused execution. Displaying clarification questions to user.',
        details: { questions: llmAnalysis.clarification_questions }
      });

      return NextResponse.json({
        status: 'AMBIGUOUS_NEEDS_INPUT',
        stages,
        is_ambiguous: true,
        clarification_questions: llmAnalysis.clarification_questions || [
          'Could you clarify the criteria or timeframe for this query?'
        ],
        explanation: llmAnalysis.explanation || 'The query requires clarification before generating SQL.'
      });
    }

    // Stage 1 Success
    stages[0].status = 'success';
    stages[0].message = 'Schema injected & intent analyzed clearly.';

    // Stage 2 Skipped or Answered
    stages.push({
      stage: 2,
      name: 'Clarification Loop',
      status: 'success',
      message: userClarifications ? 'User clarifications incorporated successfully.' : 'No clarification needed.'
    });

    let currentSql = llmAnalysis.generated_sql || 'SELECT * FROM users LIMIT 10;';
    let currentExplanation = llmAnalysis.explanation || 'Generated read-only SQL query.';

    // STAGE 3: SQL Validation & Safety Gate
    stages.push({
      stage: 3,
      name: 'SQL Validation & Safety Gate',
      status: 'in_progress',
      message: 'Verifying read-only safety and checking SQLite syntax...'
    });

    // 1. Safety Check (Read-Only SELECT)
    const safetyResult = validateQuerySafety(currentSql);
    if (!safetyResult.isSafe) {
      stages[2].status = 'error';
      stages[2].message = safetyResult.reason || 'Safety Gate rejected query.';

      return NextResponse.json({
        status: 'VALIDATION_FAILED',
        stages,
        is_ambiguous: false,
        generated_sql: currentSql,
        error: safetyResult.reason
      });
    }

    // 2. Syntax Check & Auto-Self-Correction Loop (Up to 2 Retries)
    let syntaxResult = await validateQuerySyntax(currentSql);
    let retriesAttempted = 0;
    const maxRetries = 2;

    while (!syntaxResult.isValid && retriesAttempted < maxRetries) {
      retriesAttempted++;
      stages.push({
        stage: 3,
        name: `Auto-Self-Correction (Retry ${retriesAttempted}/${maxRetries})`,
        status: 'in_progress',
        message: `Syntax error encountered: "${syntaxResult.error}". Invoking LLM self-correction...`
      });

      const correction = await autoCorrectSqlWithLLM(
        prompt,
        schemaDDL,
        currentSql,
        syntaxResult.error || 'Syntax error'
      );

      currentSql = correction.sql;
      currentExplanation = correction.explanation;

      // Re-verify safety & syntax
      const reSafety = validateQuerySafety(currentSql);
      if (!reSafety.isSafe) {
        stages[2].status = 'error';
        stages[2].message = reSafety.reason || 'Safety Gate rejected corrected query.';
        return NextResponse.json({
          status: 'VALIDATION_FAILED',
          stages,
          is_ambiguous: false,
          generated_sql: currentSql,
          error: reSafety.reason,
          retriesAttempted
        });
      }

      syntaxResult = await validateQuerySyntax(currentSql);
    }

    if (!syntaxResult.isValid) {
      stages[2].status = 'error';
      stages[2].message = `Syntax validation failed after ${maxRetries} correction attempts: ${syntaxResult.error}`;

      return NextResponse.json({
        status: 'VALIDATION_FAILED',
        stages,
        is_ambiguous: false,
        generated_sql: currentSql,
        error: syntaxResult.error,
        retriesAttempted
      });
    }

    stages[2].status = 'success';
    stages[2].message = retriesAttempted > 0 
      ? `SQL validated successfully after ${retriesAttempted} auto-correction retry.`
      : 'SQL passed safety gate and syntax EXPLAIN check cleanly.';

    // STAGE 4: Execution & Data Visualization
    stages.push({
      stage: 4,
      name: 'Execution & Data Visualization',
      status: 'in_progress',
      message: 'Executing validated query against local database...'
    });

    const executionResult = await executeQuery(currentSql);

    if (!executionResult.success) {
      stages[3].status = 'error';
      stages[3].message = executionResult.error || 'Execution failed.';

      return NextResponse.json({
        status: 'VALIDATION_FAILED',
        stages,
        is_ambiguous: false,
        generated_sql: currentSql,
        explanation: currentExplanation,
        execution: executionResult,
        error: executionResult.error,
        retriesAttempted
      });
    }

    stages[3].status = 'success';
    stages[3].message = `Execution complete: ${executionResult.rowCount} rows retrieved in ${executionResult.latencyMs}ms.`;

    return NextResponse.json({
      status: 'SUCCESS',
      stages,
      is_ambiguous: false,
      generated_sql: currentSql,
      explanation: currentExplanation,
      execution: executionResult,
      retriesAttempted
    });

  } catch (err: any) {
    console.error('API /api/query Error:', err);
    return NextResponse.json({
      status: 'ERROR',
      stages: [...stages, {
        stage: 4,
        name: 'Pipeline Error',
        status: 'error',
        message: err.message || 'Internal server error'
      }],
      is_ambiguous: false,
      error: err.message || 'An unexpected error occurred.'
    }, { status: 500 });
  }
}
