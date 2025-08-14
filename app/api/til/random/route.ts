import { NextResponse } from 'next/server';
import { fetchTilData } from '@/lib/github';
import { TilEntry } from '@/lib/github';

let cachedEntries: TilEntry[] = [];
let cacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

function getRandomTilFromCategories(entries: TilEntry[], categories?: string[]): TilEntry | null {
  if (entries.length === 0) return null;
  
  let filteredEntries = entries;
  
  // Filter by categories if provided
  if (categories && categories.length > 0) {
    filteredEntries = entries.filter(entry => categories.includes(entry.category));
  }
  
  if (filteredEntries.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * filteredEntries.length);
  return filteredEntries[randomIndex];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriesParam = searchParams.get('categories');
    
    const now = Date.now();
    
    // Refresh cache if needed
    if (!cachedEntries.length || now - cacheTime > CACHE_DURATION) {
      cachedEntries = await fetchTilData();
      cacheTime = now;
    }
    
    // Parse categories from query parameter
    let selectedCategories: string[] | undefined;
    if (categoriesParam) {
      selectedCategories = categoriesParam.split(',').map(c => c.trim()).filter(c => c.length > 0);
    }
    
    const randomTil = getRandomTilFromCategories(cachedEntries, selectedCategories);
    
    if (!randomTil) {
      return NextResponse.json({ 
        error: selectedCategories && selectedCategories.length > 0 
          ? 'No TIL entries found for selected categories' 
          : 'No TIL entries found' 
      }, { status: 404 });
    }
    
    return NextResponse.json(randomTil);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch random TIL' }, { status: 500 });
  }
}