import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Get devotional reading stats and streaks
export async function GET(request: NextRequest) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get devotional readings for the user
    const readings = await db.collection('devotionalReadings').find({
      userId: new ObjectId(userId)
    }).sort({ date: -1 }).toArray();

    // Calculate streak statistics
    const stats = calculateDevotionalStats(readings);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching devotional stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch devotional stats' },
      { status: 500 }
    );
  }
}

// Mark devotional as read
export async function POST(request: NextRequest) {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    
    const { userId, devotionalId, date } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const readingDate = date ? new Date(date) : new Date();
    const dateString = readingDate.toISOString().split('T')[0];

    // Check if already marked for today
    const existingReading = await db.collection('devotionalReadings').findOne({
      userId: new ObjectId(userId),
      date: dateString
    });

    if (existingReading) {
      return NextResponse.json({
        success: true,
        message: 'Already marked as read for today',
        data: existingReading
      });
    }

    // Create new reading record
    const newReading = {
      userId: new ObjectId(userId),
      devotionalId: devotionalId || null,
      date: dateString,
      createdAt: new Date()
    };

    const result = await db.collection('devotionalReadings').insertOne(newReading);

    if (result.insertedId) {
      // Recalculate stats after adding new reading
      const readings = await db.collection('devotionalReadings').find({
        userId: new ObjectId(userId)
      }).sort({ date: -1 }).toArray();

      const stats = calculateDevotionalStats(readings);

      return NextResponse.json({
        success: true,
        data: {
          reading: {
            id: result.insertedId.toString(),
            ...newReading,
            _id: undefined
          },
          stats
        }
      });
    } else {
      throw new Error('Failed to create reading record');
    }

  } catch (error) {
    console.error('Error marking devotional as read:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to mark as read' },
      { status: 500 }
    );
  }
}

interface DevotionalReading {
  _id?: string;
  userId: string;
  devotionalId?: string;
  date: string;
  createdAt: Date;
}

function calculateDevotionalStats(readings: DevotionalReading[]) {
  if (!readings || readings.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalReadings: 0,
      thisMonthReadings: 0,
      thisMonthGoal: 30,
      completionRate: 0,
      averagePerWeek: 0,
      weeklyProgress: [],
      monthlyProgress: [],
      favoriteTopics: [],
      achievements: getDefaultAchievements()
    };
  }

  const sortedReadings = readings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date();
  
  while (true) {
    const dateString = checkDate.toISOString().split('T')[0];
    const hasReading = sortedReadings.some(r => r.date === dateString);
    
    if (hasReading || dateString === today) {
      if (hasReading) currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const allDates = sortedReadings.map(r => r.date).sort();
  
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0 || isConsecutiveDay(allDates[i-1], allDates[i])) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // This month statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthReadings = readings.filter(r => {
    const readingDate = new Date(r.date);
    return readingDate.getMonth() === currentMonth && readingDate.getFullYear() === currentYear;
  }).length;

  // Weekly progress (last 7 days)
  const weeklyProgress = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    const completed = readings.some(r => r.date === dateString);
    
    weeklyProgress.push({
      date: dateString,
      completed,
      streak: completed ? currentStreak : 0
    });
  }

  // Monthly progress for the year
  const monthlyProgress = [];
  for (let month = 0; month < 12; month++) {
    const monthReadings = readings.filter(r => {
      const readingDate = new Date(r.date);
      return readingDate.getMonth() === month && readingDate.getFullYear() === currentYear;
    });

    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const isCurrentMonth = month === currentMonth;
    const totalDays = isCurrentMonth ? currentDay : (month < currentMonth ? daysInMonth : 0);

    monthlyProgress.push({
      month: month + 1,
      monthName: new Date(2025, month).toLocaleDateString('en', { month: 'short' }),
      daysRead: monthReadings.length,
      totalDays,
      completionRate: totalDays > 0 ? monthReadings.length / totalDays : 0
    });
  }

  // Calculate achievements
  const achievements = getAchievementsForUser(currentStreak, longestStreak, readings.length);

  return {
    currentStreak,
    longestStreak,
    totalReadings: readings.length,
    thisMonthReadings,
    thisMonthGoal: 30,
    completionRate: Math.round((thisMonthReadings / 30) * 100),
    averagePerWeek: Math.round((readings.length / 52) * 10) / 10,
    weeklyProgress,
    monthlyProgress,
    favoriteTopics: [
      { topic: "Faith", count: Math.floor(readings.length * 0.25) },
      { topic: "Hope", count: Math.floor(readings.length * 0.16) },
      { topic: "Love", count: Math.floor(readings.length * 0.15) },
      { topic: "Peace", count: Math.floor(readings.length * 0.09) },
      { topic: "Prayer", count: Math.floor(readings.length * 0.06) }
    ],
    achievements
  };
}

function isConsecutiveDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  earnedDate: string | null;
  icon: string;
}

function getDefaultAchievements(): Achievement[] {
  return [
    {
      id: "first_week",
      title: "First Week",
      description: "Read devotionals for 7 days in a row",
      earned: false,
      earnedDate: null,
      icon: "📖"
    },
    {
      id: "two_weeks",
      title: "Faithful Reader",
      description: "Read devotionals for 14 days in a row",
      earned: false,
      earnedDate: null,
      icon: "🔥"
    },
    {
      id: "one_month",
      title: "Devoted",
      description: "Read devotionals for 30 days in a row",
      earned: false,
      earnedDate: null,
      icon: "👑"
    },
    {
      id: "hundred_readings",
      title: "Century Reader",
      description: "Complete 100 devotional readings",
      earned: false,
      earnedDate: null,
      icon: "💯"
    }
  ];
}

function getAchievementsForUser(currentStreak: number, longestStreak: number, totalReadings: number): Achievement[] {
  const achievements = getDefaultAchievements();
  
  achievements.forEach(achievement => {
    switch (achievement.id) {
      case 'first_week':
        if (longestStreak >= 7) {
          achievement.earned = true;
          achievement.earnedDate = new Date().toISOString();
        }
        break;
      case 'two_weeks':
        if (longestStreak >= 14) {
          achievement.earned = true;
          achievement.earnedDate = new Date().toISOString();
        }
        break;
      case 'one_month':
        if (longestStreak >= 30) {
          achievement.earned = true;
          achievement.earnedDate = new Date().toISOString();
        }
        break;
      case 'hundred_readings':
        if (totalReadings >= 100) {
          achievement.earned = true;
          achievement.earnedDate = new Date().toISOString();
        }
        break;
    }
  });

  return achievements;
}
