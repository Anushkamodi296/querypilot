'use client';

import React, { useState } from 'react';
import { HelpCircle, Send, CheckCircle2, MessageSquare } from 'lucide-react';

interface ClarificationModalProps {
  questions: string[];
  explanation?: string;
  onSubmitClarification: (answers: Record<string, string>) => void;
  onCancel: () => void;
}

export default function ClarificationModal({
  questions,
  explanation,
  onSubmitClarification,
  onCancel
}: ClarificationModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleInputChange = (question: string, value: string) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitClarification(answers);
  };

  return (
    <div className="bg-card border border-amber-500/30 rounded-2xl p-6 mb-6 shadow-2xl shadow-amber-500/5 relative overflow-hidden">
      {/* Decorative Top Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

      <div className="flex items-start space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400">
          <HelpCircle className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Clarification Required (Stage 2 Loop)
          </h3>
          <p className="text-xs text-amber-200/80 mt-0.5">
            {explanation || 'The query contains relative terms or missing parameters. Please clarify your preferences:'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-surface/80 border border-border/70 rounded-xl p-3.5 space-y-2">
            <label className="block text-xs font-semibold text-gray-200 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              {idx + 1}. {q}
            </label>
            <input
              type="text"
              required
              placeholder="Type your clarification answer..."
              value={answers[q] || ''}
              onChange={(e) => handleInputChange(q, e.target.value)}
              className="w-full bg-[#0b101c] border border-border/80 rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50 font-sans transition"
            />
          </div>
        ))}

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-surface-hover transition"
          >
            Cancel Query
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-gray-950 flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition duration-150 transform hover:-translate-y-0.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Clarification & Execute</span>
          </button>
        </div>
      </form>
    </div>
  );
}
