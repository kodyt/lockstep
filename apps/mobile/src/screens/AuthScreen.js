import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import * as Linking from 'expo-linking'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '../services/supabase'
import { colors, radius, spacing } from '../theme'

const AuthScreen = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      setError('Please enter a valid email.')
      return
    }

    setLoading(true)
    setError('')

    const redirectTo = Linking.createURL('auth/callback')

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo
      }
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to Lockstep</Text>
        <Text style={styles.subtitle}>Enter your email to receive a sign-in link.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {sent ? <Text style={styles.success}>Check your inbox for the magic link.</Text> : null}
        <View style={styles.inputRow}>
          <MaterialCommunityIcons name="email-outline" size={18} color={colors.textSecondary} />
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@company.com"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <Pressable style={styles.primaryButton} onPress={handleEmailSignIn} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? 'Sending…' : 'Send magic link'}</Text>
        </Pressable>
        <Text style={styles.helper}>You’ll stay signed in on this device.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    backgroundColor: colors.surfaceAlt
  },
  input: {
    flex: 1,
    color: colors.textPrimary
  },
  primaryButton: {
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center'
  },
  primaryText: {
    color: '#0B1220',
    fontWeight: '700'
  },
  helper: {
    fontSize: 12,
    color: colors.textSecondary
  },
  error: {
    fontSize: 12,
    color: colors.danger
  },
  success: {
    fontSize: 12,
    color: colors.accent
  }
})

export default AuthScreen
