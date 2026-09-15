function SourcePanel({ sourceLabel, text }) {
  if (!sourceLabel) return null

  return (
    <section className='border-y border-slate-200/80 py-3 text-sm text-slate-700'>
      <div className='flex items-center justify-between gap-3'>
        <span className='truncate font-medium'>{sourceLabel}</span>
        <span className='shrink-0 text-xs text-slate-500'>{text.length.toLocaleString()} characters captured</span>
      </div>
      {text && (
        <details className='mt-2 text-xs text-slate-500'>
          <summary className='cursor-pointer font-medium text-slate-600'>Review captured text</summary>
          <p className='mt-2 max-h-24 overflow-auto whitespace-pre-wrap leading-5'>{text}</p>
        </details>
      )}
    </section>
  )
}

export default SourcePanel
