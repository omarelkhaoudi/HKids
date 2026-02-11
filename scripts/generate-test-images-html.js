import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier de sortie
const outputDir = path.join(__dirname, '../test-images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Créer un fichier HTML qui génère les images via Canvas
const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Générateur d'Images de Test - HKids</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f0f0f0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
        }
        h1 {
            color: #8B008B;
        }
        .controls {
            margin: 20px 0;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 5px;
        }
        button {
            background: #8B008B;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px;
        }
        button:hover {
            background: #6B006B;
        }
        .preview {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .preview-item {
            border: 2px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            text-align: center;
        }
        .preview-item canvas {
            max-width: 100%;
            height: auto;
            border: 1px solid #ccc;
        }
        .info {
            margin-top: 10px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 Générateur d'Images de Test - HKids</h1>
        
        <div class="controls">
            <h3>Générer les Images</h3>
            <button onclick="generateAll()">🎨 Générer Toutes les Images</button>
            <button onclick="downloadAll()">💾 Télécharger Toutes les Images</button>
        </div>

        <div class="preview" id="preview"></div>
    </div>

    <script>
        const images = [
            {
                name: 'couverture',
                text: '📚\\n\\nMon Premier Livre\\n\\nUne Aventure Magique',
                bgColor: '#FF6B9D',
                textColor: '#FFFFFF'
            },
            {
                name: 'page1',
                text: 'Page 1\\n\\nIl était une fois...',
                bgColor: '#FFE5E5',
                textColor: '#8B0000'
            },
            {
                name: 'page2',
                text: 'Page 2\\n\\nDans un pays lointain...',
                bgColor: '#E5F3FF',
                textColor: '#00008B'
            },
            {
                name: 'page3',
                text: 'Page 3\\n\\nVivait un petit héros...',
                bgColor: '#E5FFE5',
                textColor: '#006400'
            },
            {
                name: 'page4',
                text: 'Page 4\\n\\nQui partit à l\\'aventure...',
                bgColor: '#FFF5E5',
                textColor: '#8B4500'
            },
            {
                name: 'page5',
                text: 'Page 5\\n\\nEt découvrit de merveilleux amis!',
                bgColor: '#F0E5FF',
                textColor: '#4B0082'
            }
        ];

        function createImage(name, text, bgColor, textColor) {
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');

            // Fond
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, 800, 600);

            // Texte
            ctx.fillStyle = textColor;
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const lines = text.split('\\n');
            const lineHeight = 60;
            const startY = 300 - (lines.length - 1) * lineHeight / 2;

            lines.forEach((line, index) => {
                ctx.fillText(line, 400, startY + index * lineHeight);
            });

            return canvas;
        }

        function generateAll() {
            const preview = document.getElementById('preview');
            preview.innerHTML = '';

            images.forEach(img => {
                const canvas = createImage(img.name, img.text, img.bgColor, img.textColor);
                
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.innerHTML = \`
                    <h3>\${img.name}</h3>
                    <canvas id="canvas-\${img.name}" width="800" height="600"></canvas>
                    <div class="info">800x600 pixels</div>
                    <button onclick="downloadImage('\${img.name}')">💾 Télécharger</button>
                \`;
                preview.appendChild(item);

                const previewCanvas = document.getElementById(\`canvas-\${img.name}\`);
                const previewCtx = previewCanvas.getContext('2d');
                previewCtx.drawImage(canvas, 0, 0);
            });
        }

        function downloadImage(name) {
            const img = images.find(i => i.name === name);
            const canvas = createImage(img.name, img.text, img.bgColor, img.textColor);
            
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`\${name}.png\`;
                a.click();
                URL.revokeObjectURL(url);
            });
        }

        function downloadAll() {
            images.forEach((img, index) => {
                setTimeout(() => {
                    downloadImage(img.name);
                }, index * 200);
            });
        }

        // Générer automatiquement au chargement
        window.onload = () => {
            generateAll();
        };
    </script>
</body>
</html>`;

const htmlPath = path.join(outputDir, 'generate-images.html');
fs.writeFileSync(htmlPath, htmlContent);

console.log('✅ Générateur HTML créé!');
console.log(`📁 Fichier: ${htmlPath}`);
console.log('\n📝 Instructions:');
console.log('1. Ouvrez le fichier generate-images.html dans votre navigateur');
console.log('2. Les images seront générées automatiquement');
console.log('3. Cliquez sur "Télécharger Toutes les Images" pour les sauvegarder');
console.log('4. Les images seront au format PNG (800x600 pixels)');
console.log('\n✨ Prêt à utiliser!');

