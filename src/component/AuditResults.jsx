import { parseAuditSummary } from '../utils/audit'

function riskClasses(level) {
  const value = level?.toLowerCase()
  if (value === 'most dangerous') {
    return 'bg-[#b9382f] text-white'
  }
  return 'bg-[#f4df9f] text-[#7b5310]'
}

function AuditResults({ result }) {
  if (!result) return null
  const summary = parseAuditSummary(result)

  return (
    <section className='overflow-hidden rounded-xl border border-[#e7c98b] bg-[#fffdf8] shadow-[0_12px_30px_rgba(38,32,20,0.08)]'>
      <header className='border-b border-[#f0dfbd] bg-[#fff5dc] px-4 py-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-full bg-[#e29a28] text-sm font-bold text-white'>3</div>
          <div>
            <p className='text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a671d]'>The short version</p>
            <h2 className='text-lg font-semibold text-slate-900'>What deserves your attention</h2>
          </div>
        </div>
      </header>

      {summary.items.length ? (
        <div className='divide-y divide-[#eadfca]'>
          {summary.items.map((item) => (
            <article key={`${item.point}-${item.heading}`} className='p-4'>
              <div className='mb-2 flex items-center justify-between gap-3'>
                <span className='text-xs font-bold uppercase tracking-[0.16em] text-[#b17b2a]'>Finding {item.point}</span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${riskClasses(item.riskLevel)}`}>
                  {item.riskLevel}
                </span>
              </div>
              <h3 className='text-[15px] font-bold text-slate-900'>{item.heading}</h3>
              <p className='mt-1 text-sm leading-6 text-slate-700'>{item.description}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className='m-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap'>{result}</p>
      )}
    </section>
  )
}

export default AuditResults
