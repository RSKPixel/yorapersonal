import { useEffect } from 'react'

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Yora Personal` : 'Yora Personal'
  }, [title])
}
