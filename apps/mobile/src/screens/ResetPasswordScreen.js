import { useState } from 'react'
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

const ResetPasswordScreen = () => {
  const navigation = useNavigation()
  const [step, setStep] = useState('request')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const resetMessages = () => {
    setError('')
    setMessage('')
  }

  const handleSendCode = async () => {
    resetMessages()
    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email to receive a code.')
      return
    }
    setLoading(true)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false
      }
    })
    if (otpError) {
      setError(otpError.message)
    } else {
      setMessage('We sent a one-time code to your email.')
      setStep('verify')
    }
    setLoading(false)
  }

  const handleVerify = async () => {
    resetMessages()
    if (!otp.trim()) {
      setError('Enter the one-time code.')
      return
    }
    const ruleError = validatePassword(newPassword)
    if (ruleError) {
      setError(ruleError)
      return
    }
    setLoading(true)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email'
    })

    if (verifyError) {
      setError(verifyError.message)
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage('Password updated. You can sign in now.')
      navigation.goBack()
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>We’ll send a one-time code to your email.</Text>

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

        {step === 'verify' ? (
          <>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="shield-key-outline" size={18} color={colors.textSecondary} />
              <TextInput
                placeholder="One-time code"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
              />
            </View>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="lock-reset" size={18} color={colors.textSecondary} />
              <TextInput
                placeholder="New password"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={newPassword}
                secureTextEntry
                onChangeText={setNewPassword}
              />
            </View>
            <Text style={styles.helper}>Password must be at least 6 characters and include a letter + number.</Text>
          </>
        ) : null}

        {step === 'request' ? (
          <Pressable style={styles.primaryButton} onPress={handleSendCode} disabled={loading}>
            <Text style={styles.primaryText}>{loading ? 'Sending…' : 'Send Code'}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primaryButton} onPress={handleVerify} disabled={loading}>
            <Text style={styles.primaryText}>{loading ? 'Updating…' : 'Update Password'}</Text>
          </Pressable>
        )}

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Back to sign in</Text>
        </Pressable>
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

export default ResetPasswordScreen
