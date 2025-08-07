import { redirect } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { trackClick } from '@/lib/analytics';
import { headers } from 'next/headers';

interface PageProps {
  params: {
    shortCode: string;
  };
}

export default async function RedirectPage({ params }: PageProps) {
  const { shortCode } = params;
  
  try {
    console.log(`[Redirect Page] Processing ${shortCode}`);
    
    const docRef = doc(db, 'urls', shortCode);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log(`[Redirect Page] Short code ${shortCode} not found`);
      redirect('/not-found');
    }

    const urlData = docSnap.data();
    const originalUrl = urlData.originalUrl;

    // Get headers for tracking
    const headersList = headers();
    
    // Track the click
    await trackClick(shortCode, {
      userAgent: headersList.get('user-agent') || undefined,
      referer: headersList.get('referer') || undefined,
      ip: headersList.get('x-forwarded-for') || undefined
    });

    console.log(`[Redirect Page] Redirecting ${shortCode} to ${originalUrl}`);
    redirect(originalUrl);
    
  } catch (error) {
    console.error(`[Redirect Page] Error processing ${shortCode}:`, error);
    redirect('/not-found');
  }
}
