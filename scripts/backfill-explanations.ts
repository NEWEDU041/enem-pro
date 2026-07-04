import { loadEnv } from './load-env'
loadEnv()

import { YEARS } from '../lib/enem-api'
import { generateExplanationBatch } from '../lib/generate-explanations'

const BATCH_SIZE = 50

async function main() {
  let totalGenerated = 0
  let totalSkipped = 0
  let totalFailed = 0

  for (const year of YEARS) {
    let offset = 0
    console.log(`\n=== ${year} ===`)

    while (true) {
      const deadline = Date.now() + 20 * 60 * 1000 // generous local deadline, not the Vercel 300s cap
      const result = await generateExplanationBatch(year, offset, BATCH_SIZE, deadline)

      totalGenerated += result.generated
      totalSkipped += result.skipped
      totalFailed += result.failed

      console.log(
        `  offset=${offset} processed=${result.processed}/${result.total} ` +
        `generated=${result.generated} skipped=${result.skipped} failed=${result.failed}`
      )

      if (result.processed === 0 || result.processed < BATCH_SIZE) break
      offset += BATCH_SIZE
    }
  }

  console.log(`\n✨ Done. generated=${totalGenerated} skipped=${totalSkipped} failed=${totalFailed}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
