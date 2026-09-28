import assert from 'node:assert/strict'
import test from 'node:test'

import { getStoragePathFromPublicUrl } from '../lib/mediaPaths.js'
import { getMediaUploadKey, uploadDeduper } from './uploadDeduper.js'

test('extracts the storage object path from a public Supabase URL', () => {
  const url = 'https://example.supabase.co/storage/v1/object/public/news-image/articles/42/cover.webp'
  assert.equal(getStoragePathFromPublicUrl(url), 'articles/42/cover.webp')
})

test('ignores non-Supabase URLs and bad bucket paths', () => {
  assert.equal(getStoragePathFromPublicUrl('https://example.com/image.jpg'), null)
  assert.equal(getStoragePathFromPublicUrl('https://example.supabase.co/storage/v1/object/public/other-bucket/file.jpg'), null)
})

test('creates a stable key for the same file metadata', () => {
  const first = { name: 'cover.jpg', size: 1234, lastModified: 456, type: 'image/jpeg' }
  const second = { name: 'cover.jpg', size: 1234, lastModified: 456, type: 'image/jpeg' }

  assert.equal(getMediaUploadKey(first), getMediaUploadKey(second))
})

test('dedupes concurrent calls while the upload is active', async () => {
  let invocations = 0

  const first = uploadDeduper.wrap('same-file', async () => {
    invocations += 1
    await Promise.resolve()
    return 'url-1'
  })

  const second = uploadDeduper.wrap('same-file', async () => {
    invocations += 1
    await Promise.resolve()
    return 'url-2'
  })

  const [firstResult, secondResult] = await Promise.all([first, second])
  assert.equal(invocations, 1)
  assert.equal(firstResult, 'url-1')
  assert.equal(secondResult, 'url-1')
})

test('does not permanently dedupe sequential calls after the first upload resolves', async () => {
  let invocations = 0

  const first = await uploadDeduper.wrap('same-file-sequential', async () => {
    invocations += 1
    return 'url-1'
  })

  const second = await uploadDeduper.wrap('same-file-sequential', async () => {
    invocations += 1
    return 'url-2'
  })

  assert.equal(first, 'url-1')
  assert.equal(second, 'url-2')
  assert.equal(invocations, 2)
})
