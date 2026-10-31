import { useCallback, useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import ProgressBar from '../components/ProgressBar'
import ScreenHeader from '../components/ScreenHeader'
import StatCard from '../components/StatCard'
import { useApp } from '../context/AppContext'
import {
  addControlsStateListener,
  getControlsState,
  refreshStepCount
} from '../services/lockstepControls'
import { colors, radius, spacing } from '../theme'

const HomeScreen = () => {
  const { user } = useApp()
  const [controls, setControls] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState('')

  const loadState = useCallback(async (refreshHealth = false) => {
    setRefreshing(true)
    setMessage('')
    try {
      const state = refreshHealth ? await refreshStepCount() : await getControlsState()
      setControls(state)
    } catch (error) {
      setMessage(error?.message || 'Unable to refresh your steps.')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadState(true)
    let subscription
    try {
      subscription = addControlsStateListener(setControls)
    } catch (error) {
      setMessage(error?.message || 'Unable to observe step changes.')
    }
    return () => subscription?.remove()
  }, [loadState])

  const stepsToday = controls?.stepsToday ?? 0
  const dailyGoal = controls?.goal ?? 8000
  const progress = dailyGoal ? Math.min(1, stepsToday / dailyGoal) : 0
  const selectedCount =
    (controls?.selectedAppCount ?? 0) +
    (controls?.selectedCategoryCount ?? 0) +
    (controls?.selectedWebDomainCount ?? 0)

  return (
    <View style={styles.container}>
      <ScreenHeader title="Today" subtitle={user ? `Welcome back, ${user.name}` : 'Move first. Scroll later.'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadState(true)}
            tintColor={colors.accent}
          />
        }
      >
        <View style={[styles.card, styles.progressCard]}>
          <Text style={styles.cardTitle}>Step Progress</Text>
          <Text style={styles.bigNumber}>{stepsToday.toLocaleString()}</Text>
          <Text style={styles.cardSub}>
            of {dailyGoal.toLocaleString()} steps · {Math.round(progress * 100)}%
          </Text>
          <ProgressBar progress={progress} />
          <Text style={styles.helper}>
            {controls?.isUnlocked
              ? 'Goal reached. Your selected apps are unshielded for today.'
              : `${(controls?.remainingSteps ?? dailyGoal).toLocaleString()} more steps to unlock.`}
          </Text>
        </View>

        <View style={styles.statGrid}>
          <StatCard
            label="Apps"
            value={`${selectedCount} selected`}
            helper={controls?.blockingEnabled ? 'Daily shields on' : 'Blocking paused'}
          />
          <StatCard
            label="Status"
            value={controls?.isUnlocked ? 'Open' : 'Shielded'}
            helper={controls?.isUnlocked ? 'Until midnight' : 'Keep moving'}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How it works today</Text>
          <Text style={styles.cardSub}>
            Lockstep reads your total from Apple Health. Step changes update the shield in the background, and pulling down here checks immediately.
          </Text>
          <View style={styles.meterRow}>
            <View style={[styles.meterDot, styles.meterDotActive]} />
            <View style={[styles.meterLine, progress >= 1 && styles.meterLineActive]} />
            <View style={[styles.meterDot, progress >= 1 && styles.meterDotActive]} />
          </View>
          <View style={styles.meterLabels}>
            <Text style={styles.meterLabel}>Start</Text>
            <Text style={styles.meterLabel}>{dailyGoal.toLocaleString()} steps</Text>
          </View>
        </View>

        {controls?.authorizationStatus !== 'approved' ? (
          <View style={styles.noticeCard}>
            <Text style={styles.cardTitle}>Setup needed</Text>
            <Text style={styles.cardSub}>Open App Control to allow Screen Time and Health access.</Text>
          </View>
        ) : null}

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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm
  },
  progressCard: {
    borderColor: colors.accentSoft
  },
  cardTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textSecondary
  },
  cardSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20
  },
  bigNumber: {
    fontSize: 44,
    fontWeight: '700',
    color: colors.textPrimary
  },
  helper: {
    fontSize: 13,
    color: colors.accent,
    lineHeight: 20
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.md
  },
  noticeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    gap: spacing.sm
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md
  },
  meterDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border
  },
  meterDotActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  meterLine: {
    flex: 1,
    height: 3,
    backgroundColor: colors.border
  },
  meterLineActive: {
    backgroundColor: colors.accent
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  meterLabel: {
    color: colors.textSecondary,
    fontSize: 11
  },
  message: {
    color: colors.warning,
    fontSize: 13,
    textAlign: 'center'
  }
})

export default HomeScreen
