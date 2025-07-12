export class ApiClient {
  private baseUrl = '/api'

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      // Check if response has content
      const contentType = response.headers.get('content-type')
      const hasJson = contentType && contentType.includes('application/json')
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          if (hasJson) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || errorMessage
          }
        } catch {
          // If JSON parsing fails, use the default error message
        }
        return { success: false, error: errorMessage }
      }

      // Try to parse JSON if content type indicates JSON
      if (hasJson) {
        const data = await response.json()
        return data
      } else {
        // For non-JSON responses, return success with no data
        return { success: true }
      }
    } catch (error) {
      console.error('API Error:', error)
      return { success: false, error: 'Network error occurred' }
    }
  }

  // Members API
  async getMembers(params?: { search?: string; teamId?: string; isFirstTimer?: boolean }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.teamId) searchParams.append('teamId', params.teamId)
    if (params?.isFirstTimer) searchParams.append('isFirstTimer', 'true')

    const queryString = searchParams.toString()
    return this.request(`/members${queryString ? `?${queryString}` : ''}`)
  }

  async getMember(id: string) {
    return this.request(`/members/${id}`)
  }

  async createMember(member: any) {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify(member),
    })
  }

  async updateMember(id: string, member: any) {
    return this.request(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    })
  }

  async deleteMember(id: string) {
    return this.request(`/members/${id}`, {
      method: 'DELETE',
    })
  }

  // Events API
  async getEvents(params?: { search?: string; upcoming?: boolean }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.upcoming) searchParams.append('upcoming', 'true')

    const queryString = searchParams.toString()
    return this.request(`/events${queryString ? `?${queryString}` : ''}`)
  }

  async getEvent(id: string) {
    return this.request(`/events/${id}`)
  }

  async createEvent(event: any) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    })
  }

  async updateEvent(id: string, event: any) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    })
  }

  async deleteEvent(id: string) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    })
  }

  // Blog API
  async getBlogPosts(params?: { search?: string; isDraft?: boolean }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.isDraft !== undefined) searchParams.append('isDraft', params.isDraft.toString())

    const queryString = searchParams.toString()
    return this.request(`/blog${queryString ? `?${queryString}` : ''}`)
  }

  async getBlogPost(id: string) {
    return this.request(`/blog/${id}`)
  }

  async createBlogPost(post: any) {
    return this.request('/blog', {
      method: 'POST',
      body: JSON.stringify(post),
    })
  }

  async updateBlogPost(id: string, post: any) {
    return this.request(`/blog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(post),
    })
  }

  async deleteBlogPost(id: string) {
    return this.request(`/blog/${id}`, {
      method: 'DELETE',
    })
  }

  // Teams API
  async getTeams() {
    return this.request('/teams')
  }

  async getTeam(id: string) {
    return this.request(`/teams/${id}`)
  }

  async createTeam(team: any) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(team),
    })
  }

  async updateTeam(id: string, team: any) {
    return this.request(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(team),
    })
  }

  async deleteTeam(id: string) {
    return this.request(`/teams/${id}`, {
      method: 'DELETE',
    })
  }

  // Team Members API
  async addMemberToTeam(teamId: string, memberId: string) {
    return this.request(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ memberId }),
    })
  }

  async removeMemberFromTeam(teamId: string, memberId: string) {
    return this.request(`/teams/${teamId}/members?memberId=${memberId}`, {
      method: 'DELETE',
    })
  }

  // Anniversaries API
  async getAnniversaries(params?: { search?: string; type?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.type) searchParams.append('type', params.type)

    const queryString = searchParams.toString()
    return this.request(`/anniversaries${queryString ? `?${queryString}` : ''}`)
  }

  async createAnniversary(anniversary: any) {
    return this.request('/anniversaries', {
      method: 'POST',
      body: JSON.stringify(anniversary),
    })
  }

  async updateAnniversary(id: string, anniversary: any) {
    return this.request(`/anniversaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(anniversary),
    })
  }

  async deleteAnniversary(id: string) {
    return this.request(`/anniversaries/${id}`, {
      method: 'DELETE',
    })
  }

  // Attendance API
  async getAttendanceRecords(params?: { eventId?: string; memberId?: string; date?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.eventId) searchParams.append('eventId', params.eventId)
    if (params?.memberId) searchParams.append('memberId', params.memberId)
    if (params?.date) searchParams.append('date', params.date)

    const queryString = searchParams.toString()
    return this.request(`/attendance${queryString ? `?${queryString}` : ''}`)
  }

  async markAttendance(attendance: any) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendance),
    })
  }

  async updateAttendance(id: string, attendance: any) {
    return this.request(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendance),
    })
  }
}

export const apiClient = new ApiClient()
