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
import { AttendanceRecord, AttendanceRecordPopulated, Member, Event } from '@/types'
import { formatDateConsistent, parseApiAttendanceRecord, parseApiMember, parseApiEvent } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Attendance' }
]

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordPopulated[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordPopulated | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'all' | 'by-event'>('by-event')
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
        // Use the raw data since it's already properly populated with member and event details
        const records = Array.isArray(response.data) ? response.data : []
        // Just normalize the ID field and parse dates
        const normalizedRecords = records.map(record => ({
          ...record,
          id: record._id || record.id,
          date: new Date(record.date),
          checkedInAt: new Date(record.checkedInAt)
        }))
        setAttendanceRecords(normalizedRecords)
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

  const getMemberName = (memberIdOrMember: string | any) => {
    // If it's a populated object with member data
    if (typeof memberIdOrMember === 'object' && memberIdOrMember?.firstName) {
      return `${memberIdOrMember.firstName} ${memberIdOrMember.lastName}`
    }
    // If it's just an ID string, look it up in the members array
    if (typeof memberIdOrMember === 'string') {
      const member = members.find(m => m.id === memberIdOrMember)
      return member ? `${member.firstName} ${member.lastName}` : 'Unknown Member'
    }
    return 'Unknown Member'
  }

  const getEventName = (eventIdOrEvent: string | any) => {
    // If it's a populated object with event data
    if (typeof eventIdOrEvent === 'object' && eventIdOrEvent?.name) {
      return eventIdOrEvent.name
    }
    // If it's just an ID string, look it up in the events array
    if (typeof eventIdOrEvent === 'string') {
      const event = events.find(e => e.id === eventIdOrEvent)
      return event ? event.name : 'Unknown Event'
    }
    return 'Unknown Event'
  }

  const getEventDate = (eventIdOrEvent: string | any) => {
    // If it's a populated object with event data
    if (typeof eventIdOrEvent === 'object' && eventIdOrEvent?.date) {
      return new Date(eventIdOrEvent.date)
    }
    // If it's just an ID string, look it up in the events array
    if (typeof eventIdOrEvent === 'string') {
      const event = events.find(e => e.id === eventIdOrEvent)
      return event ? new Date(event.date) : new Date()
    }
    return new Date()
  }

  const filteredRecords = attendanceRecords.filter(record => {
    const memberName = getMemberName(record.memberId).toLowerCase()
    const eventName = getEventName(record.eventId).toLowerCase()
    const matchesSearch = memberName.includes(searchTerm.toLowerCase()) || 
                         eventName.includes(searchTerm.toLowerCase())
    
    // Handle both populated object and string ID for event filtering
    const recordEventId = typeof record.eventId === 'object' && record.eventId && '_id' in record.eventId
      ? record.eventId._id 
      : typeof record.eventId === 'string' 
        ? record.eventId 
        : ''
    const matchesEvent = selectedEventId === 'all' || recordEventId === selectedEventId
    
    return matchesSearch && matchesEvent
  })

  // Group records by event for by-event view
  const recordsByEvent = attendanceRecords.reduce((acc, record) => {
    const eventId = typeof record.eventId === 'object' && record.eventId && '_id' in record.eventId
      ? record.eventId._id 
      : typeof record.eventId === 'string' 
        ? record.eventId 
        : ''
    if (!acc[eventId]) {
      acc[eventId] = []
    }
    acc[eventId].push(record)
    return acc
  }, {} as Record<string, any[]>)

  // Calculate per-event statistics
  const eventStats = Object.entries(recordsByEvent).map(([eventId, records]) => {
    const eventName = getEventName(eventId)
    const totalAttendees = records.length
    const presentCount = records.filter(r => r.status === 'present').length
    const absentCount = records.filter(r => r.status === 'absent').length
    const excusedCount = records.filter(r => r.status === 'excused').length
    const attendanceRate = totalAttendees > 0 ? Math.round((presentCount / totalAttendees) * 100) : 0
    
    return {
      eventId,
      eventName,
      totalAttendees,
      presentCount,
      absentCount,
      excusedCount,
      attendanceRate,
      records
    }
  }).sort((a, b) => b.totalAttendees - a.totalAttendees)

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

  const handleEditRecord = (record: AttendanceRecordPopulated) => {
    setSelectedRecord(record)
    setIsEditing(true)
    
    // Extract IDs safely from potentially populated objects
    const memberId = typeof record.memberId === 'object' && record.memberId && '_id' in record.memberId
      ? record.memberId._id 
      : typeof record.memberId === 'string' 
        ? record.memberId 
        : ''
    
    const eventId = typeof record.eventId === 'object' && record.eventId && '_id' in record.eventId
      ? record.eventId._id 
      : typeof record.eventId === 'string' 
        ? record.eventId 
        : ''
    
    setFormData({
      memberId,
      eventId,
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

  // Calculate stats based on current filter
  const currentRecords = selectedEventId === 'all' ? attendanceRecords : 
                        attendanceRecords.filter(r => r.eventId === selectedEventId)
  const totalRecords = currentRecords.length
  const presentRecords = currentRecords.filter(r => r.status === 'present').length
  const absentRecords = currentRecords.filter(r => r.status === 'absent').length
  const excusedRecords = currentRecords.filter(r => r.status === 'excused').length
  const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

  // Recent attendance (last 7 days)
  const recentRecords = currentRecords.filter(record => 
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
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('by-event')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    view === 'by-event' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  By Event
                </button>
                <button
                  onClick={() => setView('all')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    view === 'all' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Records
                </button>
              </div>
              <Button onClick={handleAddRecord}>
                <Plus className="h-4 w-4 mr-2" />
                Record Attendance
              </Button>
            </div>
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
              {view === 'all' && (
                <div className="min-w-[200px]">
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Events</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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

        {/* Attendance Records */}
        {view === 'by-event' ? (
          /* By Event View */
          <div className="space-y-6">
            {eventStats.length > 0 ? (
              eventStats.map((eventStat) => (
                <Card key={eventStat.eventId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <Calendar className="h-5 w-5 mr-2" />
                          {eventStat.eventName}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {eventStat.totalAttendees} total attendees • {eventStat.attendanceRate}% attendance rate
                        </p>
                      </div>
                      <div className="flex space-x-4 text-center">
                        <div className="px-3 py-2 bg-green-50 rounded-lg">
                          <p className="text-lg font-semibold text-green-700">{eventStat.presentCount}</p>
                          <p className="text-xs text-green-600">Present</p>
                        </div>
                        <div className="px-3 py-2 bg-red-50 rounded-lg">
                          <p className="text-lg font-semibold text-red-700">{eventStat.absentCount}</p>
                          <p className="text-xs text-red-600">Absent</p>
                        </div>
                        <div className="px-3 py-2 bg-yellow-50 rounded-lg">
                          <p className="text-lg font-semibold text-yellow-700">{eventStat.excusedCount}</p>
                          <p className="text-xs text-yellow-600">Excused</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Check-in Time</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventStat.records
                          .filter(record => {
                            const memberName = getMemberName(record.memberId).toLowerCase()
                            return memberName.includes(searchTerm.toLowerCase())
                          })
                          .map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <UserCheck className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {getMemberName(record.memberId)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-900">
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
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
                  <p className="text-gray-600">Start by recording attendance for your events.</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* All Records View */
          <Card>
            <CardHeader>
              <CardTitle>
                Attendance Records ({filteredRecords.length})
                {selectedEventId !== 'all' && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    - {getEventName(selectedEventId)}
                  </span>
                )}
              </CardTitle>
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
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
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
        )}

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
