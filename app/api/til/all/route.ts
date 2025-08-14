import { NextResponse } from 'next/server';
import { fetchTilData } from '@/lib/github';
import { TilEntry } from '@/lib/github';

let cachedEntries: TilEntry[] = [];
let cachedCategories: string[] = [];
let cacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriesParam = searchParams.get('categories');
    
    const now = Date.now();
    
    // Refresh cache if needed
    if (!cachedEntries.length || now - cacheTime > CACHE_DURATION) {
      cachedEntries = await fetchTilData();
      // Extract unique categories
      cachedCategories = [...new Set(cachedEntries.map(entry => entry.category))].sort();
      cacheTime = now;
    }
    
    // Filter by categories if provided
    let filteredEntries = cachedEntries;
    if (categoriesParam) {
      const requestedCategories = categoriesParam.split(',').map(c => c.trim());
      filteredEntries = cachedEntries.filter(entry => 
        requestedCategories.includes(entry.category)
      );
    }
    
    return NextResponse.json({
      entries: filteredEntries,
      categories: cachedCategories,
      total: filteredEntries.length
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch TIL data' }, { status: 500 });
  }
}