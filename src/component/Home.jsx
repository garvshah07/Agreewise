import { useEffect, useRef, useState } from 'react'
import Navigation from './Navigation'
import SourcePanel from './SourcePanel'
import AuditResults from './AuditResults'
import HistoryList from './HistoryList'
import { extractDocumentText, extractPageText, extractPdfUrl, getPdfUrl } from '../utils/policy'
import { extractAuditText, requestAudit } from '../utils/audit'
import { loadHistory, saveHistory } from '../utils/history'

const extensionApi = typeof globalThis.chrome === 'undefined' ? null : globalThis.chrome

function Header({ onRefresh, disabled }) {
  return (
    <header className='flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3'>
      <div className='flex items-center gap-2'>
        <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-[#17212b] text-sm font-black text-[#f2c36c]'>A</span>
        <div>
          <h1 className='text-sm font-bold tracking-tight text-[#17212b]'>AgreeWise</h1>
          <p className='text-[10px] text-slate-500'>Policy clarity in seconds</p>
        </div>
      </div>
      <div className='flex items-center gap-3'>
        <span className='text-[10px] font-bold uppercase tracking-[0.14em] text-[#a06a21]'>TL;DR</span>
        <button
          type='button'
          onClick={onRefresh}
          disabled={disabled}
          aria-label='Start a new policy review'
          title='Start a new policy review'
          className='flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-[#17212b] disabled:cursor-not-allowed disabled:opacity-50'
        >
          ↻
        </button>
      </div>
    </header>
  )
}

function StatusMessage({ children, tone = 'neutral' }) {
  const colors = tone === 'error'
    ? 'border-rose-200 bg-rose-50 text-rose-800'
    : 'border-amber-200 bg-amber-50 text-amber-900'

  return <div className={`border-l-4 px-3 py-2 text-sm ${colors}`}>{children}</div>
}

function Home() {
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('Scan')
  const [policyText, setPolicyText] = useState('')
  const [sourceLabel, setSourceLabel] = useState('')
  const [auditResult, setAuditResult] = useState('')
  const [resultTab, setResultTab] = useState('')
  const [selectedHistoryId, setSelectedHistoryId] = useState('')
  const [status, setStatus] = useState('')
  const [statusTone, setStatusTone] = useState('neutral')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    loadHistory().then(setHistory)
  }, [])

  function resetResult() {
    setAuditResult('')
    setResultTab('')
    setSelectedHistoryId('')
    setStatus('')
  }

  function refreshWorkspace() {
    if (busy) return

    setActiveTab('Scan')
    setPolicyText('')
    setSourceLabel('')
    setAuditResult('')
    setResultTab('')
    setStatus('')
    setStatusTone('neutral')
  }

  async function scanCurrentPage() {
    setBusy(true)
    resetResult()

    try {
      if (!extensionApi?.tabs || !extensionApi.scripting) {
        throw new Error('This action is only available inside the browser extension.')
      }

      const [tab] = await extensionApi.tabs.query({ active: true, currentWindow: true })
      const pdfUrl = getPdfUrl(tab.url)

      if (pdfUrl) {
        const text = await extractPdfUrl(pdfUrl)
        setPolicyText(text.trim() ? text : '')
        setSourceLabel(tab.title || 'PDF policy')
        setResultTab('Scan')
        setStatus(text.trim() ? 'PDF text is ready for audit.' : 'No readable text was found in this PDF.')
        setStatusTone(text.trim() ? 'neutral' : 'error')
        return
      }

      const [{ result }] = await extensionApi.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageText,
      })

      setPolicyText(result?.trim() || '')
      setSourceLabel('Live page scan')
      setResultTab('Scan')
      setStatus(result?.trim() ? 'Page text is ready for audit.' : 'No readable policy text was found.')
      setStatusTone(result?.trim() ? 'neutral' : 'error')
    } catch (error) {
      setPolicyText('')
      setStatus(error?.message?.includes('download the PDF')
        ? 'This PDF blocks direct reading. Download it and use Upload file instead.'
        : 'Scan failed. Try again on a page with readable policy text.')
      setStatusTone('error')
    } finally {
      setBusy(false)
    }
  }

  async function uploadDocument(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setBusy(true)
    resetResult()

    try {
      const text = await extractDocumentText(file)
      setPolicyText(text.trim() ? text : '')
      setSourceLabel(file.name)
      setResultTab('Upload Document')
      setStatus(text.trim() ? `${file.name} is ready for audit.` : 'No readable text was found.')
      setStatusTone(text.trim() ? 'neutral' : 'error')
    } catch (error) {
      setPolicyText('')
      setSourceLabel('')
      setStatus(error.message || 'Document upload failed.')
      setStatusTone('error')
    } finally {
      event.target.value = ''
      setBusy(false)
    }
  }

  async function saveAudit(auditText) {
    const entry = {
      id: crypto.randomUUID(),
      sourceLabel: sourceLabel || 'Unknown source',
      createdAt: new Date().toISOString(),
      auditResult: auditText,
    }
    const storedHistory = await loadHistory()
    const existingHistory = storedHistory.length ? storedHistory : history
    const nextHistory = [entry, ...existingHistory].slice(0, 15)
    setHistory(nextHistory)
    await saveHistory(nextHistory)
  }

  async function auditPolicy() {
    if (!policyText.trim()) return

    const apiKey = import.meta.env.VITE_REACT_APP_GROQ_API_KEY
    const proxyUrl = import.meta.env.VITE_REACT_APP_GROQ_PROXY_URL
    if (!apiKey && !proxyUrl) {
      setStatus('Configure VITE_REACT_APP_GROQ_PROXY_URL before auditing.')
      setStatusTone('error')
      return
    }

    setBusy(true)
    resetResult()

    try {
      const response = await requestAudit({
        apiKey,
        model: import.meta.env.VITE_REACT_APP_GROQ_MODEL || 'openai/gpt-oss-120b',
        prompt: import.meta.env.VITE_REACT_APP_GROQ_PROMPT || 'You are a policy auditor. Summarize important risks clearly.',
        policyText,
      })
      const text = extractAuditText(response)

      if (!text) throw new Error('The audit returned no readable summary.')
      setAuditResult(text)
      setResultTab(activeTab)
      setStatus('Audit complete. These are the three highest-impact clauses found.')
      setStatusTone('neutral')
      await saveAudit(text)
    } catch (error) {
      setStatus(error.message || 'Audit failed. Please try again.')
      setStatusTone('error')
    } finally {
      setBusy(false)
    }
  }

  async function clearHistory() {
    setHistory([])
    setAuditResult('')
    setResultTab('')
    setSelectedHistoryId('')
    setPolicyText('')
    setSourceLabel('')
    await saveHistory([])
    setStatus('History and the open result were cleared.')
    setStatusTone('neutral')
  }

  function openHistory(entry) {
    setAuditResult(entry.auditResult)
    setResultTab('History')
    setSelectedHistoryId(entry.id)
    setSourceLabel(entry.sourceLabel)
    setActiveTab('History')
    setStatus('Loaded from history.')
    setStatusTone('neutral')
  }

  const hasPolicy = Boolean(policyText.trim())

  return (
    <main className='min-h-100 w-95 bg-[#f5f6f8] text-slate-900'>
      <Header onRefresh={refreshWorkspace} disabled={busy} />
      <div className='flex flex-col gap-4 p-4'>
        <section>
          <p className='text-[11px] font-bold uppercase tracking-[0.18em] text-[#a06a21]'>
            {activeTab === 'History' ? 'Saved reviews' : 'Privacy policy reader'}
          </p>
          <h2 className='mt-1 text-2xl font-bold tracking-tight text-[#17212b]'>
            {activeTab === 'History' ? 'Your policy history.' : 'Know before you agree.'}
          </h2>
          <p className='mt-1 text-sm leading-5 text-slate-600'>
            {activeTab === 'History'
              ? 'Open a previous three-clause review or clear your saved results.'
              : 'We find the three clauses most likely to affect you.'}
          </p>
        </section>
        <Navigation activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'Scan' && (
          <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
            <div className='flex items-start gap-3'>
              <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e9eef3] text-sm font-bold text-[#17212b]'>1</span>
              <div>
                <h3 className='font-bold text-[#17212b]'>Choose your policy source</h3>
                <p className='mt-1 text-xs leading-5 text-slate-500'>Scan the page you are reading or import a saved document.</p>
              </div>
            </div>
            <button type='button' onClick={scanCurrentPage} disabled={busy} className='mt-4 w-full rounded-lg bg-[#17212b] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#263746] disabled:cursor-not-allowed disabled:opacity-60'>
              {busy ? 'Reading page...' : 'Scan current page'}
            </button>
            <button type='button' onClick={() => setActiveTab('Upload Document')} className='mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50'>
              Or upload a PDF / TXT / MD
            </button>
          </section>
        )}

        {activeTab === 'Upload Document' && (
          <section className='rounded-xl border border-dashed border-slate-400 bg-white p-4'>
            <p className='text-[10px] font-bold uppercase tracking-[0.18em] text-[#a06a21]'>Import policy</p>
            <h2 className='mt-1 text-lg font-bold text-[#17212b]'>Choose a document</h2>
            <p className='mt-1 text-sm leading-5 text-slate-600'>PDF, TXT, or Markdown files are supported.</p>
            <button type='button' onClick={() => fileInputRef.current?.click()} disabled={busy} className='mt-4 w-full rounded-lg bg-[#17212b] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#263746] disabled:cursor-not-allowed disabled:opacity-60'>
              {busy ? 'Reading document...' : 'Choose a document'}
            </button>
          </section>
        )}

        <input ref={fileInputRef} type='file' accept='.pdf,.txt,.md,text/plain,application/pdf' onChange={uploadDocument} className='hidden' />

        {status && <StatusMessage tone={statusTone}>{status}</StatusMessage>}
        {activeTab === 'History' ? (
          <HistoryList items={history} onOpen={openHistory} onClear={clearHistory} />
        ) : (
          <>
            <SourcePanel sourceLabel={sourceLabel} text={policyText} />
          </>
        )}

        {activeTab !== 'History' && hasPolicy && (
          <section className='rounded-xl border border-[#e7c98b] bg-[#fffaf0] p-4'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <p className='text-[11px] font-bold uppercase tracking-[0.18em] text-[#a06a21]'>Step 2 / understand</p>
                <p className='mt-1 text-sm font-semibold text-[#17212b]'>Policy captured. Find the three key clauses.</p>
              </div>
              <button type='button' onClick={auditPolicy} disabled={busy} className='rounded-lg bg-[#e29a28] px-3 py-3 text-xs font-black text-[#17212b] transition hover:bg-[#f0b54b] disabled:cursor-not-allowed disabled:opacity-60'>
                {busy ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </section>
        )}

        {((activeTab !== 'History' && resultTab === activeTab) ||
          (activeTab === 'History' && selectedHistoryId)) && <AuditResults result={auditResult} />}
      </div>
    </main>
  )
}

export default Home
