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

  // Tasks API
  async getTasks(params?: { teamId?: string; status?: string; assigneeId?: string; isPublic?: boolean; search?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.teamId) searchParams.append('teamId', params.teamId)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.assigneeId) searchParams.append('assigneeId', params.assigneeId)
    if (params?.isPublic) searchParams.append('isPublic', 'true')
    if (params?.search) searchParams.append('search', params.search)

    const queryString = searchParams.toString()
    return this.request(`/tasks${queryString ? `?${queryString}` : ''}`)
  }

  async getTask(id: string) {
    return this.request(`/tasks/${id}`)
  }

  async createTask(task: any) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    })
  }

  async updateTask(id: string, task: any) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    })
  }

  async pickupTask(id: string, memberId: string) {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'pickup', memberId }),
    })
  }

  async completeTask(id: string, memberId: string) {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'complete', memberId }),
    })
  }

  async deleteTask(id: string) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  // Gallery API
  async getGalleryImages(params?: { search?: string; eventId?: string; isPublic?: boolean; uploadedBy?: string; tags?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.eventId) searchParams.append('eventId', params.eventId)
    if (params?.isPublic) searchParams.append('isPublic', 'true')
    if (params?.uploadedBy) searchParams.append('uploadedBy', params.uploadedBy)
    if (params?.tags) searchParams.append('tags', params.tags)

    const queryString = searchParams.toString()
    return this.request(`/gallery${queryString ? `?${queryString}` : ''}`)
  }

  async getGalleryImage(id: string) {
    return this.request(`/gallery/${id}`)
  }

  async uploadGalleryImage(image: any) {
    return this.request('/gallery', {
      method: 'POST',
      body: JSON.stringify(image),
    })
  }

  async updateGalleryImage(id: string, image: any) {
    return this.request(`/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(image),
    })
  }

  async deleteGalleryImage(id: string) {
    return this.request(`/gallery/${id}`, {
      method: 'DELETE',
    })
  }

  // Gallery Folders API
  async getGalleryFolders(params?: { search?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)

    const queryString = searchParams.toString()
    return this.request(`/gallery/folders${queryString ? `?${queryString}` : ''}`)
  }

  async createGalleryFolder(folder: any) {
    return this.request('/gallery/folders', {
      method: 'POST',
      body: JSON.stringify(folder),
    })
  }

  async updateGalleryFolder(id: string, folder: any) {
    return this.request('/gallery/folders', {
      method: 'PUT',
      body: JSON.stringify({ id, ...folder }),
    })
  }

  async deleteGalleryFolder(id: string) {
    return this.request(`/gallery/folders?id=${id}`, {
      method: 'DELETE',
    })
  }

  // Comments API
  async getComments(params?: { targetType?: string; targetId?: string; authorId?: string; isApproved?: boolean }) {
    const searchParams = new URLSearchParams()
    if (params?.targetType) searchParams.append('targetType', params.targetType)
    if (params?.targetId) searchParams.append('targetId', params.targetId)
    if (params?.authorId) searchParams.append('authorId', params.authorId)
    if (params?.isApproved !== undefined) searchParams.append('isApproved', params.isApproved.toString())

    const queryString = searchParams.toString()
    return this.request(`/comments${queryString ? `?${queryString}` : ''}`)
  }

  async createComment(comment: any) {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify(comment),
    })
  }

  async updateComment(id: string, comment: any) {
    return this.request(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(comment),
    })
  }

  async deleteComment(id: string) {
    return this.request(`/comments/${id}`, {
      method: 'DELETE',
    })
  }

  // Communities API
  async getCommunities(params?: { search?: string; type?: string; leaderId?: string; isActive?: boolean }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.type) searchParams.append('type', params.type)
    if (params?.leaderId) searchParams.append('leaderId', params.leaderId)
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString())

    const queryString = searchParams.toString()
    return this.request(`/communities${queryString ? `?${queryString}` : ''}`)
  }

  async getCommunity(id: string) {
    return this.request(`/communities/${id}`)
  }

  async createCommunity(community: any) {
    return this.request('/communities', {
      method: 'POST',
      body: JSON.stringify(community),
    })
  }

  async updateCommunity(id: string, community: any) {
    return this.request(`/communities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(community),
    })
  }

  async deleteCommunity(id: string) {
    return this.request(`/communities/${id}`, {
      method: 'DELETE',
    })
  }

  // Giving API
  async getGivingRecords(params?: { memberId?: string; category?: string; method?: string; startDate?: string; endDate?: string; isRecurring?: boolean }) {
    const searchParams = new URLSearchParams()
    if (params?.memberId) searchParams.append('memberId', params.memberId)
    if (params?.category) searchParams.append('category', params.category)
    if (params?.method) searchParams.append('method', params.method)
    if (params?.startDate) searchParams.append('startDate', params.startDate)
    if (params?.endDate) searchParams.append('endDate', params.endDate)
    if (params?.isRecurring !== undefined) searchParams.append('isRecurring', params.isRecurring.toString())

    const queryString = searchParams.toString()
    return this.request(`/giving${queryString ? `?${queryString}` : ''}`)
  }

  async createGivingRecord(giving: any) {
    return this.request('/giving', {
      method: 'POST',
      body: JSON.stringify(giving),
    })
  }

  async updateGivingRecord(id: string, giving: any) {
    return this.request(`/giving/${id}`, {
      method: 'PUT',
      body: JSON.stringify(giving),
    })
  }

  async deleteGivingRecord(id: string) {
    return this.request(`/giving/${id}`, {
      method: 'DELETE',
    })
  }

  // Request Forms API
  async getRequestForms(params?: { type?: string; isActive?: boolean; createdBy?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.append('type', params.type)
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString())
    if (params?.createdBy) searchParams.append('createdBy', params.createdBy)

    const queryString = searchParams.toString()
    return this.request(`/request-forms${queryString ? `?${queryString}` : ''}`)
  }

  async createRequestForm(form: any) {
    return this.request('/request-forms', {
      method: 'POST',
      body: JSON.stringify(form),
    })
  }

  async getRequestForm(id: string) {
    return this.request(`/request-forms/${id}`)
  }

  async updateRequestForm(id: string, form: any) {
    return this.request(`/request-forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    })
  }

  async deleteRequestForm(id: string) {
    return this.request(`/request-forms/${id}`, {
      method: 'DELETE',
    })
  }

  // Request Submissions API
  async getRequestSubmissions(params?: { formId?: string; submitterId?: string; status?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.formId) searchParams.append('formId', params.formId)
    if (params?.submitterId) searchParams.append('submitterId', params.submitterId)
    if (params?.status) searchParams.append('status', params.status)

    const queryString = searchParams.toString()
    return this.request(`/request-submissions${queryString ? `?${queryString}` : ''}`)
  }

  async submitRequest(submission: any) {
    return this.request('/request-submissions', {
      method: 'POST',
      body: JSON.stringify(submission),
    })
  }

  async submitRequestForm(submission: any) {
    return this.request('/request-submissions', {
      method: 'POST',
      body: JSON.stringify(submission),
    })
  }

  // User Activities API
  async getUserActivities(params?: { userId?: string; activityType?: string; startDate?: string; endDate?: string; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.userId) searchParams.append('userId', params.userId)
    if (params?.activityType) searchParams.append('activityType', params.activityType)
    if (params?.startDate) searchParams.append('startDate', params.startDate)
    if (params?.endDate) searchParams.append('endDate', params.endDate)
    if (params?.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    return this.request(`/user-activities${queryString ? `?${queryString}` : ''}`)
  }

  async logUserActivity(activity: any) {
    return this.request('/user-activities', {
      method: 'POST',
      body: JSON.stringify(activity),
    })
  }

  // Member Journey API
  async getMemberJourney(memberId: string) {
    return this.request(`/members/${memberId}/journey`)
  }
}

export const apiClient = new ApiClient()
