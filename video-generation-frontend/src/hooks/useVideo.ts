/**
 * Video generation and management hook
 */
import { useState, useCallback } from 'react'
import { videoService } from '@/services/video'
import { useApi, usePaginatedApi } from './useApi'
import type { VideoGenerationRequest, VideoProject, VideoTemplate } from '@/services/video'

export const useVideo = () => {
  const generateApi = useApi<VideoProject>()
  const projectsApi = usePaginatedApi<VideoProject>()
  const templatesApi = useApi<VideoTemplate[]>()

  const [currentProject, setCurrentProject] = useState<VideoProject | null>(null)

  const generateVideo = useCallback(async (request: VideoGenerationRequest): Promise<VideoProject | null> => {
    const result = await generateApi.execute(() => videoService.generateVideo(request))
    if (result) {
      setCurrentProject(result)
    }
    return result
  }, [generateApi])

  const getProject = useCallback(async (projectId: string): Promise<VideoProject | null> => {
    try {
      const project = await videoService.getProject(projectId)
      setCurrentProject(project)
      return project
    } catch (error) {
      console.error('Error fetching project:', error)
      return null
    }
  }, [])

  const loadProjects = useCallback((page = 1, status?: string) => {
    return projectsApi.execute(
      (pageNum, pageSize) => videoService.getProjects(pageNum, pageSize, status),
      page
    )
  }, [projectsApi])

  const loadMoreProjects = useCallback((status?: string) => {
    return projectsApi.loadMore(
      (pageNum, pageSize) => videoService.getProjects(pageNum, pageSize, status)
    )
  }, [projectsApi])

  const cancelProject = useCallback(async (projectId: string): Promise<void> => {
    await videoService.cancelProject(projectId)

    // Update current project if it's the cancelled one
    if (currentProject?.id === projectId) {
      setCurrentProject(prev => prev ? { ...prev, status: 'cancelled' } : null)
    }

    // Update projects list
    projectsApi.setData(prev => ({
      ...prev,
      items: prev.items.map(project =>
        project.id === projectId ? { ...project, status: 'cancelled' } : project
      )
    }))
  }, [currentProject, projectsApi])

  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    await videoService.deleteProject(projectId)

    // Clear current project if it's the deleted one
    if (currentProject?.id === projectId) {
      setCurrentProject(null)
    }

    // Remove from projects list
    projectsApi.setData(prev => ({
      ...prev,
      items: prev.items.filter(project => project.id !== projectId),
      total: prev.total - 1
    }))
  }, [currentProject, projectsApi])

  const duplicateProject = useCallback(async (projectId: string, title?: string): Promise<VideoProject | null> => {
    try {
      const duplicated = await videoService.duplicateProject(projectId, title)

      // Add to projects list
      projectsApi.setData(prev => ({
        ...prev,
        items: [duplicated, ...prev.items],
        total: prev.total + 1
      }))

      return duplicated
    } catch (error) {
      console.error('Error duplicating project:', error)
      return null
    }
  }, [projectsApi])

  const loadTemplates = useCallback((category?: string) => {
    return templatesApi.execute(() => videoService.getTemplates(category))
  }, [templatesApi])

  const downloadVideo = useCallback(async (projectId: string, quality?: 'original' | 'compressed'): Promise<string | null> => {
    try {
      return await videoService.downloadVideo(projectId, quality)
    } catch (error) {
      console.error('Error downloading video:', error)
      return null
    }
  }, [])

  const shareVideo = useCallback(async (projectId: string, platforms: string[]) => {
    try {
      return await videoService.shareVideo(projectId, platforms)
    } catch (error) {
      console.error('Error sharing video:', error)
      return null
    }
  }, [])

  const validateVideoRequest = useCallback((request: VideoGenerationRequest) => {
    return videoService.validateVideoRequest(request)
  }, [])

  const estimateProcessingTime = useCallback((request: VideoGenerationRequest) => {
    return videoService.estimateProcessingTime(request)
  }, [])

  const getStatusColor = useCallback((status: VideoProject['status']) => {
    return videoService.getStatusColor(status)
  }, [])

  const getStatusLabel = useCallback((status: VideoProject['status']) => {
    return videoService.getStatusLabel(status)
  }, [])

  const formatDuration = useCallback((seconds: number) => {
    return videoService.formatDuration(seconds)
  }, [])

  const formatFileSize = useCallback((bytes: number) => {
    return videoService.formatFileSize(bytes)
  }, [])

  return {
    // API states
    generation: generateApi,
    projects: projectsApi,
    templates: templatesApi,

    // Current project
    currentProject,
    setCurrentProject,

    // Actions
    generateVideo,
    getProject,
    loadProjects,
    loadMoreProjects,
    cancelProject,
    deleteProject,
    duplicateProject,
    loadTemplates,
    downloadVideo,
    shareVideo,

    // Utilities
    validateVideoRequest,
    estimateProcessingTime,
    getStatusColor,
    getStatusLabel,
    formatDuration,
    formatFileSize
  }
}