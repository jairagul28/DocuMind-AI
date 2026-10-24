/**
 * API Service for DocuMind AI Backend Communication.
 * Communicates with FastAPI endpoints for upload, extraction, Groq analysis, and storage.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const SESSION_STORAGE_KEY = 'documind_session_token';
let sessionTokenRequest;

async function createSessionToken() {
  const response = await fetch(`${API_BASE_URL}/api/session`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Unable to start a private session (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (typeof data.session_token !== 'string' || !data.session_token) {
    throw new Error('The backend did not return a valid session token');
  }

  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, data.session_token);
  } catch {
    throw new Error('Browser session storage is unavailable');
  }
  return data.session_token;
}

async function getSessionToken() {
  let storedToken;
  try {
    storedToken = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    throw new Error('Browser session storage is unavailable');
  }
  if (storedToken) return storedToken;

  if (!sessionTokenRequest) {
    sessionTokenRequest = createSessionToken().finally(() => {
      sessionTokenRequest = undefined;
    });
  }
  return sessionTokenRequest;
}

async function fetchWithSession(path, options = {}) {
  const send = async (token) => {
    const headers = new Headers(options.headers || {});
    headers.set('X-Session-Token', token);
    return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  };

  let token = await getSessionToken();
  let response = await send(token);
  if (response.status !== 401) return response;

  try {
    if (window.sessionStorage.getItem(SESSION_STORAGE_KEY) === token) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    throw new Error('Browser session storage is unavailable');
  }

  token = await getSessionToken();
  response = await send(token);
  return response;
}

export async function fetchHealth() {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      latencyMs,
      endpoint: `${API_BASE_URL}/api/health`,
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      error: error.message || 'Failed to connect to backend',
      latencyMs,
      endpoint: `${API_BASE_URL}/api/health`,
    };
  }
}

export async function uploadDocument(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchWithSession('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.detail || `Upload failed with HTTP ${response.status}`;
      return { success: false, error: errorMsg };
    }

    return {
      success: true,
      data: data.document,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network error while uploading document',
    };
  }
}

export async function fetchDocuments() {
  try {
    const response = await fetchWithSession('/api/documents', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || data?.detail || 'Failed to fetch documents',
        data: [],
        count: 0,
      };
    }

    return {
      success: true,
      data: data.documents || [],
      count: data.count || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch documents',
      data: [],
      count: 0,
    };
  }
}

export async function fetchDocumentById(documentId) {
  try {
    const response = await fetchWithSession(`/api/documents/${documentId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || data?.detail || 'Document not found',
      };
    }

    return {
      success: true,
      data: data.document,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch document',
    };
  }
}

export async function deleteDocumentById(documentId) {
  try {
    const response = await fetchWithSession(`/api/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || data?.detail || 'Failed to delete document',
      };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network error while deleting document',
    };
  }
}

export async function analyzeDocument(documentId, config) {
  try {
    const response = await fetchWithSession(`/api/documents/${documentId}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(config),
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.detail || `Analysis failed with HTTP ${response.status}`;
      return { success: false, error: errorMsg };
    }

    return {
      success: true,
      data: data.analysis,
      documentId: data.document_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network error during document analysis',
    };
  }
}

export async function fetchSampleList() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/samples/list`);
    const data = await response.json();
    return {
      success: true,
      samples: data.samples || [],
    };
  } catch (error) {
    return {
      success: false,
      samples: [],
      error: error.message,
    };
  }
}

export async function loadSampleDocument(sampleKey) {
  try {
    const response = await fetchWithSession(`/api/documents/samples/load/${sampleKey}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || data?.detail || 'Failed to load sample document',
      };
    }

    return {
      success: true,
      data: data.document,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network error loading sample document',
    };
  }
}

export { API_BASE_URL };
