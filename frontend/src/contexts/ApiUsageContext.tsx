import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from "@/lib/api";

interface ApiUsageContextType {
    apiLimit: number;          // Monthly limit
    apiUsed: number;           // Monthly used
    remainingApi: number;      // Monthly remaining
    dailyLimit: number;        // Daily limit
    dailyUsed: number;         // Daily used
    dailyRemaining: number;    // Daily remaining
    moduleUsage: Record<string, number>;
    incrementUsage: (module: string, count?: number) => void;
}

const ApiUsageContext = createContext<ApiUsageContextType | undefined>(undefined);

export const ApiUsageProvider = ({ children }: { children: ReactNode }) => {
    // Real tracking state
    const [apiLimit, setApiLimit] = useState(1000);
    const [apiUsed, setApiUsed] = useState(0);
    const [dailyLimit, setDailyLimit] = useState(100);
    const [dailyUsed, setDailyUsed] = useState(0);
    const [moduleUsage, setModuleUsage] = useState<Record<string, number>>({});

    // Fetch initial usage from backend
    useEffect(() => {
        const fetchInitialUsage = async () => {
            try {
                const data = await apiClient.get("/auth/rate-limit");
                if (data) {
                    // Monthly limits
                    setApiLimit(data.api_calls_limit || data.monthly_limit || 1000);
                    setApiUsed(data.api_calls_used || data.monthly_used || 0);
                    // Daily limits
                    setDailyLimit(data.daily_limit || 100);
                    setDailyUsed(data.daily_used || 0);
                }
            } catch (error) {
                console.error("Failed to fetch initial API usage:", error);
            }
        };
        fetchInitialUsage();
    }, []);

    const remainingApi = apiLimit - apiUsed;
    const dailyRemaining = dailyLimit - dailyUsed;

    const incrementUsage = (module: string, count: number = 1) => {
        setApiUsed(prev => Math.min(prev + count, apiLimit));
        setModuleUsage(prev => ({
            ...prev,
            [module]: (prev[module] || 0) + count
        }));
    };

    useEffect(() => {
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            const [resource, config] = args;
            const url = resource.toString();

            // Check if it's a backend API call
            // We assume backend calls contain 'localhost:8000' or start with '/api' or contain the VITE_API_URL if we could access it easily here.
            // Given the codebase, checking for 'localhost:8000' or '127.0.0.1:8000' or relative '/api' is a safe bet.
            const isBackendCall = url.includes('localhost:8000') || url.includes('127.0.0.1:8000') || url.startsWith('/api') || url.startsWith('http');

            // Exclude Auth calls
            const isAuthCall = url.includes('/auth/') || url.includes('login') || url.includes('register');
            // Exclude Dashboard calls
            const isDashboardCall = url.includes('dashboard') || url.includes('kpi');
            // Exclude Chart viewing (GET requests for HTML files)
            const isChartCall = url.includes('/charts/') || (config?.method === 'GET' && (url.includes('.html') || url.includes('chart')));
            const isUploadCall = url.includes('/upload');
            if (isBackendCall && !isAuthCall && !isDashboardCall && !isChartCall && !isUploadCall) {
                // Determine module from URL
                let module = "Other";
                if (url.includes("incident")) module = "Incidents";
                else if (url.includes("training")) module = "Training";
                else if (url.includes("audit") || url.includes("inspection")) module = "Audits";
                else if (url.includes("ptw")) module = "PTW";
                else if (url.includes("medical")) module = "Medical";
                else if (url.includes("ppe")) module = "PPE";
                else if (url.includes("rca")) module = "RCA";
                else if (url.includes("environmental")) module = "Environmental";
                else if (url.includes("governance")) module = "Governance";
                else if (url.includes("unsafety")) module = "Unsafety";
                else if (url.includes("report")) module = "Reports";

                // Increment usage
                incrementUsage(module);
            }

            return originalFetch(resource, config);
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, [apiLimit]); // Re-binding if apiLimit changes (though it doesn't really matter for the interceptor logic itself, but good for consistency)

    return (
        <ApiUsageContext.Provider value={{
            apiLimit,
            apiUsed,
            remainingApi,
            dailyLimit,
            dailyUsed,
            dailyRemaining,
            moduleUsage,
            incrementUsage
        }}>
            {children}
        </ApiUsageContext.Provider>
    );
};

export const useApiUsage = () => {
    const context = useContext(ApiUsageContext);
    if (context === undefined) {
        throw new Error('useApiUsage must be used within an ApiUsageProvider');
    }
    return context;
};
