export function parseAuditSummary(content) {
  if (!content?.trim()) return { title: 'Audit Summary', items: [] }

  const text = content.replace(/\r/g, '').trim()
  const normalizeRisk = (value) => {
    const risk = value.toLowerCase()
    return ['critical', 'high', 'most dangerous', 'dangerous'].includes(risk)
      ? 'MOST DANGEROUS'
      : 'IMPORTANT'
  }
  const sections = [...text.matchAll(
    /Point\s*(\d+)\s*\nRisk Level:\s*(.+?)\nIssue:\s*(.+?)\nContent:\s*([\s\S]*?)(?=\nPoint\s*\d+\s*\nRisk Level:|\s*$)/gi
  )]

  if (sections.length) {
    return {
      title: 'Audit Summary',
      items: sections.slice(0, 3).map((match) => ({
        point: Number(match[1]),
        riskLevel: normalizeRisk(match[2].trim()),
        heading: match[3].trim(),
        description: match[4].trim(),
      })),
    }
  }

  const bullets = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^(?:[•*-]|\d+[.)])\s+/.test(line))
    .slice(0, 3)

  return {
    title: 'Audit Summary',
    items: bullets.map((line, index) => {
      let description = line.replace(/^(?:[•*-]|\d+[.)])\s+/, '')
      const labelMatch = description.match(/^\[(MOST DANGEROUS|IMPORTANT)\]\s*/i)
      const riskLevel = labelMatch ? labelMatch[1].toUpperCase() : 'IMPORTANT'

      if (labelMatch) {
        description = description.slice(labelMatch[0].length).trim()
      }

      const separator = description.match(/\s+—\s+|:\s+/)
      const heading = separator
        ? description.slice(0, separator.index).trim()
        : `Finding ${index + 1}`
      const details = separator
        ? description.slice(separator.index + separator[0].length).trim()
        : description

      return {
        point: index + 1,
        riskLevel,
        heading,
        description: details,
      }
    }),
  }
}

export function extractAuditText(response) {
  const content = response?.choices?.[0]?.message?.content

  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : part?.type === 'text' ? part.text || '' : ''))
      .join('\n')
      .trim()
  }

  return ''
}

export async function requestAudit({ apiKey, model, prompt, policyText }) {
  const proxyUrl = import.meta.env.VITE_REACT_APP_GROQ_PROXY_URL
  const response = await fetch(
    proxyUrl || 'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(proxyUrl ? {} : { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `POLICY TEXT TO AUDIT:\n${policyText}` },
        ],
        temperature: 0.1,
        max_completion_tokens: 1200,
      }),
    }
  )

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message || `Audit request failed (${response.status}).`)
  }

  return response.json()
}
