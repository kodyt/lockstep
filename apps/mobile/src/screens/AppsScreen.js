import { useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import ScreenHeader from '../components/ScreenHeader'
import {
  addControlsStateListener,
  chooseBlockedApps,
  clearBlockedApps,
  getControlsState,
  requestControlsAuthorization,
  setBlockingEnabled,
  setDailyGoal
} from '../services/lockstepControls'
import { colors, radius, spacing } from '../theme'

const AppsScreen = () => {
  const [controls, setControls] = useState(null)
  const [goalInput, setGoalInput] = useState('8000')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const loadState = useCallback(async () => {
    try {
      const state = await getControlsState()
      setControls(state)
      setGoalInput(String(state.goal))
    } catch (error) {
      setMessage(error?.message || 'Unable to load app controls.')
    }
  }, [])

  useEffect(() => {
    loadState()
    let subscription
    try {
      subscription = addControlsStateListener(setControls)
    } catch (error) {
      setMessage(error?.message || 'Unable to observe app controls.')
    }
    return () => subscription?.remove()
  }, [loadState])

  const runAction = async (action, successMessage) => {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const state = await action()
      setControls(state)
      setGoalInput(String(state.goal))
      if (successMessage) setMessage(successMessage)
    } catch (error) {
      setMessage(error?.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const saveGoal = () => {
    const goal = Number(goalInput.replace(/[^0-9]/g, ''))
    if (!goal) {
      setMessage('Enter a goal greater than zero.')
      return
    }
    runAction(() => setDailyGoal(goal), `Daily goal updated to ${goal.toLocaleString()} steps.`)
  }

  const selectedCount =
    (controls?.selectedAppCount ?? 0) +
    (controls?.selectedCategoryCount ?? 0) +
    (controls?.selectedWebDomainCount ?? 0)
  const authorized = controls?.authorizationStatus === 'approved'

  return (
    <View style={styles.container}>
      <ScreenHeader title="App Control" subtitle="Choose what unlocks after your daily walk" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{controls?.isUnlocked ? 'Goal reached' : 'Movement required'}</Text>
          <Text style={styles.heroTitle}>
            {controls?.isUnlocked ? 'Your selected apps are open.' : 'Selected apps stay shielded.'}
          </Text>
          <Text style={styles.body}>
            {controls?.isUnlocked
              ? `${(controls?.stepsToday ?? 0).toLocaleString()} steps today.`
              : `${(controls?.remainingSteps ?? controls?.goal ?? 8000).toLocaleString()} steps remaining.`}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Screen Time access</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, authorized && styles.statusDotActive]} />
            <Text style={styles.statusText}>{authorized ? 'Authorized' : 'Not authorized'}</Text>
          </View>
          <Text style={styles.helper}>
            Apple keeps your app choices private. Lockstep stores only opaque selection tokens on this phone.
          </Text>
          {!authorized ? (
            <PrimaryButton
              label={busy ? 'Connecting...' : 'Allow Screen Time and Health'}
              onPress={() => runAction(requestControlsAuthorization, 'Permissions connected.')}
            />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Apps to block</Text>
          <Text style={styles.count}>{selectedCount}</Text>
          <Text style={styles.helper}>
            {selectedCount === 1 ? 'One app or category selected.' : 'Apps or categories selected.'}
          </Text>
          <PrimaryButton
            label={busy ? 'Opening...' : selectedCount ? 'Change selection' : 'Choose apps'}
            onPress={() => runAction(chooseBlockedApps, 'App selection saved.')}
          />
          {selectedCount ? (
            <PrimaryButton
              label="Clear selection"
              variant="ghost"
              onPress={() => runAction(clearBlockedApps, 'App selection cleared.')}
            />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Daily goal</Text>
          <View style={styles.goalRow}>
            <TextInput
              keyboardType="number-pad"
              maxLength={6}
              placeholder="8000"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={goalInput}
              onChangeText={value => setGoalInput(value.replace(/[^0-9]/g, ''))}
            />
            <Text style={styles.stepsLabel}>steps</Text>
          </View>
          <Text style={styles.helper}>We recommend 8,000. The apps unlock together when you reach this total.</Text>
          <PrimaryButton label={busy ? 'Saving...' : 'Save goal'} onPress={saveGoal} />
        </View>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.label}>Daily blocking</Text>
              <Text style={styles.helper}>Reapply shields automatically at the start of each day.</Text>
            </View>
            <Switch
              value={controls?.blockingEnabled ?? true}
              onValueChange={enabled => runAction(() => setBlockingEnabled(enabled))}
              trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    gap: spacing.sm
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700'
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textSecondary
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warning
  },
  statusDotActive: {
    backgroundColor: colors.accent
  },
  statusText: {
    color: colors.textPrimary,
    fontWeight: '600'
  },
  count: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '700'
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18
  },
  goalRow: {
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
    fontSize: 20,
    fontWeight: '700'
  },
  stepsLabel: {
    color: colors.textSecondary,
    fontSize: 14
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  toggleCopy: {
    flex: 1,
    gap: spacing.xs
  },
  message: {
    color: colors.warning,
    fontSize: 13,
    textAlign: 'center'
  }
})

export default AppsScreen
