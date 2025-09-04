'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Heart,
  UserCheck,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Image,
  DollarSign,
  Globe,
  Building,
  ClipboardList,
  Shield,
  Baby,
  Bell,
  Play,
  GraduationCap,
  LogOut
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface NavigationItem {
  name: string
  href: string
  icon: any
  roles?: string[]
  permissions?: string[]
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
  }, [])

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Members', href: '/members', icon: Users, permissions: ['members.view'] },
    { name: 'Teams', href: '/teams', icon: Users, permissions: ['teams.view'] },
    { name: 'Communities', href: '/communities', icon: Building, permissions: ['teams.view'] },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare, permissions: ['teams.view'] },
    { name: 'Events', href: '/events', icon: Calendar, permissions: ['events.view'] },
    { name: 'Attendance', href: '/attendance', icon: UserCheck, permissions: ['events.view'] },
    { name: 'Junior Church', href: '/junior-church', icon: Baby, permissions: ['events.view'] },
    { name: 'Media Library', href: '/media', icon: Play, permissions: ['blog.view'] },
    { name: 'Discipleship', href: '/discipleship', icon: GraduationCap, permissions: ['members.view'] },
    { name: 'Gallery', href: '/gallery', icon: Image, permissions: ['blog.view'] },
    { name: 'Blog', href: '/blog', icon: FileText, permissions: ['blog.view'] },
    { name: 'Giving', href: '/giving', icon: DollarSign, permissions: ['giving.view'] },
    { name: 'Notifications', href: '/notifications', icon: Bell, permissions: ['blog.create'] },
    { name: 'Form Submissions', href: '/form-submissions', icon: ClipboardList, permissions: ['members.view'] },
    { name: 'Anniversaries', href: '/anniversaries', icon: Heart, permissions: ['members.view'] },
    { name: 'Admin Management', href: '/admin-management', icon: Shield, roles: ['super_admin'] },
    { name: 'Settings', href: '/settings', icon: Settings, permissions: ['settings.manage'] },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const hasPermission = (item: NavigationItem) => {
    // If no roles or permissions specified, show to everyone
    if (!item.roles && !item.permissions) return true

    // Check role-based access
    if (item.roles && currentUser?.role) {
      if (item.roles.includes(currentUser.role)) return true
    }

    // Check permission-based access
    if (item.permissions && currentUser?.permissions) {
      return item.permissions.some(permission => 
        currentUser.permissions.includes(permission)
      )
    }

    // For team leaders, show team-related items if they have team access
    if (currentUser?.role === 'team_leader') {
      const teamLeaderItems = ['teams', 'members', 'tasks', 'profile', 'dashboard']
      const itemPath = item.href.split('/')[1]
      return teamLeaderItems.includes(itemPath)
    }

    return false
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const filteredNavigation = navigation.filter(hasPermission)

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-gray-900">Sycamore Admin</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && currentUser && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {currentUser.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="mt-4 px-3 flex-1">
        <ul className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn('h-5 w-5', !collapsed && 'mr-3')} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className={cn('h-5 w-5', !collapsed && 'mr-3')} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
