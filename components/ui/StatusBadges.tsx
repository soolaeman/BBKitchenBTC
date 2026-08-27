import React from 'react';
import { UnitStatus, PipelineStatus, GuardrailStatus } from '@/lib/types/inventory';

export function StatusBadge({ status }: { status: UnitStatus | string }) {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'AVAILABLE':
    case 'READY':
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'SOLD':
      color = 'bg-slate-800 text-slate-100 border-slate-900';
      break;
    case 'AMBIGUOUS':
      color = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {status}
    </span>
  );
}

export function PipelineBadge({ status }: { status: PipelineStatus | string }) {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  switch (status) {
    case 'PUBLISHED':
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;
    case 'READY_TO_PUBLISH':
      color = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500';
      break;
    case 'PENDING_PHOTOS':
      color = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      break;
    case 'NO_PHOTOS_FOUND':
    case 'SKIP: NO IMAGE':
      color = 'bg-orange-50 text-orange-700 border-orange-200';
      dotColor = 'bg-orange-500';
      break;
    case 'ERROR':
      color = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      break;
    case 'AMBIGUOUS':
      color = 'bg-purple-50 text-purple-700 border-purple-200';
      dotColor = 'bg-purple-500';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
}

export function GuardrailBadge({ status }: { status?: GuardrailStatus }) {
  if (!status) return null;

  let color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'WARNING') {
    color = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (status === 'BREACHED') {
    color = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${color}`}>
      {status}
    </span>
  );
}
