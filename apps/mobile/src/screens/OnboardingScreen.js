import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import {
  chooseBlockedApps,
  requestControlsAuthorization,
  setDailyGoal
} from '../services/lockstepControls'
import { colors, radius, spacing } from '../theme'

const steps = [
  {
    title: 'Connect HealthKit',
    body: 'Lockstep reads your step count from Apple Health to unlock screen time. We only pull motion data.'
  },
  {
    title: 'Set Your Daily Goal',
    body: 'Pick a goal that feels motivating. You can adjust anytime from your profile.'
  },
  {
    title: 'Choose Apps to Lock',
    body: 'Select the apps that get unlocked by movement. You can group them by category.'
  }
]

const OnboardingScreen = ({ onFinish }) => {
  const [stepIndex, setStepIndex] = useState(0)
  const [goal, setGoal] = useState('8000')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const step = steps[stepIndex]

  const handleNext = async () => {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      if (stepIndex === 0) {
        await requestControlsAuthorization()
      } else if (stepIndex === 1) {
        const parsedGoal = Number(goal.replace(/[^0-9]/g, ''))
        if (!parsedGoal) throw new Error('Enter a goal greater than zero.')
        await setDailyGoal(parsedGoal)
      } else {
        await chooseBlockedApps()
        onFinish()
        return
      }
      setStepIndex(prev => prev + 1)
    } catch (error) {
      setMessage(error?.message || 'Setup could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  const buttonLabels = [
    'Connect permissions',
    `Save ${Number(goal || 0).toLocaleString()}-step goal`,
    'Choose apps'
  ]

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Step {stepIndex + 1} of {steps.length}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
        {stepIndex === 1 ? (
          <View style={styles.goalRow}>
            <TextInput
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
              value={goal}
              onChangeText={value => setGoal(value.replace(/[^0-9]/g, ''))}
            />
            <Text style={styles.goalLabel}>steps</Text>
          </View>
        ) : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
      <View style={styles.actions}>
        <PrimaryButton label={busy ? 'Working...' : buttonLabels[stepIndex]} onPress={handleNext} />
        <PrimaryButton label="Finish later" variant="ghost" onPress={onFinish} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
    justifyContent: 'center'
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border
  },
  eyebrow: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.accent
  },
  title: {
    marginTop: spacing.sm,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary
  },
  body: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20
  },
  goalRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    fontSize: 22,
    fontWeight: '700'
  },
  goalLabel: {
    color: colors.textSecondary,
    fontSize: 14
  },
  message: {
    marginTop: spacing.md,
    color: colors.warning,
    fontSize: 13
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm
  }
})

export default OnboardingScreen
