import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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

export async function GET(request: NextRequest) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return createCorsResponse(
        { success: false, message: 'User ID is required' },
        400
      );
    }

    // Get user profile
    const profile = await db.collection('members').findOne({
      _id: new ObjectId(userId)
    });

    if (!profile) {
      return createCorsResponse(
        { success: false, message: 'Profile not found' },
        404
      );
    }

    return createCorsResponse({
      success: true,
      data: {
        id: profile._id.toString(),
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
        profilePicture: profile.profilePicture,
        joinDate: profile.joinDate,
        membershipStatus: profile.membershipStatus,
        teams: profile.teams || [],
        skills: profile.skills || [],
        interests: profile.interests || [],
        bio: profile.bio || ''
      }
    }, 200);

  } catch (error) {
    console.error('Error fetching profile:', error);
    return createCorsResponse(
      { success: false, message: 'Failed to fetch profile' },
      500
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    
    const { 
      userId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      profilePicture,
      skills,
      interests,
      bio
    } = await request.json();

    if (!userId) {
      return createCorsResponse(
        { success: false, message: 'User ID is required' },
        400
      );
    }

    const updateData: any = {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address,
      profilePicture,
      skills: skills || [],
      interests: interests || [],
      bio: bio || '',
      updatedAt: new Date()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const result = await db.collection('members').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return createCorsResponse(
        { success: false, message: 'Profile not found' },
        404
      );
    }

    const updatedProfile = await db.collection('members').findOne({
      _id: new ObjectId(userId)
    });

    return createCorsResponse({
      success: true,
      data: {
        id: updatedProfile._id.toString(),
        ...updatedProfile,
        _id: undefined
      }
    }, 200);

  } catch (error) {
    console.error('Error updating profile:', error);
    return createCorsResponse(
      { success: false, message: 'Failed to update profile' },
      500
    );
  }
}
