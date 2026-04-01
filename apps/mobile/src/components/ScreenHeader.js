import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing } from '../theme'

const ScreenHeader = ({ title, subtitle, rightSlot }) => {
  const insets = useSafeAreaInsets()
  return (
    <LinearGradient
      colors={['#1A2A40', '#0B1220']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrapper, { paddingTop: spacing.lg + insets.top }]}
    >
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightSlot ? <View>{rightSlot}</View> : null}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  textBlock: {
    gap: spacing.xs
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary
  }
})

export default ScreenHeader
