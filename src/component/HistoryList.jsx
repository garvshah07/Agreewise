import { formatHistoryDate } from '../utils/history'
import { parseAuditSummary } from '../utils/audit'

function HistoryList({ items, onOpen, onClear }) {
  if (!items.length) {
    return (
      <div className='rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600'>
        No audit history yet. Run an audit from Scan or Upload Document to save it here.
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      {items.map((entry) => {
        const summary = parseAuditSummary(entry.auditResult)
        return (
          <button
            key={entry.id}
            type='button'
            onClick={() => onOpen(entry)}
            className='w-full rounded-2xl border border-slate-200 bg-white/90 p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-white'
          >
            <div className='flex min-w-0 items-start justify-between gap-3'>
              <div className='min-w-0'>
                <div className='truncate text-sm font-semibold text-slate-900' title={entry.sourceLabel}>
                  {entry.sourceLabel}
                </div>
                <div className='mt-1 text-xs text-slate-500'>{formatHistoryDate(entry.createdAt)}</div>
              </div>
              <span className='shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600'>
                {summary.items.length || 3} points
              </span>
            </div>
            <div className='mt-3 text-sm text-slate-700'>{summary.items[0]?.heading || 'Saved audit result'}</div>
          </button>
        )
      })}
      <button
        type='button'
        onClick={onClear}
        className='w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-300 hover:text-rose-700'
      >
        Clear history
      </button>
    </div>
  )
}

export default HistoryList
