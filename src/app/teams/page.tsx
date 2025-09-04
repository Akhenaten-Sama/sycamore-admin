'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Crown,
  Calendar,
  Info,
  AlertCircle
} from 'lucide-react'
import { Team, Member } from '@/types'
import { formatDateConsistent, parseApiTeam, parseApiMember } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Teams Management' }
]

export default function TeamsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Only admins and super admins can access teams management
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      router.push('/dashboard')
      return
    }

    loadTeams()
  }, [user, router])
  const [members, setMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  const [memberActionId, setMemberActionId] = useState<string | null>(null) // Track which member is being added/removed
  const [memberSearch, setMemberSearch] = useState('') // For searching available members
  const [tooltipContent, setTooltipContent] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamLeadId: ''
  })

  useEffect(() => {
    loadTeams()
    loadMembers()
  }, [])

  const loadTeams = async () => {
    try {
      const response = await apiClient.getTeams()
      if (response.success && response.data) {
        const teamsWithParsedData = (response.data as any[]).map(parseApiTeam)
        setTeams(teamsWithParsedData)
      }
    } catch (error) {
      console.error('Failed to load teams:', error)
    }
  }

  const loadMembers = async () => {
    try {
      const response = await apiClient.getMembers()
      if (response.success && response.data) {
        const membersWithParsedData = (response.data as any[]).map(parseApiMember)
        setMembers(membersWithParsedData)
      }
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        alert('Team name is required')
        setLoading(false)
        return
      }
      
      if (!formData.description.trim()) {
        alert('Team description is required')
        setLoading(false)
        return
      }
      
      if (!formData.teamLeadId) {
        alert('Please select a team leader')
        setLoading(false)
        return
      }

      const teamData = {
        ...formData
      }

      let response
      if (isEditing && selectedTeam) {
        response = await apiClient.updateTeam(selectedTeam.id, teamData)
      } else {
        response = await apiClient.createTeam(teamData)
      }
      
      if (response.success) {
        await loadTeams()
        setIsModalOpen(false)
        resetForm()
      } else {
        alert('Failed to save team: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to save team:', error)
      alert('Failed to save team')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      teamLeadId: ''
    })
    setSelectedTeam(null)
    setIsEditing(false)
  }

  const handleAddTeam = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team)
    setFormData({
      name: team.name,
      description: team.description,
      teamLeadId: team.teamLeadId || ''
    })
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm('Are you sure you want to delete this team?')) {
      try {
        const response = await apiClient.deleteTeam(teamId)
        if (response.success) {
          await loadTeams()
        } else {
          alert('Failed to delete team: ' + (response.error || 'Unknown error'))
        }
      } catch (error) {
        console.error('Failed to delete team:', error)
        alert('Failed to delete team')
      }
    }
  }

interface TeamLead {
    firstName: string
    lastName: string
}

const getTeamLeaderName = (teamLead: TeamLead | string) => {
    if (typeof teamLead === 'string' || !teamLead) return 'Not assigned'
    return `${teamLead.firstName} ${teamLead.lastName}`
}

  const handleManageMembers = (team: Team) => {
    setSelectedTeam(team)
    setIsMembersModalOpen(true)
  }

  const getAvailableMembers = () => {
    if (!selectedTeam) return []
    const teamMembers = selectedTeam.members || []
    let available = members.filter(member => !teamMembers.includes(member.id))
    if (memberSearch.trim()) {
      const search = memberSearch.trim().toLowerCase()
      available = available.filter(
        m =>
          m.firstName.toLowerCase().includes(search) ||
          m.lastName.toLowerCase().includes(search) ||
          (m.email && m.email.toLowerCase().includes(search))
      )
    }
    return available
  }

  const getTeamMembers = () => {
    if (!selectedTeam) return []
    // team.members is an array of member IDs, so we need to find the actual member objects
    return (selectedTeam.members || [])
      .map(memberId => members.find(m => m.id === memberId))
      .filter(Boolean)
  }

  const handleAddMemberToTeam = async (memberId: string) => {
    if (!selectedTeam) return
    setMembersLoading(true)
    setMemberActionId(memberId)
    try {
      const response = await apiClient.addMemberToTeam(selectedTeam.id, memberId)
      if (response.success) {
        await loadTeams()
        // Update selected team with latest data
        const teamsRes = await apiClient.getTeams()
        const teamsData = Array.isArray(teamsRes.data) ? teamsRes.data : []
        const updatedTeam = teamsData.find((t: any) => t._id === selectedTeam.id || t.id === selectedTeam.id)
        if (updatedTeam) {
          setSelectedTeam(parseApiTeam(updatedTeam))
        }
      } else {
        alert('Failed to add member to team: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to add member to team:', error)
      alert('Failed to add member to team')
    } finally {
      setMembersLoading(false)
      setMemberActionId(null)
    }
  }

  const handleRemoveMemberFromTeam = async (memberId: string) => {
    if (!selectedTeam) return
    if (confirm('Are you sure you want to remove this member from the team?')) {
      setMembersLoading(true)
      setMemberActionId(memberId)
      try {
        const response = await apiClient.removeMemberFromTeam(selectedTeam.id, memberId)
        if (response.success) {
          await loadTeams()
          // Update selected team with latest data
          const teamsRes = await apiClient.getTeams()
          const teamsData = Array.isArray(teamsRes.data) ? teamsRes.data : []
          const updatedTeam = teamsData.find((t: any) => t._id === selectedTeam.id || t.id === selectedTeam.id)
          if (updatedTeam) {
            setSelectedTeam(parseApiTeam(updatedTeam))
          }
        } else {
          alert('Failed to remove member from team: ' + (response.error || 'Unknown error'))
        }
      } catch (error) {
        console.error('Failed to remove member from team:', error)
        alert('Failed to remove member from team')
      } finally {
        setMembersLoading(false)
        setMemberActionId(null)
      }
    }
  }

  // Tooltip handlers
  const handleMouseEnter = (e: React.MouseEvent, description: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipContent(description)
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
  }

  const handleMouseLeave = () => {
    setTooltipContent(null)
  }

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!teams.length) {
      alert('No teams to export.')
      return
    }
    
    // Debug: log the teams and members data
    console.log('Teams data:', teams)
    console.log('Members data:', members)
    console.log('Sample team members:', teams[0]?.members)
    
    // Prepare CSV header
    const header = [
      'Team Name',
      'Team Leader',
      'Members'
    ]
    
    // Prepare CSV rows
    const rows = teams.map(team => {
      // Find team lead name
      const teamLead = members.find(m => m.id === team.teamLeadId)
      const teamLeadName = teamLead ? `${teamLead.firstName} ${teamLead.lastName}` : 'Not assigned'
      
      // Debug: log team member processing
      console.log(`Processing team "${team.name}":`, {
        teamMembers: team.members,
        membersLength: team.members?.length,
        availableMembers: members.map(m => m.id)
      })
      
      // Handle member names - check if team.members contains populated objects or just IDs
      const memberNames = (team.members || [])
        .map((member: any) => {
          // If member is already a populated object with firstName and lastName
          if (typeof member === 'object' && member !== null && member.firstName && member.lastName) {
            console.log(`Found populated member:`, `${member.firstName} ${member.lastName}`)
            return `${member.firstName} ${member.lastName}`
          }
          // If member is just an ID, find it in the members array
          else if (typeof member === 'string') {
            const foundMember = members.find(m => m.id === member)
            console.log(`Looking for member ID "${member}":`, foundMember ? `Found: ${foundMember.firstName} ${foundMember.lastName}` : 'Not found')
            return foundMember ? `${foundMember.firstName} ${foundMember.lastName}` : ''
          }
          return ''
        })
        .filter(Boolean)
        .join('; ')
      
      return [
        team.name,
        teamLeadName,
        memberNames
      ]
    })
    
    // Convert to CSV string
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n')
    
    // Download as file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `teams_export_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 0)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={breadcrumbItems} />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teams Management</h1>
              <p className="text-gray-600">Organize church members into teams and assign leadership.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="outline">
                Export CSV
              </Button>
              <Button onClick={handleAddTeam}>
                <Plus className="h-4 w-4 mr-2" />
                New Team
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Teams</p>
                  <p className="text-2xl font-semibold text-gray-900">{teams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Crown className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Team Leaders</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {teams.filter(t => t.teamLeadId).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Teams</p>
                  <p className="text-2xl font-semibold text-gray-900">{teams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleExportCSV} variant="outline">
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teams Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Teams ({filteredTeams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Team Name</TableHead>
                  <TableHead className="w-96">Description</TableHead>
                  <TableHead className="w-40">Team Leader</TableHead>
                  <TableHead className="w-32">Members</TableHead>
                  <TableHead className="w-32">Created</TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{team.name}</div>
                    </TableCell>
                    <TableCell className="relative">
                        <div
                          className="text-sm text-gray-900 break-words whitespace-pre-line cursor-help relative group"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            maxWidth: '350px'
                          }}
                          onMouseEnter={(e) => handleMouseEnter(e, team.description)}
                          onMouseLeave={handleMouseLeave}
                        >
                          {team.description}
                          <Info className="h-3 w-3 inline-block ml-1 text-gray-400 opacity-50" />
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-gray-900">
                          {getTeamLeaderName(team.teamLeadId || '')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {team.members?.length || 0} members
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {formatDateConsistent(team.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTeam(team)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTeam(team.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageMembers(team)}
                        >
                          Manage Members
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Custom Tooltip */}
        {tooltipContent && (
          <div
            className="fixed z-50 max-w-md p-4 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg shadow-xl pointer-events-none animate-in fade-in duration-200"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            <div className="whitespace-pre-line break-words leading-relaxed">
              {tooltipContent}
            </div>
            {/* Arrow */}
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white"
            />
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-[-1px] w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-transparent border-t-gray-200"
            />
          </div>
        )}

        {/* Add/Edit Team Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                {isEditing ? 'Edit Team' : 'Create New Team'}
              </h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter team name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the team's purpose and activities..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Lead
                  </label>
                  <select
                    className="w-full rounded-md border bg-white text-gray-900 border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.teamLeadId}
                    onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                    required
                  >
                    <option value="">Select Team Lead</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (isEditing ? 'Update Team' : 'Create Team')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manage Members Modal */}
        {isMembersModalOpen && selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Manage Members for {selectedTeam.name}
              </h2>
              <div className="space-y-4">
                {/* Team Members List */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Team Members</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    {getTeamMembers().length === 0 ? (
                      <p className="text-gray-500 text-sm">No members assigned to this team.</p>
                    ) : getTeamMembers().map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {member.firstName} {member.lastName}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMemberFromTeam(member.id)}
                          disabled={membersLoading && memberActionId === member.id}
                        >
                          {membersLoading && memberActionId === member.id ? 'Removing...' : 'Remove'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Members List */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Available Members</h3>
                  <div className="mb-2">
                    <Input
                      placeholder="Search members by name or email..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-md p-4">
                    {getAvailableMembers().length === 0 ? (
                      <p className="text-gray-500 text-sm">No available members found.</p>
                    ) : getAvailableMembers().map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {member.firstName} {member.lastName}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddMemberToTeam(member.id)}
                          disabled={membersLoading && memberActionId === member.id}
                        >
                          {membersLoading && memberActionId === member.id ? 'Adding...' : 'Add to Team'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMembersModalOpen(false)}
                  disabled={membersLoading}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}