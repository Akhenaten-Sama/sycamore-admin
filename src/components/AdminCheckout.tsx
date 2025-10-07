'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  User, 
  Clock, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react'

interface AdminCheckoutProps {
  attendanceRecords: any[]
  juniorMembers: any[]
  onCheckoutComplete: () => void
}

export default function AdminCheckout({ attendanceRecords, juniorMembers, onCheckoutComplete }: AdminCheckoutProps) {
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [pickedUpBy, setPickedUpBy] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Get children who are currently checked in (not picked up yet)
  const checkedInChildren = attendanceRecords
    .filter(record => record.status === 'dropped_off')
    .map(record => {
      const member = juniorMembers.find(m => m.id === record.juniorMemberId)
      return {
        ...record,
        member
      }
    })
    .filter(record => record.member) // Only include records with valid members

  const handleManualCheckout = async () => {
    if (!selectedRecord || !pickedUpBy.trim()) {
      alert('Please select a child and enter the pickup person name.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/junior-church/attendance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          attendanceId: selectedRecord.id,
          pickedUpBy: pickedUpBy.trim(),
          notes: notes.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        setSelectedRecord(null)
        setPickedUpBy('')
        setNotes('')
        onCheckoutComplete()
      } else {
        alert('Checkout failed: ' + result.message)
      }
    } catch (error) {
      console.error('Error during manual checkout:', error)
      alert('An error occurred during checkout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Admin Checkout Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Admin Manual Checkout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Child Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Child to Check Out
              </label>
              <select
                value={selectedRecord?.id || ''}
                onChange={(e) => {
                  const record = checkedInChildren.find(r => r.id === e.target.value)
                  setSelectedRecord(record || null)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a child...</option>
                {checkedInChildren.map((record) => (
                  <option key={record.id} value={record.id}>
                    {record.member.firstName} {record.member.lastName} ({record.member.class}) - 
                    Dropped off by {record.dropoffBy} at {new Date(record.dropoffTime).toLocaleTimeString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedRecord && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Child Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Name:</strong> {selectedRecord.member.firstName} {selectedRecord.member.lastName}</p>
                    <p><strong>Class:</strong> {selectedRecord.member.class}</p>
                    <p><strong>Dropped off by:</strong> {selectedRecord.dropoffBy}</p>
                  </div>
                  <div>
                    <p><strong>Drop-off time:</strong> {new Date(selectedRecord.dropoffTime).toLocaleTimeString()}</p>
                    <p><strong>Authorized pickup:</strong> {selectedRecord.member.pickupAuthority.join(', ')}</p>
                    {selectedRecord.member.allergies && (
                      <p className="text-red-600"><strong>⚠️ Allergies:</strong> {selectedRecord.member.allergies}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pickup Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Picked Up By *
              </label>
              <Input
                value={pickedUpBy}
                onChange={(e) => setPickedUpBy(e.target.value)}
                placeholder="Enter name of person picking up child"
                className="w-full"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes for this checkout..."
                className="w-full"
              />
            </div>

            {/* Warning if unauthorized person */}
            {selectedRecord && pickedUpBy && !selectedRecord.member.pickupAuthority.includes(pickedUpBy) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Authorization Warning</span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  "{pickedUpBy}" is not on the authorized pickup list for {selectedRecord.member.firstName} {selectedRecord.member.lastName}.
                  This will be recorded as an admin override.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleManualCheckout}
                disabled={!selectedRecord || !pickedUpBy.trim() || loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Complete Checkout'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedRecord(null)
                  setPickedUpBy('')
                  setNotes('')
                }}
                disabled={loading}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currently Checked In Children Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Currently Checked In ({checkedInChildren.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkedInChildren.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>All children have been picked up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkedInChildren.map((record) => (
                <div 
                  key={record.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRecord?.id === record.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {record.member.firstName} {record.member.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Class: {record.member.class} | Dropped off by: {record.dropoffBy}
                      </p>
                      <p className="text-sm text-gray-500">
                        Check-in time: {new Date(record.dropoffTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Checked In
                      </span>
                      {record.member.allergies && (
                        <p className="text-xs text-red-600 mt-1">⚠️ Allergies</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}