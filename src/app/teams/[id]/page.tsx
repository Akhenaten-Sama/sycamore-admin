'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  Clock,
  CheckCircle,
  User,
  Users,
  Calendar,
  ArrowLeft,
  Crown,
  CheckSquare,
  AlertCircle,
  Target
} from 'lucide-react'
import { Team, TaskPopulated, Member } from '@/types'
import { formatDateConsistent, parseApiTeam } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [tasks, setTasks] = useState<TaskPopulated[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTask, setSelectedTask] = useState<TaskPopulated | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium' as TaskPopulated['priority'],
    dueDate: '',
    isPublic: true
  })

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Teams', href: '/teams' },
    { label: team?.name || 'Team Details' }
  ]

  useEffect(() => {
    loadTeamData()
    loadAllMembers()
  }, [teamId])

  useEffect(() => {
    if (team) {
      loadTasks()
    }
  }, [team, statusFilter])

  const loadTeamData = async () => {
    setLoading(true)
    try {
      // Load team details
      const teamResponse = await apiClient.getTeam(teamId)
      if (teamResponse.success && teamResponse.data) {
        setTeam(parseApiTeam(teamResponse.data))
      }

      // Load team members
      const membersResponse = await apiClient.getMembers({ teamId })
      if (membersResponse.success && membersResponse.data) {
        setMembers(Array.isArray(membersResponse.data) ? membersResponse.data as Member[] : [])
      }
    } catch (error) {
      console.error('Error loading team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTasks = async () => {
    try {
      const response = await apiClient.getTasks({
        teamId,
        status: statusFilter || undefined
      })
      if (response.success && response.data) {
        setTasks(Array.isArray(response.data) ? response.data as TaskPopulated[] : [])
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const loadAllMembers = async () => {
    try {
      const response = await apiClient.getMembers()
      if (response.success && response.data) {
        setAllMembers(Array.isArray(response.data) ? response.data as Member[] : [])
      }
    } catch (error) {
      console.error('Error loading all members:', error)
    }
  }

  const handleCreateTask = () => {
    setSelectedTask(null)
    setIsEditing(false)
    setTaskFormData({
      title: '',
      description: '',
      assigneeId: '',
      priority: 'medium',
      dueDate: '',
      isPublic: true
    })
    setIsTaskModalOpen(true)
  }

  const handleEditTask = (task: TaskPopulated) => {
    setSelectedTask(task)
    setIsEditing(true)
    setTaskFormData({
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId?.id || '',
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      isPublic: task.isPublic
    })
    setIsTaskModalOpen(true)
  }

  const handleSaveTask = async () => {
    try {
      const taskData = {
        ...taskFormData,
        teamId,
        creatorId: '507f1f77bcf86cd799439011', // This should come from current user context
        dueDate: taskFormData.dueDate ? new Date(taskFormData.dueDate) : undefined
      }

      if (isEditing && selectedTask) {
        // Update task logic would go here
        console.log('Update task:', taskData)
      } else {
        const response = await apiClient.createTask(taskData)
        if (response.success) {
          loadTasks()
          setIsTaskModalOpen(false)
        }
      }
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-600" />
      case 'assigned': return <User className="w-4 h-4 text-orange-600" />
      case 'open': return <AlertCircle className="w-4 h-4 text-gray-600" />
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-blue-600 bg-blue-50'
      case 'low': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-8">Loading team details...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!team) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-8">Team not found</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600 mt-1">{team.description}</p>
            </div>
          </div>
          <Button onClick={handleCreateTask} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Task
          </Button>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Members</p>
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">
                    {tasks.filter(t => t.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">
                    {tasks.filter(t => t.status === 'in-progress').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{member.firstName} {member.lastName}</p>
                      {member.isTeamLead && <Crown className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Team Tasks ({filteredTasks.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Tasks Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {task.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.assigneeId ? (
                        `${task.assigneeId.firstName} ${task.assigneeId.lastName}`
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <span className="capitalize">{task.status.replace('-', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? formatDateConsistent(new Date(task.dueDate)) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTask(task)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* Delete logic */}}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No tasks found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Task Creation/Edit Modal */}
        {isTaskModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Task' : 'Create New Task'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <Input
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the task"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign to Member
                    </label>
                    <select
                      value={taskFormData.assigneeId}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={taskFormData.isPublic}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Make task visible on mobile app
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsTaskModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveTask}>
                  {isEditing ? 'Update' : 'Create'} Task
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
