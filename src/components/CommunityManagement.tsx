import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/common'
import { UserPlus, UserMinus, Mail, Search } from 'lucide-react'
import { Member, CommunityPopulated } from '@/types'
import { apiClient } from '@/lib/api-client'

interface CommunityManagementProps {
  community: CommunityPopulated
  onClose: () => void
  onUpdate: () => void
}

export function CommunityManagement({ community, onClose, onUpdate }: CommunityManagementProps) {
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAllMembers()
  }, [])

  const loadAllMembers = async () => {
    try {
      const response = await apiClient.getMembers()
      if (response.success && response.data) {
        setAllMembers(Array.isArray(response.data) ? response.data as Member[] : [])
      }
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  const currentMemberIds = community.members.map(m => (m as any)._id || m.id)
  const availableMembers = allMembers.filter(member => 
    !currentMemberIds.includes(member.id) &&
    (member.firstName + ' ' + member.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddMember = async (memberId: string) => {
    setLoading(true)
    try {
      const updatedMembers = [...currentMemberIds, memberId]
      const response = await apiClient.updateCommunity((community as any)._id || community.id, {
        members: updatedMembers
      })
      if (response.success) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error adding member:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setLoading(true)
    try {
      const updatedMembers = currentMemberIds.filter(id => id !== memberId)
      const response = await apiClient.updateCommunity((community as any)._id || community.id, {
        members: updatedMembers
      })
      if (response.success) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error removing member:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async (memberId: string) => {
    setLoading(true)
    try {
      // TODO: Implement invite functionality
      console.log('Inviting member:', memberId)
      // This would send an invitation to the member
    } catch (error) {
      console.error('Error inviting member:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Manage Members - {community.name}
          </h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Current Members ({community.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {community.members.map((member) => (
                  <div key={(member as any)._id || member.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {member.email}
                      </div>
                    </div>
                    {/* Don't allow removing the community leader */}
                    {((member as any)._id || member.id) !== ((community.leaderId as any)._id || (community.leaderId as any).id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember((member as any)._id || member.id)}
                        disabled={loading}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {community.members.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No members yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {community.inviteOnly ? 'Invite Members' : 'Add Members'}
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {member.email}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {community.inviteOnly ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInviteMember(member.id)}
                          disabled={loading}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Invite
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddMember(member.id)}
                          disabled={loading}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {availableMembers.length === 0 && searchTerm && (
                  <div className="text-center py-4 text-gray-500">
                    No members found matching "{searchTerm}"
                  </div>
                )}
                {availableMembers.length === 0 && !searchTerm && (
                  <div className="text-center py-4 text-gray-500">
                    All members are already in this community
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {community.isPrivate && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Private Community:</strong> This community is private and only visible to members.
              {community.inviteOnly && ' Members must be invited and approved to join.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}