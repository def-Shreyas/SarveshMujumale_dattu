// import { toast } from "sonner";

// // Get the API URL from your environment variables
// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// /**
//  * A helper to get the auth token from localStorage
//  */
// function getAuthToken(): string | null {
//   return localStorage.getItem('dattu-token');
// }

// /**
//  * A helper to create the authorization header
//  */
// function getAuthHeader(isJson: boolean = true) {
//   const token = getAuthToken();

//   // Start with standard headers
//   const headers: HeadersInit = {};

//   if (isJson) {
//     headers['Content-Type'] = 'application/json';
//   }

//   // ONLY add the Authorization header if the token actually exists
//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   } else {
//     console.warn("No auth token found for API request.");
//   }

//   return headers;
// }

// /**
//  * A central handler for all API responses.
//  * --- THIS IS THE FIX ---
//  * It now checks the Content-Type before parsing.
//  */
// async function handleResponse(response: Response) {

//   // First, check if the request was successful
//   if (!response.ok) {
//     // If it's not 'ok', it's an error. Try to parse as JSON.
//     const errorData = await response.json().catch(() => ({ detail: "An unknown API error occurred" }));
//     const errorMessage = errorData.detail || "Unknown API error";

//     console.error("API Error:", errorMessage, errorData);

//     if (response.status !== 401) { // Don't toast for "Unauthorized"
//       toast.error("API Error", { description: errorMessage });
//     }
//     throw new Error(errorMessage);
//   }

//   // If the request was 'ok', check what kind of data we received
//   const contentType = response.headers.get("content-type");

//   // If backend sends JSON, parse it
//   if (contentType && contentType.includes("application/json")) {
//     const text = await response.text();
//     return text ? JSON.parse(text) : {}; // Handle empty JSON
//   }

//   // If it's not JSON (e.g., text/markdown or text/html), return as plain text.
//   return await response.text();
// }

// /**
//  * A wrapper for the native fetch function that automatically adds
//  * your JWT token to the request headers for all authenticated routes.
//  */
// export const apiClient = {
//   get: async (endpoint: string) => {
//     const response = await fetch(`${API_URL}${endpoint}`, {
//       method: "GET",
//       headers: getAuthHeader(false), // GET requests don't send a JSON body
//     });
//     return handleResponse(response);
//   },

//   post: async (endpoint: string, body?: any) => {
//     const response = await fetch(`${API_URL}${endpoint}`, {
//       method: "POST",
//       headers: getAuthHeader(true), // POST requests send JSON
//       body: body ? JSON.stringify(body) : undefined, // Handle empty body
//     });
//     return handleResponse(response);
//   },

//   put: async (endpoint: string, body: any) => {
//     const response = await fetch(`${API_URL}${endpoint}`, {
//       method: "PUT",
//       headers: getAuthHeader(true),
//       body: JSON.stringify(body),
//     });
//     return handleResponse(response);
//   },
// };

// /**
//  * A special helper for file uploads (like in Unsafety.tsx)
//  */
// export const uploadFile = async (endpoint: string, file: File) => {
//   const token = getAuthToken();
//   if (!token) {
//      toast.error("Authentication Error", { description: "You must be logged in to upload a file." });
//      throw new Error("No auth token found");
//   }

//   const formData = new FormData();
//   formData.append("file", file);

//   const response = await fetch(`${API_URL}${endpoint}`, {
//     method: "POST",
//     headers: {
//       'Authorization': `Bearer ${token}`,
//     },
//     body: formData,
//   });

//   return handleResponse(response);
// };

import { toast } from "sonner";

// Get the API URL from your environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Helper: Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem("dattu-token");
}

/**
 * Helper: Create Authorization header
 */
function getAuthHeader(isJson: boolean = true) {
  const token = getAuthToken();
  const headers: HeadersInit = {};

  if (isJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  else console.warn("⚠️ No auth token found for API request.");

  headers["Accept"] = "application/json";
  return headers;
}

/**
 * Central API response handler
 */
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown API error" }));
    let errorMessage = errorData.detail || "API request failed";

    // Fix: Ensure errorMessage is a string. Backend might return an object (e.g. for 429s)
    if (typeof errorMessage === "object") {
      errorMessage = errorMessage.message || errorMessage.error || JSON.stringify(errorMessage);
    }

    console.error("API Error:", errorMessage);
    if (response.status !== 401)
      toast.error("API Error", { description: errorMessage });

    const error = new Error(errorMessage);
    (error as any).data = errorData; // Attach raw data for consumers to use
    throw error;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }

  return await response.text();
}

/**
 * API client for GET, POST, PUT requests
 */
export const apiClient = {
  get: async (endpoint: string) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        mode: "cors",
        headers: getAuthHeader(false),
      });
      return handleResponse(response);
    } catch (error: any) {
      // Handle network errors (connection refused, timeout, etc.)
      if (error.message?.includes("Failed to fetch") || error.message?.includes("ERR_CONNECTION_REFUSED")) {
        const friendlyError = new Error(
          `Cannot connect to backend server at ${API_URL}. Please ensure the backend is running.`
        );
        console.error("Network Error:", friendlyError.message);
        throw friendlyError;
      }
      throw error;
    }
  },

  post: async (endpoint: string, body?: any) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        mode: "cors",
        headers: getAuthHeader(true),
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse(response);
    } catch (error: any) {
      // Handle network errors (connection refused, timeout, etc.)
      if (error.message?.includes("Failed to fetch") || error.message?.includes("ERR_CONNECTION_REFUSED")) {
        const friendlyError = new Error(
          `Cannot connect to backend server at ${API_URL}. Please ensure the backend is running.`
        );
        console.error("Network Error:", friendlyError.message);
        throw friendlyError;
      }
      throw error;
    }
  },

  put: async (endpoint: string, body: any) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        mode: "cors",
        headers: getAuthHeader(true),
        body: JSON.stringify(body),
      });
      return handleResponse(response);
    } catch (error: any) {
      // Handle network errors (connection refused, timeout, etc.)
      if (error.message?.includes("Failed to fetch") || error.message?.includes("ERR_CONNECTION_REFUSED")) {
        const friendlyError = new Error(
          `Cannot connect to backend server at ${API_URL}. Please ensure the backend is running.`
        );
        console.error("Network Error:", friendlyError.message);
        throw friendlyError;
      }
      throw error;
    }
  },

  delete: async (endpoint: string) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        mode: "cors",
        headers: getAuthHeader(false),
      });
      return handleResponse(response);
    } catch (error: any) {
      // Handle network errors (connection refused, timeout, etc.)
      if (error.message?.includes("Failed to fetch") || error.message?.includes("ERR_CONNECTION_REFUSED")) {
        const friendlyError = new Error(
          `Cannot connect to backend server at ${API_URL}. Please ensure the backend is running.`
        );
        console.error("Network Error:", friendlyError.message);
        throw friendlyError;
      }
      throw error;
    }
  },
};

/**
 * ✅ Fixed: File upload (sends Authorization + works with CORS)
 */
export const uploadFile = async (endpoint: string, file: File) => {
  const token = getAuthToken();
  console.log("UPLOAD TOKEN =", token);

  if (!token) {
    toast.error("Authentication Error", { description: "You must be logged in to upload a file." });
    throw new Error("No auth token found");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    mode: "cors",                // 🔥 add this
    credentials: "include",      // 🔥 and this
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  return handleResponse(response);
};
