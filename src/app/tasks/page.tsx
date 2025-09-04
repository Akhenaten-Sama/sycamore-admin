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
  Clock,
  CheckCircle,
  User,
  Users,
  Filter,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { Task, TaskPopulated, Team, Member } from '@/types'
import { formatDateConsistent } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Tasks Management' }
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskPopulated[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [selectedTask, setSelectedTask] = useState<TaskPopulated | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teamId: '',
    assigneeId: '',
    priority: 'medium' as Task['priority'],
    dueDate: '',
    isPublic: false
  })

  useEffect(() => {
    loadTasks()
    loadTeams()
    loadMembers()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getTasks({
        search: searchTerm,
        status: statusFilter || undefined,
        teamId: teamFilter || undefined
      })
      if (response.success && response.data) {
        setTasks(Array.isArray(response.data) ? response.data as TaskPopulated[] : [])
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTeams = async () => {
    try {
      const response = await apiClient.getTeams()
      if (response.success && response.data) {
        setTeams(Array.isArray(response.data) ? response.data as Team[] : [])
      }
    } catch (error) {
      console.error('Error loading teams:', error)
    }
  }

  const loadMembers = async () => {
    try {
      const response = await apiClient.getMembers()
      if (response.success && response.data) {
        setMembers(Array.isArray(response.data) ? response.data as Member[] : [])
      }
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  const handleCreateTask = () => {
    setSelectedTask(null)
    setIsEditing(false)
    setFormData({
      title: '',
      description: '',
      teamId: '',
      assigneeId: '',
      priority: 'medium',
      dueDate: '',
      isPublic: false
    })
    setIsModalOpen(true)
  }

  const handleEditTask = (task: TaskPopulated) => {
    setSelectedTask(task)
    setIsEditing(true)
    setFormData({
      title: task.title,
      description: task.description,
      teamId: task.teamId?.id || '',
      assigneeId: task.assigneeId?.id || '',
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      isPublic: task.isPublic
    })
    setIsModalOpen(true)
  }

  const handleSaveTask = async () => {
    try {
      const taskData = {
        ...formData,
        creatorId: '507f1f77bcf86cd799439011', // This should come from current user context
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
      }

      if (isEditing && selectedTask) {
        const response = await apiClient.updateTask(selectedTask.id, taskData)
        if (response.success) {
          loadTasks()
          setIsModalOpen(false)
        }
      } else {
        const response = await apiClient.createTask(taskData)
        if (response.success) {
          loadTasks()
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await apiClient.deleteTask(taskId)
        if (response.success) {
          loadTasks()
        }
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'in-progress': return 'text-blue-600 bg-blue-50'
      case 'assigned': return 'text-purple-600 bg-purple-50'
      case 'open': return 'text-orange-600 bg-orange-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  useEffect(() => {
    loadTasks()
  }, [searchTerm, statusFilter, teamFilter])

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks Management</h1>
            <p className="text-gray-600 mt-1">Manage team tasks and assignments</p>
          </div>
          <Button onClick={handleCreateTask} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Task
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
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
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Tasks ({tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading tasks...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
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
                        {task.teamId?.name || 'Unknown Team'}
                      </TableCell>
                      <TableCell>
                        {task.assigneeId ? (
                          `${task.assigneeId.firstName} ${task.assigneeId.lastName}`
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDateConsistent(new Date(task.dueDate))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No due date</span>
                        )}
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
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No tasks found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Task Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Task' : 'Create New Task'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Task description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team
                  </label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData(prev => ({ ...prev, teamId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee (Optional)
                  </label>
                  <select
                    value={formData.assigneeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
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
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Make task publicly visible
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
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
