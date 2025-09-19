#!/usr/bin/env node
/**
 * Genera statements SQL INSERT para la tabla asset_clips
 * Escanea los metadatos JSON y crea archivo .sql
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class SQLGenerator {
  constructor() {
    this.clipsDir = path.join(__dirname, 'clips')
    this.baseUrl = 'https://video-generation.supabase.co/storage/v1/object/public/video-clips'
    this.outputFile = path.join(__dirname, 'insert_asset_clips.sql')
  }

  /**
   * Escapa comillas simples para SQL
   */
  escapeSqlString(str) {
    if (!str) return 'NULL'
    return `'${String(str).replace(/'/g, "''")}'`
  }

  /**
   * Convierte array a formato PostgreSQL
   */
  arrayToSqlArray(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return 'ARRAY[]::text[]'
    const escaped = arr.map(item => this.escapeSqlString(item)).join(',')
    return `ARRAY[${escaped}]::text[]`
  }

  /**
   * Convierte objeto a JSONB
   */
  objectToJsonb(obj) {
    if (!obj) return 'NULL'
    return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`
  }

  /**
   * Escanea y recolecta todos los clips
   */
  scanAllClips() {
    const clips = []
    const categories = fs.readdirSync(this.clipsDir)

    for (const category of categories) {
      const categoryPath = path.join(this.clipsDir, category)
      
      if (!fs.statSync(categoryPath).isDirectory()) continue

      const files = fs.readdirSync(categoryPath)
      const mp4Files = files.filter(file => file.endsWith('.mp4'))

      for (const mp4File of mp4Files) {
        const jsonFile = `${mp4File}.json`
        const jsonPath = path.join(categoryPath, jsonFile)

        if (fs.existsSync(jsonPath)) {
          try {
            const metadata = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
            clips.push({
              category,
              mp4File,
              metadata,
              storageUrl: `${this.baseUrl}/${category}/${mp4File}`
            })
          } catch (error) {
            console.error(`Error leyendo ${jsonPath}:`, error.message)
          }
        }
      }
    }

    return clips
  }

  /**
   * Transforma metadatos para SQL
   */
  transformForSql(metadata, clipInfo) {
    const basicInfo = metadata.basic_info || {}
    const shortsCompat = metadata.shorts_compatibility || {}
    const aiMatching = metadata.ai_matching || {}
    const visualStyle = metadata.visual_style || {}
    const positioning = metadata.positioning || {}
    const audioCompat = metadata.audio_compatibility || {}
    const utilityScores = metadata.utility_scores || {}

    // Extraer tags
    const conceptTags = []
    if (basicInfo.query) conceptTags.push(basicInfo.query)
    if (basicInfo.category) conceptTags.push(basicInfo.category)
    if (clipInfo.category) conceptTags.push(clipInfo.category)
    if (visualStyle.style_tags) conceptTags.push(...visualStyle.style_tags)

    const emotionTags = []
    if (aiMatching.emotional_tone) emotionTags.push(aiMatching.emotional_tone)

    // Colores dominantes
    const dominantColors = []
    if (visualStyle.dominant_colors_rgb) {
      visualStyle.dominant_colors_rgb.forEach(colorRgb => {
        if (Array.isArray(colorRgb) && colorRgb.length >= 3) {
          const hex = `#${colorRgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`
          dominantColors.push(hex)
        }
      })
    }

    // Keywords
    const keywords = [...conceptTags]
    if (aiMatching.dominant_subjects) {
      keywords.push(...aiMatching.dominant_subjects)
    }

    // Scene type
    let sceneType = null
    if (shortsCompat.orientation === 'vertical') {
      sceneType = 'vertical'
    } else if (aiMatching.dominant_subjects?.includes('people')) {
      sceneType = 'portrait'
    } else if (aiMatching.dominant_subjects?.includes('dynamic')) {
      sceneType = 'action'
    } else if (aiMatching.dominant_subjects?.includes('static')) {
      sceneType = 'static'
    }

    // Motion intensity
    let motionIntensity = 'medium'
    if (aiMatching.action_level !== undefined) {
      if (aiMatching.action_level < 2) motionIntensity = 'low'
      else if (aiMatching.action_level > 6) motionIntensity = 'high'
    }

    // Descripción
    const descriptionParts = []
    if (basicInfo.query) descriptionParts.push(basicInfo.query)
    if (clipInfo.category) descriptionParts.push(`${clipInfo.category} content`)
    if (aiMatching.emotional_tone && aiMatching.emotional_tone !== 'neutral') {
      descriptionParts.push(`${aiMatching.emotional_tone} tone`)
    }
    if (basicInfo.duration) descriptionParts.push(`${basicInfo.duration}s duration`)

    const description = descriptionParts.length > 0 
      ? descriptionParts.join(', ')
      : `${clipInfo.category} video clip`

    return {
      filename: `${clipInfo.category}/${clipInfo.mp4File}`,
      file_url: clipInfo.storageUrl,
      file_size: basicInfo.file_size_mb ? Math.round(basicInfo.file_size_mb * 1024 * 1024) : null,
      duration: parseFloat(basicInfo.duration || 0),
      resolution: basicInfo.resolution || '1920x1080',
      format: 'mp4',
      concept_tags: [...new Set(conceptTags)],
      emotion_tags: [...new Set(emotionTags)],
      scene_type: sceneType,
      dominant_colors: dominantColors,
      description: description,
      keywords: [...new Set(keywords)],
      quality_score: parseFloat(utilityScores.overall_quality || 5.0),
      motion_intensity: motionIntensity,
      audio_present: Boolean(audioCompat.good_for_voiceover),
      usage_count: 0,
      success_rate: 0.0,
      processing_status: 'ready',
      is_active: true,
      
      // Metadatos originales
      basic_info: basicInfo,
      shorts_compatibility: shortsCompat,
      visual_style: visualStyle,
      positioning: positioning,
      audio_compatibility: audioCompat,
      utility_scores: utilityScores,
      ai_matching: aiMatching
    }
  }

  /**
   * Genera una línea de INSERT SQL
   */
  generateInsertSql(clipData) {
    return `INSERT INTO asset_clips (
  filename, file_url, file_size, duration, resolution, format,
  concept_tags, emotion_tags, scene_type, dominant_colors,
  description, keywords, quality_score, motion_intensity,
  audio_present, usage_count, success_rate, processing_status, is_active,
  basic_info, shorts_compatibility, visual_style, positioning,
  audio_compatibility, utility_scores, ai_matching
) VALUES (
  ${this.escapeSqlString(clipData.filename)},
  ${this.escapeSqlString(clipData.file_url)},
  ${clipData.file_size || 'NULL'},
  ${clipData.duration},
  ${this.escapeSqlString(clipData.resolution)},
  ${this.escapeSqlString(clipData.format)},
  ${this.arrayToSqlArray(clipData.concept_tags)},
  ${this.arrayToSqlArray(clipData.emotion_tags)},
  ${clipData.scene_type ? this.escapeSqlString(clipData.scene_type) : 'NULL'},
  ${this.arrayToSqlArray(clipData.dominant_colors)},
  ${this.escapeSqlString(clipData.description)},
  ${this.arrayToSqlArray(clipData.keywords)},
  ${clipData.quality_score},
  ${this.escapeSqlString(clipData.motion_intensity)},
  ${clipData.audio_present},
  ${clipData.usage_count},
  ${clipData.success_rate},
  ${this.escapeSqlString(clipData.processing_status)},
  ${clipData.is_active},
  ${this.objectToJsonb(clipData.basic_info)},
  ${this.objectToJsonb(clipData.shorts_compatibility)},
  ${this.objectToJsonb(clipData.visual_style)},
  ${this.objectToJsonb(clipData.positioning)},
  ${this.objectToJsonb(clipData.audio_compatibility)},
  ${this.objectToJsonb(clipData.utility_scores)},
  ${this.objectToJsonb(clipData.ai_matching)}
);`
  }

  /**
   * Genera archivo SQL completo
   */
  generateSqlFile() {
    console.log('Escaneando clips...')
    const clips = this.scanAllClips()
    
    console.log(`Encontrados ${clips.length} clips con metadatos`)

    const sqlLines = [
      '-- Inserción masiva de clips en asset_clips',
      '-- Generado automáticamente desde metadatos JSON',
      `-- Fecha: ${new Date().toISOString()}`,
      `-- Total clips: ${clips.length}`,
      '',
      '-- Limpiar tabla (opcional - descomenta si quieres)',
      '-- DELETE FROM asset_clips;',
      '',
      '-- Insertar clips',
      ''
    ]

    let insertCount = 0
    for (const clipInfo of clips) {
      try {
        const transformedData = this.transformForSql(clipInfo.metadata, clipInfo)
        sqlLines.push(this.generateInsertSql(transformedData))
        sqlLines.push('')
        insertCount++
      } catch (error) {
        console.error(`Error procesando ${clipInfo.mp4File}:`, error.message)
        sqlLines.push(`-- ERROR: No se pudo procesar ${clipInfo.mp4File}`)
        sqlLines.push('')
      }
    }

    sqlLines.push('-- Actualizar estadísticas de la tabla')
    sqlLines.push('ANALYZE asset_clips;')
    sqlLines.push('')
    sqlLines.push(`-- Resumen: ${insertCount} clips insertados exitosamente`)

    // Escribir archivo
    const sqlContent = sqlLines.join('\n')
    fs.writeFileSync(this.outputFile, sqlContent, 'utf8')

    console.log(`Archivo SQL generado: ${this.outputFile}`)
    console.log(`Statements generados: ${insertCount}`)
    
    // Mostrar estadísticas
    const categoryStats = {}
    clips.forEach(clip => {
      categoryStats[clip.category] = (categoryStats[clip.category] || 0) + 1
    })

    console.log('\nDistribución por categorías:')
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} clips`)
    })

    return this.outputFile
  }
}

// Ejecutar
const generator = new SQLGenerator()
generator.generateSqlFile()