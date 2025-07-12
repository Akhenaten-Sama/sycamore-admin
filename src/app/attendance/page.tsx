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
  UserCheck,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { AttendanceRecord, Member, Event } from '@/types'
import { formatDateConsistent, parseApiAttendanceRecord, parseApiMember, parseApiEvent } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Attendance' }
]

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    memberId: '',
    eventId: '',
    date: '',
    status: 'present' as 'present' | 'absent' | 'excused',
    checkedInAt: '',
    notes: ''
  })

  useEffect(() => {
    loadAttendanceRecords()
    loadMembers()
    loadEvents()
  }, [])

  const loadAttendanceRecords = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getAttendanceRecords()
      if (response.success && response.data) {
        const parsedRecords = Array.isArray(response.data) 
          ? response.data.map(parseApiAttendanceRecord)
          : []
        setAttendanceRecords(parsedRecords)
      }
    } catch (error) {
      console.error('Failed to load attendance records:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      const response = await apiClient.getMembers()
      if (response.success && response.data) {
        const parsedMembers = Array.isArray(response.data) 
          ? response.data.map(parseApiMember)
          : []
        setMembers(parsedMembers)
      }
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await apiClient.getEvents()
      if (response.success && response.data) {
        const parsedEvents = Array.isArray(response.data) 
          ? response.data.map(parseApiEvent)
          : []
        setEvents(parsedEvents)
      }
    } catch (error) {
      console.error('Failed to load events:', error)
    }
  }

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown Member'
  }

  const getEventName = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    return event ? event.name : 'Unknown Event'
  }

  const filteredRecords = attendanceRecords.filter(record => {
    const memberName = getMemberName(record.memberId).toLowerCase()
    const eventName = getEventName(record.eventId).toLowerCase()
    return memberName.includes(searchTerm.toLowerCase()) || 
           eventName.includes(searchTerm.toLowerCase())
  })

  const handleAddRecord = () => {
    setSelectedRecord(null)
    setIsEditing(false)
    setFormData({
      memberId: '',
      eventId: '',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      checkedInAt: new Date().toTimeString().slice(0, 5),
      notes: ''
    })
    setIsModalOpen(true)
  }

  const handleEditRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record)
    setIsEditing(true)
    setFormData({
      memberId: record.memberId,
      eventId: record.eventId,
      date: formatDateConsistent(record.date).split('T')[0],
      status: record.status,
      checkedInAt: record.checkedInAt ? new Date(record.checkedInAt).toTimeString().slice(0, 5) : '',
      notes: record.notes || ''
    })
    setIsModalOpen(true)
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      try {
        const response = await apiClient.updateAttendance(recordId, { deleted: true })
        if (response.success) {
          await loadAttendanceRecords() // Reload data
        } else {
          alert('Failed to delete attendance record')
        }
      } catch (error) {
        console.error('Failed to delete attendance record:', error)
        alert('Failed to delete attendance record')
      }
    }
  }

  const handleSaveRecord = async (recordData: Partial<AttendanceRecord>) => {
    try {
      setLoading(true)
      let response
      if (isEditing && selectedRecord) {
        response = await apiClient.updateAttendance(selectedRecord.id, recordData)
      } else {
        response = await apiClient.markAttendance(recordData)
      }
      
      if (response.success) {
        await loadAttendanceRecords() // Reload data
        setIsModalOpen(false)
        setSelectedRecord(null)
      } else {
        alert(response.error || 'Failed to save attendance record')
      }
    } catch (error) {
      console.error('Failed to save attendance record:', error)
      alert('Failed to save attendance record')
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const totalRecords = attendanceRecords.length
  const presentRecords = attendanceRecords.filter(r => r.status === 'present').length
  const absentRecords = attendanceRecords.filter(r => r.status === 'absent').length
  const excusedRecords = attendanceRecords.filter(r => r.status === 'excused').length
  const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

  // Recent attendance (last 7 days)
  const recentRecords = attendanceRecords.filter(record => 
    record.date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={breadcrumbItems} />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Attendance</h1>
              <p className="text-gray-600">Track member attendance for church services and events.</p>
            </div>
            <Button onClick={handleAddRecord}>
              <Plus className="h-4 w-4 mr-2" />
              Record Attendance
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Records</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalRecords}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Present</p>
                  <p className="text-2xl font-semibold text-gray-900">{presentRecords}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{attendanceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">This Week</p>
                  <p className="text-2xl font-semibold text-gray-900">{recentRecords.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-gray-900">{presentRecords}</p>
                <p className="text-sm text-gray-500">Present</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-gray-900">{absentRecords}</p>
                <p className="text-sm text-gray-500">Absent</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-gray-900">{excusedRecords}</p>
                <p className="text-sm text-gray-500">Excused</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by member name or event..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Present ({presentRecords})
                </Button>
                <Button variant="outline" size="sm">
                  Absent ({absentRecords})
                </Button>
                <Button variant="outline" size="sm">
                  Excused ({excusedRecords})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records ({filteredRecords.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-700" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {getMemberName(record.memberId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">{getEventName(record.eventId)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />                      <span className="text-sm text-gray-900">
                        {formatDateConsistent(record.date)}
                      </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'absent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {record.status === 'present' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {record.status === 'absent' && <XCircle className="h-3 w-3 mr-1" />}
                        {record.status === 'excused' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {record.checkedInAt.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {record.notes || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRecord(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRecord(record.id)}
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

        {/* Add/Edit Attendance Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Attendance Record' : 'Record New Attendance'}
              </h2>
              <form 
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  const recordData = {
                    ...formData,
                    date: new Date(formData.date),
                    checkedInAt: formData.checkedInAt ? new Date(`${formData.date}T${formData.checkedInAt}`) : undefined
                  }
                  handleSaveRecord(recordData)
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member
                  </label>
                  <select 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.memberId}
                    onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                    required
                  >
                    <option value="">Select a member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event
                  </label>
                  <select 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.eventId}
                    onChange={(e) => setFormData({...formData, eventId: e.target.value})}
                    required
                  >
                    <option value="">Select an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-in Time
                    </label>
                    <Input
                      type="time"
                      value={formData.checkedInAt}
                      onChange={(e) => setFormData({...formData, checkedInAt: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'present' | 'absent' | 'excused'})}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Optional notes about attendance..."
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : isEditing ? 'Update Record' : 'Record Attendance'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
