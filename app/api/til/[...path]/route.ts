import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params as required in Next.js 15
    const resolvedParams = await params
    
    // Reconstruct the file path from URL segments
    const requestedPath = resolvedParams.path.join('/')
    
    // Ensure the path has .md extension
    const filePath = requestedPath.endsWith('.md') ? requestedPath : `${requestedPath}.md`
    
    // Construct the full path to the TIL file
    const fullPath = path.join(process.cwd(), 'data', 'til', filePath)
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'TIL not found' },
        { status: 404 }
      )
    }
    
    // Read the file
    const fileContent = fs.readFileSync(fullPath, 'utf-8')
    
    // Parse frontmatter if exists
    const { data: frontmatter, content } = matter(fileContent)
    
    // Extract title from content or frontmatter
    const lines = content.split('\n')
    let title = frontmatter.title || ''
    
    if (!title) {
      // Look for the first heading
      for (const line of lines) {
        if (line.startsWith('# ')) {
          title = line.substring(2).trim()
          break
        }
      }
    }
    
    // Extract category from the file path
    const category = path.dirname(filePath)
    
    return NextResponse.json({
      title,
      category: category === '.' ? 'General' : category,
      content,
      path: filePath
    })
  } catch (error) {
    console.error('Error fetching TIL:', error)
    return NextResponse.json(
      { error: 'Failed to fetch TIL' },
      { status: 500 }
    )
  }
}