import { createClient } from '@supabase/supabase-js'
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from 'next-auth/adapters'

export function SupabaseCustomAdapter(
  url: string,
  secret: string
): Adapter {
  const supabase = createClient(url, secret, {
    db: { schema: 'public' },
    auth: {
      persistSession: false,
    },
  })

  return {
    async createUser(user: Omit<AdapterUser, 'id'>) {
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: user.email,
          email_verified: user.emailVerified,
          name: user.name,
          image: user.image,
        })
        .select()
        .single()

      if (error) throw error
      
      return {
        id: data.id,
        email: data.email,
        emailVerified: data.email_verified ? new Date(data.email_verified) : null,
        name: data.name,
        image: data.image,
      }
    },

    async getUser(id) {
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('id', id)
        .single()

      if (error) return null
      return {
        id: data.id,
        email: data.email,
        emailVerified: data.email_verified ? new Date(data.email_verified) : null,
        name: data.name,
        image: data.image,
      }
    },

    async getUserByEmail(email) {
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('email', email)
        .single()

      if (error) return null
      return {
        id: data.id,
        email: data.email,
        emailVerified: data.email_verified ? new Date(data.email_verified) : null,
        name: data.name,
        image: data.image,
      }
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const { data: account, error } = await supabase
        .from('accounts')
        .select('users(*)')
        .eq('provider_account_id', providerAccountId)
        .eq('provider', provider)
        .single()

      if (error || !account) return null
      return (account as any).users
    },

    async updateUser(user) {
      const { data, error } = await supabase
        .from('users')
        .update({
          email: user.email,
          email_verified: user.emailVerified,
          name: user.name,
          image: user.image,
        })
        .eq('id', user.id!)
        .select()
        .single()

      if (error) throw error
      return {
        id: data.id,
        email: data.email,
        emailVerified: data.email_verified ? new Date(data.email_verified) : null,
        name: data.name,
        image: data.image,
      }
    },

    async deleteUser(userId) {
      await supabase.from('users').delete().eq('id', userId)
    },

    async linkAccount(account: AdapterAccount) {
      await supabase.from('accounts').insert({
        user_id: account.userId,
        type: account.type,
        provider: account.provider,
        provider_account_id: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      })
    },

    async unlinkAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
      await supabase
        .from('accounts')
        .delete()
        .eq('provider_account_id', providerAccountId)
        .eq('provider', provider)
    },

    async createSession({ sessionToken, userId, expires }) {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          session_token: sessionToken,
          user_id: userId,
          expires: expires.toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return {
        sessionToken: data.session_token,
        userId: data.user_id,
        expires: new Date(data.expires),
      }
    },

    async getSessionAndUser(sessionToken) {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('*, users(*)')
        .eq('session_token', sessionToken)
        .single()

      if (error || !session) return null

      const { users, ...sessionData } = session as any

      return {
        session: {
          sessionToken: sessionData.session_token,
          userId: sessionData.user_id,
          expires: new Date(sessionData.expires),
        },
        user: users,
      }
    },

    async updateSession({ sessionToken, expires }) {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          expires: expires?.toISOString(),
        })
        .eq('session_token', sessionToken)
        .select()
        .single()

      if (error) throw error
      return {
        sessionToken: data.session_token,
        userId: data.user_id,
        expires: new Date(data.expires),
      }
    },

    async deleteSession(sessionToken) {
      await supabase
        .from('sessions')
        .delete()
        .eq('session_token', sessionToken)
    },

    async createVerificationToken({ identifier, expires, token }) {
      const { data, error } = await supabase
        .from('verification_tokens')
        .insert({
          identifier,
          token,
          expires: expires.toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return {
        identifier: data.identifier,
        token: data.token,
        expires: new Date(data.expires),
      }
    },

    async useVerificationToken({ identifier, token }) {
      const { data, error } = await supabase
        .from('verification_tokens')
        .delete()
        .eq('identifier', identifier)
        .eq('token', token)
        .select()
        .single()

      if (error || !data) return null
      return {
        identifier: data.identifier,
        token: data.token,
        expires: new Date(data.expires),
      }
    },
  }
}
