import { useCallback, useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import ProgressBar from '../components/ProgressBar'
import ScreenHeader from '../components/ScreenHeader'
import StatCard from '../components/StatCard'
import { useApp } from '../context/AppContext'
import { addSteps, getDashboard, useGraceUnlock } from '../services/api'
import { colors, radius, spacing } from '../theme'

const HomeScreen = () => {
  const { user } = useApp()
  const [dashboard, setDashboard] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [graceMessage, setGraceMessage] = useState('')

  const loadDashboard = useCallback(async () => {
    if (!user) return
    setRefreshing(true)
    const data = await getDashboard(user.id)
    setDashboard(data)
    setRefreshing(false)
  }, [user])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleAddSteps = async (delta) => {
    if (!user) return
    await addSteps(user.id, delta)
    await loadDashboard()
  }

  const handleGraceUnlock = async () => {
    if (!user) return
    const result = await useGraceUnlock(user.id)
    if (result.error) {
      setGraceMessage('No grace unlocks remaining.')
    } else {
      setGraceMessage('Grace unlock activated for today.')
    }
    await loadDashboard()
  }

  const progress = dashboard?.progress ?? 0
  const stepsToday = dashboard?.stepsToday ?? 0
  const dailyGoal = dashboard?.dailyGoal ?? 0

  return (
    <View style={styles.container}>
      <ScreenHeader title="Today" subtitle={user ? `Welcome back, ${user.name}` : 'Loading...'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDashboard} tintColor={colors.accent} />
        }
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Step Progress</Text>
          <Text style={styles.bigNumber}>{stepsToday.toLocaleString()} steps</Text>
          <Text style={styles.cardSub}>Goal {dailyGoal.toLocaleString()} · {Math.round(progress * 100)}%</Text>
          <ProgressBar progress={progress} />
          <Text style={styles.helper}>Earn {dashboard?.unlockStatus?.nextUnlockSteps ?? 0} more steps for the next unlock block.</Text>
        </View>

        <View style={styles.statGrid}>
          <StatCard label="Unlocked" value={`${dashboard?.appsUnlocked ?? 0} apps`} helper="Currently accessible" />
          <StatCard label="Locked" value={`${dashboard?.appsLocked ?? 0} apps`} helper="Earn steps to unlock" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Unlock Budget</Text>
          <Text style={styles.bigNumber}>{dashboard?.unlockStatus?.minutes ?? 0} mins</Text>
          <Text style={styles.cardSub}>Incremental unlock time earned</Text>
          <View style={styles.inlineButtons}>
            <PrimaryButton label="+500 steps" onPress={() => handleAddSteps(500)} />
            <PrimaryButton label="+1500 steps" onPress={() => handleAddSteps(1500)} variant="ghost" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Locked Apps Preview</Text>
          <Text style={styles.cardSub}>Next up once you move a bit more</Text>
          <View style={styles.previewList}>
            {(dashboard?.appsPreview ?? []).map(app => (
              <View key={app.id} style={styles.previewItem}>
                <Text style={styles.previewText}>{app.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Grace Unlock</Text>
          <Text style={styles.cardSub}>Emergency access without breaking your streak.</Text>
          {graceMessage ? <Text style={styles.graceMessage}>{graceMessage}</Text> : null}
          <PrimaryButton label="Use grace unlock" variant="ghost" onPress={handleGraceUnlock} />
        </View>
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
  cardTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textSecondary
  },
  cardSub: {
    fontSize: 12,
    color: colors.textSecondary
  },
  bigNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary
  },
  helper: {
    fontSize: 12,
    color: colors.textSecondary
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.md
  },
  inlineButtons: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  previewList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  previewItem: {
    backgroundColor: colors.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md
  },
  previewText: {
    fontSize: 12,
    color: colors.textPrimary
  },
  graceMessage: {
    fontSize: 12,
    color: colors.warning
  }
})

export default HomeScreen
