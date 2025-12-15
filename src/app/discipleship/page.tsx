'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/common'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Discipleship Courses' }
]

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  duration: string // e.g., "8 weeks", "3 months"
  level: 'beginner' | 'intermediate' | 'advanced'
  category: 'discipleship' | 'leadership' | 'ministry' | 'life_skills' | 'other'
  prerequisites?: string[]
  isActive: boolean
  maxParticipants?: number
  currentParticipants: number
  startDate: Date
  endDate: Date
  schedule: string // e.g., "Mondays 7-9 PM"
  location: string
  createdAt: Date
}

interface CourseEnrollment {
  id: string
  courseId: string
  memberId: string
  status: 'enrolled' | 'completed' | 'dropped' | 'pending'
  enrolledAt: Date
  completedAt?: Date
  progress: number // 0-100
  certificateIssued: boolean
}

export default function DiscipleshipCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'courses' | 'enrollments'>('courses')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    duration: '',
    level: 'beginner' as Course['level'],
    category: 'discipleship' as Course['category'],
    maxParticipants: '',
    startDate: '',
    endDate: '',
    schedule: '',
    location: '',
    isActive: true
  })

  useEffect(() => {
    loadCourses()
    loadEnrollments()
  }, [])

  const loadCourses = async () => {
    setLoading(true)
    try {
      // Mock data for now - replace with actual API call
      const mockCourses: Course[] = [
        {
          id: '1',
          title: 'Foundations of Faith',
          description: 'A comprehensive introduction to Christian faith and basic biblical principles',
          instructor: 'Pastor John Smith',
          duration: '8 weeks',
          level: 'beginner',
          category: 'discipleship',
          isActive: true,
          maxParticipants: 25,
          currentParticipants: 18,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-03-28'),
          schedule: 'Wednesdays 7-9 PM',
          location: 'Main Sanctuary',
          createdAt: new Date()
        },
        {
          id: '2',
          title: 'Leadership Development',
          description: 'Developing Christ-centered leadership skills for ministry and life',
          instructor: 'Elder Sarah Johnson',
          duration: '12 weeks',
          level: 'intermediate',
          category: 'leadership',
          isActive: true,
          maxParticipants: 15,
          currentParticipants: 12,
          startDate: new Date('2024-02-15'),
          endDate: new Date('2024-05-09'),
          schedule: 'Saturdays 9-11 AM',
          location: 'Conference Room',
          createdAt: new Date()
        }
      ]
      setCourses(mockCourses)
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEnrollments = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockEnrollments: CourseEnrollment[] = [
        {
          id: '1',
          courseId: '1',
          memberId: 'member1',
          status: 'enrolled',
          enrolledAt: new Date('2024-01-15'),
          progress: 75,
          certificateIssued: false
        },
        {
          id: '2',
          courseId: '1',
          memberId: 'member2',
          status: 'completed',
          enrolledAt: new Date('2024-01-10'),
          completedAt: new Date('2024-03-20'),
          progress: 100,
          certificateIssued: true
        }
      ]
      setEnrollments(mockEnrollments)
    } catch (error) {
      console.error('Error loading enrollments:', error)
    }
  }

  const handleCreateCourse = () => {
    setSelectedCourse(null)
    setIsEditing(false)
    setFormData({
      title: '',
      description: '',
      instructor: '',
      duration: '',
      level: 'beginner',
      category: 'discipleship',
      maxParticipants: '',
      startDate: '',
      endDate: '',
      schedule: '',
      location: '',
      isActive: true
    })
    setIsModalOpen(true)
  }

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course)
    setIsEditing(true)
    setFormData({
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      duration: course.duration,
      level: course.level,
      category: course.category,
      maxParticipants: course.maxParticipants?.toString() || '',
      startDate: new Date(course.startDate).toISOString().split('T')[0],
      endDate: new Date(course.endDate).toISOString().split('T')[0],
      schedule: course.schedule,
      location: course.location,
      isActive: course.isActive
    })
    setIsModalOpen(true)
  }

  const handleSaveCourse = async () => {
    try {
      const courseData = {
        ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate)
      }

      // Replace with actual API call
      console.log('Saving course:', courseData)
      setIsModalOpen(false)
      loadCourses()
    } catch (error) {
      console.error('Error saving course:', error)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        // Replace with actual API call
        console.log('Deleting course:', courseId)
        loadCourses()
      } catch (error) {
        console.error('Error deleting course:', error)
      }
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'discipleship': return BookOpen
      case 'leadership': return GraduationCap
      case 'ministry': return Award
      default: return BookOpen
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'dropped': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || course.category === categoryFilter
    const matchesLevel = !levelFilter || course.level === levelFilter
    return matchesSearch && matchesCategory && matchesLevel
  })

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discipleship Courses</h1>
            <p className="text-gray-600 mt-1">Track courses taken by members for spiritual growth</p>
          </div>
          <Button onClick={handleCreateCourse} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Course
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.filter(c => c.isActive).length}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Enrollments</p>
                  <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
                </div>
                <User className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{enrollments.filter(e => e.status === 'completed').length}</p>
                </div>
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'courses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Courses
            </button>
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enrollments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Enrollments & Progress
            </button>
          </nav>
        </div>

        {activeTab === 'courses' && (
          <>
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="discipleship">Discipleship</option>
                    <option value="leadership">Leadership</option>
                    <option value="ministry">Ministry</option>
                    <option value="life_skills">Life Skills</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const CategoryIcon = getCategoryIcon(course.category)
                const progress = course.maxParticipants ? 
                  Math.round((course.currentParticipants / course.maxParticipants) * 100) : 0
                
                return (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-5 h-5 text-blue-600" />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                            {course.level}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2 text-gray-900">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{course.instructor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{course.duration} • {course.schedule}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {course.currentParticipants}
                            {course.maxParticipants && ` / ${course.maxParticipants}`} participants
                          </span>
                        </div>
                      </div>

                      {course.maxParticipants && (
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{progress}% filled</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCourse(course)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {filteredCourses.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No courses found</p>
                  <Button onClick={handleCreateCourse} className="mt-4">
                    Create your first course
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'enrollments' && (
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollments & Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrollments.map((enrollment) => {
                  const course = courses.find(c => c.id === enrollment.courseId)
                  return (
                    <div key={enrollment.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{course?.title || 'Unknown Course'}</h4>
                          <p className="text-sm text-gray-600">Member ID: {enrollment.memberId}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                          {enrollment.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Enrolled</p>
                          <p>{new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Progress</p>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${enrollment.progress}%` }}
                              ></div>
                            </div>
                            <span>{enrollment.progress}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500">Certificate</p>
                          <div className="flex items-center gap-1">
                            {enrollment.certificateIssued ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span>{enrollment.certificateIssued ? 'Issued' : 'Not Issued'}</span>
                          </div>
                        </div>
                        {enrollment.completedAt && (
                          <div>
                            <p className="text-gray-500">Completed</p>
                            <p>{new Date(enrollment.completedAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {enrollments.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No enrollments found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Modal */}
        <Modal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title={isEditing ? 'Edit Course' : 'Create New Course'}
          size="lg"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" form="course-form">
                {isEditing ? 'Update' : 'Create'} Course
              </Button>
            </>
          }
        >
          <form id="course-form" onSubmit={(e) => { e.preventDefault(); handleSaveCourse(); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Course title"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Course description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor *
              </label>
              <Input
                value={formData.instructor}
                onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                placeholder="Instructor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration *
              </label>
              <Input
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="8 weeks, 3 months, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level *
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as Course['level'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Course['category'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="discipleship">Discipleship</option>
                <option value="leadership">Leadership</option>
                <option value="ministry">Ministry</option>
                <option value="life_skills">Life Skills</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Participants
              </label>
              <Input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                placeholder="25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule *
              </label>
              <Input
                value={formData.schedule}
                onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                placeholder="Wednesdays 7-9 PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Main Sanctuary, Room 101, etc."
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
                Active (available for enrollment)
              </label>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
