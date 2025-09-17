'use client'

import { useState, useRef } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select } from '@/components/ui/select'
import { 
  User, 
  Mic, 
  Palette, 
  Shield, 
  Bell,
  CreditCard,
  Save,
  Upload,
  Eye,
  EyeOff,
  Check
} from 'lucide-react'

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState({
    fullName: 'Juan Pérez',
    email: 'juan@example.com',
    avatar: ''
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [preferences, setPreferences] = useState({
    defaultVoice: 'spanish-female-1',
    defaultTemplate: 'tech-tutorial',
    defaultQuality: '1080p',
    autoEnhance: true,
    emailNotifications: true,
    pushNotifications: false
  })

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const voices = [
    { id: 'spanish-male-1', name: 'Carlos (Masculina)' },
    { id: 'spanish-female-1', name: 'María (Femenina)' },
    { id: 'spanish-male-pro', name: 'Alejandro Pro (Masculina)' },
    { id: 'spanish-female-pro', name: 'Sofia Pro (Femenina)' }
  ]

  const templates = [
    { id: 'tech-tutorial', name: 'Tutorial Tecnológico' },
    { id: 'viral-facts', name: 'Datos Virales' },
    { id: 'life-tips', name: 'Consejos de Vida' },
    { id: 'code-to-video', name: 'Código a Video' }
  ]

  const handleSaveProfile = async () => {
    setIsSaving(true)
    // Simular guardado
    setTimeout(() => {
      setIsSaving(false)
    }, 1000)
  }

  const handleSavePreferences = async () => {
    setIsSaving(true)
    // Simular guardado
    setTimeout(() => {
      setIsSaving(false)
    }, 1000)
  }

  const handleChangePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }
    setIsSaving(true)
    // Simular cambio de contraseña
    setTimeout(() => {
      setIsSaving(false)
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' })
      alert('Contraseña actualizada exitosamente')
    }, 1000)
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen')
      return
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo no puede ser mayor a 2MB')
      return
    }

    setUploadingAvatar(true)

    try {
      // Crear preview
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)

      // Simular upload a Supabase Storage
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Actualizar profile con la nueva URL del avatar
      const avatarUrl = `/avatars/${Date.now()}-${file.name}`
      setProfile(prev => ({ ...prev, avatar: avatarUrl }))

      alert('Avatar actualizado exitosamente')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Error al subir el avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Configuración
          </h1>
          <p className="text-muted-foreground mt-2">
            Personaliza tu experiencia y gestiona tu cuenta
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Perfil
              </CardTitle>
              <CardDescription>
                Información básica de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden">
                    {avatarPreview || profile.avatar ? (
                      <img
                        src={avatarPreview || profile.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile.fullName.split(' ').map(n => n[0]).join('')
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="mb-2"
                    onClick={handleAvatarClick}
                    disabled={uploadingAvatar}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingAvatar ? 'Subiendo...' : 'Cambiar Avatar'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG o GIF. Máximo 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre Completo</label>
                  <Input
                    value={profile.fullName}
                    onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    placeholder="tu@email.com"
                    type="email"
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={isSaving} className="btn-primary">
                {isSaving ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Guardando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Perfil
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Preferencias
              </CardTitle>
              <CardDescription>
                Configura tus opciones predeterminadas para la creación de videos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Voz Predeterminada</label>
                  <Select
                    value={preferences.defaultVoice}
                    onChange={(e) => setPreferences({...preferences, defaultVoice: e.target.value})}
                    variant="creator"
                    options={voices.map(voice => ({
                      value: voice.id,
                      label: voice.name
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Plantilla Predeterminada</label>
                  <Select
                    value={preferences.defaultTemplate}
                    onChange={(e) => setPreferences({...preferences, defaultTemplate: e.target.value})}
                    variant="creator"
                    options={templates.map(template => ({
                      value: template.id,
                      label: template.name
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Calidad Predeterminada</label>
                  <Select
                    value={preferences.defaultQuality}
                    onChange={(e) => setPreferences({...preferences, defaultQuality: e.target.value})}
                    variant="creator"
                    options={[
                      { value: '720p', label: '720p' },
                      { value: '1080p', label: '1080p (Recomendado)' },
                      { value: '4k', label: '4K (Solo PRO)' }
                    ]}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Opciones Automáticas</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Mejora automática de guiones</div>
                    <div className="text-sm text-muted-foreground">
                      Usar IA para mejorar automáticamente tus guiones
                    </div>
                  </div>
                  <Button
                    variant={preferences.autoEnhance ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreferences({...preferences, autoEnhance: !preferences.autoEnhance})}
                  >
                    {preferences.autoEnhance ? <Check className="w-4 h-4" /> : "OFF"}
                  </Button>
                </div>
              </div>

              <Button onClick={handleSavePreferences} disabled={isSaving} className="btn-primary">
                {isSaving ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Guardando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Preferencias
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Configura cómo quieres recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Notificaciones por Email</div>
                  <div className="text-sm text-muted-foreground">
                    Recibir notificaciones sobre el estado de tus videos
                  </div>
                </div>
                <Button
                  variant={preferences.emailNotifications ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreferences({...preferences, emailNotifications: !preferences.emailNotifications})}
                >
                  {preferences.emailNotifications ? <Check className="w-4 h-4" /> : "OFF"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Notificaciones Push</div>
                  <div className="text-sm text-muted-foreground">
                    Recibir notificaciones en tiempo real en el navegador
                  </div>
                </div>
                <Button
                  variant={preferences.pushNotifications ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreferences({...preferences, pushNotifications: !preferences.pushNotifications})}
                >
                  {preferences.pushNotifications ? <Check className="w-4 h-4" /> : "OFF"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Seguridad
              </CardTitle>
              <CardDescription>
                Gestiona la seguridad de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contraseña Actual</label>
                  <div className="relative">
                    <Input
                      type={isPasswordVisible ? "text" : "password"}
                      value={security.currentPassword}
                      onChange={(e) => setSecurity({...security, currentPassword: e.target.value})}
                      placeholder="Tu contraseña actual"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nueva Contraseña</label>
                    <Input
                      type="password"
                      value={security.newPassword}
                      onChange={(e) => setSecurity({...security, newPassword: e.target.value})}
                      placeholder="Nueva contraseña"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirmar Contraseña</label>
                    <Input
                      type="password"
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})}
                      placeholder="Confirma tu nueva contraseña"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  disabled={isSaving || !security.currentPassword || !security.newPassword || !security.confirmPassword}
                  variant="outline"
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Actualizando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Cambiar Contraseña
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Suscripción
              </CardTitle>
              <CardDescription>
                Gestiona tu plan y facturación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <div className="font-medium">Plan Gratuito</div>
                  <div className="text-sm text-muted-foreground">
                    5 videos por mes • Resolución 720p
                  </div>
                </div>
                <Button className="btn-primary">
                  Mejorar Plan
                </Button>
              </div>

              <div className="text-center pt-4">
                <div className="text-2xl font-bold text-accent mb-1">5</div>
                <div className="text-sm text-muted-foreground">Créditos restantes este mes</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}