import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { trackClick } from '@/lib/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const { shortCode } = params;
    console.log(`[Redirect API] Processing redirect for ${shortCode}`);

    const docRef = doc(db, 'urls', shortCode);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log(`[Redirect API] Short code ${shortCode} not found`);
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    const urlData = docSnap.data();
    const originalUrl = urlData.originalUrl;

    // Track the click
    await trackClick(shortCode, {
      userAgent: request.headers.get('user-agent') || undefined,
      referer: request.headers.get('referer') || undefined,
      ip: request.ip || request.headers.get('x-forwarded-for') || undefined
    });

    console.log(`[Redirect API] Redirecting ${shortCode} to ${originalUrl}`);
    
    return NextResponse.redirect(originalUrl, 302);
  } catch (error) {
    console.error('[Redirect API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
