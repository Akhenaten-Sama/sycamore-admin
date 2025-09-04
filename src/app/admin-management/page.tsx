'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  Users,
  Crown,
  UserCheck,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Admin Management' }
]

interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'super_admin' | 'admin' | 'team_leader'
  permissions: string[]
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  createdBy?: string
  teamIds?: string[]
  memberId?: string
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'admin' as AdminUser['role'],
    permissions: [] as string[],
    isActive: true,
    teamIds: [] as string[]
  })

  const availablePermissions: Permission[] = [
    // Member Management
    { id: 'members.view', name: 'View Members', description: 'View member profiles', category: 'Members' },
    { id: 'members.create', name: 'Create Members', description: 'Add new members', category: 'Members' },
    { id: 'members.edit', name: 'Edit Members', description: 'Modify member information', category: 'Members' },
    { id: 'members.delete', name: 'Delete Members', description: 'Remove members', category: 'Members' },
    
    // Team Management
    { id: 'teams.view', name: 'View Teams', description: 'View team information', category: 'Teams' },
    { id: 'teams.create', name: 'Create Teams', description: 'Create new teams', category: 'Teams' },
    { id: 'teams.edit', name: 'Edit Teams', description: 'Modify team details', category: 'Teams' },
    { id: 'teams.delete', name: 'Delete Teams', description: 'Remove teams', category: 'Teams' },
    
    // Event Management
    { id: 'events.view', name: 'View Events', description: 'View event information', category: 'Events' },
    { id: 'events.create', name: 'Create Events', description: 'Create new events', category: 'Events' },
    { id: 'events.edit', name: 'Edit Events', description: 'Modify event details', category: 'Events' },
    { id: 'events.delete', name: 'Delete Events', description: 'Cancel/remove events', category: 'Events' },
    
    // Financial Management
    { id: 'giving.view', name: 'View Giving', description: 'View giving records', category: 'Financial' },
    { id: 'giving.edit', name: 'Edit Giving', description: 'Modify giving records', category: 'Financial' },
    { id: 'reports.financial', name: 'Financial Reports', description: 'Access financial reports', category: 'Financial' },
    
    // Content Management
    { id: 'blog.view', name: 'View Blog', description: 'View blog posts', category: 'Content' },
    { id: 'blog.create', name: 'Create Blog', description: 'Write new blog posts', category: 'Content' },
    { id: 'blog.edit', name: 'Edit Blog', description: 'Modify blog posts', category: 'Content' },
    { id: 'blog.delete', name: 'Delete Blog', description: 'Remove blog posts', category: 'Content' },
    
    // System Management
    { id: 'admin.view', name: 'View Admins', description: 'View admin users', category: 'System' },
    { id: 'admin.create', name: 'Create Admins', description: 'Create new admin accounts', category: 'System' },
    { id: 'admin.edit', name: 'Edit Admins', description: 'Modify admin accounts', category: 'System' },
    { id: 'admin.delete', name: 'Delete Admins', description: 'Remove admin accounts', category: 'System' },
    { id: 'settings.manage', name: 'Manage Settings', description: 'System configuration', category: 'System' }
  ]

  useEffect(() => {
    loadCurrentUser()
    loadAdmins()
  }, [])

  const loadCurrentUser = () => {
    const user = localStorage.getItem('user')
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
  }

  const loadAdmins = async () => {
    setLoading(true)
    try {
      // Mock data for now - replace with actual API call
      const mockAdmins: AdminUser[] = [
        {
          id: '1',
          email: 'superadmin@church.org',
          firstName: 'Super',
          lastName: 'Admin',
          role: 'super_admin',
          permissions: availablePermissions.map(p => p.id),
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date('2024-01-01'),
          createdBy: 'System'
        },
        {
          id: '2',
          email: 'admin@church.org',
          firstName: 'Church',
          lastName: 'Admin',
          role: 'admin',
          permissions: [
            'members.view', 'members.create', 'members.edit',
            'teams.view', 'teams.create', 'teams.edit',
            'events.view', 'events.create', 'events.edit',
            'giving.view', 'blog.view', 'blog.create', 'blog.edit'
          ],
          isActive: true,
          lastLogin: new Date('2024-12-20'),
          createdAt: new Date('2024-01-02'),
          createdBy: 'Super Admin'
        },
        {
          id: '3',
          email: 'leader@church.org',
          firstName: 'Team',
          lastName: 'Leader',
          role: 'team_leader',
          permissions: ['teams.view', 'teams.edit', 'members.view'],
          isActive: true,
          lastLogin: new Date('2024-12-21'),
          createdAt: new Date('2024-02-01'),
          createdBy: 'Church Admin',
          teamIds: ['team1', 'team2']
        }
      ]
      setAdmins(mockAdmins)
    } catch (error) {
      console.error('Error loading admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDefaultPermissions = (role: AdminUser['role']) => {
    switch (role) {
      case 'super_admin':
        return availablePermissions.map(p => p.id)
      case 'admin':
        return [
          'members.view', 'members.create', 'members.edit',
          'teams.view', 'teams.create', 'teams.edit',
          'events.view', 'events.create', 'events.edit',
          'giving.view', 'blog.view', 'blog.create', 'blog.edit'
        ]
      case 'team_leader':
        return ['teams.view', 'teams.edit', 'members.view']
      default:
        return []
    }
  }

  const handleCreateAdmin = () => {
    setSelectedAdmin(null)
    setIsEditing(false)
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'admin',
      permissions: getDefaultPermissions('admin'),
      isActive: true,
      teamIds: []
    })
    setIsModalOpen(true)
  }

  const handleEditAdmin = (admin: AdminUser) => {
    setSelectedAdmin(admin)
    setIsEditing(true)
    setFormData({
      email: admin.email,
      password: '', // Don't populate password for editing
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
      teamIds: admin.teamIds || []
    })
    setIsModalOpen(true)
  }

  const handleSaveAdmin = async () => {
    try {
      const adminData = {
        ...formData,
        id: selectedAdmin?.id || Date.now().toString(),
        createdAt: selectedAdmin?.createdAt || new Date(),
        createdBy: currentUser?.firstName + ' ' + currentUser?.lastName
      }

      // Replace with actual API call
      console.log('Saving admin:', adminData)
      setIsModalOpen(false)
      loadAdmins()
    } catch (error) {
      console.error('Error saving admin:', error)
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      try {
        // Replace with actual API call
        console.log('Deleting admin:', adminId)
        loadAdmins()
      } catch (error) {
        console.error('Error deleting admin:', error)
      }
    }
  }

  const handleToggleActive = async (adminId: string, isActive: boolean) => {
    try {
      // Replace with actual API call
      console.log('Toggling admin status:', adminId, isActive)
      loadAdmins()
    } catch (error) {
      console.error('Error updating admin status:', error)
    }
  }

  const getRoleIcon = (role: AdminUser['role']) => {
    switch (role) {
      case 'super_admin': return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />
      case 'team_leader': return <UserCheck className="w-4 h-4 text-green-500" />
      default: return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleColor = (role: AdminUser['role']) => {
    switch (role) {
      case 'super_admin': return 'bg-yellow-100 text-yellow-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'team_leader': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canManageAdmin = (admin: AdminUser) => {
    if (currentUser?.role === 'super_admin') return true
    if (currentUser?.role === 'admin' && admin.role === 'team_leader') return true
    return false
  }

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || admin.role === roleFilter
    return matchesSearch && matchesRole
  })

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
            <p className="text-gray-600 mt-1">Manage admin users and their permissions</p>
          </div>
          {currentUser?.role === 'super_admin' && (
            <Button onClick={handleCreateAdmin} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Admin
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Super Admins</p>
                  <p className="text-2xl font-bold">{admins.filter(a => a.role === 'super_admin').length}</p>
                </div>
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-bold">{admins.filter(a => a.role === 'admin').length}</p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Team Leaders</p>
                  <p className="text-2xl font-bold">{admins.filter(a => a.role === 'team_leader').length}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">{admins.filter(a => a.isActive).length}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search admins..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="team_leader">Team Leader</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Last Login</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{admin.firstName} {admin.lastName}</div>
                          <div className="text-sm text-gray-600">{admin.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(admin.role)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(admin.role)}`}>
                            {admin.role.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {admin.isActive ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm ${admin.isActive ? 'text-green-700' : 'text-red-700'}`}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {canManageAdmin(admin) && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAdmin(admin)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(admin.id, !admin.isActive)}
                              >
                                {admin.isActive ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </Button>
                              {admin.role !== 'super_admin' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteAdmin(admin.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredAdmins.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No admins found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admin Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Admin User' : 'Create New Admin'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@church.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {isEditing ? '(leave blank to keep current)' : '*'}
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as AdminUser['role']
                      setFormData(prev => ({ 
                        ...prev, 
                        role: newRole,
                        permissions: getDefaultPermissions(newRole)
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={currentUser?.role !== 'super_admin' && formData.role === 'super_admin'}
                  >
                    {currentUser?.role === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                    <option value="admin">Admin</option>
                    <option value="team_leader">Team Leader</option>
                  </select>
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
                    Active user
                  </label>
                </div>
              </div>

              {/* Permissions */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Permissions</h3>
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        {category}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions.map((permission) => (
                          <div key={permission.id} className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              id={permission.id}
                              checked={formData.permissions.includes(permission.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: [...prev.permissions, permission.id]
                                  }))
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(p => p !== permission.id)
                                  }))
                                }
                              }}
                              className="mt-1 rounded"
                              disabled={formData.role === 'super_admin'}
                            />
                            <div>
                              <label htmlFor={permission.id} className="text-sm font-medium text-gray-700">
                                {permission.name}
                              </label>
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveAdmin}>
                  {isEditing ? 'Update' : 'Create'} Admin
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
