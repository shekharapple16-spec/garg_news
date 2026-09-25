const DEVANAGARI_TO_GURMUKHI = {
  'अ': 'ਅ', 'आ': 'ਆ', 'इ': 'ਇ', 'ई': 'ਈ', 'उ': 'ਉ', 'ऊ': 'ਊ', 'ए': 'ਏ', 'ऐ': 'ਐ', 'ओ': 'ਓ', 'औ': 'ਔ',
  'क': 'ਕ', 'ख': 'ਖ', 'ग': 'ਗ', 'घ': 'ਘ', 'ङ': 'ਙ', 'च': 'ਚ', 'छ': 'ਛ', 'ज': 'ਜ', 'झ': 'ਝ', 'ञ': 'ਞ',
  'ट': 'ਟ', 'ठ': 'ਠ', 'ड': 'ਡ', 'ढ': 'ਢ', 'ण': 'ਣ', 'त': 'ਤ', 'थ': 'ਥ', 'द': 'ਦ', 'ध': 'ਧ', 'न': 'ਨ',
  'प': 'ਪ', 'फ': 'ਫ', 'ब': 'ਬ', 'भ': 'ਭ', 'म': 'ਮ', 'य': 'ਯ', 'र': 'ਰ', 'ल': 'ਲ', 'व': 'ਵ',
  'श': 'ਸ਼', 'ष': 'ਸ਼', 'स': 'ਸ', 'ह': 'ਹ', '़': '਼', 'ं': 'ਂ', 'ँ': 'ਁ', 'ः': 'ਃ',
  'ा': 'ਾ', 'ि': 'ਿ', 'ी': 'ੀ', 'ु': 'ੁ', 'ू': 'ੂ', 'े': 'ੇ', 'ै': 'ੈ', 'ो': 'ੋ', 'ौ': 'ੌ', '्': '',
  '०': '੦', '१': '੧', '२': '੨', '३': '੩', '४': '੪', '५': '੫', '६': '੬', '७': '੭', '८': '੮', '९': '੯',
  ' ': ' ', '।': '.', ',': ',', ';': ';', ':': ':', '!': '!', '?': '?', '(': '(', ')': ')', '[': '[', ']': ']', '{': '{', '}': '}',
  '"': '"', "'": "'", '–': '–', '—': '—', '\n': '\n', '\r': '\r', '\t': '\t', '/': '/', '॰': '।'
}

const GURMUKHI_TO_DEVANAGARI = {
  'ਅ': 'अ', 'ਆ': 'आ', 'ਇ': 'इ', 'ਈ': 'ई', 'ਉ': 'उ', 'ਊ': 'ऊ', 'ਏ': 'ए', 'ਐ': 'ऐ', 'ਓ': 'ओ', 'ਔ': 'औ',
  'ਕ': 'क', 'ਖ': 'ख', 'ਗ': 'ग', 'ਘ': 'घ', 'ਙ': 'ङ', 'ਚ': 'च', 'ਛ': 'छ', 'ਜ': 'ज', 'ਝ': 'झ', 'ਞ': 'ञ',
  'ਟ': 'ट', 'ਠ': 'ठ', 'ਡ': 'ड', 'ਢ': 'ढ', 'ਣ': 'ण', 'ਤ': 'त', 'ਥ': 'थ', 'ਦ': 'द', 'ਧ': 'ध', 'ਨ': 'न',
  'ਪ': 'प', 'ਫ': 'फ', 'ਬ': 'ब', 'ਭ': 'भ', 'ਮ': 'म', 'ਯ': 'य', 'ਰ': 'र', 'ਲ': 'ल', 'ਵ': 'व',
  'ਸ਼': 'श', 'ਸ': 'स', 'ਹ': 'ह', 'ਁ': 'ँ', 'ਂ': 'ं', 'ਃ': 'ः', '਼': '़',
  'ਾ': 'ा', 'ਿ': 'ि', 'ੀ': 'ी', 'ੁ': 'ु', 'ੂ': 'ू', 'ੇ': 'े', 'ੈ': 'ै', 'ੋ': 'ो', 'ੌ': 'ौ', '੍': '',
  '੦': '०', '੧': '१', '੨': '२', '੩': '३', '੪': '४', '੫': '५', '੬': '६', '੭': '७', '੮': '८', '੯': '९',
  ' ': ' ', '.': '।', ',': ',', ';': ';', ':': ':', '!': '!', '?': '?', '(': '(', ')': ')', '[': '[', ']': ']', '{': '{', '}': '}',
  '"': '"', "'": "'", '–': '–', '—': '—', '\n': '\n', '\r': '\r', '\t': '\t', '/': '/', '।': '।'
}

const transliterateText = (text, map) => Array.from(text).map((char) => map[char] ?? char).join('')

export function transliterateHindiToPunjabi(text = '') {
  if (!text) {
    return ''
  }

  return transliterateText(text, DEVANAGARI_TO_GURMUKHI)
}

export function transliteratePunjabiToHindi(text = '') {
  if (!text) {
    return ''
  }

  return transliterateText(text, GURMUKHI_TO_DEVANAGARI)
}

export function transliterateHtmlToPunjabi(html = '') {
  if (!html) {
    return ''
  }

  return html
    .split(/(<[^>]+>)/g)
    .map((segment) => {
      if (segment.startsWith('<') && segment.endsWith('>')) {
        return segment
      }

      return transliterateHindiToPunjabi(segment)
    })
    .join('')
}

export function normalizeRichTextContent(value = '') {
  if (!value) {
    return ''
  }

  let normalized = String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00A0/gi, ' ')

  const emptyParagraphPatterns = [
    /<p\b[^>]*>\s*(?:<br\s*\/?>\s*)*<\/p>/gi,
    /<p\b[^>]*>\s*(?:<span\b[^>]*>\s*(?:<br\s*\/?>\s*|\s*)\s*<\/span>\s*)*<\/p>/gi,
    /<p\b[^>]*>\s*(?:&nbsp;|\s)*<\/p>/gi,
  ]

  let previousValue = ''
  while (normalized !== previousValue) {
    previousValue = normalized
    for (const pattern of emptyParagraphPatterns) {
      normalized = normalized.replace(pattern, '')
    }
  }

  return normalized.trim() ? normalized : ''
}

export function normalizeHeadlineRichText(value = '') {
  if (!value) {
    return ''
  }

  const candidate = String(value).trim()
  if (!candidate) {
    return ''
  }

  if (/<[a-z][\s\S]*>/i.test(candidate)) {
    const richText = normalizeRichTextContent(candidate)
    if (richText) {
      return richText
    }
  }

  const escaped = candidate
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return `<p>${escaped}</p>`
}

export function normalizeRichTextForStorage(value = '') {
  if (!value) {
    return ''
  }

  const candidate = String(value).trim()
  if (!candidate) {
    return ''
  }

  if (/<[a-z][\s\S]*>/i.test(candidate)) {
    return normalizeRichTextContent(candidate) || ''
  }

  const segments = candidate
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (!segments.length) {
    return ''
  }

  return segments
    .map((segment) => {
      const escaped = segment
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')

      return `<p>${escaped}</p>`
    })
    .join('')
}

export function normalizePlainTextContent(value = '') {
  if (!value) {
    return ''
  }

  return String(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p\s*>/gi, '\n')
    .replace(/<\/?div\s*>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(/<\/?ul\s*>/gi, '\n')
    .replace(/<\/?ol\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim()
}

export function detectPunjabiLanguage(value = '') {
  if (!value) {
    return 'hindi'
  }

  return /[\u0A00-\u0A7F]/.test(value) ? 'punjabi' : 'hindi'
}
