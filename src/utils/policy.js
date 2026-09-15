import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export const MAX_POLICY_CHARS = 120000

export function extractPageText() {
  const maxChars = 120000
  const excludedTags = ['nav', 'header', 'footer', 'aside']
  const root =
    document.querySelector('main') ||
    document.querySelector('article') ||
    document.querySelector('[role="main"]') ||
    document.body

  return Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li'))
    .filter((element) => !excludedTags.includes(element.closest('nav, header, footer, aside')?.tagName.toLowerCase()))
    .map((element) => element.innerText.trim())
    .filter(Boolean)
    .join('\n\n')
    .slice(0, maxChars)
}

async function extractPdfText(file) {
  return extractPdfBuffer(await file.arrayBuffer())
}

async function extractPdfBuffer(data) {
  const { GlobalWorkerOptions, getDocument } = await import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = pdfWorker
  const pdf = await getDocument({ data }).promise
  const pages = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const text = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim()

    if (text) pages.push(text)
  }

  return pages.join('\n\n').slice(0, MAX_POLICY_CHARS)
}

export function getPdfUrl(tabUrl) {
  if (!tabUrl) return ''

  try {
    const url = new URL(tabUrl)
    if (url.pathname.toLowerCase().endsWith('.pdf')) return url.href

    const fileUrl = url.searchParams.get('file')
    if (fileUrl && fileUrl.toLowerCase().includes('.pdf')) return decodeURIComponent(fileUrl)
  } catch {
    return ''
  }

  return ''
}

export async function extractPdfUrl(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not download the PDF (${response.status}).`)
  return extractPdfBuffer(await response.arrayBuffer())
}

export async function extractDocumentText(file) {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return extractPdfText(file)
  }

  if (type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
    return (await file.text()).slice(0, MAX_POLICY_CHARS)
  }

  throw new Error('Unsupported file type. Please upload a PDF, TXT, or MD file.')
}
