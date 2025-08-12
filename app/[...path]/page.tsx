'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface TilEntry {
  title: string
  category: string
  content: string
  path: string
  renderedContent?: string
}

export default function TilPage() {
  const params = useParams()
  const router = useRouter()
  const [til, setTil] = useState<TilEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reconstruct the file path from the URL segments
  const filePath = Array.isArray(params.path) ? params.path.join('/') : params.path

  useEffect(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem('theme')
    if (stored) {
      setIsDarkMode(stored === 'dark')
      document.documentElement.classList.toggle('dark', stored === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
      document.documentElement.classList.toggle('dark', prefersDark)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newTheme)
  }

  useEffect(() => {
    const fetchTil = async () => {
      if (!filePath) {
        setError('No file path provided')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Add .md extension if not present
        const path = filePath.endsWith('.md') ? filePath : `${filePath}.md`
        const response = await fetch(`/api/til/${path}`)

        if (response.ok) {
          const data = await response.json()
          setTil(data)
        } else if (response.status === 404) {
          setError('TIL not found')
        } else {
          setError('Failed to load TIL')
        }
      } catch (error) {
        console.error('Failed to fetch TIL:', error)
        setError('Failed to load TIL')
      } finally {
        setLoading(false)
      }
    }

    fetchTil()
  }, [filePath])

  const fetchRandomTil = async () => {
    try {
      const response = await fetch('/api/til')
      if (response.ok) {
        const data = await response.json()
        // Navigate to the TIL's URL
        const path = data.path.replace(/\.md$/, '')
        router.push(`/${path}`)
      }
    } catch (error) {
      console.error('Failed to fetch random TIL:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
        <div className="text-center text-muted-foreground mb-8">{error}</div>
        <button
          onClick={fetchRandomTil}
          className="px-8 py-3 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background shadow-sm">
          Random TIL
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 transition-colors duration-300">
      <div className="w-full max-w-4xl">
        {til && (
          <article className="prose prose-lg max-w-none markdown-body">
            <div className="mb-8">
              <div className="text-sm text-muted-foreground mb-2">{til.category}</div>
            </div>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match

                  if (isInline) {
                    return (
                      <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    )
                  }

                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
                pre: ({ children, ...props }) => (
                  <pre className={`hljs p-4 rounded-lg overflow-x-auto my-4 border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`} {...props}>
                    {children}
                  </pre>
                ),
                a: ({ children, ...props }) => (
                  <a className="text-primary hover:opacity-80 underline transition-opacity" {...props}>
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => <blockquote className="border-l-4 border-border text-muted-foreground pl-4 italic">{children}</blockquote>,
              }}>
              {til.content}
            </ReactMarkdown>
          </article>
        )}

        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            onClick={fetchRandomTil}
            className="p-3 bg-primary hover:opacity-90 text-primary-foreground rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background shadow-sm"
            aria-label="Random TIL">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {til && (
            <a
              href={`https://github.com/jbranchaud/til/blob/master/${til.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg transition-all duration-200 bg-secondary hover:opacity-90 text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background shadow-sm inline-flex items-center"
              aria-label="View on GitHub">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          )}
          <button
            onClick={toggleTheme}
            className="p-3 rounded-lg transition-all duration-200 bg-secondary hover:opacity-90 text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background shadow-sm"
            aria-label="Toggle theme">
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
