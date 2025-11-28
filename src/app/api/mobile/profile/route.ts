import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: corsHeaders,
  })
}

// Using POST method as a workaround
export async function POST(request: NextRequest) {
  console.log('🟢 POST /api/mobile/profile - Request received');
  console.log('🟢 URL:', request.url);
  console.log('🟢 Method:', request.method);
  
  try {
    const body = await request.json();
    console.log('🟢 Request body:', JSON.stringify(body, null, 2));
    
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
      bio,
      kinName,
      kinPhone,
      kinRelationship
    } = body;

    if (!userId) {
      console.log('❌ No userId provided');
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('🟢 Connecting to database...');
    const mongoose = await connectDB();
    const db = mongoose.connection.db;

    const updateData: any = {};
    
    // Only include fields that are provided
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (address !== undefined) updateData.address = address;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (skills !== undefined) updateData.skills = skills || [];
    if (interests !== undefined) updateData.interests = interests || [];
    if (bio !== undefined) updateData.bio = bio || '';
    if (kinName !== undefined) updateData.kinName = kinName;
    if (kinPhone !== undefined) updateData.kinPhone = kinPhone;
    if (kinRelationship !== undefined) updateData.kinRelationship = kinRelationship;
    
    updateData.updatedAt = new Date();

    console.log('🟢 Updating with data:', JSON.stringify(updateData, null, 2));

    const result = await db.collection('members').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    console.log('🟢 Update result:', { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });

    if (result.matchedCount === 0) {
      console.log('❌ Profile not found');
      return NextResponse.json(
        { success: false, message: 'Profile not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const updatedProfile = await db.collection('members').findOne({
      _id: new ObjectId(userId)
    });

    console.log('✅ Profile updated successfully');
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedProfile?._id.toString(),
        ...updatedProfile,
        _id: undefined
      }
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profile', error: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
