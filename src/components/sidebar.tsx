'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'
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
  LogOut,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface NavigationItem {
  name: string
  href: string
  icon: any
  roles?: string[]
  permissions?: string[]
}

interface NavigationGroup {
  name: string
  icon: any
  items: NavigationItem[]
  roles?: string[]
  permissions?: string[]
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user: currentUser, logout } = useAuth()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Initialize expanded groups from localStorage or defaults
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-expanded-groups')
    if (saved) {
      setExpandedGroups(JSON.parse(saved))
    } else {
      // Default to all groups expanded for admin users
      if (currentUser?.role === 'super_admin' || currentUser?.role === 'admin') {
        setExpandedGroups({
          'Members': true,
          'Teams': true,
          'Events': true,
          'Content': true,
          'Forms': true,
          'Financial': true,
          'Communication': true,
          'Administration': true
        })
      }
    }
  }, [currentUser])

  // Save expanded state to localStorage
  const toggleGroup = (groupName: string) => {
    const newState = {
      ...expandedGroups,
      [groupName]: !expandedGroups[groupName]
    }
    setExpandedGroups(newState)
    localStorage.setItem('sidebar-expanded-groups', JSON.stringify(newState))
  }

  const navigationGroups: NavigationGroup[] = [
    {
      name: 'Members',
      icon: Users,
      items: [
        { name: 'Members', href: '/members', icon: Users, permissions: ['members.view'] },
        { name: 'Communities', href: '/communities', icon: Building, permissions: ['members.view'] },
        { name: 'Anniversaries', href: '/anniversaries', icon: Heart, permissions: ['members.view'] },
        { name: 'Discipleship', href: '/discipleship', icon: GraduationCap, permissions: ['members.view'] },
      ]
    },
    {
      name: 'Teams',
      icon: Building,
      items: [
        // Team Management (Admin only - can create/manage all teams)
        { name: 'Teams Management', href: '/teams', icon: Building, roles: ['super_admin', 'admin'] },
        // Team Leader Access (only their assigned team)
        { name: 'My Team', href: '/team-management', icon: Users, roles: ['team_leader'] },
      ]
    },
    {
      name: 'Events',
      icon: Calendar,
      items: [
        { name: 'Events', href: '/events', icon: Calendar, permissions: ['events.view'] },
        { name: 'Attendance', href: '/attendance', icon: UserCheck, permissions: ['events.view'] },
        { name: 'Junior Church', href: '/junior-church', icon: Baby, permissions: ['events.view'] },
      ]
    },
    {
      name: 'Content',
      icon: FileText,
      items: [
        { name: 'Blog', href: '/blog', icon: FileText, permissions: ['blog.view'] },
        { name: 'Media Library', href: '/media', icon: Play, permissions: ['blog.view'] },
        { name: 'Gallery', href: '/gallery', icon: Image, permissions: ['blog.view'] },
      ]
    },
    {
      name: 'Forms',
      icon: ClipboardList,
      items: [
        { name: 'Forms Management', href: '/forms', icon: ClipboardList, permissions: ['members.view'] },
      ]
    },
    {
      name: 'Financial',
      icon: DollarSign,
      items: [
        { name: 'Giving', href: '/giving', icon: DollarSign, permissions: ['giving.view'] },
      ]
    },
    {
      name: 'Communication',
      icon: Bell,
      items: [
        { name: 'Notifications', href: '/notifications', icon: Bell, permissions: ['blog.create'] },
      ]
    },
    {
      name: 'Administration',
      icon: Shield,
      items: [
        { name: 'Admin Management', href: '/admin-management', icon: Shield, roles: ['super_admin'] },
        { name: 'Settings', href: '/settings', icon: Settings, permissions: ['settings.manage'] },
      ]
    }
  ]

  // Individual navigation items (always visible)
  const individualItems: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
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

  const hasGroupPermission = (group: NavigationGroup) => {
    // If group has specific role/permission requirements
    if (group.roles && currentUser?.role) {
      if (!group.roles.includes(currentUser.role)) return false
    }
    if (group.permissions && currentUser?.permissions) {
      if (!group.permissions.some(permission => 
        currentUser.permissions.includes(permission)
      )) return false
    }

    // Show group if at least one item is accessible
    return group.items.some(hasPermission)
  }

  const filteredGroups = navigationGroups.filter(hasGroupPermission)
  const filteredIndividualItems = individualItems.filter(hasPermission)

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
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
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
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
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {/* Individual Items */}
          {filteredIndividualItems.map((item) => {
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

          {/* Grouped Items */}
          {!collapsed && filteredGroups.map((group) => (
            <li key={group.name} className="mt-6">
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full group flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="flex items-center">
                  <group.icon className="h-5 w-5 mr-3" />
                  <span>{group.name}</span>
                </div>
                {expandedGroups[group.name] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {expandedGroups[group.name] && (
                <ul className="mt-1 ml-6 space-y-1">
                  {group.items.filter(hasPermission).map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          )}
                        >
                          <item.icon className="h-4 w-4 mr-3" />
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          ))}

          {/* Collapsed view - show all items as icons */}
          {collapsed && filteredGroups.map((group) => (
            group.items.filter(hasPermission).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                    title={item.name}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                </li>
              )
            })
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="px-3 pb-4 flex-shrink-0 border-t border-gray-200 pt-4">
        <button
          onClick={logout}
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
