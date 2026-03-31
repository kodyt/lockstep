import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
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
  const step = steps[stepIndex]

  const handleNext = () => {
    if (stepIndex === steps.length - 1) {
      onFinish()
      return
    }
    setStepIndex(prev => prev + 1)
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Step {stepIndex + 1} of {steps.length}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label={stepIndex === steps.length - 1 ? 'Start Moving' : 'Continue'} onPress={handleNext} />
        {stepIndex !== steps.length - 1 ? (
          <PrimaryButton label="Skip setup" variant="ghost" onPress={onFinish} />
        ) : null}
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
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm
  }
})

export default OnboardingScreen
