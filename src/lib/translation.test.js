import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeRichTextContent,
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
