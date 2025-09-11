import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    
    // Get user ID from query params or headers
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all sermon notes for the user
    const sermonNotes = await db.collection('sermonNotes').find({
      userId: new ObjectId(userId)
    }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      data: sermonNotes
    });

  } catch (error) {
    console.error('Error fetching sermon notes:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sermon notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    
    const { 
      userId, 
      title, 
      date, 
      speaker, 
      scripture, 
      keyPoints, 
      personalNotes, 
      actionItems 
    } = await request.json();

    if (!userId || !title) {
      return NextResponse.json(
        { success: false, message: 'User ID and title are required' },
        { status: 400 }
      );
    }

    // Create new sermon note
    const newSermonNote = {
      userId: new ObjectId(userId),
      title,
      date: new Date(date),
      speaker: speaker || '',
      scripture: scripture || '',
      keyPoints: keyPoints || '',
      personalNotes: personalNotes || '',
      actionItems: actionItems || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('sermonNotes').insertOne(newSermonNote);

    if (result.insertedId) {
      const createdNote = await db.collection('sermonNotes').findOne({
        _id: result.insertedId
      });

      return NextResponse.json({
        success: true,
        data: {
          id: createdNote._id.toString(),
          ...createdNote,
          _id: undefined
        }
      });
    } else {
      throw new Error('Failed to create sermon note');
    }

  } catch (error) {
    console.error('Error creating sermon note:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create sermon note' },
      { status: 500 }
    );
  }
}
