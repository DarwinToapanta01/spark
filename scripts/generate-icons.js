import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#0d0d1a"/>
  <text x="256" y="320" font-size="280" text-anchor="middle"
    font-family="system-ui" fill="#c084fc">&#x26A1;</text>
</svg>
`)

await sharp(svg).resize(192, 192).png().toFile('public/icons/icon-192.png')
await sharp(svg).resize(512, 512).png().toFile('public/icons/icon-512.png')

console.log('Iconos generados correctamente')