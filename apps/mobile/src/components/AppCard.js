import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, radius, spacing } from '../theme'

const iconMap = {
  Instagram: 'instagram',
  TikTok: 'music-note',
  YouTube: 'youtube',
  Reddit: 'reddit',
  Snapchat: 'snapchat',
  X: 'twitter',
  Facebook: 'facebook',
  Messages: 'message-text',
  Mail: 'email-outline',
  Chess: 'chess-king',
  Spotify: 'spotify',
  Netflix: 'netflix'
}

const fallbackIcon = 'apps'

const AppCard = ({
  app,
  status,
  statusColor,
  menuOpen,
  editing,
  onToggleMenu,
  onEditRules,
  onDelete,
  onSaveSteps,
  onCancelEdit
}) => {
  const iconName = iconMap[app.name] || fallbackIcon

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={iconName} size={22} color={colors.textPrimary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{app.name}</Text>
          <Text style={styles.meta}>{app.category || 'Uncategorized'} · {app.unlockSteps} steps</Text>
        </View>
        <Pressable onPress={onToggleMenu} style={styles.menuButton}>
          <MaterialCommunityIcons name="dots-horizontal" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
      <Text style={[styles.status, { color: statusColor }]}>{status}</Text>

      {menuOpen ? (
        <View style={styles.menu}>
          <Pressable style={styles.menuAction} onPress={onEditRules}>
            <Text style={styles.menuText}>Edit rules</Text>
          </Pressable>
          <Pressable style={[styles.menuAction, styles.menuDanger]} onPress={onDelete}>
            <Text style={[styles.menuText, styles.menuDangerText]}>Trash</Text>
          </Pressable>
        </View>
      ) : null}

      {editing ? (
        <View style={styles.editPanel}>
          <Text style={styles.editLabel}>Steps required to unlock</Text>
          <TextInput
            keyboardType="number-pad"
            placeholder="e.g. 2500"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={String(app.pendingSteps ?? app.unlockSteps)}
            onChangeText={(value) => onSaveSteps(app.id, value, true)}
          />
          <View style={styles.editActions}>
            <Pressable style={styles.editButton} onPress={() => onSaveSteps(app.id, app.pendingSteps ?? app.unlockSteps, false)}>
              <Text style={styles.editButtonText}>Save</Text>
            </Pressable>
            <Pressable style={[styles.editButton, styles.editButtonGhost]} onPress={onCancelEdit}>
              <Text style={[styles.editButtonText, styles.editButtonGhostText]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center'
  },
  info: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary
  },
  menuButton: {
    padding: 6
  },
  status: {
    fontSize: 12,
    fontWeight: '600'
  },
  menu: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  menuAction: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.card
  },
  menuText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  menuDanger: {
    backgroundColor: 'rgba(243, 129, 129, 0.15)'
  },
  menuDangerText: {
    color: colors.danger
  },
  editPanel: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: spacing.sm
  },
  editLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  editButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: 'center'
  },
  editButtonText: {
    color: '#0B1220',
    fontWeight: '700',
    fontSize: 12
  },
  editButtonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border
  },
  editButtonGhostText: {
    color: colors.textPrimary
  }
})

export default AppCard
