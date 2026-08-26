'use client';

import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, Loader2, ShieldCheck, Sparkles, Database, HelpCircle } from 'lucide-react';
import { PipelineStageStep } from '@/app/api/query/route';

interface StageTrackerProps {
  stages: PipelineStageStep[];
  currentStatus: 'IDLE' | 'LOADING' | 'SUCCESS' | 'AMBIGUOUS_NEEDS_INPUT' | 'VALIDATION_FAILED' | 'ERROR';
}

export default function StageTracker({ stages, currentStatus }: StageTrackerProps) {
  const stageDefinitions = [
    { number: 1, label: '1. Ambiguity Detection', icon: Sparkles },
    { number: 2, label: '2. Clarification Loop', icon: HelpCircle },
    { number: 3, label: '3. SQL Safety Gate', icon: ShieldCheck },
    { number: 4, label: '4. Execution & Viz', icon: Database },
  ];

  if (currentStatus === 'IDLE' && stages.length === 0) {
    return null;
  }

  return (
    <div className="bg-card/70 border border-border/70 rounded-2xl p-4 mb-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          4-Stage Execution Pipeline Status
        </h3>
        
        {/* Status Badge */}
        <div>
          {currentStatus === 'SUCCESS' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
            </span>
          )}
          {currentStatus === 'AMBIGUOUS_NEEDS_INPUT' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" /> AMBIGUOUS_NEEDS_INPUT
            </span>
          )}
          {currentStatus === 'VALIDATION_FAILED' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <AlertCircle className="w-3.5 h-3.5" /> VALIDATION_FAILED
            </span>
          )}
          {currentStatus === 'LOADING' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> PROCESSING...
            </span>
          )}
        </div>
      </div>

      {/* Stage Flow Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stageDefinitions.map((def) => {
          const matchingStep = stages.find(s => s.stage === def.number);
          const Icon = def.icon;
          
          let stateStyle = 'bg-surface/50 border-border/40 text-gray-500';
          let iconElement = <Clock className="w-4 h-4 text-gray-500" />;

          if (matchingStep) {
            if (matchingStep.status === 'success') {
              stateStyle = 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200';
              iconElement = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            } else if (matchingStep.status === 'warning') {
              stateStyle = 'bg-amber-950/20 border-amber-500/40 text-amber-200';
              iconElement = <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />;
            } else if (matchingStep.status === 'error') {
              stateStyle = 'bg-rose-950/20 border-rose-500/40 text-rose-200';
              iconElement = <AlertCircle className="w-4 h-4 text-rose-400" />;
            } else if (matchingStep.status === 'in_progress') {
              stateStyle = 'bg-blue-950/20 border-blue-500/50 text-blue-200 shadow-lg shadow-blue-500/10';
              iconElement = <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
            }
          }

          return (
            <div
              key={def.number}
              className={`p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between ${stateStyle}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-blue-400" />
                  {def.label}
                </span>
                {iconElement}
              </div>
              <p className="text-[11px] leading-tight text-gray-300 opacity-90 line-clamp-2">
                {matchingStep ? matchingStep.message : 'Waiting in pipeline queue...'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
