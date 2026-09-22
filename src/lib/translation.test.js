import test from 'node:test'
import assert from 'node:assert/strict'
import { transliterateHindiToPunjabi, transliteratePunjabiToHindi } from './translation.js'

test('transliterates common Hindi text to Punjabi script', () => {
  assert.equal(transliterateHindiToPunjabi('नमस्कार देश'), 'ਨਮਸਕਾਰ ਦੇਸ਼')
  assert.equal(transliterateHindiToPunjabi('आज का समाचार'), 'ਆਜ ਕਾ ਸਮਾਚਾਰ')
})

test('transliterates Punjabi script back to Hindi', () => {
  assert.equal(transliteratePunjabiToHindi('ਨਮਸਕਾਰ ਦੇਸ਼'), 'नमसकार देश')
})
