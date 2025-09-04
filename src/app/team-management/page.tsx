'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Plus, 
  CheckSquare, 
  Clock,
  AlertCircle,
  Trash2,
  Edit
} from 'lucide-react'

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role?: string
}

interface Task {
  id: string
  title: string
  description: string
  assigneeId: string
  assigneeName: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  createdAt: string
}

interface Team {
  id: string
  name: string
  description: string
  members: TeamMember[]
}

export default function TeamManagementPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'members'>('overview')
  const [showCreateTask, setShowCreateTask] = useState(false)

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigneeId: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Only team leaders can access this page
    if (user.role !== 'team_leader') {
      router.push('/dashboard')
      return
    }

    fetchTeamData()
  }, [user, router])

  const fetchTeamData = async () => {
    try {
      // Get the team leader's assigned team
      const response = await fetch('/api/teams/my-team', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTeam(data.data)
        if (data.data) {
          fetchTasks(data.data.id)
        }
      }
    } catch (error) {
      console.error('Error fetching team:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTasks(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const createTask = async () => {
    if (!team || !newTask.title || !newTask.assigneeId) return

    try {
      const response = await fetch(`/api/teams/${team.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newTask),
      })

      if (response.ok) {
        setShowCreateTask(false)
        setNewTask({
          title: '',
          description: '',
          assigneeId: '',
          dueDate: '',
          priority: 'medium'
        })
        fetchTasks(team.id)
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!team) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Assigned</h3>
          <p className="text-gray-500">You are not currently assigned to lead any team.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Team' }
        ]} />

        {/* Team Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600 mt-1">{team.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{team.members.length}</div>
                <div className="text-sm text-gray-500">Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {tasks.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'tasks', 'members'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {team.members.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {member.firstName[0]}{member.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.firstName} {member.lastName}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  ))}
                  {team.members.length > 5 && (
                    <p className="text-sm text-gray-500">
                      +{team.members.length - 5} more members
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckSquare className="h-5 w-5 mr-2" />
                  Recent Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-500">{task.assigneeName}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Team Tasks</h3>
              <Button onClick={() => setShowCreateTask(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>

            {showCreateTask && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Task</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  />
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md"
                    placeholder="Task description"
                    rows={3}
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      className="p-2 border border-gray-300 rounded-md"
                      value={newTask.assigneeId}
                      onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}
                    >
                      <option value="">Select assignee</option>
                      {team.members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    />
                    <select
                      className="p-2 border border-gray-300 rounded-md"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={createTask}>Create Task</Button>
                    <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Assigned to: {task.assigneeName}</span>
                          {task.dueDate && (
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority} priority
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Team Members</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            <div className="grid gap-4">
              {team.members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {member.firstName[0]}{member.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{member.firstName} {member.lastName}</h4>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          {member.role && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded mt-1 inline-block">
                              {member.role}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )

  async function updateTaskStatus(taskId: string, status: string) {
    if (!team) return

    try {
      const response = await fetch(`/api/teams/${team.id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchTasks(team.id)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }
}
