import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Event, Member } from '@/lib/models';
import { getCorsHeaders, corsResponse, handlePreflight } from '@/lib/cors';
import mongoose from 'mongoose';

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request);
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const submissionData = await request.json();

    const { eventId, memberId, answers, timeSpent, completedAt } = submissionData;

    if (!eventId || !memberId || !answers || !Array.isArray(answers)) {
      return corsResponse({
        message: 'Missing required fields: eventId, memberId, and answers array'
      }, request, 400);
    }

    // Define SermonChallengeSubmission schema if it doesn't exist
    const SermonChallengeSubmissionSchema = new mongoose.Schema({
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
      memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
      answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        answer: { type: mongoose.Schema.Types.Mixed, required: true },
        timestamp: { type: Date, required: true }
      }],
      timeSpent: { type: Number, default: 0 },
      completedAt: { type: Date, required: true },
      submittedAt: { type: Date, default: Date.now },
      score: { type: Number, default: null }
    });

    const SermonChallengeSubmission = mongoose.models.SermonChallengeSubmission || 
      mongoose.model('SermonChallengeSubmission', SermonChallengeSubmissionSchema);

    // Check if submission already exists
    const existingSubmission = await SermonChallengeSubmission.findOne({
      eventId: new mongoose.Types.ObjectId(eventId),
      memberId: new mongoose.Types.ObjectId(memberId)
    });

    if (existingSubmission) {
      return corsResponse({
        message: 'You have already completed this sermon challenge'
      }, request, 409);
    }

    // Create new submission
    const submission = new SermonChallengeSubmission({
      eventId: new mongoose.Types.ObjectId(eventId),
      memberId: new mongoose.Types.ObjectId(memberId),
      answers: answers.map(answer => ({
        questionId: new mongoose.Types.ObjectId(answer.questionId),
        answer: answer.answer,
        timestamp: new Date(answer.timestamp)
      })),
      timeSpent: timeSpent || 0,
      completedAt: new Date(completedAt),
      submittedAt: new Date()
    });

    const result = await submission.save();

    if (result._id) {
      return corsResponse({
        success: true,
        data: {
          message: 'Sermon challenge submitted successfully!',
          submissionId: result._id,
          answersCount: answers.length,
          timeSpent
        }
      }, request, 200);
    } else {
      throw new Error('Failed to save submission');
    }

  } catch (error) {
    console.error('Error submitting sermon challenge:', error);
    return corsResponse({
      message: 'Failed to submit sermon challenge'
    }, request, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return corsResponse({
        message: 'Member ID is required'
      }, request, 400);
    }

    // Define SermonChallengeSubmission schema if it doesn't exist
    const SermonChallengeSubmissionSchema = new mongoose.Schema({
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
      memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
      answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        answer: { type: mongoose.Schema.Types.Mixed, required: true },
        timestamp: { type: Date, required: true }
      }],
      timeSpent: { type: Number, default: 0 },
      completedAt: { type: Date, required: true },
      submittedAt: { type: Date, default: Date.now },
      score: { type: Number, default: null }
    });

    const SermonChallengeSubmission = mongoose.models.SermonChallengeSubmission || 
      mongoose.model('SermonChallengeSubmission', SermonChallengeSubmissionSchema);

    // Get all submissions for this member
    const submissions = await SermonChallengeSubmission
      .find({ memberId: new mongoose.Types.ObjectId(memberId) })
      .sort({ submittedAt: -1 });

    return corsResponse({
      success: true,
      data: submissions
    }, request, 200);

  } catch (error) {
    console.error('Error fetching sermon challenge submissions:', error);
    return corsResponse({
      message: 'Failed to fetch submissions'
    }, request, 500);
  }
}