import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/services/supabase/client'
import { useAuth } from '@/hooks/auth'
import { Template, TemplateCategory } from '../supabase/templates'

interface UseTemplatesReturn {
  templates: Template[]
  categories: TemplateCategory[]
  loading: boolean
  error: string | null
  searchTemplates: (query: string) => Promise<Template[]>
  getTemplatesByCategory: (category: string) => Promise<Template[]>
  incrementTemplateViews: (templateId: string) => Promise<void>
  incrementTemplateLikes: (templateId: string) => Promise<void>
  incrementTemplateUsage: (templateId: string) => Promise<void>
  refreshTemplates: () => Promise<void>
  getPopularTemplates: (limit?: number) => Promise<Template[]>
}

/**
 * Hook para gestionar plantillas (templates) en la aplicación.
 * Proporciona funcionalidades para obtener, buscar, filtrar y actualizar plantillas.
 * @returns {UseTemplatesReturn} Objeto con plantillas, categorías, estado de carga, errores y funciones para manipular plantillas.
 */
export function useTemplates(): UseTemplatesReturn { 

    const [templates, setTemplates] = useState<Template[]>([])
    const [categories, setCategories] = useState<TemplateCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuth()
    const supabase = createClient()

    /**
     * Busca y carga las plantillas desde la base de datos.
     */
    const fetchTemplates = useCallback(async () => {
    try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        setTemplates(data || [])
    } catch (err) {
        console.error('Error fetching templates:', err)
        setError(err instanceof Error ? err.message : 'Error fetching templates')
    } finally {
        setLoading(false)
    }
    }, [supabase])


    /**
     * Obtiene las categorías de plantillas con el conteo de plantillas en cada categoría.
     */
    const fetchCategories = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('templates')
                .select('category')
                .eq('is_active', true)
                .not('category', 'is', null)

            if (fetchError) throw fetchError

            // Count templates by category
            const categoryMap = new Map<string, number>()
            data?.forEach(template => {
                const count = categoryMap.get(template.category) || 0
                categoryMap.set(template.category, count + 1)
            })

            // Add "all" category
            const totalCount = data?.length || 0
            const categoriesWithCounts: TemplateCategory[] = [
                { id: 'all', name: 'Todos', count: totalCount }
            ]

            // Add other categories with display names
            categoryMap.forEach((count, category) => {
                if (category) {
                    categoriesWithCounts.push({
                    id: category,
                    name: getCategoryDisplayName(category),
                    count
                })
            }
    })

    setCategories(categoriesWithCounts)
    } catch (err) {
    console.error('Error fetching categories:', err)
    }
    }, [supabase])

    /**
     * Obtiene el nombre para mostrar de la categoría.
     * @param category Categoría de la plantilla
     * @returns Nombre para mostrar de la categoría 
     */
    const getCategoryDisplayName = (category: string): string => {
        const categoryNames: Record<string, string> = {
            tech: 'Tecnología',
            education: 'Educación',
            business: 'Business',
            entertainment: 'Entretenimiento',
            lifestyle: 'Lifestyle',
            marketing: 'Marketing',
            tutorials: 'Tutoriales',
            news: 'Noticias',
            social: 'Social Media',
            fitness: 'Fitness',
            food: 'Comida',
            travel: 'Viajes'
        }

        return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)
    }

    /**
     * Busca plantillas por nombre o descripción.
     * @param query Término de búsqueda
     * @returns Lista de plantillas que coinciden con la búsqueda
     */
    const searchTemplates = useCallback(async (query: string): Promise<Template[]> => {
        if (!query.trim()) return templates

        try {
            const { data, error: searchError } = await supabase
            .from('templates')
            .select('*')
            .eq('is_active', true)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .order('uses', { ascending: false })

            if (searchError) throw searchError

            return data || []
        } catch (err) {
            console.error('Error searching templates:', err)
            return []
        }
    }, [supabase, templates])

    /**
     * Obtiene plantillas por categoría.
     * @param category Categoría de las plantillas
     * @returns Lista de plantillas en la categoría especificada
     */
    const getTemplatesByCategory = useCallback(async (category: string): Promise<Template[]> => {
        if (category === 'all') return templates

        try {
            const { data, error: fetchError } = await supabase
                .from('templates')
                .select('*')
                .eq('category', category)
                .eq('is_active', true)
                .order('uses', { ascending: false })

            if (fetchError) throw fetchError

            return data || []
        } catch (err) {
            console.error('Error fetching templates by category:', err)
            return []
        }
    }, [supabase, templates])

    /**
     * Incrementa las vistas de una plantilla.
     */
    const incrementTemplateViews = useCallback(async (templateId: string) => {
    try {
        
        // Update local state optimistically
        setTemplates(prev => prev.map(template => 
        template.id === templateId 
            ? { ...template, uses: template.uses ? template.uses + 1 : 1 }
            : template
        ))

        // Fetch current uses value first
        const { data: currentData, error: fetchError } = await supabase
          .from('templates')
          .select('uses')
          .eq('id', templateId)
          .single()

        if (fetchError) throw fetchError

        const currentUses = currentData?.uses ?? 0

        // Update in database
        const { error } = await supabase
        .from('templates')
        .update({
            uses: currentUses + 1,
            updated_at: new Date().toISOString()
        })
        .eq('id', templateId)

        if (error) throw error

    } catch (err) {
        console.error('Error incrementing template views:', err)
        // Revert optimistic update on error
        await fetchTemplates()
    }
    }, [supabase, fetchTemplates])

  /**
   * Incrementa los "me gusta" de una plantilla.
   */
  const incrementTemplateLikes = useCallback(async (templateId: string) => {
    try {
      // Update local state optimistically
      setTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? { ...template, likes: template.likes ? template.likes + 1 : 1 }
          : template
      ))

      // Fetch current likes value first
      const { data: currentData, error: fetchError } = await supabase
        .from('templates')
        .select('likes')
        .eq('id', templateId)
        .single()

      if (fetchError) throw fetchError

      const currentLikes = currentData?.likes ?? 0

      // Update in database
      const { error } = await supabase
        .from('templates')
        .update({
          likes: currentLikes + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)

      if (error) throw error

    } catch (err) {
      console.error('Error incrementing template likes:', err)
      // Revert optimistic update on error
      await fetchTemplates()
    }
  }, [supabase, fetchTemplates])

  /**
   * Incrementa el uso de una plantilla.
   * Si el usuario está logueado y ha usado la plantilla más de 5 veces, se actualiza su plantilla por defecto.
   */
  const incrementTemplateUsage = useCallback(async (templateId: string) => {
    try {
      // Update local state optimistically
      setTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? { ...template, uses: template.uses ? template.uses + 1 : 1 }
          : template
      ))

      // Update in database
      // Fetch current uses value
      const { data: currentData, error: fetchError } = await supabase
        .from('templates')
        .select('uses')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      const currentUses = currentData?.uses ?? 0;

      const { error } = await supabase
        .from('templates')
        .update({ 
          uses: currentUses + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)

      if (error) throw error

      // Track usage in user preferences if user is logged in
      if (user) {
        // Update user's default template if they like this one
        const template = templates.find(t => t.id === templateId)
        if (template && template.uses ? template.uses > 5 : false) {
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              default_template_id: templateId,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })
        }
      }
    } catch (err) {
      console.error('Error incrementing template usage:', err)
      // Revert optimistic update on error
      await fetchTemplates()
    }
  }, [supabase, user, templates, fetchTemplates])

  /**
   * Obtiene las plantillas más populares.
   */
  const getPopularTemplates = useCallback(async (limit: number = 6): Promise<Template[]> => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('uses', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching popular templates:', err)
      return []
    }
  }, [supabase])

  /**
   * Refresca las plantillas y categorías llamando a las funciones de obtención correspondientes.
   */
  const refreshTemplates = useCallback(async () => {
    await Promise.all([fetchTemplates(), fetchCategories()])
  }, [fetchTemplates, fetchCategories])

  /**
   * Carga inicial de plantillas y categorías al montar el hook.
   */
  useEffect(() => {
    refreshTemplates()
  }, [refreshTemplates])

  return {
    templates,
    categories,
    loading,
    error,
    searchTemplates,
    getTemplatesByCategory,
    incrementTemplateViews,
    incrementTemplateLikes,
    incrementTemplateUsage,
    refreshTemplates,
    getPopularTemplates
  }
}

// Exportar también las funciones existentes para compatibilidad
export async function getTemplates(options?: {
  category?: string
  isPremium?: boolean
  limit?: number
}) {
  const supabase = createClient()

  let query = supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
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
    .eq('is_active', true)
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
    .eq('is_active', true)
    .order('uses', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching popular templates:', error)
    return []
  }

  return data as Template[]
}