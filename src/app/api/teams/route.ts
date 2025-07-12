import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Team } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const teams = await Team.find(query)
      .populate('teamLeadId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .sort({ name: 1 })

    return NextResponse.json({
      success: true,
      data: teams,
      total: teams.length
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.description || !body.teamLeadId) {
      return NextResponse.json(
        { success: false, error: 'Name, description, and team lead are required' },
        { status: 400 }
      )
    }

    const newTeam = new Team({
      name: body.name,
      description: body.description,
      teamLeadId: body.teamLeadId,
      members: body.members || []
    })

    const savedTeam = await newTeam.save()
    
    // Populate the saved team
    const populatedTeam = await Team.findById(savedTeam._id)
      .populate('teamLeadId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      data: populatedTeam,
      message: 'Team created successfully'
    })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
