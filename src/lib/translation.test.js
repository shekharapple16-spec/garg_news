import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeHeadlineRichText,
  normalizePlainTextContent,
  normalizeRichTextContent,
  normalizeRichTextForStorage,
  transliterateHindiToPunjabi,
  transliteratePunjabiToHindi,
} from './translation.js'

test('transliterates common Hindi text to Punjabi script', () => {
  assert.equal(transliterateHindiToPunjabi('नमस्कार देश'), 'ਨਮਸਕਾਰ ਦੇਸ਼')
  assert.equal(transliterateHindiToPunjabi('आज का समाचार'), 'ਆਜ ਕਾ ਸਮਾਚਾਰ')
})

test('transliterates Punjabi script back to Hindi', () => {
  assert.equal(transliteratePunjabiToHindi('ਨਮਸਕਾਰ ਦੇਸ਼'), 'नमसकार देश')
})

test('removes empty editor paragraphs before saving content', () => {
  const html = '<p>नमस्कार</p><p>&nbsp;</p><p><br></p><p>दोस्तों</p><p><span>&nbsp;</span></p>'

  assert.equal(normalizeRichTextContent(html), '<p>नमस्कार</p><p>दोस्तों</p>')
  assert.equal(normalizeRichTextContent('<p><br></p>'), '')
})

test('preserves rich headline formatting while converting legacy plain text safely', () => {
  const richHeadline = '<p>IIT <strong>Bombay</strong> ने <span style="color: red;">Students</span> की <em>18 में से 2</em> मांगें</p>'

  assert.equal(normalizeHeadlineRichText(richHeadline), richHeadline)
  assert.equal(normalizeHeadlineRichText('IIT Bombay ने Students की 18 में से 2 मांगें'), '<p>IIT Bombay ने Students की 18 में से 2 मांगें</p>')
})

test('keeps rich editor HTML intact and converts legacy plain text into paragraph HTML without flattening', () => {
  const richContent = '<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>'
  const styledRichContent = '<p>IIT बॉम्बे ने <strong>स्टूडेंट्स की 18 में से 2 मांगें</strong> मानीं।</p><p><span style="color: red;">छात्रों ने 18 मांगें रखीं।</span></p>'

  assert.equal(normalizeRichTextForStorage(richContent), richContent)
  assert.equal(normalizeRichTextForStorage(styledRichContent), styledRichContent)
  assert.equal(
    normalizeRichTextForStorage('Paragraph 1\n\nParagraph 2\n\nParagraph 3'),
    '<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>'
  )
})

test('preserves inline img tags in the article body so image order survives save and edit cycles', () => {
  const richContent = '<p>Text before</p><p><img src="https://cdn.example.com/one.jpg" /></p><p>Text middle</p><p><img src="https://cdn.example.com/two.jpg" /></p><p>Text after</p>'

  assert.equal(normalizeRichTextContent(richContent), richContent)
  assert.equal(normalizeRichTextForStorage(richContent), richContent)
  assert.equal(normalizePlainTextContent(richContent), 'Text before\n\n[image]\n\nText middle\n\n[image]\n\nText after')
})

test('treats blank rich-text headlines as empty so the form can block empty submissions', () => {
  assert.equal(normalizeHeadlineRichText('<p><br></p>'), '')
  assert.equal(normalizeHeadlineRichText('<p>&nbsp;</p>'), '')
  assert.equal(normalizePlainTextContent('<p><br></p>'), '')
})
