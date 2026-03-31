import { StyleSheet, Switch, Text, View } from 'react-native'
import { colors, radius, spacing } from '../theme'

const AppRow = ({ name, group, unlockMode, unlockCostMinutes, enabled, onToggle }) => {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.meta}>{group || 'Ungrouped'} · {unlockMode === 'full' ? 'Full unlock' : `${unlockCostMinutes} min block`}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        thumbColor={enabled ? colors.accent : '#6B7280'}
        trackColor={{ true: colors.accentSoft, false: colors.surfaceAlt }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  info: {
    flex: 1,
    marginRight: spacing.md
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary
  }
})

export default AppRow
