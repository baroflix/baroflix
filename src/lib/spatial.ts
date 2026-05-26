export function initSpatialNavigation() {
  if (typeof window === 'undefined') return () => {}

  const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]:not([disabled])'

  function getFocusableElements(): HTMLElement[] {
    const nodes = document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    return Array.from(nodes).filter((node) => {
      const rect = node.getBoundingClientRect()
      // Element must have dimensions and be visually visible
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(node).visibility !== 'hidden' && window.getComputedStyle(node).display !== 'none'
    })
  }

  // Calculate Euclidean distance from the closest edges, heavily penalizing non-overlapping cross-axis elements
  function getDistance(rect1: DOMRect, rect2: DOMRect, dir: 'up' | 'down' | 'left' | 'right') {
    let dx = 0;
    let dy = 0;
    let crossOverlap = 0;

    if (dir === 'left') {
      if (rect2.right >= rect1.left - 5) return Infinity;
      dx = rect1.left - rect2.right;
      crossOverlap = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
      dy = crossOverlap > 0 ? 0 : Math.min(Math.abs(rect1.top - rect2.bottom), Math.abs(rect1.bottom - rect2.top));
    } else if (dir === 'right') {
      if (rect2.left <= rect1.right + 5) return Infinity;
      dx = rect2.left - rect1.right;
      crossOverlap = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
      dy = crossOverlap > 0 ? 0 : Math.min(Math.abs(rect1.top - rect2.bottom), Math.abs(rect1.bottom - rect2.top));
    } else if (dir === 'up') {
      if (rect2.bottom >= rect1.top - 5) return Infinity;
      dy = rect1.top - rect2.bottom;
      crossOverlap = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
      dx = crossOverlap > 0 ? 0 : Math.min(Math.abs(rect1.left - rect2.right), Math.abs(rect1.right - rect2.left));
    } else if (dir === 'down') {
      if (rect2.top <= rect1.bottom + 5) return Infinity;
      dy = rect2.top - rect1.bottom;
      crossOverlap = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
      dx = crossOverlap > 0 ? 0 : Math.min(Math.abs(rect1.left - rect2.right), Math.abs(rect1.right - rect2.left));
    }

    return Math.sqrt(dx * dx + dy * dy) + (crossOverlap > 0 ? 0 : 10000);
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Ignore input if user is in an iframe, let the iframe handle its own navigation
    if (document.activeElement?.tagName === 'IFRAME') {
      return
    }

    // Ignore input if user is typing in a text field
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') {
        ;(document.activeElement as HTMLElement).blur()
      }
      return
    }

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (e.key === 'Escape') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }
      return
    }

    const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right'
    }
    
    const dir = dirMap[e.key]
    const focusable = getFocusableElements()

    let current = document.activeElement as HTMLElement
    
    // If nothing focused, focus the first element in the viewport
    if (!current || !focusable.includes(current)) {
      e.preventDefault()
      const first = focusable.find(el => {
        const rect = el.getBoundingClientRect()
        return rect.top >= 0 && rect.left >= 0 && rect.top <= window.innerHeight
      }) || focusable[0]
      
      first?.focus()
      return
    }

    e.preventDefault()
    const currentRect = current.getBoundingClientRect()

    let closest: HTMLElement | null = null
    let minDistance = Infinity

    for (const el of focusable) {
      if (el === current) continue
      const rect = el.getBoundingClientRect()
      const dist = getDistance(currentRect, rect, dir)
      if (dist < minDistance) {
        minDistance = dist
        closest = el
      }
    }

    if (closest) {
      closest.focus()
      // Smoothly scroll the container to keep the element perfectly centered for a 10-foot UI experience
      closest.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }
  }

  window.addEventListener('keydown', handleKeyDown)

  return () => {
    window.removeEventListener('keydown', handleKeyDown)
  }
}
