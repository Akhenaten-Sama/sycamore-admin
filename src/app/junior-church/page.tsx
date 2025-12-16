'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, OnboardingTour } from '@/components/common'
import { juniorChurchTourSteps } from '@/components/common/tourSteps'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Baby,
  Calendar,
  Clock,
  User,
  QrCode,
  CheckCircle,
  XCircle,
  Printer,
  Download,
  UserCheck,
  Activity
} from 'lucide-react'
import AdminCheckout from '@/components/AdminCheckout'
import LiveDashboard from '@/components/LiveDashboard'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Junior Church' }
]

interface JuniorMember {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  age: number
  parentName: string
  parentPhone: string
  parentEmail: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  allergies?: string
  medicalNotes?: string
  pickupAuthority: string[] // Array of authorized pickup persons
  class: 'nursery' | 'toddlers' | 'preschool' | 'elementary' | 'teens'
  isActive: boolean
  registeredAt: Date
  barcodeId: string // Unique barcode for dropoff/pickup
}

interface AttendanceRecord {
  id: string
  juniorMemberId: string
  date: Date
  dropoffTime?: Date
  pickupTime?: Date
  dropoffBy: string // Name of person dropping off
  pickedUpBy?: string // Name of person picking up
  status: 'dropped_off' | 'picked_up' | 'no_show'
  notes?: string
  verifiedById: string // Staff member who verified
}

export default function JuniorChurchPage() {
  const [juniorMembers, setJuniorMembers] = useState<JuniorMember[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [selectedMember, setSelectedMember] = useState<JuniorMember | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'attendance' | 'checkin' | 'admin-checkout' | 'live-dashboard'>('live-dashboard')
  const [todayDate] = useState(new Date().toISOString().split('T')[0])
  const [barcodeInput, setBarcodeInput] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    allergies: '',
    medicalNotes: '',
    pickupAuthority: '',
    class: 'nursery' as JuniorMember['class'],
    isActive: true
  })

  useEffect(() => {
    loadJuniorMembers()
    loadAttendanceRecords()
  }, [])

  const generateBarcodeId = () => {
    return 'JC' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase()
  }

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const loadJuniorMembers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/junior-church/members?active=true')
      const result = await response.json()
      
      if (result.success) {
        setJuniorMembers(result.data)
      } else {
        console.error('Failed to load junior members:', result.message)
        // Fallback to mock data for now
        const mockMembers: JuniorMember[] = [
          {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            dateOfBirth: new Date('2018-03-15'),
            age: 6,
            parentName: 'Sarah Johnson',
            parentPhone: '+1234567890',
            parentEmail: 'sarah.johnson@email.com',
            emergencyContact: {
              name: 'Mike Johnson',
              phone: '+1234567891',
              relationship: 'Father'
            },
            allergies: 'Peanuts',
            medicalNotes: 'Carries EpiPen',
            pickupAuthority: ['Sarah Johnson', 'Mike Johnson', 'Grandma Johnson'],
            class: 'elementary',
            isActive: true,
            registeredAt: new Date('2024-01-15'),
            barcodeId: 'JC2024001'
          },
          {
            id: '2',
            firstName: 'Noah',
            lastName: 'Williams',
            dateOfBirth: new Date('2021-08-22'),
            age: 3,
            parentName: 'Lisa Williams',
            parentPhone: '+1234567892',
            parentEmail: 'lisa.williams@email.com',
            emergencyContact: {
              name: 'David Williams',
              phone: '+1234567893',
              relationship: 'Father'
            },
            pickupAuthority: ['Lisa Williams', 'David Williams'],
            class: 'toddlers',
            isActive: true,
            registeredAt: new Date('2024-02-01'),
            barcodeId: 'JC2024002'
          }
        ]
        setJuniorMembers(mockMembers)
      }
    } catch (error) {
      console.error('Error loading junior members:', error)
      setJuniorMembers([])
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceRecords = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/junior-church/attendance?date=${today}`)
      const result = await response.json()
      
      if (result.success) {
        setAttendanceRecords(result.data)
      } else {
        console.error('Failed to load attendance records:', result.message)
        // Fallback to mock data for now
        const mockAttendance: AttendanceRecord[] = [
          {
            id: '1',
            juniorMemberId: '1',
            date: new Date(),
            dropoffTime: new Date(),
            dropoffBy: 'Sarah Johnson',
            status: 'dropped_off',
            verifiedById: 'staff1'
          },
          {
            id: '2',
            juniorMemberId: '2',
            date: new Date(),
            dropoffTime: new Date(),
            pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
            dropoffBy: 'Lisa Williams',
            pickedUpBy: 'David Williams',
            status: 'picked_up',
            verifiedById: 'staff1'
          }
        ]
        setAttendanceRecords(mockAttendance)
      }
    } catch (error) {
      console.error('Error loading attendance records:', error)
      setAttendanceRecords([])
    }
  }

  const handleCreateMember = () => {
    setSelectedMember(null)
    setIsEditing(false)
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      allergies: '',
      medicalNotes: '',
      pickupAuthority: '',
      class: 'nursery',
      isActive: true
    })
    setIsModalOpen(true)
  }

  const handleEditMember = (member: JuniorMember) => {
    setSelectedMember(member)
    setIsEditing(true)
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      dateOfBirth: new Date(member.dateOfBirth).toISOString().split('T')[0],
      parentName: member.parentName,
      parentPhone: member.parentPhone,
      parentEmail: member.parentEmail,
      emergencyContactName: member.emergencyContact.name,
      emergencyContactPhone: member.emergencyContact.phone,
      emergencyContactRelationship: member.emergencyContact.relationship,
      allergies: member.allergies || '',
      medicalNotes: member.medicalNotes || '',
      pickupAuthority: member.pickupAuthority.join(', '),
      class: member.class,
      isActive: member.isActive
    })
    setIsModalOpen(true)
  }

  const handleSaveMember = async () => {
    setLoading(true)
    try {
      const dateOfBirth = new Date(formData.dateOfBirth)
      const memberData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        parentEmail: formData.parentEmail,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship
        },
        allergies: formData.allergies,
        medicalNotes: formData.medicalNotes,
        pickupAuthority: formData.pickupAuthority,
        class: formData.class
      }

      const url = isEditing 
        ? '/api/junior-church/members' 
        : '/api/junior-church/members'
      
      const method = isEditing ? 'PUT' : 'POST'
      
      if (isEditing && selectedMember) {
        (memberData as any).id = selectedMember.id
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(memberData)
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        setIsModalOpen(false)
        loadJuniorMembers()
      } else {
        alert('Error: ' + result.message)
      }
    } catch (error) {
      console.error('Error saving junior member:', error)
      alert('An error occurred while saving the member.')
    } finally {
      setLoading(false)
    }
  }

  const handleBarcodeCheckIn = async () => {
    if (!barcodeInput.trim()) return

    const member = juniorMembers.find(m => m.barcodeId === barcodeInput.trim())
    if (!member) {
      alert('Barcode not found. Please check and try again.')
      return
    }

    const today = new Date().toDateString()
    const existingRecord = attendanceRecords.find(
      r => r.juniorMemberId === member.id && new Date(r.date).toDateString() === today
    )

    try {
      if (existingRecord && existingRecord.status === 'dropped_off') {
        // This is a pickup
        const pickupBy = prompt(`Pickup for ${member.firstName} ${member.lastName}. Enter name of person picking up:`)
        if (!pickupBy) return

        const response = await fetch('/api/junior-church/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            barcodeId: barcodeInput.trim(),
            action: 'pickup',
            personName: pickupBy
          })
        })

        const result = await response.json()

        if (result.success) {
          alert(`${member.firstName} ${member.lastName} checked out successfully!`)
          if (result.wasOverride) {
            alert('WARNING: This was an override pickup by an unauthorized person.')
          }
        } else if (result.requiresOverride) {
          const confirmed = confirm(
            `${result.message}\n\nAuthorized persons: ${result.authorizedPersons.join(', ')}\n\nDo you want to override and allow this pickup?`
          )
          if (confirmed) {
            // Retry with override
            const overrideResponse = await fetch('/api/junior-church/attendance', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                barcodeId: barcodeInput.trim(),
                action: 'pickup',
                personName: pickupBy,
                override: true
              })
            })

            const overrideResult = await overrideResponse.json()
            if (overrideResult.success) {
              alert(`${member.firstName} ${member.lastName} checked out with override!`)
            } else {
              alert('Failed to process override checkout: ' + overrideResult.message)
            }
          }
        } else {
          alert('Checkout failed: ' + result.message)
        }
      } else {
        // This is a dropoff
        const dropoffBy = prompt(`Drop-off for ${member.firstName} ${member.lastName}. Enter name of person dropping off:`)
        if (!dropoffBy) return

        const response = await fetch('/api/junior-church/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            barcodeId: barcodeInput.trim(),
            action: 'dropoff',
            personName: dropoffBy
          })
        })

        const result = await response.json()

        if (result.success) {
          alert(`${member.firstName} ${member.lastName} checked in successfully!`)
        } else {
          alert('Check-in failed: ' + result.message)
        }
      }

      setBarcodeInput('')
      loadAttendanceRecords()
    } catch (error) {
      console.error('Error processing barcode check-in/out:', error)
      alert('An error occurred while processing the request.')
    }
  }

  const printBarcode = (member: JuniorMember) => {
    // Generate barcode content for printing
    const barcodeContent = `
      <div style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
        <h2>${member.firstName} ${member.lastName}</h2>
        <div style="font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
          ${member.barcodeId}
        </div>
        <p>Class: ${member.class}</p>
        <p>Parent: ${member.parentName}</p>
        <p>Phone: ${member.parentPhone}</p>
      </div>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(barcodeContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getClassColor = (className: string) => {
    switch (className) {
      case 'nursery': return 'bg-pink-100 text-pink-800'
      case 'toddlers': return 'bg-blue-100 text-blue-800'
      case 'preschool': return 'bg-green-100 text-green-800'
      case 'elementary': return 'bg-yellow-100 text-yellow-800'
      case 'teens': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredMembers = juniorMembers.filter(member => {
    const matchesSearch = member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.barcodeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = !classFilter || member.class === classFilter
    return matchesSearch && matchesClass
  })

  const todayAttendance = attendanceRecords.filter(record => 
    new Date(record.date).toDateString() === new Date().toDateString()
  )

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Junior Church</h1>
            <p className="text-gray-600 mt-1">Manage kids signups, drop-off and pick-up tracking</p>
          </div>
          <Button onClick={handleCreateMember} className="flex items-center gap-2" data-tour="add-child">
            <Plus className="w-4 h-4" />
            Register Child
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4" data-tour="attendance-stats">
          {['nursery', 'toddlers', 'preschool', 'elementary', 'teens'].map((className) => {
            const count = juniorMembers.filter(m => m.class === className && m.isActive).length
            return (
              <Card key={className}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 capitalize">{className}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <Baby className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Check-ins</p>
                  <p className="text-2xl font-bold">{todayAttendance.filter(r => r.status === 'dropped_off').length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Picked Up</p>
                  <p className="text-2xl font-bold">{todayAttendance.filter(r => r.status === 'picked_up').length}</p>
                </div>
                <XCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Still Here</p>
                  <p className="text-2xl font-bold">
                    {todayAttendance.filter(r => r.status === 'dropped_off').length - 
                     todayAttendance.filter(r => r.status === 'picked_up').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('live-dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'live-dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-1" />
              Live Dashboard
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab('checkin')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'checkin'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Check-in/Check-out
            </button>
            <button
              onClick={() => setActiveTab('admin-checkout')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'admin-checkout'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserCheck className="w-4 h-4 inline mr-1" />
              Admin Checkout
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'attendance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Attendance Records
            </button>
          </nav>
        </div>

        {activeTab === 'live-dashboard' && (
          <LiveDashboard
            attendanceRecords={attendanceRecords}
            juniorMembers={juniorMembers}
            onRefresh={() => {
              loadJuniorMembers()
              loadAttendanceRecords()
            }}
          />
        )}

        {activeTab === 'members' && (
          <>
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search children..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Classes</option>
                    <option value="nursery">Nursery</option>
                    <option value="toddlers">Toddlers</option>
                    <option value="preschool">Preschool</option>
                    <option value="elementary">Elementary</option>
                    <option value="teens">Teens</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="children-list">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{member.firstName} {member.lastName}</h3>
                        <p className="text-gray-600 text-sm">Age: {member.age}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassColor(member.class)}`}>
                        {member.class}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{member.parentName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 font-mono">{member.barcodeId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(member.dateOfBirth).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {member.allergies && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mb-4">
                        <p className="text-red-800 text-sm font-medium">⚠️ Allergies: {member.allergies}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printBarcode(member)}
                        className="flex items-center gap-1"
                      >
                        <Printer className="w-4 h-4" />
                        Print ID
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMember(member)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* handleDeleteMember(member.id) */}}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredMembers.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Baby className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No children found</p>
                  <Button onClick={handleCreateMember} className="mt-4">
                    Register your first child
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'checkin' && (
          <Card data-tour="check-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Barcode Check-in/Check-out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scan or Enter Barcode ID
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
                        placeholder="JC2024001"
                        className="font-mono"
                        onKeyPress={(e) => e.key === 'Enter' && handleBarcodeCheckIn()}
                      />
                      <Button onClick={handleBarcodeCheckIn}>
                        Process
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Instructions:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Scan the child's barcode for check-in or check-out</li>
                      <li>• First scan = Drop-off (requires guardian name)</li>
                      <li>• Second scan = Pick-up (verifies authorized person)</li>
                      <li>• System will alert for unauthorized pickup attempts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'admin-checkout' && (
          <AdminCheckout
            attendanceRecords={attendanceRecords}
            juniorMembers={juniorMembers}
            onCheckoutComplete={loadAttendanceRecords}
          />
        )}

        {activeTab === 'attendance' && (
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance - {new Date().toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAttendance.map((record) => {
                  const member = juniorMembers.find(m => m.id === record.juniorMemberId)
                  return (
                    <div key={record.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{member?.firstName} {member?.lastName}</h4>
                          <p className="text-sm text-gray-600">Class: {member?.class}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'dropped_off' ? 'bg-green-100 text-green-800' :
                          record.status === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs font-medium">Dropped off by</p>
                          <p className="text-gray-900 font-medium">{record.dropoffBy}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-medium">Drop-off time</p>
                          <p className="text-gray-900 font-medium">{record.dropoffTime ? new Date(record.dropoffTime).toLocaleTimeString() : '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-medium">Picked up by</p>
                          <p className="text-gray-900 font-medium">{record.pickedUpBy || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-medium">Pick-up time</p>
                          <p className="text-gray-900 font-medium">{record.pickupTime ? new Date(record.pickupTime).toLocaleTimeString() : '-'}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {todayAttendance.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No attendance records for today</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member Modal */}
        <Modal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title={isEditing ? 'Edit Child Registration' : 'Register New Child'}
          size="lg"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" form="junior-member-form">
                {isEditing ? 'Update' : 'Register'} Child
              </Button>
            </>
          }
        >
          <form id="junior-member-form" onSubmit={(e) => { e.preventDefault(); handleSaveMember(); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Child's first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Child's last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class *
              </label>
              <select
                value={formData.class}
                onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value as JuniorMember['class'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="nursery">Nursery (0-2 years)</option>
                <option value="toddlers">Toddlers (2-4 years)</option>
                <option value="preschool">Preschool (4-6 years)</option>
                <option value="elementary">Elementary (6-12 years)</option>
                <option value="teens">Teens (13+ years)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent/Guardian Name *
              </label>
              <Input
                value={formData.parentName}
                onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                placeholder="Primary parent/guardian"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Phone *
              </label>
              <Input
                value={formData.parentPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Email
              </label>
              <Input
                type="email"
                value={formData.parentEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                placeholder="parent@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Name *
              </label>
              <Input
                value={formData.emergencyContactName}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                placeholder="Emergency contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Phone *
              </label>
              <Input
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship *
              </label>
              <Input
                value={formData.emergencyContactRelationship}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelationship: e.target.value }))}
                placeholder="Father, Mother, Grandparent, etc."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authorized Pickup Persons *
              </label>
              <Input
                value={formData.pickupAuthority}
                onChange={(e) => setFormData(prev => ({ ...prev, pickupAuthority: e.target.value }))}
                placeholder="John Doe, Jane Doe, Grandma Smith (comma separated)"
              />
              <p className="text-xs text-gray-500 mt-1">
                List all people authorized to pick up this child
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergies
              </label>
              <Input
                value={formData.allergies}
                onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                placeholder="Peanuts, shellfish, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical Notes
              </label>
              <Input
                value={formData.medicalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, medicalNotes: e.target.value }))}
                placeholder="Medications, conditions, etc."
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active registration
              </label>
            </div>
          </form>
        </Modal>
        
        <OnboardingTour steps={juniorChurchTourSteps} storageKey="junior-church-tour-completed" />
      </div>
    </DashboardLayout>
  )
}
