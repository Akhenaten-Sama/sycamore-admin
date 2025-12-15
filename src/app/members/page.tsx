'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Modal, OnboardingTour } from '@/components/common'
import { membersTourSteps } from '@/components/common/tourSteps'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Crown, 
  Users, 
  Mail,
  Phone,
  Calendar,
  MapPin,
  Upload,
  Download
} from 'lucide-react'
import { Member, Team } from '@/types'
import { formatDateConsistent, parseApiMember, parseApiTeam } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Members' }
]

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    weddingAnniversary: '',
    maritalStatus: 'single' as 'single' | 'married' | 'divorced',
    emergencyContact: '',
    emergencyPhone: '',
    teamIds: [] as string[],
    isAdmin: false,
    isTeamLead: false,
    isFirstTimer: false,
    createUserAccount: false
  })

  useEffect(() => {
    loadMembers()
    loadTeams()
  }, [])

  const loadMembers = async () => {
    try {
      const response = await apiClient.getMembers()
      if (response.success && response.data) {
        // Parse dates from API response
        const membersWithDates = (response.data as any[]).map(parseApiMember)
        setMembers(membersWithDates)
      }
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const loadTeams = async () => {
    try {
      const response = await apiClient.getTeams()
      if (response.success && response.data) {
        const parsedTeams = Array.isArray(response.data) 
          ? response.data.map(parseApiTeam)
          : []
        setTeams(parsedTeams)
      }
    } catch (error) {
      console.error('Failed to load teams:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const memberData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        weddingAnniversary: formData.weddingAnniversary ? new Date(formData.weddingAnniversary) : undefined,
        emergencyContact: formData.emergencyContact ? {
          name: formData.emergencyContact,
          phone: formData.emergencyPhone || '',
          relationship: 'Emergency Contact'
        } : undefined,
        dateJoined: new Date()
      }

      if (isEditing && selectedMember) {
        const response = await apiClient.updateMember(selectedMember.id, memberData)
        if (response.success) {
          await loadMembers()
          setIsModalOpen(false)
          resetForm()
        }
      } else {
        const response = await apiClient.createMember(memberData)
        if (response.success) {
          await loadMembers()
          setIsModalOpen(false)
          resetForm()
        }
      }
    } catch (error) {
      console.error('Failed to save member:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      weddingAnniversary: '',
      maritalStatus: 'single',
      emergencyContact: '',
      emergencyPhone: '',
      teamIds: [],
      isAdmin: false,
      isTeamLead: false,
      isFirstTimer: false,
      createUserAccount: false
    })
    setSelectedMember(null)
    setIsEditing(false)
  }

  const filteredMembers = members.filter(member =>
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddMember = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleEditMember = (member: Member) => {
    setSelectedMember(member)
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone || '',
      address: member.address || '',
      dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString().split('T')[0] : '',
      weddingAnniversary: member.weddingAnniversary ? member.weddingAnniversary.toISOString().split('T')[0] : '',
      maritalStatus: member.maritalStatus,
      emergencyContact: typeof member.emergencyContact === 'object' ? member.emergencyContact.name : (member.emergencyContact || ''),
      emergencyPhone: typeof member.emergencyContact === 'object' ? member.emergencyContact.phone : '',
      teamIds: member.teamId ? [member.teamId] : [],
      isAdmin: member.isAdmin,
      isTeamLead: member.isTeamLead,
      isFirstTimer: member.isFirstTimer,
      createUserAccount: false // Don't auto-check when editing existing members
    })
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleDeleteMember = async (memberId: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      try {
        const response = await apiClient.deleteMember(memberId)
        if (response.success) {
          await loadMembers()
        }
      } catch (error) {
        console.error('Failed to delete member:', error)
      }
    }
  }

  const toggleTeamLead = (memberId: string) => {
    setMembers(members.map(m =>
      m.id === memberId ? { ...m, isTeamLead: !m.isTeamLead } : m
    ))
  }

  const toggleAdmin = (memberId: string) => {
    setMembers(members.map(m =>
      m.id === memberId ? { ...m, isAdmin: !m.isAdmin } : m
    ))
  }

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'No Team'
    const team = teams.find(t => t.id === teamId)
    return team?.name || 'Unknown Team'
  }

  const handleCSVImport = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    
    if (!file) return

    setLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/members/import', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`Import completed: ${result.data.successful} successful, ${result.data.failed} failed`)
        await loadMembers() // Reload members after import
      } else {
        alert(`Import failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to import CSV:', error)
      alert('Failed to import CSV file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={breadcrumbItems} />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Members</h1>
              <p className="text-gray-600">Manage church members and their roles.</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = '/sample-members.csv'
                  link.download = 'sample-members.csv'
                  link.click()
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.csv'
                  input.onchange = handleCSVImport
                  input.click()
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={handleAddMember} data-tour="add-member">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </div>

        {/* Onboarding Tour */}
        <OnboardingTour steps={membersTourSteps} storageKey="members-tour-completed" />

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative" data-tour="search">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2" data-tour="filters">
                <Button variant="outline" size="sm">
                  First Timers ({members.filter(m => m.isFirstTimer).length})
                </Button>
                <Button variant="outline" size="sm">
                  Team Leads ({members.filter(m => m.isTeamLead).length})
                </Button>
                <Button variant="outline" size="sm">
                  Admins ({members.filter(m => m.isAdmin).length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card data-tour="member-list">
          <CardHeader>
            <CardTitle>All Members ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            {member.firstName[0]}{member.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div 
                            className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                            onClick={() => router.push(`/members/${member.id}/journey`)}
                          >
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            {member.isAdmin && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <Crown className="h-3 w-3 mr-1" />
                                Admin
                              </span>
                            )}
                            {member.isTeamLead && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Users className="h-3 w-3 mr-1" />
                                Team Lead
                              </span>
                            )}
                            {member.isFirstTimer && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                First Timer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {member.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {member.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="capitalize">{member.maritalStatus}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">{getTeamName(member.teamId)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDateConsistent(member.dateJoined)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant={member.isTeamLead ? "primary" : "outline"}
                          size="sm"
                          onClick={() => toggleTeamLead(member.id)}
                        >
                          Team Lead
                        </Button>
                        <Button
                          variant={member.isAdmin ? "danger" : "outline"}
                          size="sm"
                          onClick={() => toggleAdmin(member.id)}
                        >
                          Admin
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMember(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Member Modal */}
        <Modal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title={isEditing ? 'Edit Member' : 'Add New Member'}
          size="lg"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" form="member-form" disabled={loading}>
                {loading ? 'Saving...' : (isEditing ? 'Update Member' : 'Add Member')}
              </Button>
            </>
          }
        >
          <form id="member-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marital Status
                    </label>
                    <select 
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as 'single' | 'married' | 'divorced' })}
                    >
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wedding Anniversary (if married)
                  </label>
                  <Input
                    type="date"
                    value={formData.weddingAnniversary}
                    onChange={(e) => setFormData({ ...formData, weddingAnniversary: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact Name
                  </label>
                  <Input
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Enter emergency contact name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact Phone
                  </label>
                  <Input
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="Enter emergency contact phone"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isFirstTimer}
                      onChange={(e) => setFormData({ ...formData, isFirstTimer: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">First Timer</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isTeamLead}
                      onChange={(e) => setFormData({ ...formData, isTeamLead: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Team Lead</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Admin</span>
                  </label>
                </div>
                <div className="border-t pt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.createUserAccount}
                      onChange={(e) => setFormData({ ...formData, createUserAccount: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Create User Account
                      <span className="block text-xs text-gray-500 mt-1">
                        Generate login credentials and send via email
                      </span>
                    </span>
                  </label>
                </div>
              </form>
            </Modal>
      </div>
    </DashboardLayout>
  )
}
