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
  FileText,
  Eye,
  Calendar,
  User,
  Tag
} from 'lucide-react'
import { BlogPost } from '@/types'
import { formatDateConsistent, getCurrentDate, parseApiBlogPost } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Blog Management' }
]

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author: '',
    tags: '',
    featuredImage: '',
    isDraft: true
  })

  useEffect(() => {
    loadBlogPosts()
  }, [])

  const loadBlogPosts = async () => {
    try {
      const response = await apiClient.getBlogPosts()
      if (response.success && response.data) {
        const postsWithParsedData = (response.data as any[]).map(parseApiBlogPost)
        setBlogPosts(postsWithParsedData)
      }
    } catch (error) {
      console.error('Failed to load blog posts:', error)
    }
  }

  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleAddPost = () => {
    setSelectedPost(null)
    setIsEditing(false)
    setIsModalOpen(true)
  }

  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleDeletePost = async (postId: string) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      try {
        const response = await apiClient.deleteBlogPost(postId)
        if (response.success) {
          setBlogPosts(blogPosts.filter(p => p.id !== postId))
        } else {
          alert('Failed to delete blog post')
        }
      } catch (error) {
        console.error('Failed to delete blog post:', error)
        alert('Failed to delete blog post')
      }
    }
  }

  const togglePublishStatus = async (postId: string) => {
    try {
      const post = blogPosts.find(p => p.id === postId)
      if (!post) return

      const updatedPost = { 
        ...post,
        isDraft: !post.isDraft,
        publishedAt: !post.isDraft ? getCurrentDate() : undefined
      }

      const response = await apiClient.updateBlogPost(postId, updatedPost)
      if (response.success) {
        setBlogPosts(blogPosts.map(p => p.id === postId ? updatedPost : p))
      } else {
        alert('Failed to update post status')
      }
    } catch (error) {
      console.error('Failed to update post status:', error)
      alert('Failed to update post status')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formElement = e.target as HTMLFormElement
      const formDataObj = new FormData(formElement)
      
      const postData = {
        title: formDataObj.get('title') as string,
        slug: formDataObj.get('slug') as string,
        excerpt: formDataObj.get('excerpt') as string,
        content: formDataObj.get('content') as string,
        author: formDataObj.get('author') as string,
        featuredImage: formDataObj.get('featuredImage') as string,
        tags: (formDataObj.get('tags') as string).split(',').map(tag => tag.trim()).filter(Boolean),
        isDraft: formDataObj.get('isDraft') === 'on'
      }

      let response
      if (isEditing && selectedPost) {
        response = await apiClient.updateBlogPost(selectedPost.id, postData)
      } else {
        response = await apiClient.createBlogPost(postData)
      }

      if (response.success) {
        setIsModalOpen(false)
        loadBlogPosts() // Reload the posts
      } else {
        alert('Failed to save blog post: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to save blog post:', error)
      alert('Failed to save blog post')
    } finally {
      setLoading(false)
    }
  }

  const publishedPosts = blogPosts.filter(p => !p.isDraft)
  const draftPosts = blogPosts.filter(p => p.isDraft)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={breadcrumbItems} />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
              <p className="text-gray-600">Create and manage blog posts for your church website.</p>
            </div>
            <Button onClick={handleAddPost}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Posts</p>
                  <p className="text-2xl font-semibold text-gray-900">{blogPosts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Published</p>
                  <p className="text-2xl font-semibold text-gray-900">{publishedPosts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Edit className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Drafts</p>
                  <p className="text-2xl font-semibold text-gray-900">{draftPosts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Published ({publishedPosts.length})
                </Button>
                <Button variant="outline" size="sm">
                  Drafts ({draftPosts.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blog Posts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Posts ({filteredPosts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="font-medium text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {post.excerpt}
                        </div>
                        <div className="text-xs text-gray-400">
                          Slug: {post.slug}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{post.author}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.isDraft
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {post.isDraft ? 'Draft' : 'Published'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {post.publishedAt 
                            ? formatDateConsistent(post.publishedAt)
                            : 'Not published'
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPost(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublishStatus(post.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Post Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Post' : 'Create New Post'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <Input
                    name="title"
                    defaultValue={selectedPost?.title || ''}
                    placeholder="Enter post title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <Input
                    name="slug"
                    defaultValue={selectedPost?.slug || ''}
                    placeholder="post-url-slug"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excerpt
                  </label>
                  <textarea
                    name="excerpt"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    defaultValue={selectedPost?.excerpt || ''}
                    placeholder="Brief description of the post..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    name="content"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={12}
                    defaultValue={selectedPost?.content || ''}
                    placeholder="Write your post content here..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author
                    </label>
                    <Input
                      name="author"
                      defaultValue={selectedPost?.author || ''}
                      placeholder="Author name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Featured Image URL
                    </label>
                    <Input
                      name="featuredImage"
                      defaultValue={selectedPost?.featuredImage || ''}
                      placeholder="Enter image URL"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <Input
                    name="tags"
                    defaultValue={selectedPost?.tags.join(', ') || ''}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isDraft"
                      defaultChecked={selectedPost?.isDraft !== false}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Save as Draft</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (isEditing ? 'Update Post' : 'Create Post')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
