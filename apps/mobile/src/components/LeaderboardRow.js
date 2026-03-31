import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../theme'

const LeaderboardRow = ({ rank, name, steps, highlight }) => {
  return (
    <View style={[styles.row, highlight && styles.highlight]}>
      <Text style={styles.rank}>{rank}</Text>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.steps}>{steps.toLocaleString()} steps</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  highlight: {
    backgroundColor: 'rgba(108, 246, 178, 0.08)'
  },
  rank: {
    width: 28,
    fontSize: 14,
    color: colors.textSecondary
  },
  name: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary
  },
  steps: {
    fontSize: 12,
    color: colors.textSecondary
  }
})

export default LeaderboardRow
