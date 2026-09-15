const HISTORY_KEY = 'agreewise_audit_history'
const extensionApi = typeof globalThis.chrome === 'undefined' ? null : globalThis.chrome

function storage() {
  return extensionApi?.storage?.local
}

function localHistory() {
  if (typeof localStorage === 'undefined') return []

  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export async function loadHistory() {
  const area = storage()
  if (!area) return localHistory()

  const result = await area.get(HISTORY_KEY)
  return Array.isArray(result?.[HISTORY_KEY]) ? result[HISTORY_KEY] : []
}

export async function saveHistory(items) {
  const area = storage()

  if (area) {
    await area.set({ [HISTORY_KEY]: items })
    return
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
  }
}

export function formatHistoryDate(value) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return 'Unknown time'
  }
}
