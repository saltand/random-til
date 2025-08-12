import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export interface TilEntry {
  title: string;
  category: string;
  content: string;
  path: string;
}

// const TIL_REPO_URL = 'https://github.com/jbranchaud/til';
const TIL_DATA_DIR = path.join(process.cwd(), 'data/til');

export async function fetchTilData(): Promise<TilEntry[]> {
  const entries: TilEntry[] = [];
  
  try {
    const dirs = await fs.readdir(TIL_DATA_DIR);
    
    for (const dir of dirs) {
      const dirPath = path.join(TIL_DATA_DIR, dir);
      const stats = await fs.stat(dirPath);
      
      if (stats.isDirectory() && !dir.startsWith('.')) {
        const files = await fs.readdir(dirPath);
        
        for (const file of files) {
          if (file.endsWith('.md') && !file.toLowerCase().includes('readme')) {
            const filePath = path.join(dirPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const { content: mdContent } = matter(content);
            
            const title = file.replace('.md', '').replace(/-/g, ' ');
            
            entries.push({
              title: title.charAt(0).toUpperCase() + title.slice(1),
              category: dir.charAt(0).toUpperCase() + dir.slice(1),
              content: mdContent,
              path: `${dir}/${file}`
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading TIL data:', error);
  }
  
  return entries;
}

export function getRandomTil(entries: TilEntry[]): TilEntry | null {
  if (entries.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * entries.length);
  return entries[randomIndex];
}