'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';

interface UrlData {
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  createdAt: any;
}

interface ClickData {
  id: string;
  shortCode: string;
  timestamp: any;
}

export default function DebugFirestore() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [urls, setUrls] = useState<UrlData[]>([]);
  const [clicks, setClicks] = useState<ClickData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      console.log('[Debug] Testing Firestore connection...');
      
      // Try to read from a collection
      const testQuery = query(collection(db, 'urls'), limit(1));
      await getDocs(testQuery);
      
      setConnectionStatus('connected');
      console.log('[Debug] Firestore connection successful');
    } catch (err) {
      console.error('[Debug] Firestore connection failed:', err);
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[Debug] Loading URLs...');
      
      // Load URLs
      const urlsQuery = query(
        collection(db, 'urls'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const urlsSnapshot = await getDocs(urlsQuery);
      const urlsData: UrlData[] = urlsSnapshot.docs.map(doc => ({
        shortCode: doc.id,
        ...doc.data()
      } as UrlData));
      
      setUrls(urlsData);
      console.log('[Debug] Loaded', urlsData.length, 'URLs');

      // Load recent clicks
      console.log('[Debug] Loading clicks...');
      const clicksQuery = query(
        collection(db, 'clicks'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const clicksSnapshot = await getDocs(clicksQuery);
      const clicksData: ClickData[] = clicksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClickData));
      
      setClicks(clicksData);
      console.log('[Debug] Loaded', clicksData.length, 'clicks');
      
    } catch (err) {
      console.error('[Debug] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testUrlCreation = async () => {
    try {
      console.log('[Debug] Testing URL creation...');
      
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com/test-' + Date.now()
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('[Debug] URL creation successful:', result);
        alert(`Success! Created: ${result.shortUrl}`);
        loadData(); // Reload data
      } else {
        console.error('[Debug] URL creation failed:', result);
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error('[Debug] URL creation error:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Firestore Debug Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={checkConnection} variant="outline">
            Check Connection
          </Button>
          <Button onClick={loadData} disabled={loading}>
            {loading ? 'Loading...' : 'Load Data'}
          </Button>
          <Button onClick={testUrlCreation} variant="secondary">
            Test URL Creation
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={
              connectionStatus === 'connected' ? 'default' : 
              connectionStatus === 'error' ? 'destructive' : 'secondary'
            }>
              {connectionStatus === 'checking' && 'Checking...'}
              {connectionStatus === 'connected' && 'Connected'}
              {connectionStatus === 'error' && 'Error'}
            </Badge>
            {connectionStatus === 'connected' && (
              <span className="text-sm text-green-600">Firestore is working properly</span>
            )}
          </div>
          {error && (
            <Alert className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* URLs Collection */}
      <Card>
        <CardHeader>
          <CardTitle>URLs Collection</CardTitle>
          <CardDescription>Recent shortened URLs</CardDescription>
        </CardHeader>
        <CardContent>
          {urls.length === 0 ? (
            <p className="text-muted-foreground">No URLs found. Click "Load Data" to check.</p>
          ) : (
            <div className="space-y-2">
              {urls.map((url) => (
                <div key={url.shortCode} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-mono text-sm">{url.shortCode}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-md">
                      {url.originalUrl}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{url.totalClicks || 0} clicks</div>
                    <div className="text-xs text-muted-foreground">
                      {url.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clicks Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Clicks Collection</CardTitle>
          <CardDescription>Recent click events</CardDescription>
        </CardHeader>
        <CardContent>
          {clicks.length === 0 ? (
            <p className="text-muted-foreground">No clicks found. Click "Load Data" to check.</p>
          ) : (
            <div className="space-y-2">
              {clicks.map((click) => (
                <div key={click.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-mono text-sm">{click.shortCode}</div>
                    <div className="text-xs text-muted-foreground">ID: {click.id}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {click.timestamp?.toDate?.()?.toLocaleString() || 'Unknown time'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
