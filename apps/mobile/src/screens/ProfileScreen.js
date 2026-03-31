import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import ScreenHeader from '../components/ScreenHeader'
import StatCard from '../components/StatCard'
import ToggleRow from '../components/ToggleRow'
import { useApp } from '../context/AppContext'
import { getProfile } from '../services/api'
import { colors, radius, spacing } from '../theme'

const ProfileScreen = () => {
  const { user } = useApp()
  const [profile, setProfile] = useState(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [groupUpdatesEnabled, setGroupUpdatesEnabled] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const data = await getProfile(user.id)
      setProfile(data)
    }
    load()
  }, [user])

  const history = profile?.history ?? []

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profile" subtitle="Your streaks, stats, and preferences" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.label}>Streaks</Text>
          <View style={styles.statGrid}>
            <StatCard label="Current" value={`${profile?.streaks?.current ?? 0} days`} helper="Keep it alive" />
            <StatCard label="Best" value={`${profile?.streaks?.best ?? 0} days`} helper="Personal record" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Step history</Text>
          <View style={styles.historyList}>
            {history.map((entry, index) => (
              <View key={`${entry.date}-${index}`} style={styles.historyRow}>
                <Text style={styles.historyDate}>{entry.date}</Text>
                <View style={styles.historyBarTrack}>
                  <View style={[styles.historyBarFill, { width: `${Math.min(100, (entry.steps / (profile?.user?.dailyGoal || 8000)) * 100)}%` }]} />
                </View>
                <Text style={styles.historySteps}>{entry.steps.toLocaleString()}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.helper}>Best day: {profile?.personalRecords?.bestDay?.toLocaleString() ?? 0} steps</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Settings</Text>
          <ToggleRow
            label="Progress reminders"
            description="Get nudges when you're close to unlocking"
            value={notificationsEnabled}
            onChange={setNotificationsEnabled}
          />
          <ToggleRow
            label="Group updates"
            description="Notify me when my group hits a milestone"
            value={groupUpdatesEnabled}
            onChange={setGroupUpdatesEnabled}
          />
          <ToggleRow
            label="Privacy mode"
            description="Hide my step count from leaderboards"
            value={false}
            onChange={() => {}}
          />
          <View style={styles.inlineButtons}>
            <PrimaryButton label="Edit goal" variant="ghost" onPress={() => {}} />
            <PrimaryButton label="HealthKit sync" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Legal</Text>
          <Text style={styles.helper}>Privacy policy · Terms of service</Text>
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
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textSecondary
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.md
  },
  historyList: {
    marginTop: spacing.sm,
    gap: spacing.sm
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  historyDate: {
    width: 40,
    fontSize: 12,
    color: colors.textSecondary
  },
  historyBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    overflow: 'hidden'
  },
  historyBarFill: {
    height: '100%',
    backgroundColor: colors.accent
  },
  historySteps: {
    width: 60,
    textAlign: 'right',
    fontSize: 12,
    color: colors.textSecondary
  },
  helper: {
    fontSize: 12,
    color: colors.textSecondary
  },
  inlineButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm
  }
})

export default ProfileScreen
