import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Event } from '@/lib/models';
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors';
import mongoose from 'mongoose';

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    await connectDB();
    const { eventId } = await params;

    if (!eventId) {
      return corsResponse({
        message: 'Event ID is required'
      }, request, 400);
    }

    // Get event with sermon challenges
    const event = await Event.findById(eventId).select('sermonChallenges name date');

    if (!event) {
      return corsResponse({
        message: 'Event not found'
      }, request, 404);
    }

    const challenges = event.sermonChallenges || [];

    return corsResponse({
      success: true,
      data: challenges
    }, request, 200);

  } catch (error) {
    console.error('Error fetching sermon challenges:', error);
    return corsResponse({
      message: 'Failed to fetch sermon challenges'
    }, request, 500);
  }
}