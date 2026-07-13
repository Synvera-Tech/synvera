"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

import type { CompositionItem } from "@/lib/compositions";

export function useCompositions() {
  const { isLoaded: authLoaded, isSignedIn, getToken } = useAuth();
  const [compositions, setCompositions] = useState<CompositionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authLoaded) return;
    if (!isSignedIn) {
      setCompositions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch("/api/compositions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Não foi possível carregar suas composições.");
      const data: CompositionItem[] = await response.json();
      setCompositions(data ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar suas composições.");
    } finally {
      setLoading(false);
    }
  }, [authLoaded, getToken, isSignedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const deleteComposition = useCallback(async (publicId: string) => {
    const token = await getToken();
    const response = await fetch(`/api/compositions/${encodeURIComponent(publicId)}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok && response.status !== 404) {
      throw new Error("Não foi possível remover a composição.");
    }
    setCompositions((current) => current.filter((item) => item.public_id !== publicId));
  }, [getToken]);

  return {
    authLoaded,
    isSignedIn,
    compositions,
    loading,
    error,
    refresh,
    deleteComposition,
  };
}
