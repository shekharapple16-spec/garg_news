import assert from 'node:assert/strict'
import test from 'node:test'

import { getStoragePathFromPublicUrl } from '../lib/mediaPaths.js'

test('extracts the storage object path from a public Supabase URL', () => {
  const url = 'https://example.supabase.co/storage/v1/object/public/news-image/articles/42/cover.webp'
  assert.equal(getStoragePathFromPublicUrl(url), 'articles/42/cover.webp')
})

test('ignores non-Supabase URLs and bad bucket paths', () => {
  assert.equal(getStoragePathFromPublicUrl('https://example.com/image.jpg'), null)
  assert.equal(getStoragePathFromPublicUrl('https://example.supabase.co/storage/v1/object/public/other-bucket/file.jpg'), null)
})
