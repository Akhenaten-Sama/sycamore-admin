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
  Heart,
  Calendar,
  Gift,
  Cake,
  Bell
} from 'lucide-react'
import { Anniversary, Member } from '@/types'
import { getCurrentDate, parseApiAnniversary, parseApiMember } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Anniversaries' }
]

export default function AnniversariesPage() {
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAnniversary, setSelectedAnniversary] = useState<Anniversary | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'birthday' | 'wedding'>('all')
  const [loading, setLoading] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    memberId: '',
    type: 'birthday' as 'birthday' | 'wedding',
    date: '',
    notes: '',
    recurring: true
  })

  useEffect(() => {
    loadAnniversaries()
    loadMembers()
  }, [])

  useEffect(() => {
    if (members.length > 0) {
      calculateUpcomingBirthdays()
    }
  }, [members]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const calculateUpcomingBirthdays = () => {
    const today = new Date()
    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(today.getMonth() + 6)

    const upcoming = members.filter(member => {
      if (!member.dateOfBirth) return false
      
      const birthDate = new Date(member.dateOfBirth)
      const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
      const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate())

      // Check if birthday is within the next 6 months
      return (thisYearBirthday >= today && thisYearBirthday <= sixMonthsFromNow) ||
             (nextYearBirthday >= today && nextYearBirthday <= sixMonthsFromNow)
    }).sort((a, b) => {
      // Sort by next birthday date
      const aBirthDate = new Date(a.dateOfBirth!)
      const bBirthDate = new Date(b.dateOfBirth!)
      const aNextBirthday = new Date(today.getFullYear(), aBirthDate.getMonth(), aBirthDate.getDate())
      const bNextBirthday = new Date(today.getFullYear(), bBirthDate.getMonth(), bBirthDate.getDate())
      
      if (aNextBirthday < today) aNextBirthday.setFullYear(today.getFullYear() + 1)
      if (bNextBirthday < today) bNextBirthday.setFullYear(today.getFullYear() + 1)
      
      return aNextBirthday.getTime() - bNextBirthday.getTime()
    })

    setUpcomingBirthdays(upcoming)
  }

  const loadAnniversaries = async () => {
    try {
      setConnectionError(null)
      const response = await apiClient.getAnniversaries()
      if (response.success && response.data) {
        // Parse dates from API response
        const anniversariesWithDates = Array.isArray(response.data) 
          ? response.data.map(parseApiAnniversary)
          : []
        setAnniversaries(anniversariesWithDates)
      } else if (response.error && response.error.includes('MongoDB Atlas')) {
        setConnectionError(response.error + ((response as any).details ? ': ' + (response as any).details : ''))
      }
    } catch (error) {
      console.error('Failed to load anniversaries:', error)
      setConnectionError('Failed to connect to database. Please check your network connection.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditing && selectedAnniversary) {
        const response = await apiClient.updateAnniversary(selectedAnniversary.id, formData)
        if (response.success) {
          await loadAnniversaries()
          setIsModalOpen(false)
          resetForm()
        }
      } else {
        const response = await apiClient.createAnniversary(formData)
        if (response.success) {
          await loadAnniversaries()
          setIsModalOpen(false)
          resetForm()
        }
      }
    } catch (error) {
      console.error('Failed to save anniversary:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      memberId: '',
      type: 'birthday',
      date: '',
      notes: '',
      recurring: true
    })
    setSelectedAnniversary(null)
    setIsEditing(false)
  }

  const filteredAnniversaries = anniversaries.filter(anniversary => {
    const member = members.find(m => m.id === anniversary.memberId)
    const memberName = member ? `${member.firstName} ${member.lastName}` : ''
    
    const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || anniversary.type === filterType
    
    return matchesSearch && matchesType
  })

  const handleAddAnniversary = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleEditAnniversary = (anniversary: Anniversary) => {
    setSelectedAnniversary(anniversary)
    setFormData({
      memberId: anniversary.memberId,
      type: anniversary.type,
      date: anniversary.date.toISOString().split('T')[0],
      notes: anniversary.notes || '',
      recurring: anniversary.recurring
    })
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleDeleteAnniversary = async (anniversaryId: string) => {
    if (confirm('Are you sure you want to delete this anniversary?')) {
      try {
        const response = await apiClient.deleteAnniversary(anniversaryId)
        if (response.success) {
          await loadAnniversaries()
        }
      } catch (error) {
        console.error('Failed to delete anniversary:', error)
      }
    }
  }

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown Member'
  }

  const getUpcomingAnniversaries = () => {
    const today = getCurrentDate()
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))
    
    return anniversaries.filter(anniversary => {
      const anniversaryThisYear = new Date(
        today.getFullYear(),
        anniversary.date.getMonth(),
        anniversary.date.getDate()
      )
      
      // If anniversary has passed this year, check next year
      if (anniversaryThisYear < today) {
        anniversaryThisYear.setFullYear(today.getFullYear() + 1)
      }
      
      return anniversaryThisYear <= thirtyDaysFromNow
    }).sort((a, b) => {
      const dateA = new Date(today.getFullYear(), a.date.getMonth(), a.date.getDate())
      const dateB = new Date(today.getFullYear(), b.date.getMonth(), b.date.getDate())
      if (dateA < today) dateA.setFullYear(today.getFullYear() + 1)
      if (dateB < today) dateB.setFullYear(today.getFullYear() + 1)
      return dateA.getTime() - dateB.getTime()
    })
  }

  const getAnniversaryIcon = (type: string) => {
    return type === 'birthday' ? <Cake className="h-4 w-4" /> : <Heart className="h-4 w-4" />
  }

  const getAnniversaryColor = (type: string) => {
    return type === 'birthday' 
      ? 'bg-pink-100 text-pink-800'
      : 'bg-purple-100 text-purple-800'
  }

  const getDaysUntilAnniversary = (date: Date) => {
    const today = getCurrentDate()
    const anniversaryThisYear = new Date(
      today.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
    
    if (anniversaryThisYear < today) {
      anniversaryThisYear.setFullYear(today.getFullYear() + 1)
    }
    
    const timeDiff = anniversaryThisYear.getTime() - today.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  const upcomingAnniversaries = getUpcomingAnniversaries()
  const birthdayCount = anniversaries.filter(a => a.type === 'birthday').length
  const weddingCount = anniversaries.filter(a => a.type === 'wedding').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={breadcrumbItems} />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Anniversaries</h1>
              <p className="text-gray-600">Track birthdays and wedding anniversaries of church members.</p>
            </div>
            <Button onClick={handleAddAnniversary}>
              <Plus className="h-4 w-4 mr-2" />
              Add Anniversary
            </Button>
          </div>
        </div>

        {/* Connection Error Alert */}
        {connectionError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Database Connection Issue</h3>
                  <p className="mt-1 text-sm text-red-700">{connectionError}</p>
                  <div className="mt-2 text-xs text-red-600">
                    <p>To fix this issue:</p>
                    <ol className="mt-1 list-decimal list-inside space-y-1">
                      <li>Go to MongoDB Atlas Dashboard</li>
                      <li>Navigate to Network Access</li>
                      <li>Click "Add IP Address"</li>
                      <li>Add your current IP or 0.0.0.0/0 for development</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Anniversaries</p>
                  <p className="text-2xl font-semibold text-gray-900">{anniversaries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Cake className="h-8 w-8 text-pink-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Birthdays</p>
                  <p className="text-2xl font-semibold text-gray-900">{birthdayCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Gift className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Weddings</p>
                  <p className="text-2xl font-semibold text-gray-900">{weddingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Upcoming (30 days)</p>
                  <p className="text-2xl font-semibold text-gray-900">{upcomingAnniversaries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Birthdays Section */}
        {upcomingBirthdays.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cake className="h-5 w-5 mr-2 text-pink-600" />
                Upcoming Birthdays (Next 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingBirthdays.map((member) => {
                  const birthDate = new Date(member.dateOfBirth!)
                  const today = new Date()
                  const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
                  const nextBirthday = thisYearBirthday < today 
                    ? new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate())
                    : thisYearBirthday
                  const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  const age = today.getFullYear() - birthDate.getFullYear()

                  return (
                    <div key={member.id} className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {member.firstName} {member.lastName}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {nextBirthday.toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-xs text-pink-600 mt-1">
                            {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                            {' • '}Turning {age + (thisYearBirthday < today ? 1 : 0)}
                          </p>
                        </div>
                        <Cake className="h-5 w-5 text-pink-500" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={filterType === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  All ({anniversaries.length})
                </Button>
                <Button
                  variant={filterType === 'birthday' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('birthday')}
                >
                  Birthdays ({birthdayCount})
                </Button>
                <Button
                  variant={filterType === 'wedding' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('wedding')}
                >
                  Weddings ({weddingCount})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Anniversaries Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>All Anniversaries ({filteredAnniversaries.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Days Until</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnniversaries.map((anniversary) => (
                      <TableRow key={anniversary.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-700">
                                {getMemberName(anniversary.memberId).split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">
                              {getMemberName(anniversary.memberId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAnniversaryColor(anniversary.type)}`}>
                            {getAnniversaryIcon(anniversary.type)}
                            <span className="ml-1 capitalize">{anniversary.type}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {anniversary.date.toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-900">
                            {getDaysUntilAnniversary(anniversary.date)} days
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAnniversary(anniversary)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAnniversary(anniversary.id)}
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
          </div>

          {/* Upcoming Anniversaries */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Upcoming (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAnniversaries.slice(0, 10).map((anniversary) => (
                    <div key={anniversary.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          anniversary.type === 'birthday' ? 'bg-pink-100' : 'bg-purple-100'
                        }`}>
                          {getAnniversaryIcon(anniversary.type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {getMemberName(anniversary.memberId)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {anniversary.date.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {getDaysUntilAnniversary(anniversary.date)}
                        </div>
                        <div className="text-xs text-gray-500">days</div>
                      </div>
                    </div>
                  ))}
                  {upcomingAnniversaries.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No upcoming anniversaries in the next 30 days
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add/Edit Anniversary Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Anniversary' : 'Add New Anniversary'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.memberId}
                    onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                    required
                  >
                    <option value="">Select Member</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anniversary Type
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'birthday' | 'wedding' })}
                  >
                    <option value="birthday">Birthday</option>
                    <option value="wedding">Wedding Anniversary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any special notes..."
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.recurring}
                      onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Recurring Annually</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false)
                      resetForm()
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (isEditing ? 'Update Anniversary' : 'Add Anniversary')}
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
