import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Form, IForm } from '@/lib/models'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false',
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
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    // Build query - only return active forms for public access
    const query: any = { isActive: true }
    if (category) {
      query.category = category
    }
    
    const forms = await Form.find(query).sort({ createdAt: -1 })

    const mobileForms = forms.map((form: IForm) => ({
      id: form._id,
      title: form.title,
      description: form.description,
      fields: form.fields,
      category: form.category || 'General',
      icon: form.icon || 'FormOutlined',
      color: form.color || '#4A7C23'
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
