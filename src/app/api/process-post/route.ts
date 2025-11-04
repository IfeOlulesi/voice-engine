import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Post } from '../../../../lib/db';
import { repurposeContent } from '../../../../lib/openai';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();
    
    const body = await request.json();
    const { post, platforms = ['linkedin', 'x', 'instagram', 'facebook'] } = body;
    
    if (!post || !post.text) {
      return NextResponse.json(
        { success: false, error: 'Post content is required' },
        { status: 400 }
      );
    }
    
    console.log('Processing post:', post);
    
    // Repurpose content using LLM
    const variants = await repurposeContent(post.text);
    console.log('Generated variants:', variants);
    
    // Calculate scheduled times (Tue/Fri 8:30 AM X/IG, 7 PM FB - WAT timezone)
    const now = new Date();
    const scheduledTimes = [];
    
    // Find next Tuesday 8:30 AM WAT for X and IG
    const nextTuesday = new Date(now);
    nextTuesday.setUTCHours(7, 30, 0, 0); // 8:30 AM WAT = 7:30 AM UTC
    const daysUntilTuesday = (2 - now.getUTCDay() + 7) % 7;
    if (daysUntilTuesday === 0 && now.getUTCHours() >= 7) {
      nextTuesday.setUTCDate(nextTuesday.getUTCDate() + 7);
    } else {
      nextTuesday.setUTCDate(nextTuesday.getUTCDate() + daysUntilTuesday);
    }
    scheduledTimes.push(nextTuesday);
    
    // Find next Friday 7 PM WAT for FB
    const nextFriday = new Date(now);
    nextFriday.setUTCHours(18, 0, 0, 0); // 7 PM WAT = 6 PM UTC
    const daysUntilFriday = (5 - now.getUTCDay() + 7) % 7;
    if (daysUntilFriday === 0 && now.getUTCHours() >= 18) {
      nextFriday.setUTCDate(nextFriday.getUTCDate() + 7);
    } else {
      nextFriday.setUTCDate(nextFriday.getUTCDate() + daysUntilFriday);
    }
    scheduledTimes.push(nextFriday);
    
    // Save to database
    const newPost = new Post({
      original: post,
      variants: variants,
      scheduledAt: scheduledTimes,
      status: 'queued',
      platforms: platforms
    });
    
    await newPost.save();
    console.log('Saved post to database:', newPost._id);
    
    return NextResponse.json({
      success: true,
      data: {
        postId: newPost._id,
        original: post,
        variants: variants,
        scheduledAt: scheduledTimes,
        status: 'queued',
        platforms: platforms
      }
    });
    
  } catch (error) {
    console.error('Error in process-post endpoint:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}