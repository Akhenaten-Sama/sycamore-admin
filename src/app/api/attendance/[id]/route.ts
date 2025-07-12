import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { AttendanceRecord } from '@/lib/models'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const record = await AttendanceRecord.findById(id)
      .populate('memberId', 'firstName lastName email')
      .populate('eventId', 'name date location')
    
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: record
    })
  } catch (error) {
    console.error('Error fetching attendance record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance record' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { id } = await params
    
    const updateData = {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
      checkedInAt: body.checkedInAt ? new Date(body.checkedInAt) : undefined,
    }

    const updatedRecord = await AttendanceRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('memberId', 'firstName lastName email')
      .populate('eventId', 'name date location')

    if (!updatedRecord) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: 'Attendance record updated successfully'
    })
  } catch (error) {
    console.error('Error updating attendance record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update attendance record' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const deletedRecord = await AttendanceRecord.findByIdAndDelete(id)
    
    if (!deletedRecord) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting attendance record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete attendance record' },
      { status: 500 }
    )
  }
}
