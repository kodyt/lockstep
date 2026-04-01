import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import GroupCard from '../components/GroupCard'
import LeaderboardRow from '../components/LeaderboardRow'
import PrimaryButton from '../components/PrimaryButton'
import ScreenHeader from '../components/ScreenHeader'
import { useApp } from '../context/AppContext'
import { getGroups, getLeaderboard } from '../services/api'
import { colors, radius, spacing } from '../theme'

const GroupsScreen = () => {
  const { user } = useApp()
  const [groups, setGroups] = useState([])
  const [leaderboard, setLeaderboard] = useState({ entries: [] })
  const [scope, setScope] = useState('daily')

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const groupData = await getGroups(user.id)
      setGroups(groupData)
      const leaderboardData = await getLeaderboard(scope)
      setLeaderboard(leaderboardData)
    }
    load()
  }, [user, scope])

  return (
    <View style={styles.container}>
      <ScreenHeader title="Leaderboard" subtitle="Move together and unlock together" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.label}>Your groups</Text>
          <View style={styles.list}>
            {groups.map(group => (
              <GroupCard
                key={group.id}
                name={group.name}
                goalSteps={group.goalSteps}
                mode={group.mode}
                role={group.role}
                optOut={group.optOutOfUnlock}
              />
            ))}
          </View>
          <View style={styles.inlineButtons}>
            <PrimaryButton label="Create group" onPress={() => {}} />
            <PrimaryButton label="Join with code" variant="ghost" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Leaderboard</Text>
          <View style={styles.inlineButtons}>
            <PrimaryButton label="Daily" variant={scope === 'daily' ? 'primary' : 'ghost'} onPress={() => setScope('daily')} />
            <PrimaryButton label="Weekly" variant={scope === 'weekly' ? 'primary' : 'ghost'} onPress={() => setScope('weekly')} />
          </View>
          <View style={styles.leaderboard}>
            {(leaderboard.entries || []).map((entry, index) => (
              <LeaderboardRow
                key={entry.userId}
                rank={index + 1}
                name={entry.name}
                steps={entry.steps}
                highlight={entry.userId === user?.id}
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Group challenges</Text>
          <Text style={styles.helper}>Schedule time-bound challenges and earn tiered rewards. Coming next.</Text>
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
  list: {
    gap: spacing.sm
  },
  inlineButtons: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  leaderboard: {
    marginTop: spacing.sm
  },
  helper: {
    fontSize: 12,
    color: colors.textSecondary
  }
})

export default GroupsScreen
