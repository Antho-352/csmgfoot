/**
 * Initialize fade-in-up animations using Intersection Observer
 */
export function initFadeInUp() {
  const elements = document.querySelectorAll('.fade-in-up');
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  elements.forEach((element) => {
    observer.observe(element);
  });
}

/**
 * CountUp animation for numbers
 */
export function countUp(element: HTMLElement, target: number, duration: number = 2000) {
  const start = 0;
  const increment = target / (duration / 16); // 60 FPS
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toString();
  }, 16);
}

/**
 * Format price range
 */
export function formatPrice(min: number, max: number): string {
  const formatNum = (num: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return `${formatNum(min)} - ${formatNum(max)}`;
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

/**
 * Calculate reading time
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Format date in French
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}
