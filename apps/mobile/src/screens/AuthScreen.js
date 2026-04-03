import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '../services/supabase'
import { colors, radius, spacing } from '../theme'

const emailPattern = /.+@.+\..+/

const validatePassword = (value) => {
  if (value.length < 6) return 'Password must be at least 6 characters.'
  const hasLetter = /[A-Za-z]/.test(value)
  const hasDigit = /\d/.test(value)
  if (!hasLetter || !hasDigit) return 'Password must include at least one letter and one number.'
  return null
}

const AuthScreen = () => {
  const navigation = useNavigation()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const headerCopy = useMemo(() => {
    return mode === 'signup'
      ? { title: 'Create your account', subtitle: 'Use email + password to get started.' }
      : { title: 'Welcome back', subtitle: 'Sign in to keep unlocking screen time.' }
  }, [mode])

  const resetMessages = () => {
    setError('')
    setMessage('')
  }

  const handleSignIn = async () => {
    resetMessages()
    if (!emailPattern.test(email.trim()) || !password) {
      setError('Enter a valid email and password.')
      return
    }
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })
    if (signInError) setError(signInError.message)
    setLoading(false)
  }

  const handleSignUp = async () => {
    resetMessages()
    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    const ruleError = validatePassword(password)
    if (ruleError) {
      setError(ruleError)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password
    })
    if (signUpError) {
      setError(signUpError.message)
    } else if (!data.session) {
      setMessage('Check your email to confirm your account, then sign in.')
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tabButton, mode === 'signin' && styles.tabActive]}
            onPress={() => {
              setMode('signin')
              resetMessages()
            }}
          >
            <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>Sign In</Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, mode === 'signup' && styles.tabActive]}
            onPress={() => {
              setMode('signup')
              resetMessages()
            }}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Sign Up</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>{headerCopy.title}</Text>
        <Text style={styles.subtitle}>{headerCopy.subtitle}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}

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

        <View style={styles.inputRow}>
          <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />
        </View>

        {mode === 'signup' ? (
          <>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="lock-check-outline" size={18} color={colors.textSecondary} />
              <TextInput
                placeholder="Confirm password"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={confirmPassword}
                secureTextEntry
                onChangeText={setConfirmPassword}
              />
            </View>
            <Text style={styles.helper}>Password must be at least 6 characters and include a letter + number.</Text>
          </>
        ) : (
          <Pressable onPress={() => navigation.navigate('ResetPassword')}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        )}

        {mode === 'signin' ? (
          <Pressable style={styles.primaryButton} onPress={handleSignIn} disabled={loading}>
            <Text style={styles.primaryText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </Pressable>
        ) : null}

        {mode === 'signup' ? (
          <Pressable style={styles.primaryButton} onPress={handleSignUp} disabled={loading}>
            <Text style={styles.primaryText}>{loading ? 'Creating…' : 'Create Account'}</Text>
          </Pressable>
        ) : null}

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
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  tabActive: {
    backgroundColor: colors.card,
    borderColor: colors.accent
  },
  tabText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  tabTextActive: {
    color: colors.textPrimary
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
  link: {
    fontSize: 12,
    color: colors.highlight,
    textAlign: 'right'
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
