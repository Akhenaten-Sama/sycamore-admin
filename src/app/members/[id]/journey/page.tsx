'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Heart,
  Users,
  Trophy,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Activity,
  Edit
} from 'lucide-react'
import { Member } from '@/types'
import { formatDateConsistent } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

export default function MemberJourneyPage() {
  const params = useParams()
  const memberId = params.id as string
  
  const [memberData, setMemberData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Members', href: '/members' },
    { label: memberData?.member ? `${memberData.member.firstName} ${memberData.member.lastName}` : 'Member Profile' }
  ]

  useEffect(() => {
    if (memberId) {
      loadMemberJourney()
    }
  }, [memberId])

  const loadMemberJourney = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getMemberJourney(memberId)
      if (response.success && response.data) {
        setMemberData(response.data)
      }
    } catch (error) {
      console.error('Error loading member journey:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-8">Loading member profile...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!memberData) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-8 text-red-600">Member not found</div>
        </div>
      </DashboardLayout>
    )
  }

  const { member, stats, activities, attendanceRecords, givingRecords, communities, assignedTasks } = memberData

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              {member.avatar ? (
                <img src={member.avatar} alt={member.firstName} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {member.firstName} {member.lastName}
              </h1>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {member.email}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {member.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {member.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDateConsistent(new Date(member.dateJoined))}
                </span>
                {member.isTeamLead && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    Team Leader
                  </span>
                )}
                {member.isAdmin && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Attendance Streak</p>
                  <p className="text-2xl font-bold">{stats.attendanceStreak}</p>
                  <p className="text-xs text-gray-500">weeks</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Attendance</p>
                  <p className="text-2xl font-bold">{stats.totalAttendance}</p>
                  <p className="text-xs text-gray-500">events</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Giving</p>
                  <p className="text-2xl font-bold">${stats.totalGiving.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">lifetime</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Communities</p>
                  <p className="text-2xl font-bold">{stats.communitiesCount}</p>
                  <p className="text-xs text-gray-500">active</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Date of Birth</p>
                  <p className="font-medium">
                    {member.dateOfBirth ? formatDateConsistent(new Date(member.dateOfBirth)) : 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Marital Status</p>
                  <p className="font-medium capitalize">{member.maritalStatus || 'Not specified'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600">Address</p>
                  <p className="font-medium">{member.address || 'Not provided'}</p>
                </div>
                {member.weddingAnniversary && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Wedding Anniversary</p>
                    <p className="font-medium">{formatDateConsistent(new Date(member.weddingAnniversary))}</p>
                  </div>
                )}
                {member.emergencyContact && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Emergency Contact</p>
                    <p className="font-medium">{member.emergencyContact.name}</p>
                    <p className="text-sm text-gray-500">{member.emergencyContact.phone} ({member.emergencyContact.relationship})</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Communities & Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Communities & Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {member.teamId && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">Team Member</p>
                    <p className="text-sm text-blue-700">{member.teamId.name}</p>
                    {member.isTeamLead && (
                      <span className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs mt-1">
                        Team Leader
                      </span>
                    )}
                  </div>
                )}
                
                {communities.map((community: any) => (
                  <div key={community.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{community.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{community.type.replace('-', ' ')}</p>
                    {community.meetingSchedule && (
                      <p className="text-xs text-gray-500 mt-1">{community.meetingSchedule}</p>
                    )}
                  </div>
                ))}
                
                {!member.teamId && communities.length === 0 && (
                  <p className="text-gray-500 text-sm">No communities or teams joined</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tasks & Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Tasks & Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Assigned Tasks</span>
                  <span className="font-semibold">{stats.tasksAssigned}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed Tasks</span>
                  <span className="font-semibold text-green-600">{stats.tasksCompleted}</span>
                </div>
                
                {assignedTasks.slice(0, 3).map((task: any) => (
                  <div key={task.id} className="p-2 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{task.title}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">{task.teamId.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.slice(0, 10).map((activity: any, index: number) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-gray-500">{formatDateConsistent(new Date(activity.timestamp))}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Attendance & Giving */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceRecords.slice(0, 5).map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{record.eventId?.name || 'Unknown Event'}</p>
                      <p className="text-xs text-gray-500">{formatDateConsistent(new Date(record.date))}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'excused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                ))}
                {attendanceRecords.length === 0 && (
                  <p className="text-gray-500 text-sm">No attendance records</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Recent Giving
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {givingRecords.slice(0, 5).map((giving: any) => (
                  <div key={giving.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm capitalize">{giving.category.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">{formatDateConsistent(new Date(giving.date))}</p>
                    </div>
                    <span className="font-semibold text-green-600">
                      ${giving.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {givingRecords.length === 0 && (
                  <p className="text-gray-500 text-sm">No giving records</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
