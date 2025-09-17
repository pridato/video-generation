"use client";
import React from "react"
import { useAuth } from "@/contexts/AuthContext";
import {
  getSubscriptionInfo,
  hasFeatureAccess,
  isPremiumTier,
  isFreeTier,
} from "@/lib/subscription";
import type { SubscriptionTier } from "@/lib/subscription";
import { Building, Crown, Zap } from "lucide-react";

export function useSubscriptionHelpers() {
  const { profile } = useAuth();

  const tier: SubscriptionTier = profile?.subscription_tier as SubscriptionTier;
  const subscriptionInfo = getSubscriptionInfo(tier);
  const totalCredits = profile?.credits || subscriptionInfo.credits;



  const getTierIcon = (iconTier: SubscriptionTier): React.ReactNode => {
    switch (iconTier) {
      case "enterprise":
        return <Building className="w-4 h-4 text-muted-foreground" />
      case "pro":
        return <Crown className="w-4 h-4 text-yellow-500" />
      case "starter":
        return <Zap className="w-4 h-4 text-primary" />
      default:
        return <span className="text-xs text-muted-foreground">free</span>
    }
  }

  const getCreditStatus = () => {
    const remaining = profile?.credits_remaining || 0;
    const percentage = (remaining / totalCredits) * 100;

    return {
      percentage,
      isLow: percentage < 20,
      isVeryLow: percentage < 10,
      remaining,
      total: totalCredits,
    };
  };

  return {
    tier,
    subscriptionInfo,
    profile,
    totalCredits,
    getTierIcon,
    getCreditStatus,
    // Funciones de utilidad
    hasAccess: (requiredTier: SubscriptionTier) =>
      hasFeatureAccess(tier, requiredTier),
    isPremium: isPremiumTier(tier),
    isFree: isFreeTier(tier),
  };
}
