import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeHeadlineRichText,
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

  assert.equal(normalizeRichTextForStorage(richContent), richContent)
  assert.equal(
    normalizeRichTextForStorage('Paragraph 1\n\nParagraph 2\n\nParagraph 3'),
    '<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>'
  )
  assert.equal(
    normalizeRichTextForStorage('IIT बॉम्बे ने <strong>स्टूडेंट्स की 18 में से 2 मांगें</strong> मानीं।\n\nसाहिल की मौत के बाद <em>IIT बॉम्बे</em> में छात्रों का प्रदर्शन तीन दिन तक चला।'),
    'IIT बॉम्बे ने <strong>स्टूडेंट्स की 18 में से 2 मांगें</strong> मानीं।\n\nसाहिल की मौत के बाद <em>IIT बॉम्बे</em> में छात्रों का प्रदर्शन तीन दिन तक चला।'
  )
})
