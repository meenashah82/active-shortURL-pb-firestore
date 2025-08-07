import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Shorten request received');
    
    const { url } = await request.json();
    
    if (!url) {
      console.log('[API] No URL provided');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!isValidUrl(url)) {
      console.log('[API] Invalid URL provided:', url);
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Generate unique short code
    let shortCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shortCode = generateShortCode();
      attempts++;
      
      if (attempts > maxAttempts) {
        console.error('[API] Failed to generate unique short code after', maxAttempts, 'attempts');
        return NextResponse.json({ error: 'Failed to generate unique short code' }, { status: 500 });
      }
      
      const docRef = doc(db, 'urls', shortCode);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        break;
      }
      
      console.log('[API] Short code', shortCode, 'already exists, trying again');
    } while (true);

    // Create URL document
    const urlData = {
      originalUrl: url,
      shortCode,
      createdAt: Timestamp.now(),
      totalClicks: 0
    };

    await setDoc(doc(db, 'urls', shortCode), urlData);
    
    console.log('[API] URL shortened successfully:', shortCode);
    
    return NextResponse.json({
      shortCode,
      shortUrl: `${request.nextUrl.origin}/${shortCode}`,
      originalUrl: url
    });

  } catch (error) {
    console.error('[API] Error shortening URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
