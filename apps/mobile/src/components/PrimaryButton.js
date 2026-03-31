import { Pressable, StyleSheet, Text } from 'react-native'
import { colors, radius, spacing } from '../theme'

const PrimaryButton = ({ label, onPress, variant = 'primary' }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'ghost' ? styles.ghost : styles.primary,
        pressed && styles.pressed
      ]}
    >
      <Text style={[styles.text, variant === 'ghost' && styles.ghostText]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primary: {
    backgroundColor: colors.accent
  },
  ghost: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent'
  },
  text: {
    color: '#0B1220',
    fontWeight: '700',
    fontSize: 14
  },
  ghostText: {
    color: colors.textPrimary
  },
  pressed: {
    opacity: 0.85
  }
})

export default PrimaryButton
