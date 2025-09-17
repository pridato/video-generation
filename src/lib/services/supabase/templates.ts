import { createClient } from '@/lib/services/supabase/client'

export interface Template {
  id: string
  name: string
  description: string
  category: string
  preview_url?: string
  is_premium: boolean
  likes?: number
  uses?: number
  created_at: string
}

export async function getTemplates(options?: {
  category?: string
  isPremium?: boolean
  limit?: number
}) {
  const supabase = createClient()

  let query = supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.category) {
    query = query.eq('category', options.category)
  }

  if (options?.isPremium !== undefined) {
    query = query.eq('is_premium', options.isPremium)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching templates:', error)
    return []
  }

  return data as Template[]
}

export async function getTemplateCategories() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('templates')
    .select('category')
    .not('category', 'is', null)

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  // Get unique categories
  const categories = [...new Set(data.map(item => item.category))]
  return categories
}

export async function getPopularTemplates(limit: number = 6) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('uses', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching popular templates:', error)
    return []
  }

  return data as Template[]
}