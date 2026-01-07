/**
 * Utilitários para trabalhar com o Supabase
 */

import { createClient } from './server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Verifica se o usuário está logado e redireciona para login se não estiver
 */
export async function requireAuth(): Promise<User> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return session.user
}

/**
 * Verifica se o usuário é admin
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return false
  }

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  return user?.role === 'admin'
}

/**
 * Obtém o profile do usuário
 */
export async function getUserProfile(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return profile
}

/**
 * Define tipos para usar com o Supabase
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']