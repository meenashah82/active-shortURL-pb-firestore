import { NextRequest, NextResponse } from 'next/server';
import { getFirebase } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const { shortCode } = params;
    const { db } = getFirebase();

    if (!db) {
      console.log(`[Redirect API] Database connection failed for ${shortCode}`);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    console.log(`[Redirect API] Processing redirect for ${shortCode}`);

    // Get URL document
    const docRef = doc(db, 'urls', shortCode);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log(`[Redirect API] Short code ${shortCode} not found`);
      return NextResponse.redirect(new URL('/not-found', request.url));
    }

    const urlData = docSnap.data();
    const originalUrl = urlData.originalUrl;

    if (!urlData.isActive) {
      console.log(`[Redirect API] URL ${shortCode} is inactive`);
      return NextResponse.json({ error: 'URL is inactive' }, { status: 410 });
    }

    // Track click
    const clickData = {
      shortCode,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || '',
      referer: request.headers.get('referer') || '',
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    };

    // Add click record and increment counter
    await Promise.all([
      addDoc(collection(db, 'clicks'), clickData),
      updateDoc(docRef, {
        totalClicks: increment(1),
        lastClickedAt: new Date().toISOString()
      })
    ]);

    console.log(`[Redirect API] Redirecting ${shortCode} to ${originalUrl}`);

    // Redirect to original URL
    return NextResponse.redirect(originalUrl, 302);
  } catch (error) {
    console.error('[Redirect API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
