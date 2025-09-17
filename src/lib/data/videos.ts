export type VideoStatus = 'processing' | 'completed' | 'failed'

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
    downloadUrl: '/videos/react-hooks.mp4'
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
    downloadUrl: '/videos/js-tricks.mp4'
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
    downloadUrl: '/videos/dev-tips.mp4'
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


