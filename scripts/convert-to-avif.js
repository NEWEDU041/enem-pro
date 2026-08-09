const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images')
const EXTENSIONS = ['.jpg', '.jpeg', '.png']

async function convertToAVIF() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('📁 Criando diretório de imagens...')
    fs.mkdirSync(IMAGES_DIR, { recursive: true })
    return
  }

  const files = fs.readdirSync(IMAGES_DIR)
  const imageFiles = files.filter(file =>
    EXTENSIONS.some(ext => file.toLowerCase().endsWith(ext))
  )

  if (imageFiles.length === 0) {
    console.log('✅ Nenhuma imagem para converter')
    return
  }

  console.log(`🚀 Convertendo ${imageFiles.length} imagens para AVIF...\n`)

  let converted = 0
  let errors = 0

  for (const file of imageFiles) {
    try {
      const inputPath = path.join(IMAGES_DIR, file)
      const outputPath = path.join(IMAGES_DIR, file.replace(/\.\w+$/, '.avif'))

      // Skip se AVIF já existe
      if (fs.existsSync(outputPath)) {
        console.log(`⏭️  ${file} → já convertido`)
        continue
      }

      await sharp(inputPath)
        .toFormat('avif', { quality: 80, effort: 6 })
        .toFile(outputPath)

      const inputSize = fs.statSync(inputPath).size / 1024
      const outputSize = fs.statSync(outputPath).size / 1024
      const savings = (1 - outputSize / inputSize) * 100

      console.log(`✅ ${file} (${inputSize.toFixed(1)}KB → ${outputSize.toFixed(1)}KB, -${savings.toFixed(0)}%)`)
      converted++
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`)
      errors++
    }
  }

  console.log(`\n📊 RESULTADO:`)
  console.log(`   ✅ Convertidas: ${converted}`)
  console.log(`   ❌ Erros: ${errors}`)
  console.log(`   📈 Economia: ~${(converted * 45).toFixed(0)}% tamanho`)
}

convertToAVIF().catch(error => {
  console.error('Erro durante conversão:', error)
  process.exit(1)
})
