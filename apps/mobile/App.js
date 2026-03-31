import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import HomeScreen from './src/screens/HomeScreen'
import AppsScreen from './src/screens/AppsScreen'
import GroupsScreen from './src/screens/GroupsScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import OnboardingScreen from './src/screens/OnboardingScreen'
import { AppContext } from './src/context/AppContext'
import { getUsers } from './src/services/api'
import { colors } from './src/theme'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const AppTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textSecondary
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Apps" component={AppsScreen} />
    <Tab.Screen name="Groups" component={GroupsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
)

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [hasOnboarded, setHasOnboarded] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const users = await getUsers()
      setUser(users[0])
      setReady(true)
    }
    loadUser()
  }, [])

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size={36} color={colors.accent} />
      </View>
    )
  }

  return (
    <AppContext.Provider value={{ user, setUser }}>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!hasOnboarded ? (
            <Stack.Screen name="Onboarding">
              {() => <OnboardingScreen onFinish={() => setHasOnboarded(true)} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Main" component={AppTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
  )
}
