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
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  CreditCard,
  Banknote,
  Building,
  Heart,
  ChevronDown,
  Filter
} from 'lucide-react'
import { Giving, GivingPopulated, Member } from '@/types'
import { formatDateConsistent } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Finance & Giving' }
]

export default function GivingPage() {
  const [givings, setGivings] = useState<GivingPopulated[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [memberFilter, setMemberFilter] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedGiving, setSelectedGiving] = useState<GivingPopulated | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalRecords: 0,
    monthlyTotal: 0,
    averageGiving: 0
  })
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    currency: 'USD',
    method: 'cash' as Giving['method'],
    category: 'tithe' as Giving['category'],
    description: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringFrequency: undefined as Giving['recurringFrequency']
  })

  useEffect(() => {
    loadGivings()
    loadMembers()
  }, [])

  const loadGivings = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (categoryFilter) params.category = categoryFilter
      if (methodFilter) params.method = methodFilter
      if (memberFilter) params.memberId = memberFilter
      if (dateRange.start) params.startDate = dateRange.start
      if (dateRange.end) params.endDate = dateRange.end

      const response = await apiClient.getGivingRecords(params)
      if (response.success && response.data) {
        const givingData = Array.isArray(response.data) ? response.data as GivingPopulated[] : []
        setGivings(givingData)
        
        // Calculate stats
        const totalAmount = givingData.reduce((sum: number, giving: GivingPopulated) => sum + giving.amount, 0)
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const monthlyTotal = givingData
          .filter((giving: GivingPopulated) => {
            const givingDate = new Date(giving.date)
            return givingDate.getMonth() === currentMonth && givingDate.getFullYear() === currentYear
          })
          .reduce((sum: number, giving: GivingPopulated) => sum + giving.amount, 0)
        
        setStats({
          totalAmount,
          totalRecords: givingData.length,
          monthlyTotal,
          averageGiving: givingData.length > 0 ? totalAmount / givingData.length : 0
        })
      }
    } catch (error) {
      console.error('Error loading givings:', error)
    } finally {
      setLoading(false)
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

  const handleCreateGiving = () => {
    setSelectedGiving(null)
    setIsEditing(false)
    setFormData({
      memberId: '',
      amount: '',
      currency: 'USD',
      method: 'cash',
      category: 'tithe',
      description: '',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringFrequency: undefined
    })
    setIsModalOpen(true)
  }

  const handleEditGiving = (giving: GivingPopulated) => {
    setSelectedGiving(giving)
    setIsEditing(true)
    setFormData({
      memberId: giving.memberId?.id || '',
      amount: giving.amount.toString(),
      currency: giving.currency,
      method: giving.method,
      category: giving.category,
      description: giving.description || '',
      date: new Date(giving.date).toISOString().split('T')[0],
      isRecurring: giving.isRecurring,
      recurringFrequency: giving.recurringFrequency
    })
    setIsModalOpen(true)
  }

  const handleSaveGiving = async () => {
    try {
      const givingData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date)
      }

      if (isEditing && selectedGiving) {
        const response = await apiClient.updateGivingRecord(selectedGiving.id, givingData)
        if (response.success) {
          loadGivings()
          setIsModalOpen(false)
        }
      } else {
        const response = await apiClient.createGivingRecord(givingData)
        if (response.success) {
          loadGivings()
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error('Error saving giving:', error)
    }
  }

  const handleDeleteGiving = async (givingId: string) => {
    if (confirm('Are you sure you want to delete this giving record?')) {
      try {
        const response = await apiClient.deleteGivingRecord(givingId)
        if (response.success) {
          loadGivings()
        }
      } catch (error) {
        console.error('Error deleting giving:', error)
      }
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tithe': return Heart
      case 'offering': return DollarSign
      case 'building_fund': return Building
      case 'missions': return TrendingUp
      default: return DollarSign
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return CreditCard
      case 'cash': return Banknote
      case 'bank_transfer': return Building
      default: return DollarSign
    }
  }

  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: { [key: string]: string } = {
      'NGN': '₦',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'GHS': 'GH₵',
      'ZAR': 'R',
      'KES': 'KSh'
    };
    return symbols[currencyCode] || '$';
  };

  useEffect(() => {
    loadGivings()
  }, [categoryFilter, methodFilter, memberFilter, dateRange])

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finance & Giving</h1>
            <p className="text-gray-600 mt-1">Track and manage church finances and giving records</p>
          </div>
          <Button onClick={handleCreateGiving} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Record Giving
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Giving</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalAmount.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.monthlyTotal.toLocaleString()}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Paystack Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {givings.filter(g => g.method === 'paystack').length}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="tithe">Tithe</option>
                <option value="offering">Offering</option>
                <option value="special_offering">Special Offering</option>
                <option value="building_fund">Building Fund</option>
                <option value="missions">Missions</option>
                <option value="youth">Youth Ministry</option>
                <option value="outreach">Community Outreach</option>
                <option value="special">Special Projects</option>
                <option value="other">Other</option>
              </select>
              
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="paystack">Paystack</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="other">Other</option>
              </select>
              
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Members</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
              
              <Input
                type="date"
                placeholder="Start Date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              
              <Input
                type="date"
                placeholder="End Date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
              
              <Button
                variant="outline"
                onClick={() => {
                  setCategoryFilter('')
                  setMethodFilter('')
                  setMemberFilter('')
                  setDateRange({ start: '', end: '' })
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Givings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Giving Records ({givings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading giving records...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Recurring</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {givings.map((giving) => {
                    const CategoryIcon = getCategoryIcon(giving.category)
                    const MethodIcon = getMethodIcon(giving.method)
                    return (
                      <TableRow key={giving.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {giving.memberId ? 
                              `${giving.memberId.firstName} ${giving.memberId.lastName}` :
                              'Unknown Member'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-green-600">
                            {getCurrencySymbol(giving.currency)}{giving.amount.toLocaleString()} {giving.currency}
                          </div>
                          {giving.paymentReference && (
                            <div className="text-xs text-gray-500 mt-1">
                              Ref: {giving.paymentReference}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="w-4 h-4 text-gray-400" />
                            <span className="capitalize">{giving.category.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MethodIcon className="w-4 h-4 text-gray-400" />
                            <span className="capitalize">{giving.method.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDateConsistent(new Date(giving.date))}
                        </TableCell>
                        <TableCell>
                          {giving.isRecurring ? (
                            <span className="text-green-600 text-sm">
                              Yes ({giving.recurringFrequency})
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditGiving(giving)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteGiving(giving.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {givings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No giving records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Giving Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Giving Record' : 'Record New Giving'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member *
                  </label>
                  <select
                    value={formData.memberId}
                    onChange={(e) => setFormData(prev => ({ ...prev, memberId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">$ USD</option>
                    <option value="NGN">₦ NGN</option>
                    <option value="EUR">€ EUR</option>
                    <option value="GBP">£ GBP</option>
                    <option value="CAD">C$ CAD</option>
                    <option value="GHS">GH₵ GHS</option>
                    <option value="ZAR">R ZAR</option>
                    <option value="KES">KSh KES</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Giving['category'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="tithe">Tithe</option>
                    <option value="offering">Offering</option>
                    <option value="special_offering">Special Offering</option>
                    <option value="building_fund">Building Fund</option>
                    <option value="missions">Missions</option>
                    <option value="youth">Youth Ministry</option>
                    <option value="outreach">Community Outreach</option>
                    <option value="special">Special Projects</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value as Giving['method'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="paystack">Paystack</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="isRecurring" className="text-sm text-gray-700">
                      This is a recurring giving
                    </label>
                  </div>

                  {formData.isRecurring && (
                    <select
                      value={formData.recurringFrequency || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurringFrequency: e.target.value as Giving['recurringFrequency'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Frequency</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveGiving}>
                  {isEditing ? 'Update' : 'Record'} Giving
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
