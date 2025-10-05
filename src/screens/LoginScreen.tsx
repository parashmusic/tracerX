"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,Image,
  ImageBackground 
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/Feather"
import { colors } from "../theme/colors"
import { authService } from "../services/authService"
const appLogo = require("../assets/images/ticon3.png");
const backgroundImage = { uri: "https://www.krea.ai/api/img?f=webp&i=https%3A%2F%2Ftest1-emgndhaqd0c9h2db.a01.azurefd.net%2Fimages%2F1a5e4606-2928-4eed-b765-dc8be4619ca0.png" };

interface LoginScreenProps {
  navigation: any
  onLoginSuccess: (user: any) => void
}

export default function LoginScreen({ navigation, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [name, setName] = useState("")

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      console.log("Starting login process...")
      const response = await authService.login(email.trim(), password)

      // Store user data and token (same as frontend)
      await authService.storeUserData(response.token, response.user)

      console.log("Login successful, calling success callback...")
      // Call success callback
      onLoginSuccess(response.user)

      Alert.alert("Success", "Login successful!")
    } catch (error: any) {
      console.error("Login error:", error)
      Alert.alert("Login Failed", error.message || "Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long")
      return
    }

    setLoading(true)
    try {
      console.log("Starting registration process...")
      const response = await authService.register(name.trim(), email.trim(), password)

      // Store user data and token (same as frontend)
      await authService.storeUserData(response.token, response.user)

      console.log("Registration successful, calling success callback...")
      // Call success callback
      onLoginSuccess(response.user)

      Alert.alert("Success", "Account created successfully!")
    } catch (error: any) {
      console.error("Registration error:", error)
      Alert.alert("Registration Failed", error.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (isRegisterMode) {
      handleRegister()
    } else {
      handleLogin()
    }
  }

  return (
     <ImageBackground 
      source={backgroundImage} 
      style={styles.backgroundImage}
      resizeMode="cover" // or "contain", "stretch", etc.
    >
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <View style={styles.content}>
          {/* Header */}
           <View style={styles.logoContainer}>
              <Image source={appLogo} style={styles.logo} />
              <Text style={styles.title}>TracerX</Text>
              <Text style={styles.subtitle}>
                {isRegisterMode ? "Create your account" : "Welcome back"}
              </Text>
            </View>

          {/* Form */}
          <View style={styles.form}>
            {isRegisterMode && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="user" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.mutedForeground}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Icon name="mail" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Icon name={showPassword ? "eye-off" : "eye"} size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading
                  ? isRegisterMode
                    ? "Creating Account..."
                    : "Signing In..."
                  : isRegisterMode
                    ? "Create Account"
                    : "Sign In"}
              </Text>
            </TouchableOpacity>

            {/* Toggle Mode */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setIsRegisterMode(!isRegisterMode)
                setName("")
                setEmail("")
                setPassword("")
              }}
              disabled={loading}
            >
              <Text style={styles.toggleButtonText}>
                {isRegisterMode ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
   formWithBackground: {
    backgroundColor: 'rgba(255,255,255,0.9)', // Make form slightly transparent
    borderRadius: 12,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 0,
  },
  container: {
    flex: 1,
    
    // backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedForeground,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: 'white',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#0f0f1250',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff70',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: 'white',
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primaryForeground,
  },
  toggleButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  toggleButtonText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: "center",
  },
})
