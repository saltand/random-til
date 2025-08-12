import { NextResponse } from 'next/server';
import { fetchTilData, getRandomTil } from '@/lib/github';

let cachedEntries: any[] = [];
let cacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

export async function GET() {
  try {
    const now = Date.now();
    
    if (!cachedEntries.length || now - cacheTime > CACHE_DURATION) {
      cachedEntries = await fetchTilData();
      cacheTime = now;
    }
    
    const randomTil = getRandomTil(cachedEntries);
    
    if (!randomTil) {
      return NextResponse.json({ error: 'No TIL entries found' }, { status: 404 });
    }
    
    return NextResponse.json(randomTil);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch TIL' }, { status: 500 });
  }
}