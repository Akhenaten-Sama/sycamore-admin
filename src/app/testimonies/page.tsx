'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ViewModal, OnboardingTour } from '@/components/common'
import { testimoniesTourSteps } from '@/components/common/tourSteps'
import { 
  Search, 
  Eye,
  Check,
  X,
  Trash2,
  Heart,
  Calendar,
  User,
  Filter
} from 'lucide-react'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Praise Reports' }
]

interface Testimony {
  _id: string
  title: string
  testimony: string
  category: string
  submittedBy: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  submitterName: string
  submitterEmail?: string
  isApproved: boolean
  isPublic: boolean
  approvedBy?: {
    _id: string
    firstName: string
    lastName: string
  }
  approvedAt?: string
  rejectionReason?: string
  likes: number
  createdAt: string
  updatedAt: string
}

export default function TestimoniesPage() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([])
  const [filteredTestimonies, setFilteredTestimonies] = useState<Testimony[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [selectedTestimony, setSelectedTestimony] = useState<Testimony | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTestimonies()
  }, [statusFilter])

  useEffect(() => {
    filterTestimonies()
  }, [testimonies, searchTerm])

  const loadTestimonies = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/testimonies?status=${statusFilter}`)
      const data = await response.json()
      
      if (data.success) {
        setTestimonies(data.data)
      }
    } catch (error) {
      console.error('Error loading testimonies:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTestimonies = () => {
    let filtered = testimonies

    if (searchTerm) {
      filtered = filtered.filter(testimony =>
        testimony.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testimony.testimony.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testimony.submitterName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTestimonies(filtered)
  }

  const viewTestimony = (testimony: Testimony) => {
    setSelectedTestimony(testimony)
    setIsViewModalOpen(true)
  }

  const approveTestimony = async (testimonyId: string) => {
    try {
      const response = await fetch(`/api/testimonies/${testimonyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isApproved: true,
          approvedBy: 'current-user-id' // TODO: Get from auth context
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        loadTestimonies()
        setIsViewModalOpen(false)
      }
    } catch (error) {
      console.error('Error approving testimony:', error)
    }
  }

  const openRejectModal = (testimony: Testimony) => {
    setSelectedTestimony(testimony)
    setRejectionReason('')
    setIsRejectModalOpen(true)
  }

  const rejectTestimony = async () => {
    if (!selectedTestimony) return

    try {
      const response = await fetch(`/api/testimonies/${selectedTestimony._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isApproved: false,
          rejectionReason
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        loadTestimonies()
        setIsRejectModalOpen(false)
        setIsViewModalOpen(false)
      }
    } catch (error) {
      console.error('Error rejecting testimony:', error)
    }
  }

  const deleteTestimony = async (testimonyId: string) => {
    if (!confirm('Are you sure you want to delete this testimony? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/testimonies/${testimonyId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        loadTestimonies()
        setIsViewModalOpen(false)
      }
    } catch (error) {
      console.error('Error deleting testimony:', error)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Healing': 'bg-green-100 text-green-800',
      'Financial Breakthrough': 'bg-blue-100 text-blue-800',
      'Salvation': 'bg-purple-100 text-purple-800',
      'Deliverance': 'bg-red-100 text-red-800',
      'Answered Prayer': 'bg-yellow-100 text-yellow-800',
      'General': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors['General']
  }

  const stats = {
    total: testimonies.length,
    pending: testimonies.filter(t => !t.isApproved).length,
    approved: testimonies.filter(t => t.isApproved).length,
    totalLikes: testimonies.reduce((sum, t) => sum + (t.likes || 0), 0)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Praise Reports</h1>
            <p className="text-gray-600 mt-1">
              Manage praise reports and testimonies from members
            </p>
          </div>
        </div>

        {/* Onboarding Tour */}
        <OnboardingTour steps={testimoniesTourSteps} storageKey="testimonies-tour-completed" />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Praise Reports</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalLikes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card data-tour="testimony-filters">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search praise reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('approved')}
                >
                  Approved
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Testimonies List */}
        <Card data-tour="testimony-list">
          <CardHeader>
            <CardTitle>Praise Reports ({filteredTestimonies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-900">Loading praise reports...</div>
            ) : filteredTestimonies.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No praise reports found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTestimonies.map((testimony) => (
                  <div
                    key={testimony._id}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">{testimony.title}</h3>
                          <Badge className={getCategoryColor(testimony.category)}>
                            {testimony.category}
                          </Badge>
                          {testimony.isApproved ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {testimony.testimony}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {testimony.submitterName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(testimony.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {testimony.likes || 0} likes
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2" data-tour="approve-reject">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewTestimony(testimony)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!testimony.isApproved && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => approveTestimony(testimony._id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRejectModal(testimony)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTestimony(testimony._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Testimony Modal */}
        <ViewModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          title={selectedTestimony?.title || ''}
          description={
            selectedTestimony ? (
              <Badge className={getCategoryColor(selectedTestimony.category)}>
                {selectedTestimony.category}
              </Badge>
            ) : undefined
          }
          size="lg"
          data={selectedTestimony ? [
            { label: 'Testimony', value: selectedTestimony.testimony, fullWidth: true },
            { label: 'Submitted By', value: selectedTestimony.submitterName },
            { label: 'Email', value: selectedTestimony.submitterEmail || 'N/A' },
            { label: 'Submitted Date', value: new Date(selectedTestimony.createdAt).toLocaleDateString() },
            { label: 'Status', value: selectedTestimony.isApproved ? 'Approved' : 'Pending' },
            ...(selectedTestimony.isApproved && selectedTestimony.approvedBy ? [
              { label: 'Approved By', value: `${selectedTestimony.approvedBy.firstName} ${selectedTestimony.approvedBy.lastName}` },
              { label: 'Approved Date', value: selectedTestimony.approvedAt ? new Date(selectedTestimony.approvedAt).toLocaleDateString() : 'N/A' }
            ] : []),
            ...(selectedTestimony.rejectionReason ? [
              { label: 'Rejection Reason', value: selectedTestimony.rejectionReason, fullWidth: true }
            ] : [])
          ] : []}
          footer={
            selectedTestimony && !selectedTestimony.isApproved ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => openRejectModal(selectedTestimony)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => approveTestimony(selectedTestimony._id)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            ) : undefined
          }
        />

        {/* Reject Testimony Modal */}
        <ViewModal
          open={isRejectModalOpen}
          onOpenChange={setIsRejectModalOpen}
          title="Reject Praise Report"
          description="Please provide a reason for rejecting this praise report"
          data={[]}
          footer={
            <>
              <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={rejectTestimony}
                disabled={!rejectionReason.trim()}
                variant="danger"
              >
                Reject Praise Report
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason</Label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="mt-1 flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>
          </div>
        </ViewModal>
      </div>
    </DashboardLayout>
  )
}
