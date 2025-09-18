import { createClient } from './client'

// Configuración de buckets
export const STORAGE_BUCKETS = {
  VIDEO_CLIPS: 'video-clips',      // 20MB - Clips de video para contenido
  GENERATED_CONTENT: 'generated-content', // 20MB - Videos generados finales
  ASSETS: 'assets',                // 7MB - Imágenes, logos, fondos
  USER_UPLOADS: 'user-uploads'     // 3MB - Uploads del usuario (avatares, etc.)
} as const

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS]

// Límites de tamaño por bucket (en bytes)
export const BUCKET_SIZE_LIMITS = {
  [STORAGE_BUCKETS.VIDEO_CLIPS]: 20 * 1024 * 1024,      // 20MB
  [STORAGE_BUCKETS.GENERATED_CONTENT]: 20 * 1024 * 1024, // 20MB
  [STORAGE_BUCKETS.ASSETS]: 7 * 1024 * 1024,             // 7MB
  [STORAGE_BUCKETS.USER_UPLOADS]: 3 * 1024 * 1024        // 3MB
} as const

// Tipos de archivos permitidos por bucket
export const ALLOWED_FILE_TYPES = {
  [STORAGE_BUCKETS.VIDEO_CLIPS]: ['video/mp4', 'video/webm', 'video/mov'],
  [STORAGE_BUCKETS.GENERATED_CONTENT]: ['video/mp4', 'video/webm'],
  [STORAGE_BUCKETS.ASSETS]: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  [STORAGE_BUCKETS.USER_UPLOADS]: ['image/jpeg', 'image/png', 'image/webp']
} as const

interface UploadOptions {
  fileName?: string
  folder?: string
  upsert?: boolean
}

interface UploadResult {
  success: boolean
  data?: {
    path: string
    fullPath: string
    publicUrl: string
  }
  error?: string
}

/**
 * Sube un archivo a un bucket específico de Supabase Storage
 */
export async function uploadFile(
  bucket: StorageBucket,
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const supabase = createClient()

    // Validar tamaño del archivo
    const maxSize = BUCKET_SIZE_LIMITS[bucket]
    if (file.size > maxSize) {
      return {
        success: false,
        error: `El archivo excede el límite de ${maxSize / 1024 / 1024}MB para el bucket ${bucket}`
      }
    }

    // Validar tipo de archivo
    const allowedTypes = ALLOWED_FILE_TYPES[bucket] as readonly string[]
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `Tipo de archivo no permitido. Tipos válidos: ${allowedTypes.join(', ')}`
      }
    }

    // Generar nombre de archivo único si no se proporciona
    const fileName = options.fileName || `${Date.now()}-${file.name}`
    const folder = options.folder || ''
    const fullPath = folder ? `${folder}/${fileName}` : fileName

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, {
        upsert: options.upsert || false,
        contentType: file.type
      })

    if (error) {
      throw error
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      success: true,
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl
      }
    }

  } catch (error) {
    console.error('Error uploading file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al subir archivo'
    }
  }
}

/**
 * Sube un clip de video al bucket video-clips
 */
export async function uploadClip(
  file: File,
  options: Omit<UploadOptions, 'folder'> & { category?: string } = {}
): Promise<UploadResult> {
  const folder = options.category || 'general'
  return uploadFile(STORAGE_BUCKETS.VIDEO_CLIPS, file, { ...options, folder })
}

/**
 * Sube contenido generado al bucket generated-content
 */
export async function uploadGeneratedVideo(
  file: File,
  userId: string,
  videoId: string,
  options: Omit<UploadOptions, 'folder' | 'fileName'> = {}
): Promise<UploadResult> {
  const fileName = `${videoId}.mp4`
  const folder = `users/${userId}`
  return uploadFile(STORAGE_BUCKETS.GENERATED_CONTENT, file, { ...options, folder, fileName })
}

/**
 * Sube un asset (imagen, logo, etc.) al bucket assets
 */
export async function uploadAsset(
  file: File,
  options: Omit<UploadOptions, 'folder'> & { category?: string } = {}
): Promise<UploadResult> {
  const folder = options.category || 'general'
  return uploadFile(STORAGE_BUCKETS.ASSETS, file, { ...options, folder })
}

/**
 * Sube un archivo del usuario (avatar, etc.) al bucket user-uploads
 */
export async function uploadUserFile(
  file: File,
  userId: string,
  options: Omit<UploadOptions, 'folder'> = {}
): Promise<UploadResult> {
  const folder = `users/${userId}`
  return uploadFile(STORAGE_BUCKETS.USER_UPLOADS, file, { ...options, folder })
}

/**
 * Obtiene la URL pública de un archivo
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const supabase = createClient()
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return publicUrl
}

/**
 * Elimina un archivo del storage
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

/**
 * Lista archivos en un bucket/folder
 */
export async function listFiles(
  bucket: StorageBucket,
  folder?: string,
  options: {
    limit?: number
    offset?: number
    sortBy?: { column: string; order?: 'asc' | 'desc' }
  } = {}
) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: options.limit,
        offset: options.offset,
        sortBy: options.sortBy
      })

    if (error) {
      throw error
    }

    return {
      success: true,
      data: data.map(file => ({
        ...file,
        publicUrl: getPublicUrl(bucket, folder ? `${folder}/${file.name}` : file.name)
      }))
    }
  } catch (error) {
    console.error('Error listing files:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error listando archivos'
    }
  }
}

/**
 * Obtiene información de un archivo
 */
export async function getFileInfo(bucket: StorageBucket, path: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop()
      })

    if (error || !data || data.length === 0) {
      throw new Error('Archivo no encontrado')
    }

    const fileInfo = data[0]
    return {
      success: true,
      data: {
        ...fileInfo,
        publicUrl: getPublicUrl(bucket, path)
      }
    }
  } catch (error) {
    console.error('Error getting file info:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo información del archivo'
    }
  }
}

/**
 * Crea una URL firmada para acceso temporal
 */
export async function createSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600 // 1 hora por defecto
) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      throw error
    }

    return {
      success: true,
      data: {
        signedUrl: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000)
      }
    }
  } catch (error) {
    console.error('Error creating signed URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error creando URL firmada'
    }
  }
}

// Utilidades helper
export const storageUtils = {
  // Convertir bytes a formato legible
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // Obtener extensión de archivo
  getFileExtension: (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || ''
  },

  // Validar si es un archivo de video
  isVideoFile: (file: File): boolean => {
    return file.type.startsWith('video/')
  },

  // Validar si es un archivo de imagen
  isImageFile: (file: File): boolean => {
    return file.type.startsWith('image/')
  },

  // Generar nombre de archivo único
  generateUniqueFileName: (originalName: string): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = storageUtils.getFileExtension(originalName)
    const baseName = originalName.replace(/\.[^/.]+$/, '')
    return `${baseName}-${timestamp}-${random}.${extension}`
  }
}