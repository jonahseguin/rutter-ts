import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const zodGenPath = join(import.meta.dirname, '../src/generated/zod.gen.ts')
const content = readFileSync(zodGenPath, 'utf-8')
const fixed = content.replaceAll('.gt(true)', '.gt(0)')
if (fixed !== content) {
  writeFileSync(zodGenPath, fixed)
  console.info('postgenerate: fixed .gt(true) → .gt(0) in zod.gen.ts')
} else {
  console.info('postgenerate: no .gt(true) fixups needed')
}
