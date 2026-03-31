import { StyleSheet, View } from 'react-native'
import { colors, radius } from '../theme'

const ProgressBar = ({ progress }) => {
  const width = `${Math.min(100, Math.max(0, progress * 100))}%`
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent
  }
})

export default ProgressBar
