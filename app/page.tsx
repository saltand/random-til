'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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

function HomePage() {
  const searchParams = useSearchParams()
  const [til, setTil] = useState<TilEntry | null>(null)
  const [randomLoading, setRandomLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  
  const hasInitialized = useRef(false)
  const tilPath = searchParams.get('til')

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

    // Load categories and selected categories from localStorage
    const loadCategoriesAndFilter = async () => {
      try {
        const response = await fetch('/api/til/all')
        if (response.ok) {
          const data = await response.json()
          setAllCategories(data.categories)

          // Load selected categories from localStorage, default to all
          const savedCategories = localStorage.getItem('selectedCategories')
          if (savedCategories) {
            const parsed = JSON.parse(savedCategories)
            setSelectedCategories(parsed)
          } else {
            // Default to all categories selected
            setSelectedCategories(data.categories)
            localStorage.setItem('selectedCategories', JSON.stringify(data.categories))
          }
        }
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }

    loadCategoriesAndFilter()
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newTheme)
  }

  const handleCategoryToggle = (category: string) => {
    const newSelected = selectedCategories.includes(category) ? selectedCategories.filter(c => c !== category) : [...selectedCategories, category]

    setSelectedCategories(newSelected)
    localStorage.setItem('selectedCategories', JSON.stringify(newSelected))
  }

  const handleSelectAll = () => {
    setSelectedCategories(allCategories)
    localStorage.setItem('selectedCategories', JSON.stringify(allCategories))
  }

  const handleDeselectAll = () => {
    setSelectedCategories([])
    localStorage.setItem('selectedCategories', JSON.stringify([]))
  }

  // 点击外部关闭筛选菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showCategoryFilter && !target.closest('[data-category-filter]')) {
        setShowCategoryFilter(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCategoryFilter])

  const fetchRandomTil = useCallback(async () => {
    setRandomLoading(true)
    try {
      // Build query string with selected categories
      const categoriesQuery = selectedCategories.length > 0 && selectedCategories.length < allCategories.length ? `?categories=${selectedCategories.join(',')}` : ''

      const response = await fetch(`/api/til/random${categoriesQuery}`)
      if (response.ok) {
        const data = await response.json()
        const newPath = data.path.replace(/\.md$/, '')
        // 直接更新状态，不触发 useEffect
        setTil(data)
        window.history.pushState({}, '', `/?til=${newPath}`)
        // 平滑滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setError('No TIL found for selected categories')
      }
    } catch (error) {
      console.error('Failed to fetch random TIL:', error)
      setError('Failed to fetch random TIL')
    } finally {
      setRandomLoading(false)
    }
  }, [selectedCategories, allCategories])

  // 处理特定路径的 TIL 加载
  useEffect(() => {
    if (!tilPath || selectedCategories.length === 0) return

    const loadSpecificTil = async () => {
      setError(null)
      try {
        const path = tilPath.endsWith('.md') ? tilPath : `${tilPath}.md`
        const response = await fetch(`/api/til/${path}`)

        if (response.ok) {
          const data = await response.json()
          setTil(data)
        } else if (response.status === 404) {
          await fetchRandomTil()
        } else {
          setError('Failed to load TIL')
        }
      } catch (error) {
        console.error('Failed to fetch TIL:', error)
        setError('Failed to load TIL')
      }
    }

    loadSpecificTil()
  }, [tilPath, selectedCategories, fetchRandomTil])

  // 处理无路径时的随机 TIL 加载（只在初始化时）
  useEffect(() => {
    if (!tilPath && selectedCategories.length > 0 && !til && !hasInitialized.current) {
      hasInitialized.current = true
      fetchRandomTil()
    }
  }, [tilPath, selectedCategories, til, fetchRandomTil])

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
        <div className="text-center text-muted-foreground mb-8">{error}</div>
      </div>
    )
  }

  return til ? (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pb-24 p-8">
        <div className="w-full max-w-4xl mx-auto">
          <article className="prose prose-lg max-w-none markdown-body main-content">
            <div className="mb-4">
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
                  <a className="text-primary hover:opacity-80 underline" {...props}>
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => <blockquote className="border-l-4 border-border text-muted-foreground pl-4 italic">{children}</blockquote>,
              }}>
              {til.content}
            </ReactMarkdown>
          </article>
        </div>
      </div>

      {/* 固定在底部的按钮栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-center gap-4 p-4">
          <button
            onClick={fetchRandomTil}
            disabled={randomLoading}
            className="p-3 bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background shadow-sm"
            aria-label="Random TIL">
            {randomLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>

          {/* 类别筛选按钮 */}
          <div className="relative" data-category-filter>
            <button
              onClick={() => setShowCategoryFilter(!showCategoryFilter)}
              className="p-3 rounded-lg bg-secondary hover:opacity-90 text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background shadow-sm inline-flex items-center"
              aria-label="Category Filter">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </button>

            {/* 筛选下拉菜单 */}
            {showCategoryFilter && (
              <div className="absolute bottom-full mb-2 right-0 bg-background border border-border rounded-lg shadow-lg p-4 min-w-[280px] max-h-[400px] overflow-y-auto category-filter-dropdown">
                <div className="flex gap-2 mb-4">
                  <button onClick={handleSelectAll} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90">
                    Select All
                  </button>
                  <button onClick={handleDeselectAll} className="px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded hover:opacity-90">
                    Deselect All
                  </button>
                </div>

                <div className="space-y-2">
                  {allCategories.map(category => (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="rounded border-border text-primary focus:ring-primary focus:ring-offset-background"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {til && (
            <a
              href={`https://github.com/jbranchaud/til/blob/master/${til.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-secondary hover:opacity-90 text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background shadow-sm inline-flex items-center"
              aria-label="View on GitHub">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          )}
          <button
            onClick={toggleTheme}
            className="p-3 rounded-lg bg-secondary hover:opacity-90 text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background shadow-sm"
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
  ) : (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      }>
      <HomePage />
    </Suspense>
  )
}
