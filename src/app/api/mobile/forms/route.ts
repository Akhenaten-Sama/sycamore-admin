import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Form, IForm } from '@/lib/models'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

function createCorsResponse(data: any, status: number) {
  return NextResponse.json(data, { status, headers: corsHeaders })
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

// GET /api/mobile/forms - Get all active forms for mobile app
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Only return active forms for public access
    const forms = await Form.find({ isActive: true }).sort({ createdAt: -1 })

    const mobileForms = forms.map((form: IForm) => ({
      id: form._id,
      title: form.title,
      description: form.description,
      fields: form.fields,
      category: form.category || 'General',
      icon: form.icon || 'FormOutlined',
      color: form.color || '#0A9396'
    }))

    return createCorsResponse({
      success: true,
      data: mobileForms
    }, 200)
  } catch (error) {
    console.error('Error fetching forms:', error)
    return createCorsResponse({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
}
