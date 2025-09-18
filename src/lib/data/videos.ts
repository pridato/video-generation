export type VideoStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface Video {
  id: string
  title: string
  thumbnail: string
  duration: number
  status: VideoStatus
  createdAt: string
  template: string
  views?: number
  downloadUrl?: string
  // Nuevos campos para integración con Storage
  video_url?: string
  thumbnail_url?: string
  engagement_rate?: number
}



export const MOCK_VIDEOS: Video[] = [
  {
    id: '1',
    title: 'React Hooks Explicados',
    thumbnail: '🖥️',
    duration: 45,
    status: 'completed',
    createdAt: '2024-01-15',
    template: 'Tutorial Tecnológico',
    views: 1250,
    downloadUrl: '/videos/react-hooks.mp4',
    video_url: 'https://supabase.co/storage/v1/object/public/generated-content/users/123/react-hooks.mp4',
    thumbnail_url: 'https://supabase.co/storage/v1/object/public/assets/thumbnails/react-hooks.jpg',
    engagement_rate: 0.12
  },
  {
    id: '2',
    title: '5 Trucos de JavaScript',
    thumbnail: '⚡',
    duration: 38,
    status: 'completed',
    createdAt: '2024-01-12',
    template: 'Datos Virales',
    views: 3800,
    downloadUrl: '/videos/js-tricks.mp4',
    video_url: 'https://supabase.co/storage/v1/object/public/generated-content/users/123/js-tricks.mp4',
    thumbnail_url: 'https://supabase.co/storage/v1/object/public/assets/thumbnails/js-tricks.jpg',
    engagement_rate: 0.18
  },
  {
    id: '3',
    title: 'Consejos para Programadores',
    thumbnail: '💡',
    duration: 52,
    status: 'completed',
    createdAt: '2024-01-10',
    template: 'Consejos de Vida',
    views: 890,
    downloadUrl: '/videos/dev-tips.mp4',
    video_url: 'https://supabase.co/storage/v1/object/public/generated-content/users/123/dev-tips.mp4',
    thumbnail_url: 'https://supabase.co/storage/v1/object/public/assets/thumbnails/dev-tips.jpg',
    engagement_rate: 0.08
  },
  {
    id: '4',
    title: 'Tutorial de Next.js',
    thumbnail: '🚀',
    duration: 0,
    status: 'processing',
    createdAt: '2024-01-16',
    template: 'Tutorial Tecnológico'
  },
  {
    id: '5',
    title: 'TypeScript para Principiantes',
    thumbnail: '❌',
    duration: 0,
    status: 'failed',
    createdAt: '2024-01-14',
    template: 'Tutorial Tecnológico'
  }
]


