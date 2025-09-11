import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid sermon note ID' },
        { status: 400 }
      );
    }

    const sermonNote = await db.collection('sermonNotes').findOne({
      _id: new ObjectId(id)
    });

    if (!sermonNote) {
      return NextResponse.json(
        { success: false, message: 'Sermon note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: sermonNote._id.toString(),
        ...sermonNote,
        _id: undefined
      }
    });

  } catch (error) {
    console.error('Error fetching sermon note:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sermon note' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid sermon note ID' },
        { status: 400 }
      );
    }

    const { 
      title, 
      date, 
      speaker, 
      scripture, 
      keyPoints, 
      personalNotes, 
      actionItems 
    } = await request.json();

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Title is required' },
        { status: 400 }
      );
    }

    const updateData = {
      title,
      date: new Date(date),
      speaker: speaker || '',
      scripture: scripture || '',
      keyPoints: keyPoints || '',
      personalNotes: personalNotes || '',
      actionItems: actionItems || '',
      updatedAt: new Date()
    };

    const result = await db.collection('sermonNotes').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Sermon note not found' },
        { status: 404 }
      );
    }

    const updatedNote = await db.collection('sermonNotes').findOne({
      _id: new ObjectId(id)
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedNote._id.toString(),
        ...updatedNote,
        _id: undefined
      }
    });

  } catch (error) {
    console.error('Error updating sermon note:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update sermon note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid sermon note ID' },
        { status: 400 }
      );
    }

    const result = await db.collection('sermonNotes').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Sermon note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sermon note deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting sermon note:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete sermon note' },
      { status: 500 }
    );
  }
}
