#!/bin/bash
# 🖼️ Script para otimizar imagens para WebP

echo "🖼️  Otimizando imagens..."

# Instalar sharp se necessário
npm install sharp

# Converter PNG/JPG para WebP
node -e "
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dirs = ['./public', './app'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;

  const walk = (d) => {
    fs.readdirSync(d).forEach(file => {
      const full = path.join(d, file);
      const stat = fs.statSync(full);

      if (stat.isDirectory()) {
        walk(full);
      } else if (['.png', '.jpg', '.jpeg'].includes(path.extname(file))) {
        const dest = full.replace(/\.[^.]+$/, '.webp');

        sharp(full)
          .webp({ quality: 80 })
          .toFile(dest)
          .then(() => console.log(\`✅ \${file}\`))
          .catch(e => console.log(\`❌ \${file}: \${e.message}\`));
      }
    });
  };

  walk(dir);
});

console.log('✅ Imagens otimizadas!');
"

echo ""
echo "💡 Próximo passo: Build"
echo "   npm run build"
