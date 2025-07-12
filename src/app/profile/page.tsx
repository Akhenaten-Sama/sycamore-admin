'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Users,
  Crown,
  Camera,
  Save,
  Edit
} from 'lucide-react'
import { mockUser, mockTeams } from '@/lib/mock-data'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Profile' }
]

export default function ProfilePage() {
  const [user, setUser] = useState(mockUser)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  })

  const getUserTeams = () => {
    return mockTeams.filter(team => user.teamIds.includes(team.id))
  }

  const getTeamsLeading = () => {
    return mockTeams.filter(team => team.teamLeadId === user.id)
  }

  const handleSave = () => {
    // Here you would typically save to backend
    setUser(prev => ({
      ...prev,
      firstName: formData.firstName,
      lastName: formData.lastName
    }))
    setIsEditing(false)
  }

  const userTeams = getUserTeams()
  const teamsLeading = getTeamsLeading()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={breadcrumbItems} />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600">Manage your personal information and account details.</p>
            </div>
            <Button 
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "primary"}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  {/* Avatar */}
                  <div className="relative inline-block">
                    <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt="Profile" 
                          className="h-24 w-24 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-blue-700">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      )}
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                        <Camera className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Name */}
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>

                  {/* Role Badges */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {user.isAdmin && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <Crown className="h-4 w-4 mr-1" />
                        Admin
                      </span>
                    )}
                    {user.isTeamLead && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <Users className="h-4 w-4 mr-1" />
                        Team Lead
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Teams Member Of</span>
                    <span className="text-sm font-medium text-gray-900">{userTeams.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Teams Leading</span>
                    <span className="text-sm font-medium text-gray-900">{teamsLeading.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account Type</span>
                    <span className="text-sm font-medium text-gray-900">
                      {user.isAdmin ? 'Administrator' : 'Member'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teams */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">My Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userTeams.map(team => (
                    <div key={team.id} className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-700" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{team.name}</div>
                        <div className="text-sm text-gray-500">
                          {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {teamsLeading.some(t => t.id === team.id) && (
                        <Crown className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  ))}
                  {userTeams.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Not a member of any teams yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded-md text-gray-900">
                          {user.firstName}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded-md text-gray-900">
                          {user.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md text-gray-900">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{user.email}</span>
                        <span className="text-xs text-gray-500">(Cannot be changed)</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md text-gray-900">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{formData.phone || 'Not provided'}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      {isEditing ? (
                        <textarea
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter address"
                        />
                      ) : (
                        <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-md text-gray-900">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span>{formData.address || 'Not provided'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.emergencyContact.name}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                          }))}
                          placeholder="Contact name"
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded-md text-gray-900">
                          {formData.emergencyContact.name || 'Not provided'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      {isEditing ? (
                        <Input
                          type="tel"
                          value={formData.emergencyContact.phone}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                          }))}
                          placeholder="Contact phone"
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded-md text-gray-900">
                          {formData.emergencyContact.phone || 'Not provided'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship
                      </label>
                      {isEditing ? (
                        <select
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.emergencyContact.relationship}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                          }))}
                        >
                          <option value="">Select relationship</option>
                          <option value="spouse">Spouse</option>
                          <option value="parent">Parent</option>
                          <option value="child">Child</option>
                          <option value="sibling">Sibling</option>
                          <option value="friend">Friend</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded-md text-gray-900">
                          {formData.emergencyContact.relationship || 'Not provided'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Security */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-8 w-8 text-green-600" />
                        <div>
                          <div className="font-medium text-gray-900">Password</div>
                          <div className="text-sm text-gray-500">Last changed 30 days ago</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
