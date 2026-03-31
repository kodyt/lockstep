import { StyleSheet, Switch, Text, View } from 'react-native'
import { colors, spacing } from '../theme'

const ToggleRow = ({ label, description, value, onChange }) => {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={value ? colors.accent : '#6B7280'}
        trackColor={{ true: colors.accentSoft, false: colors.surfaceAlt }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  textBlock: {
    flex: 1,
    marginRight: spacing.md
  },
  label: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary
  }
})

export default ToggleRow
