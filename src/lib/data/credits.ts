import { Crown, Rocket, Zap } from "lucide-react";

const PLAN_BENEFITS = {
  free: {
    icon: Zap,
    name: 'Free',
    credits: 5,
    features: ['5 videos/mes', 'Plantillas básicas', 'Calidad 720p']
  },
  pro: {
    icon: Crown,
    name: 'Pro',
    credits: 100,
    features: ['100 videos/mes', 'Todas las plantillas', 'Calidad 1080p', 'Sin marca de agua']
  },
  enterprise: {
    icon: Rocket,
    name: 'Enterprise',
    credits: 500,
    features: ['500 videos/mes', 'Plantillas premium', 'Calidad 4K', 'API access', 'Soporte prioritario']
  }
}

// Mock data para el historial de créditos
const CREDIT_HISTORY = [
  {
    id: 1,
    type: 'used',
    amount: -1,
    description: 'Video generado: "Top 5 Consejos de Marketing"',
    date: '2024-12-15T10:30:00Z',
    videoId: 'v123'
  },
  {
    id: 2,
    type: 'purchase',
    amount: 50,
    description: 'Compra de pack de créditos',
    date: '2024-12-14T15:45:00Z',
    transactionId: 'tx_456'
  },
  {
    id: 3,
    type: 'used',
    amount: -1,
    description: 'Video generado: "Tutorial React Hooks"',
    date: '2024-12-14T09:20:00Z',
    videoId: 'v124'
  },
  {
    id: 4,
    type: 'bonus',
    amount: 5,
    description: 'Bonus por referir a un amigo',
    date: '2024-12-13T16:10:00Z',
    referralId: 'ref_789'
  },
  {
    id: 5,
    type: 'renewal',
    amount: 100,
    description: 'Renovación mensual del plan Pro',
    date: '2024-12-01T00:00:00Z',
    planId: 'pro'
  }
]

export { PLAN_BENEFITS, CREDIT_HISTORY };