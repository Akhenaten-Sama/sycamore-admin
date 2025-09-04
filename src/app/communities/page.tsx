'use client'

import { useState, useEffect } from 'react'
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
  Settings,
  UserPlus,
  Heart,
  Church,
  Briefcase
} from 'lucide-react'
import { Community, CommunityPopulated, Member } from '@/types'
import { formatDateConsistent } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Communities' }
]

const communityTypeIcons = {
  'team': Users,
  'life-group': Heart,
  'ministry': Church,
  'custom': Briefcase
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityPopulated[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityPopulated | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'team' as Community['type'],
    leaderId: '',
    meetingSchedule: '',
    isActive: true
  })

  useEffect(() => {
    loadCommunities()
    loadMembers()
  }, [])

  const loadCommunities = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getCommunities({
        search: searchTerm,
        type: typeFilter || undefined
      })
      if (response.success && response.data) {
        setCommunities(Array.isArray(response.data) ? response.data as CommunityPopulated[] : [])
      }
    } catch (error) {
      console.error('Error loading communities:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      const response = await apiClient.getMembers()
      if (response.success && response.data) {
        console.log('Loaded members:', response.data)
        const membersArray = Array.isArray(response.data) ? response.data as Member[] : []
        if (membersArray.length > 0) {
          console.log('First member structure:', membersArray[0])
        }
        setMembers(membersArray)
      }
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  const handleCreateCommunity = () => {
    setSelectedCommunity(null)
    setIsEditing(false)
    setFormData({
      name: '',
      description: '',
      type: 'team',
      leaderId: '',
      meetingSchedule: '',
      isActive: true
    })
    setIsModalOpen(true)
  }

  const handleEditCommunity = (community: CommunityPopulated) => {
    setSelectedCommunity(community)
    setIsEditing(true)
    setFormData({
      name: community.name,
      description: community.description,
      type: community.type,
      leaderId: community.leaderId?.id || '',
      meetingSchedule: community.meetingSchedule || '',
      isActive: community.isActive
    })
    setIsModalOpen(true)
  }

  const handleSaveCommunity = async () => {
    try {
      console.log('Form data being submitted:', formData)
      console.log('Leader ID type:', typeof formData.leaderId)
      
      if (isEditing && selectedCommunity) {
        const response = await apiClient.updateCommunity(selectedCommunity.id, formData)
        if (response.success) {
          loadCommunities()
          setIsModalOpen(false)
        }
      } else {
        const response = await apiClient.createCommunity(formData)
        if (response.success) {
          loadCommunities()
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error('Error saving community:', error)
    }
  }

  const handleDeleteCommunity = async (communityId: string) => {
    if (confirm('Are you sure you want to delete this community?')) {
      try {
        const response = await apiClient.deleteCommunity(communityId)
        if (response.success) {
          loadCommunities()
        }
      } catch (error) {
        console.error('Error deleting community:', error)
      }
    }
  }

  const getCommunityTypeLabel = (type: string) => {
    switch (type) {
      case 'team': return 'Team'
      case 'life-group': return 'Life Group'
      case 'ministry': return 'Ministry'
      case 'custom': return 'Custom'
      default: return type
    }
  }

  const getCommunityTypeColor = (type: string) => {
    switch (type) {
      case 'team': return 'text-blue-600 bg-blue-50'
      case 'life-group': return 'text-pink-600 bg-pink-50'
      case 'ministry': return 'text-purple-600 bg-purple-50'
      case 'custom': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  useEffect(() => {
    loadCommunities()
  }, [searchTerm, typeFilter])

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
            <p className="text-gray-600 mt-1">Manage all church communities and groups</p>
          </div>
          <Button onClick={handleCreateCommunity} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Community
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['team', 'life-group', 'ministry', 'custom'].map((type) => {
            const count = communities.filter(c => c.type === type).length
            const Icon = communityTypeIcons[type as keyof typeof communityTypeIcons]
            return (
              <Card key={type}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{getCommunityTypeLabel(type)}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                    <Icon className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search communities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="team">Teams</option>
                <option value="life-group">Life Groups</option>
                <option value="ministry">Ministries</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Communities Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Communities ({communities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading communities...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Meeting Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communities.map((community) => {
                    const Icon = communityTypeIcons[community.type]
                    return (
                      <TableRow key={community.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{community.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {community.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCommunityTypeColor(community.type)}`}>
                            {getCommunityTypeLabel(community.type)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            {community.leaderId ? 
                              `${community.leaderId.firstName} ${community.leaderId.lastName}` :
                              'Unknown Leader'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            {community.members?.length || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          {community.meetingSchedule ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{community.meetingSchedule}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            community.isActive 
                              ? 'text-green-600 bg-green-50' 
                              : 'text-red-600 bg-red-50'
                          }`}>
                            {community.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatDateConsistent(new Date(community.createdAt))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCommunity(community)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCommunity(community.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {communities.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No communities found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Community Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Community' : 'Create New Community'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Community name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Community description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Community['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="team">Team</option>
                    <option value="life-group">Life Group</option>
                    <option value="ministry">Ministry</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leader *
                  </label>
                  <select
                    value={formData.leaderId}
                    onChange={(e) => setFormData(prev => ({ ...prev, leaderId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Leader</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Schedule
                  </label>
                  <Input
                    value={formData.meetingSchedule}
                    onChange={(e) => setFormData(prev => ({ ...prev, meetingSchedule: e.target.value }))}
                    placeholder="e.g., Every Sunday 2 PM"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Community is active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveCommunity}>
                  {isEditing ? 'Update' : 'Create'} Community
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
