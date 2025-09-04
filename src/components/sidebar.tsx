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
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Communities', href: '/communities', icon: Building },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Attendance', href: '/attendance', icon: UserCheck },
  { name: 'Gallery', href: '/gallery', icon: Image },
  { name: 'Blog', href: '/blog', icon: FileText },
  { name: 'Giving', href: '/giving', icon: DollarSign },
  { name: 'Requests', href: '/requests', icon: ClipboardList },
  { name: 'Anniversaries', href: '/anniversaries', icon: Heart },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

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

      {/* Navigation */}
      <nav className="mt-8 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
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
    </div>
  )
}
