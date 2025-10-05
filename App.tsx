"use client"

import { useEffect, useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { View, Text, Alert } from "react-native"
import Icon from "react-native-vector-icons/Feather"

// Screens
import LoginScreen from "./src/screens/LoginScreen"
import DashboardScreen from "./src/screens/DashboardScreen"
import ProjectsScreen from "./src/screens/ProjectsScreen"
import ProjectDetailScreen from "./src/screens/ProjectDetailScreen"
import TasksScreen from "./src/screens/TasksScreen"
import FinanceScreen from "./src/screens/FinanceScreen"
import ProjectFormScreen from "./src/screens/ProjectScreenForm"
import TaskFormScreen from "./src/screens/TaskFormScreen"

// Services
import { authService } from "./src/services/authService"
import ChatbotOverlay from "./src/components/ChatBotOverlay"
// Theme
import { colors } from "./src/theme/colors"

const Tab = createBottomTabNavigator()

// Separate stack instances for Projects and Tasks
const ProjectsStackNav = createStackNavigator()
const TasksStackNav = createStackNavigator()

function ProjectsStack() {
  return (
    <ProjectsStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <ProjectsStackNav.Screen
        name="ProjectsList"
        component={ProjectsScreen}
        options={{ title: "Projects" }}
      />
      <ProjectsStackNav.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{ title: "Project Details" }}
      />
      <ProjectsStackNav.Screen
        name="ProjectForm"
        component={ProjectFormScreen}
        options={{ title: "New Project" }}
      />
      <ProjectsStackNav.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={{ title: "New Task" }}
      />
    </ProjectsStackNav.Navigator>
  )
}

function TasksStack() {
  return (
    <TasksStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <TasksStackNav.Screen
        name="TasksList"
        component={TasksScreen}
        options={{ title: "Tasks" }}
      />
      <TasksStackNav.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={{ title: "New Task" }}
      />
    </TasksStackNav.Navigator>
  )
}

function MainTabs({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = ""
          if (route.name === "Dashboard") iconName = "home"
          else if (route.name === "Projects") iconName = "folder"
          else if (route.name === "Tasks") iconName = "check-square"
          else if (route.name === "Finance") iconName = "dollar-sign"
          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontWeight: "600" },
        headerRight: () => (
          <Icon
            name="log-out"
            size={20}
            color={colors.foreground}
            style={{ marginRight: 16 }}
            onPress={onLogout}
          />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="Projects"
        component={ProjectsStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Finance" component={FinanceScreen} />
    </Tab.Navigator>
  )
}

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <Icon name="loader" size={32} color={colors.primary} />
      <Text style={{ color: colors.foreground, marginTop: 16, fontSize: 16 }}>
        Loading...
      </Text>
    </View>
  )
}

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const { token, user: storedUser } = await authService.getStoredUserData()
        if (token && storedUser) {
          setUser(storedUser)
        }
      } catch (e: any) {
        console.error("Failed to check auth status:", e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authService.logout()
          setUser(null)
        },
      },
    ])
  }

  if (loading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoadingScreen />
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        {user ? (
           <>
            <MainTabs user={user} onLogout={handleLogout} />
            {/* only show the chatbot once the user is logged in */}
            <ChatbotOverlay />
          </>
        ) : (
          <ProjectsStackNav.Navigator screenOptions={{ headerShown: false }}>
            <ProjectsStackNav.Screen name="Login">
              {props => <LoginScreen {...props} onLoginSuccess={setUser} />}
            </ProjectsStackNav.Screen>
          </ProjectsStackNav.Navigator>
        )}
      </NavigationContainer>
        
    </SafeAreaProvider>
  )
}
