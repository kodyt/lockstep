import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, shadow, spacing } from '../theme'

const StatCard = ({ label, value, helper }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    ...shadow
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textSecondary
  },
  value: {
    marginTop: spacing.xs,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary
  },
  helper: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary
  }
})

export default StatCard
