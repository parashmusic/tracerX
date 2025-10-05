import Constants from "expo-constants";
import { authService } from "./authService"

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL 

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

class ApiService {
  private async getAuthHeaders() {
    const token = await authService.getAuthToken()
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = await this.getAuthHeaders()

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Network error" }))
      throw new ApiError(response.status, errorData.message || "Request failed")
    }

    // Handle empty-body
    const text = await response.text()
    const data = text ? JSON.parse(text) : null
    if (data?.success) return data.data
    return data
  }

  // Projects
  async getProjects(params?: { status?: string; search?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.status && params.status !== "all") {
      const statusMap: { [key: string]: string } = {
        active: "in_progress",
        completed: "completed",
        "on-hold": "on_hold",
        archived: "archived",
      }
      searchParams.append("status", statusMap[params.status] || params.status)
    }
    if (params?.search) searchParams.append("search", params.search)
    const query = searchParams.toString()
    return this.request<any>(`/projects${query ? `?${query}` : ""}`)
  }
  async getProject(id: string) {
    return this.request<any>(`/projects/${id}`)
  }
  async createProject(data: any) {
    return this.request<any>("/projects", { method: "POST", body: JSON.stringify(data) })
  }
  async updateProject(id: string, data: any) {
    return this.request<any>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }
  async deleteProject(id: string) {
    return this.request<any>(`/projects/${id}`, { method: "DELETE" })
  }
  // in ApiService class
async addProjectNote(projectId: string, data: { content: string; isImportant?: boolean }) {
  return this.request<any>(`/projects/${projectId}/notes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}


  // Tasks
  async getTasks(params?: { status?: string; project?: string; search?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append("status", params.status)
    if (params?.project) searchParams.append("project", params.project)
    if (params?.search) searchParams.append("search", params.search)
    const query = searchParams.toString()
    return this.request<any>(`/tasks${query ? `?${query}` : ""}`)
  }
  async createTask(data: any) {
    return this.request<any>("/tasks", { method: "POST", body: JSON.stringify(data) })
  }
  async updateTask(id: string, data: any) {
    return this.request<any>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }
  async deleteTask(id: string) {
    return this.request<any>(`/tasks/${id}`, { method: "DELETE" })
  }
  async addTaskComment(taskId: string, comment: any) {
    return this.request<any>(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify(comment),
    })
  }

  // Finance
  /** Fetch all transactions, optionally filtering by project, type, status, or search */
  async getTransactions(params?: {
    project?: string
    type?: string
    status?: string
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.project) searchParams.append("project", params.project)
    if (params?.type)    searchParams.append("type", params.type)
    if (params?.status)  searchParams.append("status", params.status)
    if (params?.search)  searchParams.append("search", params.search)
    const query = searchParams.toString()
    return this.request<any>(`/finance${query ? `?${query}` : ""}`)
  }

  /** Create a new transaction (invoice or payment) */
  async createTransaction(data: any) {
    return this.request<any>("/finance", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /** Update only the status of a transaction */
  async updateTransactionStatus(id: string, status: string) {
    return this.request<any>(`/finance/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  }

  /**
   * Get the finance summary.
   * If you pass a projectId, the server will return only that project's summary.
   */
  async getFinanceSummary(projectId?: string) {
    const query = projectId ? `?project=${projectId}` : ""
    return this.request<any>(`/finance/summary${query}`)
  }



  
  

  
  // Dashboard
  async getDashboardStats() {
    return this.request<any>("/dashboard/stats")
  }
  async getDashboardActivities() {
    return this.request<any>("/dashboard/activities")
  }
  async getDashboardDeadlines() {
    return this.request<any>("/dashboard/deadlines")
  }
  async getDashboardFinanceOverview() {
    return this.request<any>("/dashboard/finance-overview")
  }

  // Users
  async getUsers() {
    return this.request<any>("/users")
  }
  async getUser(id: string) {
    return this.request<any>(`/users/${id}`)
  }
  async updateUser(id: string, data: any) {
    return this.request<any>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }
  async deactivateUser(id: string) {
    return this.request<any>(`/users/${id}`, { method: "DELETE" })
  }
  async getUserStatsOverview() {
    return this.request<any>("/users/stats/overview")
  }
  async searchCollaborators(query: string) {
    return this.request<any>(`/users/search/collaborators?search=${encodeURIComponent(query)}`)
  }
  async updateAvatar(userId: string, formData: FormData) {
    const token = await authService.getAuthToken()
    if (!token) throw new ApiError(401, "Not authenticated")
    const response = await fetch(`${API_BASE_URL}/users/${userId}/avatar`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Network error" }))
      throw new ApiError(response.status, err.message)
    }
    const data = await response.json()
    return data.data
  }

  // Activities
  async getActivities() {
    return this.request<any>("/activities")
  }
  async getActivity(id: string) {
    return this.request<any>(`/activities/${id}`)
  }
  async markActivityRead(id: string) {
    return this.request<any>(`/activities/${id}/read`, { method: "PATCH" })
  }
  async markAllActivitiesRead() {
    return this.request<any>("/activities/read/all", { method: "PATCH" })
  }
  async deleteActivity(id: string) {
    return this.request<any>(`/activities/${id}`, { method: "DELETE" })
  }
}

export const apiService = new ApiService()
export { ApiError }
