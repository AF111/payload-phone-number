import { copyFile, mkdir } from 'node:fs/promises'

await mkdir(new URL('../dist/', import.meta.url), { recursive: true })
await copyFile(
  new URL('../src/phone-number-field.css', import.meta.url),
  new URL('../dist/phone-number-field.css', import.meta.url),
)
