import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import AppCard from '../components/AppCard'
import PrimaryButton from '../components/PrimaryButton'
import ScreenHeader from '../components/ScreenHeader'
import { useApp } from '../context/AppContext'
import { getAppGroups, getApps, getDashboard } from '../services/api'
import { colors, radius, spacing } from '../theme'

const AppsScreen = () => {
  const { user } = useApp()
  const [apps, setApps] = useState([])
  const [groups, setGroups] = useState([])
  const [query, setQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState('all')
  const [activeTab, setActiveTab] = useState('all')
  const [stepsToday, setStepsToday] = useState(0)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  const [newSteps, setNewSteps] = useState('2500')

  const availableApps = [
    { name: 'Instagram', category: 'Social' },
    { name: 'TikTok', category: 'Video' },
    { name: 'YouTube', category: 'Video' },
    { name: 'Reddit', category: 'Social' },
    { name: 'Snapchat', category: 'Social' },
    { name: 'Chess', category: 'Games' },
    { name: 'Netflix', category: 'Video' },
    { name: 'Spotify', category: 'Social' },
    { name: 'X', category: 'Social' },
    { name: 'Mail', category: 'Focus' }
  ]

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const [appsData, groupData, dashboard] = await Promise.all([
        getApps(user.id),
        getAppGroups(user.id),
        getDashboard(user.id)
      ])
      const mappedApps = (appsData || []).map(app => ({
        ...app,
        category: groupData.find(group => group.id === app.groupId)?.name || 'Uncategorized',
        unlockSteps: app.unlockSteps ?? 2500
      }))
      setApps(mappedApps)
      setGroups(groupData)
      setStepsToday(dashboard?.stepsToday ?? 0)
    }
    load()
  }, [user])

  const filteredApps = useMemo(() => {
    const base = apps.filter(app => {
      const matchesQuery = app.name.toLowerCase().includes(query.toLowerCase())
      const matchesGroup = activeGroup === 'all' || app.category.toLowerCase() === activeGroup
      return matchesQuery && matchesGroup
    })

    return base.filter(app => {
      if (activeTab === 'all') return true
      const unlocked = stepsToday >= app.unlockSteps
      return activeTab === 'unlocked' ? unlocked : !unlocked
    })
  }, [apps, query, activeGroup, activeTab, stepsToday])

  const handleAddApp = () => {
    if (!selectedApp) return
    const steps = Number(newSteps) || 2500
    const newEntry = {
      id: `local_${Date.now()}`,
      name: selectedApp.name,
      category: selectedApp.category,
      unlockSteps: steps
    }
    setApps(prev => [newEntry, ...prev])
    setSelectedApp(null)
    setNewSteps('2500')
    setShowPicker(false)
    setShowAddPanel(false)
  }

  const handleDelete = (id) => {
    setApps(prev => prev.filter(app => app.id !== id))
    setMenuOpenId(null)
  }

  const handleEditRules = (id) => {
    setEditingId(id)
    setMenuOpenId(null)
    setApps(prev => prev.map(app => (app.id === id ? { ...app, pendingSteps: app.unlockSteps } : app)))
  }

  const handleSaveSteps = (id, value, isTyping) => {
    setApps(prev => prev.map(app => {
      if (app.id !== id) return app
      if (isTyping) {
        return { ...app, pendingSteps: value.replace(/[^0-9]/g, '') }
      }
      const cleaned = Number(String(value).replace(/[^0-9]/g, '')) || app.unlockSteps
      return { ...app, unlockSteps: cleaned, pendingSteps: undefined }
    }))
    if (!isTyping) setEditingId(null)
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="App Control"
        subtitle="Choose which apps unlock with movement"
        rightSlot={(
          <Pressable style={styles.addButton} onPress={() => setShowAddPanel(prev => !prev)}>
            <MaterialCommunityIcons name="plus" size={22} color={colors.textPrimary} />
          </Pressable>
        )}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.tabRow}>
          <PrimaryButton label="All Apps" variant={activeTab === 'all' ? 'primary' : 'ghost'} onPress={() => setActiveTab('all')} />
          <PrimaryButton label="Locked" variant={activeTab === 'locked' ? 'primary' : 'ghost'} onPress={() => setActiveTab('locked')} />
          <PrimaryButton label="Unlocked" variant={activeTab === 'unlocked' ? 'primary' : 'ghost'} onPress={() => setActiveTab('unlocked')} />
        </View>

        {showAddPanel ? (
          <View style={styles.card}>
            <Text style={styles.label}>Add app</Text>
            <Text style={styles.helper}>Device app list requires Screen Time / FamilyControls integration. This prototype uses a curated list.</Text>
            <Pressable style={styles.dropdown} onPress={() => setShowPicker(prev => !prev)}>
              <Text style={styles.dropdownText}>{selectedApp?.name || 'Select an app'}</Text>
              <MaterialCommunityIcons name={showPicker ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
            </Pressable>
            {showPicker ? (
              <View style={styles.pickerList}>
                {availableApps.map(app => (
                  <Pressable
                    key={app.name}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedApp(app)
                      setShowPicker(false)
                    }}
                  >
                    <Text style={styles.pickerText}>{app.name}</Text>
                    <Text style={styles.pickerMeta}>{app.category}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <TextInput
              keyboardType="number-pad"
              placeholder="Steps required to unlock"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={newSteps}
              onChangeText={setNewSteps}
            />
            <PrimaryButton label="Add app" onPress={handleAddApp} />
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>Search apps</Text>
          <TextInput
            placeholder="Find an app"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {activeTab === 'all' ? (
          <View style={styles.card}>
            <Text style={styles.label}>Filters</Text>
            <View style={styles.groupRow}>
              {['all', 'social', 'video', 'games'].map(filter => (
                <PrimaryButton
                  key={filter}
                  label={filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  variant={activeGroup === filter ? 'primary' : 'ghost'}
                  onPress={() => setActiveGroup(filter)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>{activeTab === 'all' ? 'All apps' : activeTab === 'locked' ? 'Locked apps' : 'Unlocked apps'}</Text>
          <View style={styles.list}>
            {filteredApps.length === 0 ? (
              <Text style={styles.helper}>No apps yet. Add one with the plus button.</Text>
            ) : (
              filteredApps.map(app => {
                const unlocked = stepsToday >= app.unlockSteps
                const status = unlocked ? 'Unlocked' : 'Locked'
                const statusColor = unlocked ? colors.accent : colors.warning

                return (
                  <AppCard
                    key={app.id}
                    app={app}
                    status={status}
                    statusColor={statusColor}
                    menuOpen={menuOpenId === app.id}
                    editing={editingId === app.id}
                    onToggleMenu={() => setMenuOpenId(menuOpenId === app.id ? null : app.id)}
                    onEditRules={() => handleEditRules(app.id)}
                    onDelete={() => handleDelete(app.id)}
                    onSaveSteps={handleSaveSteps}
                    onCancelEdit={() => setEditingId(null)}
                  />
                )
              })
            )}
          </View>
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
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt
  },
  groupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  list: {
    gap: spacing.sm
  },
  helper: {
    fontSize: 12,
    color: colors.textSecondary
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceAlt
  },
  dropdownText: {
    color: colors.textPrimary,
    fontSize: 14
  },
  pickerList: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt
  },
  pickerItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  pickerText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  pickerMeta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary
  }
})

export default AppsScreen
