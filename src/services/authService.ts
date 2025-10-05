import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants";
const AUTH_API_BASE = Constants.expoConfig?.extra?.AUTH_API_BASE 

interface AuthUser { _id: string; name: string; email: string; role?: string }
interface LoginResponse { success: boolean; data: { token: string; user: AuthUser } }
interface RegisterResponse { success: boolean; data: { token: string; user: AuthUser } }
interface ProfileResponse { success: boolean; data: AuthUser }

class AuthService {
  private readonly TOKEN_KEY = "auth_token"
  private readonly USER_KEY = "user_data"

  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const res = await fetch(`${AUTH_API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data: LoginResponse = await res.json()
    if (!res.ok || !data.success) throw new Error(data.data?.message || "Login failed")
    return { token: data.data.token, user: data.data.user }
  }

  async register(name: string, email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const res = await fetch(`${AUTH_API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
    const data: RegisterResponse = await res.json()
    if (!res.ok || !data.success) throw new Error(data.data?.message || "Registration failed")
    return { token: data.data.token, user: data.data.user }
  }

  async getCurrentUser(): Promise<AuthUser> {
    const token = await this.getAuthToken()
    if (!token) throw new Error("Not authenticated")
    const res = await fetch(`${AUTH_API_BASE}/me`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    })
    const data: ProfileResponse = await res.json()
    if (!res.ok || !data.success) throw new Error(data.data?.message || "Failed fetching profile")
    return data.data
  }

  async updateProfile(payload: Partial<AuthUser>): Promise<AuthUser> {
    const token = await this.getAuthToken()
    if (!token) throw new Error("Not authenticated")
    const res = await fetch(`${AUTH_API_BASE}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const data: ProfileResponse = await res.json()
    if (!res.ok || !data.success) throw new Error(data.data?.message || "Failed updating profile")
    return data.data
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = await this.getAuthToken()
    if (!token) throw new Error("Not authenticated")
    const res = await fetch(`${AUTH_API_BASE}/change-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.data?.message || "Failed changing password")
  }

  async storeUserData(token: string, user: AuthUser): Promise<void> {
    await AsyncStorage.multiSet([[this.TOKEN_KEY, token], [this.USER_KEY, JSON.stringify(user)]])
  }

  async getStoredUserData(): Promise<{ token: string | null; user: AuthUser | null }> {
    const [[, token], [, userJson]] = await AsyncStorage.multiGet([this.TOKEN_KEY, this.USER_KEY])
    return { token, user: userJson ? JSON.parse(userJson) : null }
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([this.TOKEN_KEY, this.USER_KEY])
  }

  async getAuthToken(): Promise<string | null> {
    return AsyncStorage.getItem(this.TOKEN_KEY)
  }

  async isAuthenticated(): Promise<boolean> {
    const { token, user } = await this.getStoredUserData()
    return !!(token && user)
  }
}

export const authService = new AuthService()
