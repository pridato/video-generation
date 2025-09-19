# 🎬 ShortsAI Frontend - Next.js SaaS Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-cyan)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green)
![Stripe](https://img.shields.io/badge/Stripe-Ready-purple)

**Plataforma SaaS moderna para generación automática de YouTube Shorts con IA**

[🚀 Demo en Vivo](https://shortsai-demo.vercel.app) • [📖 Docs](https://docs.shortsai.com) • [🏠 Proyecto Principal](../README.md)

</div>

## ✨ Características Principales

### 🚀 **Experiencia de Usuario**
- 🎬 **Generación de Videos** - Interfaz intuitiva para crear Shorts
- 🎨 **UI Moderna** - Diseño elegante con Tailwind CSS 4.0
- 📱 **Totalmente Responsive** - Optimizada para todos los dispositivos
- ⚡ **Carga Ultra Rápida** - Next.js 15 con Turbopack
- 🎥 **Preview en Tiempo Real** - Ve tu video mientras se genera

### 🔐 **Autenticación y Usuarios**
- 🔑 **Supabase Auth** - Login social (Google, GitHub, Discord)
- 👤 **Perfiles de Usuario** - Gestión completa de cuentas
- 🛡️ **Middleware Protegido** - Rutas seguras por rol
- 🔄 **Sesiones Persistentes** - Auth state management con Zustand

### 💳 **Monetización SaaS**
- 💰 **3 Planes de Suscripción** - Free, Pro ($29), Enterprise ($99)
- 💳 **Stripe Integration** - Pagos seguros y recurrentes
- 📊 **Límites Dinámicos** - Control por plan de suscripción
- 📈 **Analytics de Uso** - Métricas de consumo por usuario

### 📊 **Dashboard Empresarial**
- 🎬 **Gestión de Videos** - Historial completo y organización
- 📈 **Analytics Avanzados** - Métricas de rendimiento
- 💾 **Almacenamiento en la Nube** - Integración con Supabase Storage
- 🔍 **Búsqueda y Filtros** - Encuentra videos rápidamente

### 🗺️ **Arquitectura Avanzada**
- 🚀 **Next.js 15** - App Router con React Server Components
- 🔥 **Turbopack** - Bundler ultra rápido para desarrollo
- 🎯 **TypeScript 5** - Type safety completo
- 🎨 **Tailwind CSS 4** - Styling moderno y consistente
- 🔄 **Framer Motion** - Animaciones fluidas

## 🛠️ Tech Stack

### 🏢 **Core Framework**
- **Next.js 15.5.3** - React framework con App Router
- **React 19.1.0** - Biblioteca de UI con últimas características
- **TypeScript 5** - Tipado estático para mayor seguridad
- **Turbopack** - Bundler de nueva generación

### 🎨 **UI & Styling**
- **Tailwind CSS 4** - Framework CSS utility-first
- **Radix UI** - Componentes primitivos accesibles
- **Framer Motion 12** - Animaciones fluidas
- **Lucide React** - Iconos consistentes y modernos
- **Canvas API** - Manipulación de gráficos

### 🗺️ **Backend & Auth**
- **Supabase** - Backend-as-a-Service completo
- **Supabase Auth** - Autenticación multi-provider
- **Supabase Storage** - Almacenamiento de archivos
- **Row Level Security** - Seguridad a nivel de datos

### 💳 **Payments & Subscriptions**
- **Stripe** - Procesamiento de pagos
- **Stripe Checkout** - Flujo de pago optimizado
- **Webhooks** - Sincronización automática

### 📊 **State & Data**
- **Zustand** - State management ligero
- **React Hooks** - Estado local y efectos
- **Context API** - Compartir estado global
- **SWR/TanStack Query** - Data fetching (próximamente)

## 🚀 Configuración y Desarrollo

### 📋 **Prerrequisitos**
- **Node.js 18+** - Runtime de JavaScript
- **npm** o **yarn** - Gestor de paquetes
- **Git** - Control de versiones
- **Cuenta Supabase** - Backend y autenticación
- **Cuenta Stripe** - Pagos (opcional para desarrollo)

### 📦 **Instalación Rápida**

#### 1️⃣ **Clonar e instalar dependencias**
```bash
# Clonar el repositorio
git clone https://github.com/yourusername/video-generation-saas.git
cd video-generation-saas/video-generation-frontend

# Instalar dependencias (recomendado npm)
npm install

# O con yarn
yarn install
```

#### 2️⃣ **Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo
cp .env.local.example .env.local

# Editar con tus credenciales
nano .env.local
```

#### 3️⃣ **Configurar Supabase**
```bash
# 1. Crear proyecto en https://supabase.com
# 2. Obtener URL y API Key del dashboard
# 3. Ejecutar migraciones de BD
psql -h db.xxx.supabase.co -p 5432 -d postgres -U postgres -f supabase-schema.sql
```

#### 4️⃣ **Iniciar servidor de desarrollo**
```bash
# Con Turbopack (recomendado)
npm run dev

# Sin Turbopack
npm run dev:legacy

# Con análisis del bundle
npm run analyze
```

🎉 **¡Listo!** Abre [http://localhost:3000](http://localhost:3000)

### 🔧 **Scripts Disponibles**

```bash
# Desarrollo
npm run dev          # Turbopack + hot reload
npm run dev:debug    # Con debugging habilitado

# Construcción
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run build:analyze # Analizar tamaño del bundle

# Testing
npm run test         # Unit tests con Jest
npm run test:watch   # Tests en modo watch
npm run test:e2e     # End-to-end tests

# Linting & Formatting
npm run lint         # ESLint
npm run lint:fix     # Auto-fix de linting
npm run format       # Prettier formatting

# Base de datos
npm run db:migrate   # Ejecutar migraciones
npm run db:seed      # Datos de prueba
npm run db:reset     # Reset completo

# Utilidades
npm run gen:types    # Generar tipos de Supabase
npm run gen:components # Scaffold de componentes
```

## 📱 Estructura del Proyecto

```
video-generation-frontend/
├── 📄 Archivos de configuración
│   ├── next.config.ts           # Configuración de Next.js
│   ├── tailwind.config.js       # Configuración de Tailwind
│   ├── tsconfig.json           # Configuración de TypeScript
│   ├── components.json         # Configuración de componentes UI
│   ├── middleware.ts           # Middleware de autenticación
│   └── package.json            # Dependencias y scripts
│
├── 📁 src/                     # Código fuente principal
│   │
│   ├── 🏠 app/                   # Next.js App Router
│   │   ├── (auth)/             # Rutas de autenticación
│   │   │   ├── login/          # Página de login
│   │   │   ├── register/       # Página de registro
│   │   │   └── forgot/         # Recuperación de contraseña
│   │   │
│   │   ├── (dashboard)/        # Dashboard protegido
│   │   │   ├── dashboard/      # Panel principal
│   │   │   ├── videos/         # Gestión de videos
│   │   │   ├── analytics/      # Métricas y stats
│   │   │   └── settings/       # Configuraciones
│   │   │
│   │   ├── (marketing)/        # Páginas públicas
│   │   │   ├── pricing/        # Planes y precios
│   │   │   ├── features/       # Características
│   │   │   └── about/          # Acerca de
│   │   │
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # Endpoints de auth
│   │   │   ├── stripe/         # Webhooks de Stripe
│   │   │   └── videos/         # API de videos
│   │   │
│   │   ├── globals.css         # Estilos globales
│   │   ├── layout.tsx          # Layout raíz
│   │   └── page.tsx            # Página de inicio
│   │
│   ├── 🧩 components/           # Componentes reutilizables
│   │   ├── ui/                 # Componentes base (Radix + Tailwind)
│   │   │   ├── button.tsx      # Botón personalizable
│   │   │   ├── card.tsx        # Tarjetas
│   │   │   ├── dialog.tsx      # Modales
│   │   │   ├── input.tsx       # Campos de entrada
│   │   │   └── ...             # Otros componentes
│   │   │
│   │   ├── common/             # Componentes comunes
│   │   │   ├── header.tsx      # Header principal
│   │   │   ├── footer.tsx      # Footer
│   │   │   ├── sidebar.tsx     # Barra lateral
│   │   │   └── navigation.tsx  # Navegación
│   │   │
│   │   ├── dashboard/          # Componentes del dashboard
│   │   │   ├── stats-cards.tsx # Tarjetas de estadísticas
│   │   │   ├── charts.tsx      # Gráficos y visualizaciones
│   │   │   └── data-tables.tsx # Tablas de datos
│   │   │
│   │   ├── videos/             # Componentes relacionados con videos
│   │   │   ├── video-card.tsx  # Tarjeta de video
│   │   │   ├── video-form.tsx  # Formulario de creación
│   │   │   └── video-player.tsx # Reproductor
│   │   │
│   │   └── forms/              # Formularios especializados
│   │       ├── auth-forms.tsx  # Formularios de auth
│   │       ├── payment-form.tsx # Formulario de pago
│   │       └── profile-form.tsx # Perfil de usuario
│   │
│   ├── 🪠 hooks/                # Custom React Hooks
│   │   ├── auth/               # Hooks de autenticación
│   │   │   ├── useAuth.ts      # Hook principal de auth
│   │   │   ├── useSession.ts   # Gestión de sesión
│   │   │   └── AuthContext.tsx # Context de autenticación
│   │   │
│   │   ├── subscription/       # Hooks de suscripciones
│   │   │   ├── useSubscription.ts # Estado de suscripción
│   │   │   └── useStripe.ts    # Integración con Stripe
│   │   │
│   │   ├── ui/                 # Hooks de UI
│   │   │   ├── useToast.ts     # Notificaciones
│   │   │   ├── useModal.ts     # Modales
│   │   │   └── ToastContext.tsx # Context de toasts
│   │   │
│   │   └── data/               # Hooks de datos
│   │       ├── useVideos.ts    # Gestión de videos
│   │       └── useAnalytics.ts # Métricas
│   │
│   ├── 📚 lib/                   # Bibliotecas y utilidades
│   │   ├── supabase/           # Configuración de Supabase
│   │   │   ├── client.ts       # Cliente de Supabase
│   │   │   ├── server.ts       # Cliente del servidor
│   │   │   └── middleware.ts   # Middleware helpers
│   │   │
│   │   ├── stripe/             # Integración con Stripe
│   │   │   ├── client.ts       # Cliente de Stripe
│   │   │   └── webhooks.ts     # Handlers de webhooks
│   │   │
│   │   ├── data/               # Datos estáticos
│   │   │   ├── features.ts     # Lista de características
│   │   │   ├── pricing.ts      # Planes de precios
│   │   │   ├── testimonials.ts # Testimonios
│   │   │   └── projects.ts     # Proyectos de ejemplo
│   │   │
│   │   ├── utils/              # Utilidades generales
│   │   │   ├── cn.ts          # Utility de clases CSS
│   │   │   ├── format.ts      # Formateo de datos
│   │   │   ├── validation.ts   # Esquemas de validación
│   │   │   └── constants.ts    # Constantes globales
│   │   │
│   │   └── services/           # Servicios externos
│   │       ├── api.ts          # Cliente de API
│   │       ├── analytics.ts    # Analytics tracking
│   │       └── storage.ts      # Gestión de archivos
│   │
│   └── 🏷️ types/                # Definiciones de tipos TypeScript
│       ├── index.ts            # Tipos generales
│       ├── auth.ts             # Tipos de autenticación
│       ├── database.ts         # Tipos de base de datos
│       ├── subscription.ts     # Tipos de suscripciones
│       └── video.ts            # Tipos relacionados con videos
│
├── 📄 Archivos de base de datos
│   ├── supabase-schema.sql     # Esquema de la base de datos
│   └── migracion.sql           # Migraciones adicionales
│
└── 📄 Documentación y configuración
    ├── README.md               # Este archivo
    ├── .env.local.example      # Ejemplo de variables de entorno
    ├── .gitignore              # Archivos ignorados por Git
    └── .eslintrc.json          # Configuración de ESLint
```



## 🔑 Variables de Entorno

### 📄 **Archivo .env.local**

```bash
# ==============================================
# 🏢 SUPABASE - Backend y Autenticación
# ==============================================
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Servidor

# ==============================================
# 💳 STRIPE - Pagos y Suscripciones
# ==============================================
STRIPE_PUBLIC_KEY=pk_test_51H7xNvE5n...                    # Público
STRIPE_SECRET_KEY=sk_test_51H7xNvE5n...                    # Servidor
STRIPE_WEBHOOK_SECRET=whsec_1234567890...                   # Webhooks

# ==============================================
# 🚀 BACKEND API - Integración con FastAPI
# ==============================================
NEXT_PUBLIC_API_URL=http://localhost:8000                  # Desarrollo
# NEXT_PUBLIC_API_URL=https://tu-backend.railway.app       # Producción

# ==============================================
# 📊 ANALYTICS Y MONITOREO
# ==============================================
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX                             # Google Analytics
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/...     # Error tracking

# ==============================================
# 🌐 CONFIGURACIÓN DE ENTORNO
# ==============================================
NODE_ENV=development                                        # development | production
NEXT_PUBLIC_APP_URL=http://localhost:3000                  # URL de la app

# ==============================================
# 🔒 SEGURIDAD
# ==============================================
NEXTAUTH_SECRET=tu-secreto-super-seguro-aqui-2024         # JWT secret
NEXTAUTH_URL=http://localhost:3000                         # URL base

# ==============================================
# 💾 STORAGE Y ARCHIVOS
# ==============================================
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://tu-proyecto.supabase.co/storage/v1
MAX_FILE_SIZE=10485760                                     # 10MB en bytes

# ==============================================
# 🎥 SERVICIOS DE VIDEO (FUTURO)
# ==============================================
# ELEVENLABS_API_KEY=sk_1234567890...                      # Voice synthesis
# PEXELS_API_KEY=1234567890...                             # Stock footage
# OPENAI_API_KEY=sk-1234567890...                          # Script enhancement
```

### 📑 **Descripción Detallada**

| Categoría | Variable | Descripción | Requerido | Ejemplo |
|-----------|-----------|-------------|-----------|----------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | ✅ | `https://abc.supabase.co` |
| | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | API Key anónima (público) | ✅ | `eyJhbGciOiJIUzI1Ni...` |
| | `SUPABASE_SERVICE_ROLE_KEY` | Service role (servidor) | 🔶 | `eyJhbGciOiJIUzI1Ni...` |
| **Stripe** | `STRIPE_PUBLIC_KEY` | Publishable key (público) | 🔶 | `pk_test_51H7xNv...` |
| | `STRIPE_SECRET_KEY` | Secret key (servidor) | 🔶 | `sk_test_51H7xNv...` |
| | `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | 🔶 | `whsec_1234567...` |
| **API** | `NEXT_PUBLIC_API_URL` | URL del backend FastAPI | ✅ | `http://localhost:8000` |
| **Analytics** | `NEXT_PUBLIC_GA_ID` | Google Analytics ID | ❌ | `G-XXXXXXXXXX` |
| | `SENTRY_DSN` | Sentry error tracking | ❌ | `https://abc123@...` |
| **Seguridad** | `NEXTAUTH_SECRET` | JWT signing secret | ✅ | String seguro aleatorio |
| | `NEXTAUTH_URL` | URL base de la app | ✅ | `http://localhost:3000` |

**Leyenda:** ✅ Requerido | 🔶 Opcional para desarrollo | ❌ Opcional

### 🔒 **Obtener Credenciales**

#### Supabase
1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **Settings** > **API**
4. Copia **Project URL** y **anon/public key**

#### Stripe
1. Ve a [dashboard.stripe.com](https://dashboard.stripe.com)
2. En **Developers** > **API keys**
3. Copia **Publishable key** y **Secret key**
4. Para webhooks: **Developers** > **Webhooks** > **Add endpoint**

#### Backend API
1. Ejecuta tu backend en local: `http://localhost:8000`
2. O usa tu deployment en Railway/Heroku

## 💰 Planes de Suscripción

### 🏆 **Planes Disponibles**

| Plan | Precio | Videos/mes | Resolución | Características | Stripe Price ID |
|------|--------|------------|------------|---------------|------------------|
| **🆓 Free** | $0 | 5 | 720p | Básico | - |
| **⭐ Pro** | $29 | 100 | 1080p | Avanzadas + API | `price_1xxxxxx` |
| **👑 Enterprise** | $99 | 500 | 4K | Completas + Soporte | `price_1yyyyyy` |

### 🎨 **Características por Plan**

#### 🆓 **Plan Free**
- ✅ 5 videos por mes
- ✅ Resolución 720p
- ✅ Templates básicos
- ✅ Soporte por email
- ❌ Sin API access
- ❌ Sin analytics avanzados

#### ⭐ **Plan Pro**
- ✅ 100 videos por mes
- ✅ Resolución 1080p
- ✅ Todos los templates
- ✅ API access completo
- ✅ Analytics avanzados
- ✅ Soporte prioritario
- ✅ Integraciones (Zapier, etc.)

#### 👑 **Plan Enterprise**
- ✅ 500 videos por mes
- ✅ Resolución 4K
- ✅ Templates exclusivos
- ✅ API rate limits altos
- ✅ Analytics empresariales
- ✅ Soporte 24/7
- ✅ White-label option
- ✅ Custom integrations

## 🚀 Deployment

### 🟢 **Vercel (Recomendado)**

#### Deploy Automático
```bash
# 1. Conectar GitHub a Vercel
# 2. Import project desde dashboard
# 3. Configurar variables de entorno
# 4. Deploy automático
```

#### Deploy Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy desde terminal
vercel --prod

# Configurar variables de entorno
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... más variables
```

### 🟡 **Netlify**
```bash
# Conectar repositorio
# Build command: npm run build
# Publish directory: .next
# Configurar variables de entorno en dashboard
```

### ☁️ **AWS Amplify**
```bash
# 1. Conectar GitHub repo
# 2. Build settings:
# version: 1
# frontend:
#   phases:
#     preBuild:
#       commands:
#         - npm install
#     build:
#       commands:
#         - npm run build
#   artifacts:
#     baseDirectory: .next
#     files:
#       - '**/*'
```

### 🐳 **Docker**
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build y run
docker build -t shortsai-frontend .
docker run -p 3000:3000 --env-file .env.local shortsai-frontend
```

## 🧪 Testing

### 📝 **Unit Tests**
```bash
# Ejecutar todos los tests
npm run test

# Tests en modo watch
npm run test:watch

# Coverage report
npm run test:coverage
```

### 🎭 **End-to-End Tests**
```bash
# Playwright E2E tests
npm run test:e2e

# E2E en modo interactivo
npm run test:e2e:ui

# E2E solo en Chrome
npm run test:e2e -- --project=chromium
```

### 📊 **Performance Testing**
```bash
# Lighthouse CI
npm run lighthouse

# Bundle analyzer
npm run analyze

# Speed testing
npm run test:performance
```

## 🐛 Debug y Troubleshooting

### 🔍 **Problemas Comunes**

#### Error de Supabase Connection
```bash
# Verificar variables de entorno
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test de conexión
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/
```

#### Error de Stripe
```bash
# Verificar keys
echo $STRIPE_PUBLIC_KEY
echo $STRIPE_SECRET_KEY

# Test webhook
curl -X POST localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### Build Errors
```bash
# Limpiar cache
rm -rf .next node_modules
npm install

# Build en modo debug
DEBUG=1 npm run build

# Verificar tipos TypeScript
npm run type-check
```

### 📊 **Logs y Monitoreo**
```bash
# Ver logs en desarrollo
npm run dev -- --debug

# Production logs (PM2)
pm2 logs shortsai-frontend

# Vercel logs
vercel logs
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Sigue estos pasos:

### 🚀 **Setup para Contribuir**
```bash
# 1. Fork del repositorio
# 2. Clonar tu fork
git clone https://github.com/tu-usuario/video-generation-saas.git
cd video-generation-saas/video-generation-frontend

# 3. Instalar dependencias
npm install

# 4. Crear branch para feature
git checkout -b feature/nueva-funcionalidad

# 5. Hacer cambios y commit
git commit -m "feat: agregar nueva funcionalidad"

# 6. Push y crear PR
git push origin feature/nueva-funcionalidad
```

### 📄 **Guías de Código**
- **ESLint**: Código debe pasar linting (`npm run lint`)
- **TypeScript**: Type safety completo
- **Tests**: Añadir tests para nuevas funcionalidades
- **Commits**: Usar conventional commits (`feat:`, `fix:`, etc.)
- **PR**: Descripción detallada con screenshots si aplica

### 🐛 **Reportar Bugs**
1. Buscar issues existentes
2. Crear nuevo issue con template
3. Incluir pasos para reproducir
4. Añadir screenshots/logs si es útil

## 📝 Licencia

Este proyecto está bajo la **Licencia MIT**. Ver el archivo [LICENSE](../LICENSE) para más detalles.

---

<div align="center">

**🎆 ¡Gracias por usar ShortsAI! 🎆**

[⭐ Dale una estrella](https://github.com/yourusername/video-generation-saas) si te gusta el proyecto

[💬 Discord](https://discord.gg/shortsai) • [🐦 Twitter](https://twitter.com/shortsai) • [📧 Email](mailto:support@shortsai.com)

</div>
