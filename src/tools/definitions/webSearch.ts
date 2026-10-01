export interface WebSearchParams {
  query: string;
}

export interface WebSearchResult {
  success: boolean;
  query: string;
  results?: Array<{ title: string; url: string; snippet: string }>;
  error?: string;
}

/**
 * Web search tool interface.
 * Returns an honest error if no search provider is configured.
 */
export async function webSearch(params: WebSearchParams): Promise<WebSearchResult> {
  const query = params?.query?.trim() || '';

  if (!query) {
    return {
      success: false,
      query: '',
      error: 'Please provide a search query.',
    };
  }

  // Check for search provider configuration (e.g. Google Search API key or custom endpoint)
  const isSearchConfigured = Boolean(
    typeof process !== 'undefined' && process.env && process.env.GOOGLE_SEARCH_API_KEY
  );

  if (!isSearchConfigured) {
    return {
      success: false,
      query,
      error: 'Web search is not configured yet.',
    };
  }

  // Placeholder for future dedicated search provider integration
  return {
    success: false,
    query,
    error: 'Web search is not configured yet.',
  };
}
