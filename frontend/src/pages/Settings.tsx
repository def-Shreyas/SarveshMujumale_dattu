"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon,
  User,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Loader2,
  UserPlus,
  Users as UsersIcon,
  Star,
  CreditCard,
  Trash2,
  Gift,
  History,
  TrendingUp,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import type { User as AuthUser } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// --- Type for API Usage data ---
interface ApiUsage {
  api_calls_limit: number;      // Monthly API limit
  api_calls_used: number;       // Monthly API used
  api_calls_remaining: number;  // Monthly API remaining
  daily_limit: number;          // Daily limit from subscription
  daily_used: number;           // Daily used
  daily_remaining: number;      // Daily remaining
  monthly_limit: number;        // Monthly limit from subscription
  monthly_used: number;         // Monthly used
  monthly_remaining: number;   // Monthly remaining
  subscription_tier: string;
}

// --- Type for New User Form (matches backend) ---
type NewUserForm = {
  username: string;
  email: string;
  password: string;
  company_name: string;
  contact_person: string;
  role: AuthUser['role'];
  subscription_tier: "basic" | "premium" | "enterprise" | "free";
  api_calls_limit: number;
}

// --- Type for Grant API Calls (for future backend implementation) ---
// interface GrantApiCallsRequest {
//   user_id: string;
//   additional_calls: number;
//   reason?: string;
// }

// --- Type for Grant History ---
interface GrantHistory {
  id: string;
  user_id: string;
  username: string;
  email: string;
  granted_by: string;
  additional_calls: number;
  reason?: string;
  granted_at: string;
  subscription_tier?: string;
}

// --- Type for User API Usage (Admin View) ---
interface UserApiUsageInfo {
  user_id: string;
  username: string;
  email: string;
  api_calls_limit: number;
  api_calls_used: number;
  api_calls_remaining: number;
  subscription_tier: string;
  usage_percentage: number;
  status: "critical" | "warning" | "good";
}

// --- Utility Components ---
const SectionCard: React.FC<{ children: React.ReactNode; title: string; description: string }> = ({
  children,
  title,
  description,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <Card className="shadow-lg border-t-4 border-[#0B3D91] hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  </motion.div>
);

const AnimatedButton: React.FC<React.ComponentProps<typeof motion.button>> = (props) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="inline-flex items-center justify-center rounded-md font-medium transition-colors"
    {...props}
  />
);

// ===================================================================
// --- 1. USER SETTINGS COMPONENTS (For CEO, CFO, etc.) ---
// ===================================================================

const UserProfile: React.FC = () => {
  const { user } = useAuth();

  // This component is now READ-ONLY as requested
  return (
    <SectionCard
      title="Personal Information"
      description="This is your registered user information."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name">Full Name / Company</Label>
          <Input id="name" value={user?.company_name || user?.username} disabled />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user?.email} disabled />
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">Role</Label>
          <Input id="role" value={user?.role} className="capitalize" disabled />
        </div>
      </div>
    </SectionCard>
  );
};

const UserApiUsage: React.FC = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<ApiUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchUsage = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setApiError(null);

    try {
      const data = await apiClient.get("/auth/rate-limit");

      if (data && typeof data.api_calls_limit !== 'undefined') {
        setUsage(data);
        setApiError(null); // Clear any previous errors
      } else {
        throw new Error("Invalid usage data received from server.");
      }
    } catch (error: any) {
      console.error("Failed to fetch API usage:", error);
      const errorMessage = error.message || "Failed to fetch API usage.";

      // Check if we have usage data in the error (e.g. from 429 Limit Exceeded)
      // The backend might return { detail: { ... }, limit: 10, used: 11 } or similar
      // We check for 'limit' and 'used' in error.data
      if (error.data && (typeof error.data.limit === 'number' || typeof error.data.daily_limit === 'number')) {
        const fallbackUsage: ApiUsage = {
          api_calls_limit: error.data.api_calls_limit ?? error.data.limit ?? 1000,
          api_calls_used: error.data.api_calls_used ?? error.data.used ?? 0,
          api_calls_remaining: error.data.api_calls_remaining ?? 0,
          daily_limit: error.data.daily_limit ?? error.data.limit ?? 100, // Fallback to limit if daily_limit missing
          daily_used: error.data.daily_used ?? error.data.used ?? 0,
          daily_remaining: error.data.daily_remaining ?? 0,
          monthly_limit: error.data.monthly_limit ?? 1000,
          monthly_used: error.data.monthly_used ?? 0,
          monthly_remaining: error.data.monthly_remaining ?? 0,
          subscription_tier: error.data.subscription_tier ?? "basic"
        };
        setUsage(fallbackUsage);
        setApiError(null); // Clear error so UI renders the bars
      } else {
        setApiError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Prevent multiple concurrent fetches
    if (hasFetchedRef.current) return;

    let isMounted = true;
    hasFetchedRef.current = true;
    const abortController = new AbortController();

    const loadUsage = async () => {
      if (!isMounted || abortController.signal.aborted) return;
      await fetchUsage(false);
    };

    loadUsage();

    return () => {
      isMounted = false;
      abortController.abort();
      hasFetchedRef.current = false;
    };
  }, []);

  // This is the CRASH GUARD (fixes blank page)
  if (isLoading) {
    return (
      <SectionCard title="API & Subscription" description="Loading usage data...">
        <div className="h-24 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </SectionCard>
    )
  }

  if (apiError || !user) {
    return (
      <SectionCard title="API & Subscription" description="Could not load usage data.">
        <div className="h-24 flex justify-center items-center text-red-500">
          <AlertTriangle className="h-6 w-6" />
          <p className="ml-2">{apiError || "User not found."}</p>
        </div>
      </SectionCard>
    )
  }

  if (!usage) {
    return (
      <SectionCard title="API & Subscription" description="No usage data available.">
        <div className="h-24 flex justify-center items-center text-gray-500">
          <p>Use an AI tool (like the Vision Report) to see your usage.</p>
        </div>
      </SectionCard>
    )
  }

  // Calculate percentages for progress bars
  const monthlyUsagePercent = usage.api_calls_limit > 0
    ? (usage.api_calls_used / usage.api_calls_limit) * 100
    : 0;

  const dailyUsagePercent = usage.daily_limit > 0
    ? (usage.daily_used / usage.daily_limit) * 100
    : 0;



  // Format remaining APIs
  const formatRemaining = (remaining: number) => {
    if (remaining === -1) return "Unlimited";
    return remaining.toLocaleString();
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return "Unlimited";
    return limit.toLocaleString();
  };

  return (
    <SectionCard
      title="API & Subscription"
      description={`You are currently on the ${user.subscription_tier} plan.`}
    >
      <div className="space-y-6">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsage(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Usage"}
          </Button>
        </div>

        {/* Monthly API Calls (Main Limit) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold">API Calls</Label>
            <div className="text-right">
              <span className="text-lg font-bold text-[#0B3D91]">
                {usage.api_calls_used.toLocaleString()} / {formatLimit(usage.api_calls_limit)}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                ({formatRemaining(usage.api_calls_remaining)} remaining)
              </span>
            </div>
          </div>
          <Progress
            value={monthlyUsagePercent}
            className="h-3"
            indicatorClassName={
              monthlyUsagePercent >= 90
                ? "bg-red-500"
                : monthlyUsagePercent >= 75
                  ? "bg-yellow-500"
                  : "bg-teal-500"
            }
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Used: {usage.api_calls_used.toLocaleString()}</span>
            <span>Remaining: {formatRemaining(usage.api_calls_remaining)}</span>
          </div>
        </div>

        {/* Daily API Calls (New Section) */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold">Daily API Calls</Label>
            <div className="text-right">
              <span className="text-lg font-bold text-[#0B3D91]">
                {usage.daily_used.toLocaleString()} / {formatLimit(usage.daily_limit)}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                ({formatRemaining(usage.daily_remaining)} remaining)
              </span>
            </div>
          </div>
          <Progress
            value={dailyUsagePercent}
            className="h-3"
            indicatorClassName={
              dailyUsagePercent >= 90
                ? "bg-red-500"
                : dailyUsagePercent >= 75
                  ? "bg-yellow-500"
                  : "bg-teal-500"
            }
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Used: {usage.daily_used.toLocaleString()}</span>
            <span>Remaining: {formatRemaining(usage.daily_remaining)}</span>
          </div>
        </div>



        {/* Monthly Subscription Limit (Info) */}
        {usage.monthly_limit !== usage.api_calls_limit && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Subscription Monthly Limit:</span>
              <span className="font-semibold">
                {usage.monthly_used.toLocaleString()} / {formatLimit(usage.monthly_limit)}
              </span>
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {monthlyUsagePercent >= 90 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Warning: You've used {monthlyUsagePercent.toFixed(0)}% of your monthly API limit!
              </span>
            </div>
          </div>
        )}

        {monthlyUsagePercent >= 75 && monthlyUsagePercent < 90 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                You've used {monthlyUsagePercent.toFixed(0)}% of your monthly API limit.
              </span>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

const UserSubscription: React.FC = () => {
  return (
    <SectionCard
      title="Manage Subscription"
      description="Upgrade your plan to access more features and higher API limits."
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Fixed the 'variant' bug by wrapping Button in motion.div */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full md:w-auto"
        >
          <Button className="w-full bg-green-600 hover:bg-green-700">
            <Star className="mr-2 h-4 w-4" /> Upgrade to Premium
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full md:w-auto"
        >
          <Button className="w-full" variant="outline">
            <CreditCard className="mr-2 h-4 w-4" /> Update Billing
          </Button>
        </motion.div>
      </div>
    </SectionCard>
  );
};

// ===================================================================
// --- 2. ADMIN SETTINGS COMPONENTS (For 'admin' role) ---
// ===================================================================

const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  return (
    <SectionCard
      title="Administrator Profile"
      description="This is your administrative account information."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name">Full Name / Company</Label>
          <Input id="name" value={user?.company_name || user?.username} disabled />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user?.email} disabled />
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">Role</Label>
          <Input id="role" value={user?.role} className="capitalize" disabled />
        </div>
      </div>
    </SectionCard>
  );
};

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form state for the new user, now matching your backend
  const [newUser, setNewUser] = useState<NewUserForm>({
    username: "",
    email: "",
    password: "",
    company_name: "",
    contact_person: "",
    role: "user",
    subscription_tier: "basic",
    api_calls_limit: 1000,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get("/auth/admin/users");
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast.error("Error", { description: "Username, Email, and Password are required." });
      return;
    }

    setIsCreating(true);
    try {
      // Calls POST /auth/admin/create-user
      await apiClient.post("/auth/admin/create-user", newUser);

      toast.success("User Created", { description: `Account for ${newUser.username} created.` });
      setNewUser({ // Clear form
        username: "", email: "", password: "", company_name: "",
        contact_person: "", role: "user", subscription_tier: "basic", api_calls_limit: 1000
      });
      await fetchUsers(); // Refresh the user list

    } catch (error: any) {
      console.error("Failed to create user:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Calls DELETE /auth/admin/users/{user_id}
      await apiClient.delete(`/auth/admin/users/${userId}`);
      await fetchUsers(); // Refresh the user list after deletion
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      throw error; // Re-throw to let the dialog handle the error display
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#0B3D91]" />
        <p className="ml-2 text-gray-600">Loading User List...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Create New User"
        description="Create new executive or user accounts for your organization."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password"> Password</Label>
            <Input id="password" type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" value={newUser.company_name} onChange={(e) => setNewUser({ ...newUser, company_name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact">Contact Person</Label>
            <Input id="contact" value={newUser.contact_person} onChange={(e) => setNewUser({ ...newUser, contact_person: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={newUser.role} onValueChange={(val: AuthUser['role']) => setNewUser({ ...newUser, role: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="SafetyManager">Safety Manager</SelectItem>
                <SelectItem value="CEO">CEO</SelectItem>
                <SelectItem value="CFO">CFO</SelectItem>
                <SelectItem value="CHRO">CHRO</SelectItem>
                <SelectItem value="COO">COO</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Subscription Tier</Label>
            <Select value={newUser.subscription_tier} onValueChange={(val: any) => setNewUser({ ...newUser, subscription_tier: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="limit">API Call Limit (Monthly)</Label>
            <Input id="limit" type="number" value={newUser.api_calls_limit} onChange={(e) => setNewUser({ ...newUser, api_calls_limit: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <AnimatedButton
            onClick={handleCreateUser}
            disabled={isCreating}
            className="bg-green-600 text-white px-6 py-2 shadow-md hover:bg-green-700 transition-colors"
          >
            {isCreating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {isCreating ? "Creating..." : "Create User"}
          </AnimatedButton>
        </div>
      </SectionCard>

      <SectionCard
        title="Manage Existing Users"
        description="View and manage all user accounts in the system."
      >
        <UserListTable users={users} onDelete={handleDeleteUser} />
      </SectionCard>
    </div>
  );
}

const SubscriptionManager: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [updateData, setUpdateData] = useState({
    subscription_tier: "basic" as "basic" | "premium" | "enterprise" | "free",
    api_calls_limit: 1000,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get("/auth/admin/users");
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // When user is selected, update form with their current data
  useEffect(() => {
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (selectedUser) {
      setUpdateData({
        subscription_tier: selectedUser.subscription_tier as any,
        // Your Python 'UserResponse' model includes 'api_calls_limit'
        api_calls_limit: (selectedUser as any).api_calls_limit || 1000,
      });
    }
  }, [selectedUserId, users]);

  const handleUpdateSubscription = async () => {
    if (!selectedUserId) {
      toast.error("Error", { description: "Please select a user to update." });
      return;
    }

    setIsUpdating(true);
    try {
      // Calls PUT /auth/admin/users/{user_id}/upgrade
      await apiClient.put(`/auth/admin/users/${selectedUserId}/upgrade`, updateData);

      toast.success("Subscription Updated");
      await fetchUsers(); // Refresh list to show new data

    } catch (error: any) {
      console.error("Failed to update subscription:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <SectionCard title="Manage Subscriptions & API Limits" description="Grant or upgrade subscription tiers and API call limits for a specific user.">
        <div className="h-48 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B3D91]" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Manage Subscriptions & API Limits"
      description="Grant or upgrade subscription tiers and API call limits for a specific user."
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>Select User</Label>
          <Select onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user to manage..." />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* This form appears once a user is selected */}
        {selectedUserId && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-1">
              <Label>Subscription Tier</Label>
              <Select value={updateData.subscription_tier} onValueChange={(val: any) => setUpdateData({ ...updateData, subscription_tier: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="limit">API Call Limit (Monthly)</Label>
              <Input id="limit" type="number" value={updateData.api_calls_limit} onChange={(e) => setUpdateData({ ...updateData, api_calls_limit: parseInt(e.target.value) || 0 })} />
            </div>
          </motion.div>
        )}
      </div>
      <div className="flex justify-end pt-4">
        <AnimatedButton
          onClick={handleUpdateSubscription}
          disabled={isUpdating || !selectedUserId}
          className="bg-[#00A79D] text-white px-6 py-2 shadow-md hover:bg-[#008a7e] transition-colors"
        >
          {isUpdating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
          {isUpdating ? "Updating..." : "Update Subscription"}
        </AnimatedButton>
      </div>
    </SectionCard>
  );
};

// ===================================================================
// --- NEW ADMIN COMPONENTS ---
// ===================================================================

const GrantApiCalls: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [additionalCalls, setAdditionalCalls] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGranting, setIsGranting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get("/auth/admin/users");
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleGrantApiCalls = async () => {
    if (!selectedUserId) {
      toast.error("Error", { description: "Please select a user." });
      return;
    }
    if (additionalCalls <= 0) {
      toast.error("Error", { description: "Please enter a valid number of API calls to grant." });
      return;
    }

    setIsGranting(true);
    try {
      // Get current user data
      const selectedUser = users.find(u => u.id === selectedUserId);
      if (!selectedUser) {
        throw new Error("User not found");
      }

      const currentLimit = (selectedUser as any).api_calls_limit || 1000;
      const newLimit = currentLimit + additionalCalls;

      // Update user's API limit (this grants additional calls)
      await apiClient.put(`/auth/admin/users/${selectedUserId}/upgrade`, {
        subscription_tier: selectedUser.subscription_tier,
        api_calls_limit: newLimit
      });

      toast.success("API Calls Granted", {
        description: `Successfully granted ${additionalCalls.toLocaleString()} API calls to ${selectedUser.username}. New limit: ${newLimit.toLocaleString()}`
      });

      // Reset form
      setSelectedUserId("");
      setAdditionalCalls(0);
      setReason("");
      await fetchUsers();
    } catch (error: any) {
      console.error("Failed to grant API calls:", error);
      toast.error("Grant Failed", { description: error.message || "Failed to grant API calls." });
    } finally {
      setIsGranting(false);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  if (isLoading) {
    return (
      <SectionCard title="Grant Additional API Calls" description="Grant additional API calls to users who have reached their limit.">
        <div className="h-48 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B3D91]" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Grant Additional API Calls"
      description="Grant additional API calls to users who have reached their subscription tier limit."
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>Select User</Label>
          <Select onValueChange={setSelectedUserId} value={selectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user to grant API calls..." />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.username} ({user.email}) - Tier: {user.subscription_tier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUser && (
          <motion.div
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Limit:</span>
                <span className="ml-2 font-semibold">
                  {(selectedUser as any).api_calls_limit?.toLocaleString() || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Used:</span>
                <span className="ml-2 font-semibold">
                  {(selectedUser as any).api_calls_used?.toLocaleString() || "0"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Remaining:</span>
                <span className="ml-2 font-semibold text-red-600">
                  {((selectedUser as any).api_calls_limit - ((selectedUser as any).api_calls_used || 0)).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Subscription:</span>
                <span className="ml-2 font-semibold capitalize">{selectedUser.subscription_tier}</span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="additionalCalls">Additional API Calls to Grant</Label>
            <Input
              id="additionalCalls"
              type="number"
              min="1"
              value={additionalCalls}
              onChange={(e) => setAdditionalCalls(parseInt(e.target.value) || 0)}
              placeholder="Enter number of API calls"
            />
            {selectedUser && additionalCalls > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                New limit will be: {((selectedUser as any).api_calls_limit || 0) + additionalCalls} calls
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Special request, exceeded limit"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <AnimatedButton
          onClick={handleGrantApiCalls}
          disabled={isGranting || !selectedUserId || additionalCalls <= 0}
          className="bg-[#0B3D91] text-white px-6 py-2 shadow-md hover:bg-[#0a2f6f] transition-colors"
        >
          {isGranting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Granting...
            </>
          ) : (
            <>
              <Gift className="mr-2 h-4 w-4" />
              Grant API Calls
            </>
          )}
        </AnimatedButton>
      </div>
    </SectionCard>
  );
};

const UserApiUsageMonitor: React.FC = () => {
  const [userUsage, setUserUsage] = useState<UserApiUsageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "good">("all");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get("/auth/admin/users");

      // Calculate usage info for each user
      const usageInfo: UserApiUsageInfo[] = data.map((user: any) => {
        const limit = user.api_calls_limit || 1000;
        const used = user.api_calls_used || 0;
        const remaining = limit - used;
        const percentage = limit > 0 ? (used / limit) * 100 : 0;

        let status: "critical" | "warning" | "good" = "good";
        if (percentage >= 90) status = "critical";
        else if (percentage >= 75) status = "warning";

        return {
          user_id: user.id,
          username: user.username,
          email: user.email,
          api_calls_limit: limit,
          api_calls_used: used,
          api_calls_remaining: remaining,
          subscription_tier: user.subscription_tier,
          usage_percentage: percentage,
          status
        };
      });

      setUserUsage(usageInfo);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load user usage data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsage = filter === "all"
    ? userUsage
    : userUsage.filter(u => u.status === filter);

  const criticalUsers = userUsage.filter(u => u.status === "critical").length;
  const warningUsers = userUsage.filter(u => u.status === "warning").length;

  if (isLoading) {
    return (
      <SectionCard title="User API Usage Monitor" description="Monitor all users' API usage and get alerts when limits are approaching.">
        <div className="h-48 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B3D91]" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="User API Usage Monitor"
      description="Monitor all users' API usage and get alerts when limits are approaching."
    >
      <div className="space-y-4">
        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalUsers}</p>
                <p className="text-xs text-gray-500">≥90% usage</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warning</p>
                <p className="text-2xl font-bold text-yellow-600">{warningUsers}</p>
                <p className="text-xs text-gray-500">≥75% usage</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Good</p>
                <p className="text-2xl font-bold text-green-600">{userUsage.length - criticalUsers - warningUsers}</p>
                <p className="text-xs text-gray-500">&lt;75% usage</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({userUsage.length})
          </Button>
          <Button
            variant={filter === "critical" ? "default" : "outline"}
            size="sm"
            className={filter === "critical" ? "bg-red-600 hover:bg-red-700" : ""}
            onClick={() => setFilter("critical")}
          >
            Critical ({criticalUsers})
          </Button>
          <Button
            variant={filter === "warning" ? "default" : "outline"}
            size="sm"
            className={filter === "warning" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
            onClick={() => setFilter("warning")}
          >
            Warning ({warningUsers})
          </Button>
          <Button
            variant={filter === "good" ? "default" : "outline"}
            size="sm"
            className={filter === "good" ? "bg-green-600 hover:bg-green-700" : ""}
            onClick={() => setFilter("good")}
          >
            Good ({userUsage.length - criticalUsers - warningUsers})
          </Button>
        </div>

        {/* User Usage Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Usage %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsage.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No users found matching the filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsage.map((usage) => (
                  <TableRow key={usage.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{usage.username}</p>
                        <p className="text-xs text-gray-500">{usage.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{usage.subscription_tier}</TableCell>
                    <TableCell>{usage.api_calls_used.toLocaleString()}</TableCell>
                    <TableCell>{usage.api_calls_limit.toLocaleString()}</TableCell>
                    <TableCell className={usage.api_calls_remaining < 100 ? "text-red-600 font-semibold" : ""}>
                      {usage.api_calls_remaining.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={usage.usage_percentage} className="w-20 h-2" />
                        <span className="text-sm">{usage.usage_percentage.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          usage.status === "critical"
                            ? "bg-red-600 text-white"
                            : usage.status === "warning"
                              ? "bg-yellow-600 text-white"
                              : "bg-green-600 text-white"
                        }
                      >
                        {usage.status === "critical" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {usage.status === "warning" && <Bell className="h-3 w-3 mr-1" />}
                        {usage.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
    </SectionCard>
  );
};

const GrantHistory: React.FC = () => {
  const [history, setHistory] = useState<GrantHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Note: This will work once backend endpoint is created
  // For now, we'll show a placeholder that explains the feature
  useEffect(() => {
    setIsLoading(true);
    // Simulate loading - in real implementation, this would call:
    // const data = await apiClient.get("/auth/admin/grant-history");
    setTimeout(() => {
      setHistory([]);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <SectionCard title="Grant History" description="View history of all API call grants made to users.">
        <div className="h-48 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B3D91]" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Grant History"
      description="View history of all API call grants and subscription tier updates made to users."
    >
      {history.length === 0 ? (
        <div className="text-center py-12">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No grant history available yet.</p>
          <p className="text-sm text-gray-500">
            Grant history will appear here once you start granting additional API calls to users.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Note: This feature requires backend implementation of grant tracking.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Granted By</TableHead>
                <TableHead>Additional Calls</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Subscription</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.granted_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.username}</p>
                      <p className="text-xs text-gray-500">{item.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.granted_by}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    +{item.additional_calls.toLocaleString()}
                  </TableCell>
                  <TableCell>{item.reason || "—"}</TableCell>
                  <TableCell className="capitalize">{item.subscription_tier || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </SectionCard>
  );
};

const UserListTable: React.FC<{ users: AuthUser[]; onDelete: (userId: string) => Promise<void> }> = ({ users, onDelete }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (user: AuthUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      toast.success("User Deleted", { description: `User ${userToDelete.username} has been permanently deleted.` });
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast.error("Delete Failed", { description: error.message || "Failed to delete user. Please try again." });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sub Tier</TableHead>
            <TableHead>API Usage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const apiLimit = (user as any).api_calls_limit || 1000;
            const apiUsed = (user as any).api_calls_used || 0;
            const usagePercent = apiLimit > 0 ? (apiUsed / apiLimit) * 100 : 0;
            const isCritical = usagePercent >= 90;
            const isWarning = usagePercent >= 75 && usagePercent < 90;

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    className={cn("text-white capitalize", user.role === 'admin' ? "bg-[#0B3D91]" : "bg-gray-500")}
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn("text-white capitalize", user.status === 'active' ? "bg-green-600" : "bg-red-600")}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">
                  {user.subscription_tier}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="flex-1">
                      <Progress
                        value={usagePercent}
                        className="h-2"
                        indicatorClassName={
                          isCritical ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-green-500"
                        }
                      />
                    </div>
                    <span className={cn(
                      "text-xs font-semibold",
                      isCritical ? "text-red-600" : isWarning ? "text-yellow-600" : "text-gray-600"
                    )}>
                      {usagePercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {apiUsed.toLocaleString()} / {apiLimit.toLocaleString()}
                    {isCritical && <AlertTriangle className="h-3 w-3 inline ml-1 text-red-600" />}
                    {isWarning && !isCritical && <Bell className="h-3 w-3 inline ml-1 text-yellow-600" />}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(user)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription className="pt-2">
              You are about to permanently delete the user account. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">User Details:</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  <li><strong>Username:</strong> {userToDelete.username}</li>
                  <li><strong>Email:</strong> {userToDelete.email}</li>
                  <li><strong>Role:</strong> <span className="capitalize">{userToDelete.role}</span></li>
                  {userToDelete.company_name && (
                    <li><strong>Company:</strong> {userToDelete.company_name}</li>
                  )}
                </ul>
              </div>
              <p className="mt-4 text-sm text-red-600 font-medium">
                ⚠️ This will remove the user from the frontend, backend, and database completely.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};


// --- Logout Section Component (For all users) ---
const LogoutSection: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info("Logged Out", { description: "You have securely signed out." });
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Session Management"
        description="Sign out of your current DATTU session."
      >
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <p className="font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-[#0B3D91]" /> Active Session
            </p>
            <p className="text-sm text-gray-600 capitalize">
              Current user: {user?.username} ({user?.role})
            </p>
          </div>
          <AnimatedButton
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-2 shadow-md hover:bg-red-700 transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" /> Log Out Now
          </AnimatedButton>
        </div>
      </SectionCard>
    </div>
  );
};

// ===================================================================
// --- 3. MAIN SETTINGS COMPONENT (The "Switch") ---
// ===================================================================

const AdminSettings: React.FC = () => {
  return (
    <Tabs defaultValue="profile">
      <TabsList className="w-full justify-start h-12 bg-gray-100 flex-wrap">
        <TabsTrigger value="profile" className="flex items-center gap-2 text-base data-[state=active]:bg-white">
          <User className="h-5 w-5" /> Profile
        </TabsTrigger>
        <TabsTrigger value="user_management" className="flex items-center gap-2 text-base data-[state=active]:bg-white">
          <UsersIcon className="h-5 w-5 text-[#0B3D91]" /> User Management
        </TabsTrigger>
        <TabsTrigger value="subscriptions" className="flex items-center gap-2 text-base data-[state=active]:bg-white">
          <Star className="h-5 w-5 text-yellow-500" /> Manage Subscriptions
        </TabsTrigger>
        <TabsTrigger value="grant_calls" className="flex items-center gap-2 text-base data-[state=active]:bg-white">
          <Gift className="h-5 w-5 text-green-600" /> Grant API Calls
        </TabsTrigger>
        <TabsTrigger value="usage_monitor" className="flex items-center gap-2 text-base data-[state=active]:bg-white">
          <TrendingUp className="h-5 w-5 text-blue-600" /> Usage Monitor
        </TabsTrigger>
        <TabsTrigger value="grant_history" className="flex items-center gap-2 text-base data-[state=active]:bg-white">
          <History className="h-5 w-5 text-purple-600" /> Grant History
        </TabsTrigger>
        <TabsTrigger value="logout" className="flex items-center gap-2 text-red-500 data-[state=active]:bg-white">
          <LogOut className="h-5 w-5" /> Log Out
        </TabsTrigger>
      </TabsList>
      <div className="mt-6">
        <TabsContent value="profile">
          <AdminProfile />
        </TabsContent>
        <TabsContent value="user_management">
          <AdminUserManagement />
        </TabsContent>
        <TabsContent value="subscriptions">
          <SubscriptionManager />
        </TabsContent>
        <TabsContent value="grant_calls">
          <GrantApiCalls />
        </TabsContent>
        <TabsContent value="usage_monitor">
          <UserApiUsageMonitor />
        </TabsContent>
        <TabsContent value="grant_history">
          <GrantHistory />
        </TabsContent>
        <TabsContent value="logout">
          <LogoutSection />
        </TabsContent>
      </div>
    </Tabs>
  );
}

const UserSettings: React.FC = () => {
  return (
    <Tabs defaultValue="profile">
      <TabsList className="w-full justify-start h-12 bg-gray-100">
        <TabsTrigger value="profile" className="flex items-center gap-2 text-base data-[state=active]:bg-white">
          <User className="h-5 w-5" /> Profile & Subscription
        </TabsTrigger>
        <TabsTrigger value="logout" className="flex items-center gap-2 text-red-500 data-[state=active]:bg-white">
          <LogOut className="h-5 w-5" /> Log Out
        </TabsTrigger>
      </TabsList>
      <div className="mt-6">
        <TabsContent value="profile">
          <div className="space-y-6">
            <UserProfile />
            <UserApiUsage />
            <UserSubscription />
          </div>
        </TabsContent>
        <TabsContent value="logout">
          <LogoutSection />
        </TabsContent>
      </div>
    </Tabs>
  );
}

// --- This is the main component exported from the file ---
export const Settings: React.FC = () => {
  const { user } = useAuth();

  // Show a loading spinner until we know the user's role
  if (!user) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-[#0B3D91]" />
      </div>
    );
  }

  // This is the "switch" that renders the correct UI
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <SettingsIcon className="h-7 w-7 text-[#0B3D91]" />
        Executive Settings
      </h1>
      <Separator />

      {/* This is the core logic:
        IF the user's role is 'admin', show the Admin dashboard.
        ELSE, show the regular User dashboard.
      */}
      {user.role === 'admin' ? <AdminSettings /> : <UserSettings />}

    </motion.div>
  );
};