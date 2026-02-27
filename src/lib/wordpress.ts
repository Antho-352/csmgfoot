const WP_API_URL = import.meta.env.VITE_WP_API_URL || '';

export interface WPPost {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  date: string;
  modified: string;
  categories: number[];
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
  };
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

/**
 * Fetch posts from WordPress API
 */
export async function getPosts(page: number = 1, perPage: number = 9): Promise<{
  posts: WPPost[];
  total: number;
  totalPages: number;
}> {
  if (!WP_API_URL) {
    console.warn('WordPress API URL not configured');
    return { posts: [], total: 0, totalPages: 0 };
  }

  try {
    const response = await fetch(
      `${WP_API_URL}/posts?per_page=${perPage}&page=${page}&_embed`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const posts = await response.json();
    const total = parseInt(response.headers.get('X-WP-Total') || '0');
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0');

    return { posts, total, totalPages };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], total: 0, totalPages: 0 };
  }
}

/**
 * Fetch a single post by slug
 */
export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  if (!WP_API_URL) {
    console.warn('WordPress API URL not configured');
    return null;
  }

  try {
    const response = await fetch(`${WP_API_URL}/posts?slug=${slug}&_embed`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const posts = await response.json();
    return posts.length > 0 ? posts[0] : null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

/**
 * Fetch posts by category
 */
export async function getPostsByCategory(
  categoryId: number,
  page: number = 1,
  perPage: number = 3
): Promise<WPPost[]> {
  if (!WP_API_URL) {
    return [];
  }

  try {
    const response = await fetch(
      `${WP_API_URL}/posts?categories=${categoryId}&per_page=${perPage}&page=${page}&_embed`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    return [];
  }
}

/**
 * Fetch all categories
 */
export async function getCategories(): Promise<WPCategory[]> {
  if (!WP_API_URL) {
    return [];
  }

  try {
    const response = await fetch(`${WP_API_URL}/categories?per_page=100`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Strip HTML tags from string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Get featured image URL from post
 */
export function getFeaturedImage(post: WPPost): string | null {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
}

/**
 * Get categories from post
 */
export function getPostCategories(post: WPPost): Array<{ id: number; name: string; slug: string }> {
  return post._embedded?.['wp:term']?.[0] || [];
}
