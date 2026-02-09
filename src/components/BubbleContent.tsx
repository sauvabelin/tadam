import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { BulleId } from '../types'
import { getBubble, type TabData } from '../api/bubbleApi'
import { LoadingSpinner } from './LoadingSpinner'

interface Props {
  bubbleId: BulleId
}

export function BubbleContent({ bubbleId }: Props) {
  const [content, setContent] = useState<string | null>(null)
  const [tabs, setTabs] = useState<TabData[]>([])
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchContent() {
      setIsLoading(true)
      setError(null)

      try {
        const bubble = await getBubble(bubbleId)

        if (!cancelled) {
          const bubbleTabs = bubble?.tabs || []
          setTabs(bubbleTabs)

          if (bubbleTabs.length === 0) {
            // No tabs: use bubble.content
            setContent(bubble?.content || null)
            setActiveTabId(null)
          } else if (bubbleTabs.length === 1) {
            // 1 tab: use tab content, no tab bar
            setContent(bubbleTabs[0].content || null)
            setActiveTabId(bubbleTabs[0].id)
          } else {
            // 2+ tabs: show tab bar, select first
            setActiveTabId(bubbleTabs[0].id)
            setContent(bubbleTabs[0].content || null)
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch bubble content:', err)
          setError('Erreur lors du chargement du contenu')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchContent()

    return () => {
      cancelled = true
    }
  }, [bubbleId])

  const handleTabClick = (tab: TabData) => {
    setActiveTabId(tab.id)
    setContent(tab.content || null)
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '200px',
          gap: '1rem',
        }}
      >
        <LoadingSpinner size={60} color="#667eea" />
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>Chargement...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '200px',
          gap: '1rem',
          color: '#ef4444',
        }}
      >
        <p>{error}</p>
      </div>
    )
  }

  const showTabBar = tabs.length >= 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {showTabBar && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: activeTabId === tab.id ? '#FFFEF5' : '#2D2D2D',
                background: activeTabId === tab.id ? '#902212' : 'rgba(255, 254, 245, 0.7)',
                border: '3px solid #2D2D2D',
                borderRadius: '999px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: activeTabId === tab.id
                  ? '3px 3px 0px rgba(0, 0, 0, 0.2)'
                  : '2px 2px 0px rgba(0, 0, 0, 0.1)',
              }}
            >
              {tab.tab_name}
            </button>
          ))}
        </div>
      )}

      {!content ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '200px',
            gap: '1rem',
            color: '#6b7280',
          }}
        >
          <p>Contenu en cours de redaction...</p>
        </div>
      ) : (
        <div className="bubble-content" style={{ padding: '1rem', flex: 1, overflow: 'auto' }}>
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
        </div>
      )}

      <style>{`
        .bubble-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1a1a2e;
        }
        .bubble-content h1 {
          font-size: 2em;
          font-weight: 700;
          margin: 0.5em 0;
          color: #1a1a2e;
        }
        .bubble-content h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.75em 0 0.5em;
          color: #1a1a2e;
        }
        .bubble-content h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.75em 0 0.5em;
          color: #1a1a2e;
        }
        .bubble-content p {
          margin: 0.75em 0;
        }
        .bubble-content ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .bubble-content ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .bubble-content li {
          margin: 0.25em 0;
        }
        .bubble-content blockquote {
          border-left: 4px solid #667eea;
          padding-left: 1em;
          margin: 1em 0;
          color: #4b5563;
          font-style: italic;
        }
        .bubble-content pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1em 0;
        }
        .bubble-content code {
          background: #e5e7eb;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }
        .bubble-content pre code {
          background: none;
          padding: 0;
        }
        .bubble-content a {
          color: #667eea;
          text-decoration: underline;
        }
        .bubble-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        .bubble-content hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2em 0;
        }
      `}</style>
    </div>
  )
}
