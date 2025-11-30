import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { ChildWard, JuniorMember, Member } from '@/lib/models'
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: Date): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// Helper function to determine class based on age
function determineClass(age: number): 'nursery' | 'toddlers' | 'preschool' | 'elementary' | 'teens' {
  if (age < 2) return 'nursery'
  if (age < 4) return 'toddlers'
  if (age < 6) return 'preschool'
  if (age < 13) return 'elementary'
  return 'teens'
}

// Helper function to generate unique barcode ID
async function generateBarcodeId(): Promise<string> {
  const prefix = 'JC'
  let barcodeId: string
  let isUnique = false
  
  while (!isUnique) {
    const randomNum = Math.floor(100000 + Math.random() * 900000)
    barcodeId = `${prefix}${randomNum}`
    
    const existing = await JuniorMember.findOne({ barcodeId })
    if (!existing) {
      isUnique = true
    }
  }
  
  return barcodeId!
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

    // Get parent info to match junior members
    const parent = await Member.findById(parentId)
    if (!parent) {
      return corsResponse(
        { message: 'Parent not found' },
        request,
        404
      )
    }

    console.log('Fetching children for parent:', {
      parentId,
      parentPhone: parent.phone,
      parentName: `${parent.firstName} ${parent.lastName}`
    })

    // Get junior members by parent phone (since that's how they're linked)
    const juniorMembers = await JuniorMember.find({ 
      parentPhone: parent.phone,
      isActive: true 
    }).sort({ registeredAt: -1 }).lean()

    console.log('Found junior members:', juniorMembers.length)

    // Return the data in a format the frontend expects
    const children = juniorMembers.map(member => ({
      _id: member._id,
      firstName: member.firstName,
      lastName: member.lastName,
      dateOfBirth: member.dateOfBirth,
      age: member.age,
      class: member.class,
      barcodeId: member.barcodeId,
      allergies: member.allergies,
      medicalNotes: member.medicalNotes,
      parentPhone: member.parentPhone,
      isActive: member.isActive
    }))

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

    // Verify parent exists and get their info
    const parent = await Member.findById(parentId)
    if (!parent) {
      return corsResponse(
        { message: 'Parent not found' },
        request,
        404
      )
    }

    // Check for existing duplicate by parent phone and child name + DOB
    const existingChild = await JuniorMember.findOne({
      parentPhone: parent.phone,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: new Date(dateOfBirth),
      isActive: true
    })

    if (existingChild) {
      console.log('Duplicate child detected:', {
        firstName,
        lastName,
        parentPhone: parent.phone,
        existingId: existingChild._id
      })
      
      return corsResponse({
        success: true,
        data: {
          ...existingChild.toObject(),
          _id: existingChild._id
        },
        message: 'Child already registered',
        isDuplicate: true
      }, request)
    }

    // Calculate age and determine class
    const age = calculateAge(new Date(dateOfBirth))
    const childClass = determineClass(age)
    
    // Generate unique barcode ID
    const barcodeId = await generateBarcodeId()

    console.log('Creating new junior member:', {
      firstName,
      lastName,
      parentPhone: parent.phone,
      barcodeId,
      class: childClass
    })

    // Create JuniorMember record (for junior church system)
    const newJuniorMember = new JuniorMember({
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      age,
      parentName: `${parent.firstName} ${parent.lastName}`,
      parentPhone: parent.phone,
      parentEmail: parent.email,
      emergencyContact: emergencyContact || {
        name: `${parent.firstName} ${parent.lastName}`,
        phone: parent.phone,
        relationship: 'parent'
      },
      allergies: Array.isArray(allergies) ? allergies.join(', ') : (allergies || ''),
      medicalNotes: specialNeeds || '',
      pickupAuthority: [`${parent.firstName} ${parent.lastName}`],
      class: childClass,
      isActive: true,
      registeredAt: new Date(),
      barcodeId
    })

    const savedJuniorMember = await newJuniorMember.save()

    // Also create ChildWard record (for mobile app compatibility)
    const newChildWard = new ChildWard({
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      parentId,
      relationship,
      specialNeeds,
      allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
      emergencyContact
    })

    await newChildWard.save()

    return corsResponse({
      success: true,
      data: {
        ...savedJuniorMember.toObject(),
        _id: savedJuniorMember._id
      },
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