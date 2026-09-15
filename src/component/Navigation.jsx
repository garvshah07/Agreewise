const TABS = [
  { label: 'Scan page', value: 'Scan' },
  { label: 'Upload file', value: 'Upload Document' },
  { label: 'History', value: 'History' },
]

function Navigation({ activeTab, onChange }) {
  return (
    <nav className='grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white/70 p-2 shadow-sm'>
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type='button'
          onClick={() => onChange(tab.value)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            activeTab === tab.value
              ? 'bg-[#17212b] text-white shadow-sm'
              : 'text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

export default Navigation
