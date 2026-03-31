import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import AppRow from '../components/AppRow'
import PrimaryButton from '../components/PrimaryButton'
import ScreenHeader from '../components/ScreenHeader'
import { useApp } from '../context/AppContext'
import { getAppGroups, getApps } from '../services/api'
import { colors, radius, spacing } from '../theme'

const AppsScreen = () => {
  const { user } = useApp()
  const [apps, setApps] = useState([])
  const [groups, setGroups] = useState([])
  const [query, setQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState('all')

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const [appsData, groupData] = await Promise.all([
        getApps(user.id),
        getAppGroups(user.id)
      ])
      setApps(appsData)
      setGroups(groupData)
    }
    load()
  }, [user])

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesQuery = app.name.toLowerCase().includes(query.toLowerCase())
      const matchesGroup = activeGroup === 'all' || app.groupId === activeGroup
      return matchesQuery && matchesGroup
    })
  }, [apps, query, activeGroup])

  return (
    <View style={styles.container}>
      <ScreenHeader title="App Control" subtitle="Choose which apps unlock with movement" />
      <ScrollView contentContainerStyle={styles.scroll}>
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

        <View style={styles.card}>
          <Text style={styles.label}>App groups</Text>
          <View style={styles.groupRow}>
            <PrimaryButton label="All" variant={activeGroup === 'all' ? 'primary' : 'ghost'} onPress={() => setActiveGroup('all')} />
            {groups.map(group => (
              <PrimaryButton
                key={group.id}
                label={group.name}
                variant={activeGroup === group.id ? 'primary' : 'ghost'}
                onPress={() => setActiveGroup(group.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Locked apps</Text>
          <View style={styles.list}>
            {filteredApps.map(app => (
              <AppRow
                key={app.id}
                name={app.name}
                group={groups.find(group => group.id === app.groupId)?.name}
                unlockMode={app.unlockMode}
                unlockCostMinutes={app.unlockCostMinutes}
                enabled={app.enabled}
                onToggle={() => {}}
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Unlock modes</Text>
          <Text style={styles.helper}>Incremental unlock gives timed access per step block. Full unlock requires hitting your daily goal.</Text>
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
  }
})

export default AppsScreen
