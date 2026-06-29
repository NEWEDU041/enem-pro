import * as fs from 'fs'
import * as path from 'path'

export function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.production.local')
  const raw = fs.readFileSync(envPath, 'latin1') // latin1 preserva bytes sem interpretar BOM

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue

    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()

    // Remove aspas externas
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }

    // Remove BOM (0xEF 0xBB 0xBF em UTF-8, aparece como \xef\xbb\xbf em latin1) e CRLF
    val = val.replace(/^\xef\xbb\xbf/, '').replace(/\r?\n$/, '').trim()

    if (key && val) {
      process.env[key] = val
    }
  }
}
