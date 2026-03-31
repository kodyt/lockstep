import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing } from '../theme'

const GroupCard = ({ name, goalSteps, mode, role, optOut }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.meta}>{goalSteps.toLocaleString()} steps · {mode === 'shared' ? 'Shared unlock' : 'Individual unlock'}</Text>
      <View style={styles.badges}>
        <Text style={styles.badge}>{role === 'owner' ? 'Owner' : 'Member'}</Text>
        {optOut ? <Text style={[styles.badge, styles.optOut]}>Opted out</Text> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary
  },
  badges: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.xs
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    color: colors.textSecondary,
    fontSize: 11
  },
  optOut: {
    backgroundColor: '#2F2A3A',
    color: colors.warning
  }
})

export default GroupCard
