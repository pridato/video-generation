// generate-templates-real.mjs
import { createCanvas } from 'canvas'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// TUS 24 TEMPLATES REALES
const templates = [
  { id: 'historia-de-marca', name: 'Historia de Marca', category: 'marketing' },
  { id: 'call-to-action', name: 'Call to Action', category: 'marketing' },
  { id: 'lanzamiento-de-producto', name: 'Lanzamiento de Producto', category: 'marketing' },
  { id: 'testimonios-sociales', name: 'Testimonios Sociales', category: 'marketing' },
  
  { id: 'code-tutorial', name: 'Code Tutorial', category: 'tech' },
  { id: 'developer-tips', name: 'Developer Tips', category: 'tech' },
  { id: 'tech-minimalista', name: 'Tech Minimalista', category: 'tech' },
  { id: 'tech-neon', name: 'Tech Neon', category: 'tech' },
  
  { id: 'corporativo-limpio', name: 'Corporativo Limpio', category: 'business' },
  { id: 'sales-conversion', name: 'Sales & Conversión', category: 'business' },
  { id: 'startup-pitch', name: 'Startup Pitch', category: 'business' },
  { id: 'presentacion-de-equipo', name: 'Presentación de Equipo', category: 'business' },
  
  { id: 'educativo-clasico', name: 'Educativo Clásico', category: 'education' },
  { id: 'educativo-interactivo', name: 'Educativo Interactivo', category: 'education' },
  { id: 'formulas-matematicas', name: 'Fórmulas Matemáticas', category: 'education' },
  { id: 'laboratorio-cientifico', name: 'Laboratorio Científico', category: 'education' },
  
  { id: 'fitness-energia', name: 'Fitness & Energía', category: 'lifestyle' },
  { id: 'food-delicioso', name: 'Food & Delicioso', category: 'lifestyle' },
  { id: 'lifestyle-moderno', name: 'Lifestyle Moderno', category: 'lifestyle' },
  { id: 'travel-aventura', name: 'Travel & Aventura', category: 'lifestyle' },
  
  { id: 'gaming-epico', name: 'Gaming Épico', category: 'entertainment' },
  { id: 'estilo-meme', name: 'Estilo Meme', category: 'entertainment' },
  { id: 'music-beats', name: 'Music & Beats', category: 'entertainment' },
  { id: 'viral-y-trendy', name: 'Viral y Trendy', category: 'entertainment' }
]

const categoryColors = {
  marketing: { bg: '#FF6B35', text: '#FFFFFF' },
  tech: { bg: '#00D9FF', text: '#0F0F23' },
  business: { bg: '#1e40af', text: '#FFFFFF' },
  education: { bg: '#059669', text: '#FFFFFF' },
  lifestyle: { bg: '#ec4899', text: '#FFFFFF' },
  entertainment: { bg: '#dc2626', text: '#FFFFFF' }
}

function generateThumbnail(template) {
  const width = 200
  const height = 150
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  
  const colors = categoryColors[template.category]
  
  // Fondo con gradiente suave
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, colors.bg)
  gradient.addColorStop(1, colors.bg + 'DD')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  // Icono por categoría
  ctx.fillStyle = colors.text
  ctx.font = '50px Arial'
  ctx.textAlign = 'center'
  
  const icons = {
    marketing: '📈',
    tech: '💻', 
    business: '💼',
    education: '🎓',
    lifestyle: '🌟',
    entertainment: '🎉'
  }
  
  ctx.fillText(icons[template.category], width/2, height/2 + 15)
  
  // Nombre abreviado
  ctx.fillStyle = colors.text
  ctx.font = 'bold 12px Arial'
  const shortName = template.name.length > 18 
    ? template.name.substring(0, 15) + '...'
    : template.name
  ctx.fillText(shortName, width/2, height - 15)
  
  // Guardar
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.8 })
  const outputPath = join(__dirname, 'public', 'templates', 'thumbnails', `${template.id}-thumb.jpg`)
  
  const dir = dirname(outputPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  
  writeFileSync(outputPath, buffer)
  console.log(`✅ Thumbnail: ${template.id}-thumb.jpg`)
}

function generateAdvancedPlaceholder(template) {
  const width = 400
  const height = 300
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  
  const colors = categoryColors[template.category]
  
  // Fondo base
  ctx.fillStyle = colors.bg
  ctx.fillRect(0, 0, width, height)
  
  // Patrones específicos por template
  ctx.fillStyle = colors.text + '12'
  
  // Patrones únicos según el template específico
  switch(template.id) {
    case 'tech-neon':
      // Patrón neon especial
      for(let i = 0; i < width; i += 30) {
        ctx.fillRect(i, 50, 2, height - 100)
        ctx.fillRect(i + 10, 30, 2, height - 60)
      }
      break
      
    case 'gaming-epico':
      // Patrón gaming
      for(let i = 0; i < width; i += 40) {
        for(let j = 0; j < height; j += 40) {
          ctx.fillRect(i, j, 8, 8)
          ctx.fillRect(i + 16, j + 16, 8, 8)
        }
      }
      break
      
    case 'estilo-meme':
      // Patrón meme (círculos irregulares)
      for(let i = 0; i < width; i += 60) {
        for(let j = 0; j < height; j += 50) {
          ctx.beginPath()
          ctx.arc(i + Math.random() * 20, j + Math.random() * 20, 15, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
      break
      
    default:
      // Patrón por categoría
      switch(template.category) {
        case 'tech':
          for(let i = 0; i < width; i += 35) {
            for(let j = 0; j < height; j += 25) {
              ctx.fillRect(i, j, 25, 2)
              ctx.fillRect(i, j + 8, 18, 2)
            }
          }
          break
          
        case 'marketing':
          for(let i = 0; i < width; i += 70) {
            for(let j = 0; j < height; j += 50) {
              ctx.beginPath()
              ctx.moveTo(i, j + 25)
              ctx.lineTo(i + 25, j)
              ctx.lineTo(i + 25, j + 50)
              ctx.fill()
            }
          }
          break
          
        case 'business':
          for(let i = 0; i < width; i += 55) {
            for(let j = 0; j < height; j += 45) {
              ctx.fillRect(i + 8, j + 8, 35, 25)
            }
          }
          break
          
        case 'education':
          for(let i = 0; i < width; i += 45) {
            for(let j = 0; j < height; j += 35) {
              ctx.fillRect(i, j, 35, 6)
              ctx.fillRect(i, j + 12, 30, 6)
              ctx.fillRect(i, j + 24, 25, 6)
            }
          }
          break
          
        case 'lifestyle':
          for(let i = 0; i < width; i += 60) {
            for(let j = 0; j < height; j += 50) {
              ctx.beginPath()
              ctx.arc(i, j, 18, 0, 2 * Math.PI)
              ctx.fill()
            }
          }
          break
          
        case 'entertainment':
          for(let i = 0; i < width; i += 70) {
            for(let j = 0; j < height; j += 60) {
              // Estrella
              ctx.beginPath()
              ctx.moveTo(i, j - 8)
              ctx.lineTo(i + 4, j)
              ctx.lineTo(i + 12, j)
              ctx.lineTo(i + 6, j + 6)
              ctx.lineTo(i + 8, j + 14)
              ctx.lineTo(i, j + 10)
              ctx.lineTo(i - 8, j + 14)
              ctx.lineTo(i - 6, j + 6)
              ctx.lineTo(i - 12, j)
              ctx.lineTo(i - 4, j)
              ctx.closePath()
              ctx.fill()
            }
          }
          break
      }
  }
  
  // Overlay elegante
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, colors.bg + '00')
  gradient.addColorStop(0.7, colors.bg + '40')
  gradient.addColorStop(1, colors.bg + '90')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  // Título con sombra
  ctx.fillStyle = colors.text
  ctx.font = 'bold 26px Arial'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.shadowBlur = 6
  
  // Título en múltiples líneas si es necesario
  const words = template.name.split(' ')
  if (words.length > 2) {
    ctx.fillText(words.slice(0, 2).join(' '), width/2, height/2 - 12)
    ctx.fillText(words.slice(2).join(' '), width/2, height/2 + 18)
  } else if (words.length === 2) {
    ctx.fillText(words[0], width/2, height/2 - 8)
    ctx.fillText(words[1], width/2, height/2 + 22)
  } else {
    ctx.fillText(template.name, width/2, height/2)
  }
  
  // Reset shadow
  ctx.shadowColor = 'transparent'
  
  // Badge de categoría
  const badgeWidth = 100
  const badgeHeight = 20
  ctx.fillStyle = colors.text
  ctx.fillRect(width/2 - badgeWidth/2, height/2 + 45, badgeWidth, badgeHeight)
  ctx.fillStyle = colors.bg
  ctx.font = '12px Arial'
  ctx.fillText(template.category.toUpperCase(), width/2, height/2 + 58)
  
  // Guardar
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 })
  const outputPath = join(__dirname, 'public', 'templates', 'previews', `${template.id}.jpg`)
  
  const dir = dirname(outputPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  
  writeFileSync(outputPath, buffer)
  console.log(`✅ Preview: ${template.id}.jpg`)
}

async function generateAllPlaceholders() {
  console.log('🎨 Generando imágenes para tus 24 templates reales...')
  console.log(`📊 Total: ${templates.length} templates`)
  
  try {
    // Crear directorios
    const dirs = ['public/templates/previews', 'public/templates/thumbnails']
    dirs.forEach(dir => {
      const fullDir = join(__dirname, dir)
      if (!existsSync(fullDir)) {
        mkdirSync(fullDir, { recursive: true })
        console.log(`📁 Creado: ${dir}`)
      }
    })
    
    // Contar por categoría
    const stats = templates.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1
      return acc
    }, {})
    
    console.log('\n📋 Templates por categoría:')
    Object.entries(stats).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`)
    })
    console.log('')
    
    // Generar todas las imágenes
    templates.forEach((template, index) => {
      try {
        process.stdout.write(`[${index + 1}/${templates.length}] `)
        generateAdvancedPlaceholder(template)
        generateThumbnail(template)
      } catch (error) {
        console.error(`❌ Error con ${template.id}:`, error.message)
      }
    })
    
    console.log('\n🎉 ¡Todas las imágenes generadas!')
    console.log('\n📝 Ahora ejecuta este SQL en Supabase:')
    console.log('-- (Ve al archivo SQL que generé antes)')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

generateAllPlaceholders()