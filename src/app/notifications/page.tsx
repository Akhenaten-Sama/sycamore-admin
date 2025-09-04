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
  Bell,
  Send,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Mail,
  Smartphone
} from 'lucide-react'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Notifications' }
]

interface NotificationTemplate {
  id: string
  name: string
  title: string
  message: string
  type: 'push' | 'email' | 'sms' | 'in_app'
  category: 'announcement' | 'reminder' | 'urgent' | 'event' | 'giving' | 'attendance'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface NotificationCampaign {
  id: string
  templateId: string
  name: string
  scheduledAt?: Date
  sentAt?: Date
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  recipients: {
    type: 'all' | 'members' | 'teams' | 'groups' | 'custom'
    targetIds?: string[] // team IDs, group IDs, or custom member IDs
    count: number
  }
  deliveryStats: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    failed: number
  }
  createdBy: string
  createdAt: Date
}

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  pushToken?: string
  preferences: {
    pushNotifications: boolean
    emailNotifications: boolean
    smsNotifications: boolean
  }
}

export default function NotificationsPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<NotificationCampaign | null>(null)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns' | 'analytics'>('templates')
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    message: '',
    type: 'push' as NotificationTemplate['type'],
    category: 'announcement' as NotificationTemplate['category'],
    isActive: true
  })

  const [campaignForm, setCampaignForm] = useState({
    templateId: '',
    name: '',
    scheduledAt: '',
    recipientType: 'all' as 'all' | 'members' | 'teams' | 'groups' | 'custom',
    targetIds: [] as string[],
    sendImmediately: true
  })

  useEffect(() => {
    loadTemplates()
    loadCampaigns()
    loadMembers()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      // Mock data for now - replace with actual API call
      const mockTemplates: NotificationTemplate[] = [
        {
          id: '1',
          name: 'Sunday Service Reminder',
          title: 'Don\'t Forget Sunday Service!',
          message: 'Join us this Sunday at 10 AM for worship and fellowship. See you there!',
          type: 'push',
          category: 'reminder',
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '2',
          name: 'Giving Campaign',
          title: 'Building Fund Update',
          message: 'We\'re 75% towards our building fund goal! Thank you for your continued support.',
          type: 'email',
          category: 'giving',
          isActive: true,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02')
        },
        {
          id: '3',
          name: 'Emergency Alert',
          title: 'Service Cancelled',
          message: 'Due to weather conditions, Sunday service has been cancelled. Stay safe!',
          type: 'push',
          category: 'urgent',
          isActive: false,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03')
        }
      ]
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCampaigns = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockCampaigns: NotificationCampaign[] = [
        {
          id: '1',
          templateId: '1',
          name: 'Weekly Sunday Reminder',
          scheduledAt: new Date('2024-12-25T08:00:00'),
          sentAt: new Date('2024-12-25T08:00:00'),
          status: 'sent',
          recipients: {
            type: 'all',
            count: 150
          },
          deliveryStats: {
            sent: 150,
            delivered: 148,
            opened: 95,
            clicked: 12,
            failed: 2
          },
          createdBy: 'admin',
          createdAt: new Date('2024-12-24')
        },
        {
          id: '2',
          templateId: '2',
          name: 'Building Fund Update',
          status: 'draft',
          recipients: {
            type: 'members',
            count: 120
          },
          deliveryStats: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            failed: 0
          },
          createdBy: 'admin',
          createdAt: new Date('2024-12-26')
        }
      ]
      setCampaigns(mockCampaigns)
    } catch (error) {
      console.error('Error loading campaigns:', error)
    }
  }

  const loadMembers = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockMembers: Member[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@email.com',
          phone: '+1234567890',
          pushToken: 'push_token_1',
          preferences: {
            pushNotifications: true,
            emailNotifications: true,
            smsNotifications: false
          }
        }
      ]
      setMembers(mockMembers)
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  const handleCreateTemplate = () => {
    setSelectedTemplate(null)
    setIsEditing(false)
    setTemplateForm({
      name: '',
      title: '',
      message: '',
      type: 'push',
      category: 'announcement',
      isActive: true
    })
    setIsTemplateModalOpen(true)
  }

  const handleEditTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setIsEditing(true)
    setTemplateForm({
      name: template.name,
      title: template.title,
      message: template.message,
      type: template.type,
      category: template.category,
      isActive: template.isActive
    })
    setIsTemplateModalOpen(true)
  }

  const handleSaveTemplate = async () => {
    try {
      const templateData = {
        ...templateForm,
        id: selectedTemplate?.id || Date.now().toString(),
        createdAt: selectedTemplate?.createdAt || new Date(),
        updatedAt: new Date()
      }

      // Replace with actual API call
      console.log('Saving template:', templateData)
      setIsTemplateModalOpen(false)
      loadTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleCreateCampaign = () => {
    setSelectedCampaign(null)
    setCampaignForm({
      templateId: '',
      name: '',
      scheduledAt: '',
      recipientType: 'all',
      targetIds: [],
      sendImmediately: true
    })
    setIsCampaignModalOpen(true)
  }

  const handleSendCampaign = async () => {
    try {
      const campaignData = {
        ...campaignForm,
        id: Date.now().toString(),
        status: campaignForm.sendImmediately ? 'sending' : 'scheduled' as NotificationCampaign['status'],
        recipients: {
          type: campaignForm.recipientType,
          targetIds: campaignForm.targetIds,
          count: getRecipientCount()
        },
        deliveryStats: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          failed: 0
        },
        createdBy: 'admin',
        createdAt: new Date(),
        scheduledAt: campaignForm.sendImmediately ? undefined : new Date(campaignForm.scheduledAt)
      }

      // Replace with actual API call
      console.log('Creating campaign:', campaignData)
      setIsCampaignModalOpen(false)
      loadCampaigns()
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  const getRecipientCount = () => {
    switch (campaignForm.recipientType) {
      case 'all':
        return members.length
      case 'members':
        return members.filter(m => m.preferences.pushNotifications).length
      case 'teams':
      case 'groups':
      case 'custom':
        return campaignForm.targetIds.length
      default:
        return 0
    }
  }

  const getTypeIcon = (type: NotificationTemplate['type']) => {
    switch (type) {
      case 'push': return <Smartphone className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'sms': return <MessageSquare className="w-4 h-4" />
      case 'in_app': return <Bell className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: NotificationTemplate['category']) => {
    switch (category) {
      case 'announcement': return 'bg-blue-100 text-blue-800'
      case 'reminder': return 'bg-yellow-100 text-yellow-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'event': return 'bg-green-100 text-green-800'
      case 'giving': return 'bg-purple-100 text-purple-800'
      case 'attendance': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: NotificationCampaign['status']) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4 text-gray-500" />
      case 'scheduled': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'sending': return <Send className="w-4 h-4 text-blue-500" />
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">Send push notifications, emails, and SMS to your congregation</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateTemplate} variant="outline" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Template
            </Button>
            <Button onClick={handleCreateCampaign} className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Send Notification
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Recipients</p>
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sent This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{campaigns.filter(c => c.status === 'sent').length}</p>
                </div>
                <Send className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Open Rate</p>
                  <p className="text-2xl font-bold">63%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{templates.filter(t => t.isActive).length}</p>
                </div>
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'campaigns'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Campaigns
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates or campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Title:</p>
                      <p className="text-sm text-gray-600">{template.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Message:</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{template.message}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCampaignForm(prev => ({ ...prev, templateId: template.id }))
                          handleCreateCampaign()
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredTemplates.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No templates found</p>
                <Button onClick={handleCreateTemplate} className="mt-4">
                  Create your first template
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => {
              const template = templates.find(t => t.id === campaign.templateId)
              return (
                <Card key={campaign.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(campaign.status)}
                          <h3 className="font-semibold">{campaign.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          Template: {template?.name || 'Unknown'}
                        </p>
                        {campaign.scheduledAt && (
                          <p className="text-sm text-gray-600">
                            Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                        campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Recipients</p>
                        <p className="font-medium">{campaign.recipients.count}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Sent</p>
                        <p className="font-medium">{campaign.deliveryStats.sent}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Delivered</p>
                        <p className="font-medium">{campaign.deliveryStats.delivered}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Opened</p>
                        <p className="font-medium">{campaign.deliveryStats.opened}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Open Rate</p>
                        <p className="font-medium">
                          {campaign.deliveryStats.sent > 0 
                            ? Math.round((campaign.deliveryStats.opened / campaign.deliveryStats.sent) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {filteredCampaigns.length === 0 && (
              <div className="text-center py-12">
                <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No campaigns found</p>
                <Button onClick={handleCreateCampaign} className="mt-4">
                  Send your first notification
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Sent</span>
                    <span className="font-medium">150</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delivered</span>
                    <span className="font-medium text-green-600">148 (98.7%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Opened</span>
                    <span className="font-medium text-blue-600">95 (63.3%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Failed</span>
                    <span className="font-medium text-red-600">2 (1.3%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['push', 'email', 'sms', 'in_app'].map((type) => {
                    const count = templates.filter(t => t.type === type).length
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(type as NotificationTemplate['type'])}
                          <span className="text-sm text-gray-600 capitalize">{type}</span>
                        </div>
                        <span className="font-medium">{count} templates</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Template Modal */}
        {isTemplateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Template' : 'Create New Template'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Sunday Service Reminder"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={templateForm.type}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value as NotificationTemplate['type'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="push">Push Notification</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="in_app">In-App</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as NotificationTemplate['category'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="announcement">Announcement</option>
                      <option value="reminder">Reminder</option>
                      <option value="urgent">Urgent</option>
                      <option value="event">Event</option>
                      <option value="giving">Giving</option>
                      <option value="attendance">Attendance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    value={templateForm.title}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Don't Forget Sunday Service!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    value={templateForm.message}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Join us this Sunday at 10 AM for worship and fellowship..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {templateForm.message.length}/160 characters (SMS limit)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={templateForm.isActive}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active template
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsTemplateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  {isEditing ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Modal */}
        {isCampaignModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Send Notification</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template *
                  </label>
                  <select
                    value={campaignForm.templateId}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, templateId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template</option>
                    {templates.filter(t => t.isActive).map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name *
                  </label>
                  <Input
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Weekly Sunday Reminder"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients *
                  </label>
                  <select
                    value={campaignForm.recipientType}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, recipientType: e.target.value as typeof campaignForm.recipientType }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Members</option>
                    <option value="members">Active Members Only</option>
                    <option value="teams">Specific Teams</option>
                    <option value="groups">Specific Groups</option>
                    <option value="custom">Custom Selection</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated recipients: {getRecipientCount()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="sendNow"
                      name="timing"
                      checked={campaignForm.sendImmediately}
                      onChange={() => setCampaignForm(prev => ({ ...prev, sendImmediately: true }))}
                    />
                    <label htmlFor="sendNow" className="text-sm text-gray-700">
                      Send immediately
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="schedule"
                      name="timing"
                      checked={!campaignForm.sendImmediately}
                      onChange={() => setCampaignForm(prev => ({ ...prev, sendImmediately: false }))}
                    />
                    <label htmlFor="schedule" className="text-sm text-gray-700">
                      Schedule for later
                    </label>
                  </div>
                </div>

                {!campaignForm.sendImmediately && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Date & Time *
                    </label>
                    <Input
                      type="datetime-local"
                      value={campaignForm.scheduledAt}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    />
                  </div>
                )}

                {campaignForm.templateId && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Preview:</h4>
                    {(() => {
                      const template = templates.find(t => t.id === campaignForm.templateId)
                      return template ? (
                        <div>
                          <p className="text-sm font-medium">{template.title}</p>
                          <p className="text-sm text-gray-600">{template.message}</p>
                        </div>
                      ) : null
                    })()}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsCampaignModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendCampaign}
                  disabled={!campaignForm.templateId || !campaignForm.name}
                >
                  {campaignForm.sendImmediately ? 'Send Now' : 'Schedule'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
