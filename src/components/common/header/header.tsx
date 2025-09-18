"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { useToast } from "@/hooks/ui";
import { useSubscriptionHelpers } from "@/hooks/subscription";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  getPopularTemplates,
  getTemplateCategories,
  type Template,
} from "@/lib/services/supabase/templates";
import {
  Play,
  LogOut,
  User,
  Menu,
  X,
  Palette,
  BarChart3,
  CreditCard,
  ChevronDown,
  Settings,
  Coins,
  Plus,
  CoinsIcon,
} from "lucide-react";

const NAVIGATION_DATA = {
  landing: [
    { href: "#features", label: "Características" },
    { href: "/pricing", label: "Precios" },
    { href: "#testimonials", label: "Testimonios" },
  ],
  authenticated: [
    { href: ROUTES.CREATE, label: "Crear", icon: null },
    { href: ROUTES.LIBRARY, label: "Biblioteca", icon: null },
    { href: "/templates", label: "Templates", icon: Palette },
  ],
  premium: [{ href: "/analytics", label: "Analíticas", icon: BarChart3 }],
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, credits, isLoading, signOut } = useAuth();
  const { success } = useToast();
  const { subscriptionInfo, getTierIcon, hasAccess } = useSubscriptionHelpers();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [, setPopularTemplates] = useState<Template[]>([]);
  const [, setTemplateCategories] = useState<string[]>([]);

  const isAuthenticated = !!user;

  // Helper para determinar si un link está activo
  const isActiveLink = (href: string) => {
    if (href.startsWith("#")) return false;
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  useEffect(() => {
    const loadTemplates = async () => {
      if (isAuthenticated) {
        try {
          const [templates, categories] = await Promise.all([
            getPopularTemplates(6),
            getTemplateCategories(),
          ]);
          setPopularTemplates(templates);
          setTemplateCategories(categories);
        } catch (error) {
          console.error("Error loading templates:", error);
        }
      }
    };

    loadTemplates();
  }, [isAuthenticated]);

  const handleSignOut = async () => {
    try {
      await signOut();
      success("Sesión cerrada exitosamente");
      router.push(ROUTES.HOME || "/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLogoClick = () => {
    if (isAuthenticated) {
      router.push(ROUTES.DASHBOARD || "/dashboard");
    } else {
      router.push(ROUTES.HOME || "/");
    }
  };

  if (isLoading) {
    return (
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ShortsAI
              </span>
            </div>
            <div className="w-24 h-8 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </nav>
    );
  }

  const CreditIndicator = () => {
    if (!isAuthenticated || !profile) return null;

    if (credits === null) return null;

    const isLow = credits <= 10;
    const isVeryLow = credits <= 3;

    return (
      <div className="flex items-center gap-2">
        {/* Mostrar créditos */}
        <Button
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isVeryLow
              ? "bg-red-50 hover:bg-red-100 text-red-700"
              : isLow
                ? "bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                : "bg-muted/30 hover:bg-muted/50"
            }`}
        >
          <Coins
            className={`w-4 h-4 ${isVeryLow
                ? "text-red-500"
                : isLow
                  ? "text-yellow-500"
                  : "text-green-500"
              }`}
          />
          <span className="text-sm font-medium">{credits} créditos</span>
          {isLow && (
            <div
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${isVeryLow ? "bg-red-500" : "bg-yellow-500"
                }`}
            />
          )}
        </Button>

        {/* Botón comprar créditos */}
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-1 h-9 px-3"
          onClick={() => router.push("/credits/purchase-credits")}
        >
          <Plus className="w-3 h-3" />
          <span className="hidden sm:inline">Comprar</span>
        </Button>
      </div>
    );
  };

  const UserDropdown = () => {
    if (!isAuthenticated || !user || !profile) return null;

    return (
      <div className="relative">
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
        >
          {/* Avatar mejorado */}
          <div className="w-9 h-9 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full flex items-center justify-center ring-2 ring-primary/20">
            <User className="w-5 h-5 text-primary" />
          </div>

          {/* Info del usuario */}
          <div className="hidden sm:block text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate max-w-24">
                {profile.full_name || user?.email?.split("@")[0]}
              </p>
              {getTierIcon && getTierIcon(profile.subscription_tier)}
            </div>
            <p
              className={`text-xs font-medium ${subscriptionInfo?.color || "text-muted-foreground"
                }`}
            >
              {subscriptionInfo?.label || profile.subscription_tier}
            </p>
          </div>

          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {isUserMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-background border border-border rounded-xl shadow-xl z-50 p-3">
            <div className="px-3 py-3 border-b border-border mb-2">
              <p className="font-medium text-sm">
                {profile.full_name || user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${subscriptionInfo?.bgColor || "bg-muted"
                      } ${subscriptionInfo?.color || "text-muted-foreground"}`}
                  >
                    {subscriptionInfo?.label || profile.subscription_tier}
                  </span>
                  {getTierIcon && getTierIcon(profile.subscription_tier)}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {credits || 0} créditos
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Link
                href={ROUTES.SETTINGS || "/settings"}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Configuración
              </Link>

              <Link
                href="/credits/actual-credits"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <CoinsIcon className="w-4 h-4" />
                Gestionar Créditos
              </Link>

              <Link
                href="/pricing"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <CreditCard className="w-4 h-4" />
                Gestionar Plan
              </Link>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={handleLogoClick}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ShortsAI
            </span>
          </button>

          {/* Desktop Navigation */}
          {!isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center space-x-8">
                {NAVIGATION_DATA.landing.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`transition-colors ${isActiveLink(item.href)
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg">
                  <Link href="/auth/register">Empezar Gratis</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Navegación centrada */}
              <div className="hidden md:flex items-center justify-center flex-1">
                <div className="flex items-center space-x-8">
                  {NAVIGATION_DATA.authenticated.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = isActiveLink(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`transition-colors flex items-center gap-2 px-3 py-2 rounded-lg ${isActive
                            ? "text-foreground font-medium bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                      >
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        {item.label}
                      </Link>
                    );
                  })}

                  {/* Premium Analytics - Solo para Pro y Enterprise */}
                  {hasAccess &&
                    hasAccess("pro") &&
                    NAVIGATION_DATA.premium.map((item) => {
                      const IconComponent = item.icon!;
                      const isActive = isActiveLink(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`transition-colors flex items-center gap-2 px-3 py-2 rounded-lg ${isActive
                              ? "text-foreground font-medium bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CreditIndicator />
                <UserDropdown />
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-3">
              {!isAuthenticated ? (
                <>
                  {NAVIGATION_DATA.landing.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block text-muted-foreground hover:text-foreground transition-colors py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <hr className="border-border/50 my-3" />
                  <Link
                    href="/auth/login"
                    className="block text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block bg-gradient-to-r from-primary to-secondary text-white text-center py-3 rounded-lg font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Empezar Gratis
                  </Link>
                </>
              ) : (
                <>
                  {/* User Profile Section */}
                  {profile && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {profile.full_name || user?.email?.split("@")[0]}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${subscriptionInfo?.bgColor || "bg-muted"
                                } ${subscriptionInfo?.color ||
                                "text-muted-foreground"
                                }`}
                            >
                              {subscriptionInfo?.label ||
                                profile.subscription_tier}
                            </span>
                            {getTierIcon &&
                              getTierIcon(profile.subscription_tier)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Coins className="w-3 h-3" />
                            {credits || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Main Navigation */}
                  {NAVIGATION_DATA.authenticated.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        {item.label}
                      </Link>
                    );
                  })}

                  <Link
                    href="/templates"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Palette className="w-4 h-4" />
                    Templates
                  </Link>

                  {/* Premium Features - Solo para Pro y Enterprise */}
                  {hasAccess &&
                    hasAccess("pro") &&
                    NAVIGATION_DATA.premium.map((item) => {
                      const IconComponent = item.icon!;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <IconComponent className="w-4 h-4" />
                          {item.label}
                        </Link>
                      );
                    })}

                  <hr className="border-border/50 my-3" />

                  {/* Settings & Account */}
                  <Link
                    href={ROUTES.SETTINGS || "/settings"}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Configuración
                  </Link>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors py-2 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
