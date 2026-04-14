import 'expo-dev-client'
import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import HomeScreen from './src/screens/HomeScreen'
import AppsScreen from './src/screens/AppsScreen'
import GroupsScreen from './src/screens/GroupsScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import OnboardingScreen from './src/screens/OnboardingScreen'
import AuthScreen from './src/screens/AuthScreen'
import ResetPasswordScreen from './src/screens/ResetPasswordScreen'
import { AppContext } from './src/context/AppContext'
import { ensureUserRecord } from './src/services/api'
import { supabase } from './src/services/supabase'
import { colors } from './src/theme'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()
const AuthStack = createNativeStackNavigator()

const tabIcons = {
  Home: 'home-variant',
  Apps: 'view-grid',
  Leaderboard: 'trophy-variant-outline',
  Profile: 'account-circle'
}

const AppTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        height: 76,
        paddingTop: 8,
        paddingBottom: 16
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600'
      }
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.iconBubble, focused && styles.iconBubbleActive]}>
            <MaterialCommunityIcons name={tabIcons.Home} size={22} color={color} />
          </View>
        )
      }}
    />
    <Tab.Screen
      name="Apps"
      component={AppsScreen}
      options={{
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.iconBubble, focused && styles.iconBubbleActive]}>
            <MaterialCommunityIcons name={tabIcons.Apps} size={22} color={color} />
          </View>
        )
      }}
    />
    <Tab.Screen
      name="Leaderboard"
      component={GroupsScreen}
      options={{
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.iconBubble, focused && styles.iconBubbleActive]}>
            <MaterialCommunityIcons name={tabIcons.Leaderboard} size={22} color={color} />
          </View>
        )
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.iconBubble, focused && styles.iconBubbleActive]}>
            <MaterialCommunityIcons name={tabIcons.Profile} size={22} color={color} />
          </View>
        )
      }}
    />
  </Tab.Navigator>
)

export default function App() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [hasOnboarded, setHasOnboarded] = useState(false)

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setReady(true)
    }
    initSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleUrl = async (url) => {
      if (!url) return
      try {
        const { queryParams } = Linking.parse(url)
        const hash = url.split('#')[1] || ''
        const hashParams = Object.fromEntries(new URLSearchParams(hash))
        const code = queryParams?.code
        const accessToken = hashParams.access_token || queryParams?.access_token
        const refreshToken = hashParams.refresh_token || queryParams?.refresh_token

        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
          return
        }

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
        }
      } catch (error) {
        console.warn('Auth deep link error', error)
      }
    }

    const loadInitialUrl = async () => {
      const url = await Linking.getInitialURL()
      if (url) await handleUrl(url)
    }

    loadInitialUrl()

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url)
    })

    return () => subscription.remove()
  }, [])

  useEffect(() => {
    const loadUser = async () => {
      if (!session?.user) {
        setUser(null)
        return
      }
      const displayName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email ||
        'Member'
      const apiUser = await ensureUserRecord(session.user.id, displayName)
      setUser(apiUser)
    }
    loadUser()
  }, [session])

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size={36} color={colors.accent} />
      </View>
    )
  }

  if (!session) {
    return (
      <NavigationContainer>
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="AuthHome" component={AuthScreen} />
          <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </AuthStack.Navigator>
      </NavigationContainer>
    )
  }

  if (!user) {
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

const styles = StyleSheet.create({
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconBubbleActive: {
    backgroundColor: 'rgba(108, 246, 178, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(108, 246, 178, 0.45)'
  }
})
