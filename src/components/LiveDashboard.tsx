'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  UserX,
  AlertTriangle,
  Phone,
  User,
  RefreshCw,
  Activity
} from 'lucide-react'

interface LiveDashboardProps {
  attendanceRecords: any[]
  juniorMembers: any[]
  onRefresh: () => void
}

export default function LiveDashboard({ attendanceRecords, juniorMembers, onRefresh }: LiveDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Auto refresh data every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const refreshTimer = setInterval(() => {
      onRefresh()
    }, 30000) // 30 seconds

    return () => clearInterval(refreshTimer)
  }, [autoRefresh, onRefresh])

  // Get today's attendance records
  const today = new Date().toDateString()
  const todayRecords = attendanceRecords.filter(
    record => new Date(record.date).toDateString() === today
  )

  // Calculate statistics
  const stats = {
    totalRegistered: juniorMembers.filter(m => m.isActive).length,
    checkedIn: todayRecords.filter(r => r.status === 'dropped_off').length,
    pickedUp: todayRecords.filter(r => r.status === 'picked_up').length,
    stillPresent: todayRecords.filter(r => r.status === 'dropped_off').length,
    noShow: juniorMembers.filter(m => m.isActive).length - todayRecords.length
  }

  // Get children currently present (checked in but not picked up)
  const presentChildren = todayRecords
    .filter(record => record.status === 'dropped_off')
    .map(record => {
      const member = juniorMembers.find(m => m.id === record.juniorMemberId)
      return {
        ...record,
        member,
        durationPresent: Date.now() - new Date(record.dropoffTime).getTime()
      }
    })
    .filter(record => record.member)
    .sort((a, b) => b.durationPresent - a.durationPresent) // Longest present first

  // Get children who have been picked up
  const pickedUpChildren = todayRecords
    .filter(record => record.status === 'picked_up')
    .map(record => {
      const member = juniorMembers.find(m => m.id === record.juniorMemberId)
      return { ...record, member }
    })
    .filter(record => record.member)
    .sort((a, b) => new Date(b.pickupTime).getTime() - new Date(a.pickupTime).getTime()) // Most recent first

  // Helper function to format duration
  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Helper function to get class color
  const getClassColor = (className: string) => {
    const colors = {
      nursery: 'bg-pink-100 text-pink-800',
      toddlers: 'bg-blue-100 text-blue-800',
      preschool: 'bg-green-100 text-green-800',
      elementary: 'bg-purple-100 text-purple-800',
      teens: 'bg-orange-100 text-orange-800'
    }
    return colors[className as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header with Current Time and Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Service Dashboard</h2>
          <p className="text-gray-600">
            {currentTime.toLocaleDateString()} at {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Activity className={`w-4 h-4 mr-1 ${autoRefresh ? 'text-green-600' : ''}`} />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Registered</p>
                <p className="text-2xl font-bold">{stats.totalRegistered}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Checked In</p>
                <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Still Present</p>
                <p className="text-2xl font-bold text-orange-600">{stats.stillPresent}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Picked Up</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pickedUp}</p>
              </div>
              <UserX className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">No Show</p>
                <p className="text-2xl font-bold text-gray-600">{stats.noShow}</p>
              </div>
              <UserX className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currently Present Children */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Currently Present ({presentChildren.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {presentChildren.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>All children have been picked up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {presentChildren.map((record) => (
                <div 
                  key={record.id} 
                  className="p-4 border rounded-lg bg-orange-50 border-orange-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-lg">
                          {record.member.firstName} {record.member.lastName}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassColor(record.member.class)}`}>
                          {record.member.class}
                        </span>
                        {record.member.allergies && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            ⚠️ Allergies
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Dropped off by:</p>
                          <p className="font-medium">{record.dropoffBy}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Drop-off time:</p>
                          <p className="font-medium">{new Date(record.dropoffTime).toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Duration present:</p>
                          <p className="font-medium text-orange-600">{formatDuration(record.durationPresent)}</p>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="mt-3 p-2 bg-white rounded border">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Emergency Contact:</span>
                          <span>{record.member.emergencyContact.name}</span>
                          <span className="text-blue-600">{record.member.emergencyContact.phone}</span>
                          <span className="text-gray-500">({record.member.emergencyContact.relationship})</span>
                        </div>
                      </div>

                      {/* Authorized Pickup */}
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <strong>Authorized pickup:</strong> {record.member.pickupAuthority.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        Present
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Picked Up */}
      {pickedUpChildren.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Recently Picked Up ({pickedUpChildren.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {pickedUpChildren.slice(0, 10).map((record) => (
                <div 
                  key={record.id} 
                  className="p-3 border rounded-lg bg-green-50 border-green-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">
                        {record.member.firstName} {record.member.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Picked up by: {record.pickedUpBy} at {new Date(record.pickupTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassColor(record.member.class)}`}>
                      {record.member.class}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}