import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { ChildWard, Member } from '@/lib/models'
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
}

// Get all children/wards for a parent
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    
    if (!parentId) {
      return corsResponse(
        { message: 'Parent ID is required' },
        request,
        400
      )
    }

    const children = await ChildWard.find({ 
      parentId,
      isActive: true 
    }).sort({ createdAt: -1 })

    return corsResponse({
      success: true,
      data: children
    }, request)

  } catch (error) {
    console.error('Error fetching children/wards:', error)
    return corsResponse(
      { success: false, message: 'Failed to fetch children/wards' },
      request,
      500
    )
  }
}

// Add a new child/ward
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { 
      firstName, 
      lastName, 
      dateOfBirth, 
      parentId, 
      relationship = 'child',
      specialNeeds,
      allergies,
      emergencyContact
    } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !parentId) {
      return corsResponse(
        { message: 'First name, last name, date of birth, and parent ID are required' },
        request,
        400
      )
    }

    // Verify parent exists
    const parent = await Member.findById(parentId)
    if (!parent) {
      return corsResponse(
        { message: 'Parent not found' },
        request,
        404
      )
    }

    const newChild = new ChildWard({
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      parentId,
      relationship,
      specialNeeds,
      allergies: allergies || [],
      emergencyContact
    })

    const savedChild = await newChild.save()

    return corsResponse({
      success: true,
      data: savedChild,
      message: 'Child/ward added successfully'
    }, request)

  } catch (error) {
    console.error('Error adding child/ward:', error)
    return corsResponse(
      { success: false, message: 'Failed to add child/ward' },
      request,
      500
    )
  }
}