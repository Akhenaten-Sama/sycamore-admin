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
  Calendar,
  Clock,
  MapPin,
  Users,
  Image,
  Video,
  Repeat
} from 'lucide-react'
import { Event } from '@/types'
import { formatDateConsistent, getCurrentDate, parseApiEvent } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Events' }
]

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    endDate: '',
    location: '',
    isRecurring: false,
    maxAttendees: ''
  })

  useEffect(() => {
    loadEvents()
  }, [])

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

  const currentDate = getCurrentDate()

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddEvent = () => {
    setSelectedEvent(null)
    setIsEditing(false)
    setFormData({
      name: '',
      description: '',
      date: '',
      endDate: '',
      location: '',
      isRecurring: false,
      maxAttendees: ''
    })
    setIsModalOpen(true)
  }

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setIsEditing(true)
    setFormData({
      name: event.name,
      description: event.description,
      date: formatDateConsistent(event.date).split('T')[0],
      endDate: event.endDate ? formatDateConsistent(event.endDate).split('T')[0] : '',
      location: event.location || '',
      isRecurring: event.isRecurring,
      maxAttendees: event.maxAttendees?.toString() || ''
    })
    setIsModalOpen(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await apiClient.deleteEvent(eventId)
        if (response.success) {
          await loadEvents() // Reload data
        } else {
          alert('Failed to delete event')
        }
      } catch (error) {
        console.error('Failed to delete event:', error)
        alert('Failed to delete event')
      }
    }
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formElement = e.target as HTMLFormElement
      const formData = new FormData(formElement)
      
      const eventData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        date: new Date(formData.get('date') as string),
        endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
        location: formData.get('location') as string,
        maxAttendees: formData.get('maxAttendees') ? parseInt(formData.get('maxAttendees') as string) : undefined,
        banner: formData.get('banner') as string,
        bannerType: formData.get('bannerType') as string,
        isRecurring: formData.get('isRecurring') === 'on',
        createdBy: 'current-user' // Should be replaced with actual user ID
      }

      let response
      if (isEditing && selectedEvent) {
        response = await apiClient.updateEvent(selectedEvent.id, eventData)
      } else {
        response = await apiClient.createEvent(eventData)
      }
      
      if (response.success) {
        await loadEvents() // Reload data
        setIsModalOpen(false)
        setSelectedEvent(null)
      } else {
        alert(response.error || 'Failed to save event')
      }
    } catch (error) {
      console.error('Failed to save event:', error)
      alert('Failed to save event')
    } finally {
      setLoading(false)
    }
  }

  const formatEventDate = (date: Date, endDate?: Date) => {
    const dateStr = formatDateConsistent(date)
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    if (endDate) {
      const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      if (date.toDateString() === endDate.toDateString()) {
        return `${dateStr} ${timeStr} - ${endTimeStr}`
      } else {
        return `${dateStr} ${timeStr} - ${formatDateConsistent(endDate)} ${endTimeStr}`
      }
    }
    
    return `${dateStr} ${timeStr}`
  }

  const upcomingEvents = events.filter(event => event.date > currentDate)
  const pastEvents = events.filter(event => event.date <= currentDate)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={breadcrumbItems} />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Events</h1>
              <p className="text-gray-600">Manage church events and activities.</p>
            </div>
            <Button onClick={handleAddEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Events</p>
                  <p className="text-2xl font-semibold text-gray-900">{events.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Upcoming</p>
                  <p className="text-2xl font-semibold text-gray-900">{upcomingEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Repeat className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Recurring</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {events.filter(e => e.isRecurring).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Events ({filteredEvents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-purple-700" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{event.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {event.description}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {event.isRecurring && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Repeat className="h-3 w-3 mr-1" />
                                Recurring
                              </span>
                            )}
                            {event.banner && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {event.bannerType === 'video' ? (
                                  <Video className="h-3 w-3 mr-1" />
                                ) : (
                                  <Image className="h-3 w-3 mr-1" />
                                )}
                                {event.bannerType === 'video' ? 'Video' : 'Image'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatEventDate(event.date, event.endDate)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {event.date > currentDate ? 'Upcoming' : 'Past'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {event.location || 'Not specified'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {event.maxAttendees && (
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              Max: {event.maxAttendees}
                            </span>
                          </div>
                        )}
                        {event.attendees && (
                          <div className="text-sm text-gray-500">
                            {event.attendees.length} registered
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
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

        {/* Add/Edit Event Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Event' : 'Create New Event'}
              </h2>
              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name
                  </label>
                  <Input
                    name="name"
                    defaultValue={selectedEvent?.name || ''}
                    placeholder="Enter event name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    defaultValue={selectedEvent?.description || ''}
                    placeholder="Describe the event..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date & Time
                    </label>
                    <Input
                      name="date"
                      type="datetime-local"
                      defaultValue={selectedEvent?.date.toISOString().slice(0, 16) || ''}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date & Time
                    </label>
                    <Input
                      name="endDate"
                      type="datetime-local"
                      defaultValue={selectedEvent?.endDate?.toISOString().slice(0, 16) || ''}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <Input
                    name="location"
                    defaultValue={selectedEvent?.location || ''}
                    placeholder="Enter event location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Attendees
                  </label>
                  <Input
                    name="maxAttendees"
                    type="number"
                    defaultValue={selectedEvent?.maxAttendees || ''}
                    placeholder="Enter maximum number of attendees"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner URL
                  </label>
                  <Input
                    name="banner"
                    defaultValue={selectedEvent?.banner || ''}
                    placeholder="Enter banner image or video URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Type
                  </label>
                  <select 
                    name="bannerType"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={selectedEvent?.bannerType || 'image'}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      name="isRecurring"
                      type="checkbox"
                      defaultChecked={selectedEvent?.isRecurring || false}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Recurring Event</span>
                  </label>
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
                    {loading ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
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
