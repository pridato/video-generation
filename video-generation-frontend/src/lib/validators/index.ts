/**
 * Validation utilities
 */
import { LIMITS, AUTH_VALIDATION } from '@/constants'

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= AUTH_VALIDATION.EMAIL.MAX_LENGTH
}

// Password validation
export const validatePassword = (password: string) => {
  const errors: string[] = []

  if (!password) {
    errors.push(AUTH_VALIDATION.PASSWORD.REQUIRED)
    return { isValid: false, errors }
  }

  if (password.length < AUTH_VALIDATION.PASSWORD.MIN_LENGTH) {
    errors.push(`Mínimo ${AUTH_VALIDATION.PASSWORD.MIN_LENGTH} caracteres`)
  }

  if (password.length > AUTH_VALIDATION.PASSWORD.MAX_LENGTH) {
    errors.push(`Máximo ${AUTH_VALIDATION.PASSWORD.MAX_LENGTH} caracteres`)
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula')
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula')
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Debe contener al menos un número')
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  }
}

const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  let score = 0

  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/(?=.*[a-z])/.test(password)) score += 1
  if (/(?=.*[A-Z])/.test(password)) score += 1
  if (/(?=.*\d)/.test(password)) score += 1
  if (/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) score += 1

  if (score <= 2) return 'weak'
  if (score <= 4) return 'medium'
  return 'strong'
}

// Script validation
export const validateScript = (script: string) => {
  const errors: string[] = []

  if (!script.trim()) {
    errors.push('El script no puede estar vacío')
    return { isValid: false, errors }
  }

  if (script.length < LIMITS.SCRIPT.MIN_LENGTH) {
    errors.push(`El script debe tener al menos ${LIMITS.SCRIPT.MIN_LENGTH} caracteres`)
  }

  if (script.length > LIMITS.SCRIPT.MAX_LENGTH) {
    errors.push(`El script no puede exceder ${LIMITS.SCRIPT.MAX_LENGTH} caracteres`)
  }

  // Check for basic content quality
  const wordCount = script.trim().split(/\s+/).length
  if (wordCount < 5) {
    errors.push('El script debe contener al menos 5 palabras')
  }

  return {
    isValid: errors.length === 0,
    errors,
    wordCount,
    characterCount: script.length,
    estimatedDuration: wordCount / 2.5 // ~2.5 words per second
  }
}

// File validation
export const validateFile = (file: File, allowedTypes: string[], maxSize: number) => {
  const errors: string[] = []

  if (!file) {
    errors.push('No se ha seleccionado ningún archivo')
    return { isValid: false, errors }
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`El archivo es demasiado grande. Máximo ${formatFileSize(maxSize)}`)
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    errors.push(`Formato no permitido. Formatos válidos: ${allowedTypes.join(', ')}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    fileName: file.name,
    fileSize: file.size,
    fileType: fileExtension
  }
}

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Phone number validation (Spanish format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+34|0034|34)?[6789]\d{8}$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

// Name validation
export const validateName = (name: string) => {
  const errors: string[] = []

  if (!name.trim()) {
    errors.push(AUTH_VALIDATION.NAME.REQUIRED)
    return { isValid: false, errors }
  }

  if (name.length < AUTH_VALIDATION.NAME.MIN_LENGTH) {
    errors.push(`Mínimo ${AUTH_VALIDATION.NAME.MIN_LENGTH} caracteres`)
  }

  if (name.length > AUTH_VALIDATION.NAME.MAX_LENGTH) {
    errors.push(`Máximo ${AUTH_VALIDATION.NAME.MAX_LENGTH} caracteres`)
  }

  if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(name)) {
    errors.push('Solo letras y espacios permitidos')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Credit card validation (basic)
export const validateCreditCard = (cardNumber: string) => {
  const number = cardNumber.replace(/\s+/g, '')

  if (!/^\d{13,19}$/.test(number)) {
    return { isValid: false, error: 'Número de tarjeta inválido' }
  }

  // Luhn algorithm
  let sum = 0
  let alternate = false

  for (let i = number.length - 1; i >= 0; i--) {
    let n = parseInt(number.charAt(i), 10)

    if (alternate) {
      n *= 2
      if (n > 9) {
        n = (n % 10) + 1
      }
    }

    sum += n
    alternate = !alternate
  }

  return {
    isValid: sum % 10 === 0,
    error: sum % 10 !== 0 ? 'Número de tarjeta inválido' : null
  }
}

// Duration validation
export const validateDuration = (duration: number) => {
  return {
    isValid: duration >= LIMITS.AUDIO.MIN_DURATION && duration <= LIMITS.AUDIO.MAX_DURATION,
    error: duration < LIMITS.AUDIO.MIN_DURATION
      ? `Duración mínima: ${LIMITS.AUDIO.MIN_DURATION}s`
      : duration > LIMITS.AUDIO.MAX_DURATION
      ? `Duración máxima: ${LIMITS.AUDIO.MAX_DURATION}s`
      : null
  }
}

// Helper function for file size formatting
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}