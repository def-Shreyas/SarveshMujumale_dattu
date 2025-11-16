"use client";
import React, { useState, useEffect } from "react";
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
  Settings as SettingsIcon,
  User,
  Key,
  LogOut,
  Building,
  Check,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Zap,
  UserPlus,
  Users as UsersIcon,
  Star,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api"; 
import type { User as AuthUser } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils"; 

// --- Type for API Usage data ---
interface ApiUsage {
  daily_limit: number;
  monthly_limit: number;
  api_calls_today: number;
  api_calls_month: number;
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
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      setIsLoading(true); 
      setApiError(null);
      try {
        const data = await apiClient.get("/auth/rate-limit");
        if (data && typeof data.api_calls_month !== 'undefined') {
          setUsage(data); 
        } else {
          throw new Error("Invalid usage data received from server.");
        }
      } catch (error: any) {
        console.error("Failed to fetch API usage:", error);
        setApiError(error.message || "Failed to fetch API usage.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsage();
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

  const dailyUsage = usage.daily_limit > 0 ? (usage.api_calls_today / usage.daily_limit) * 100 : 0;
  const monthlyUsage = usage.monthly_limit > 0 ? (usage.api_calls_month / usage.monthly_limit) * 100 : 0;

  return (
    <SectionCard
      title="API & Subscription"
      description={`You are currently on the ${user.subscription_tier} plan.`}
    >
      <div className="space-y-4">
        <div>
          <Label className="flex justify-between mb-1">
            <span>Monthly API Calls Used</span>
            <span className="font-bold">{usage.api_calls_month.toLocaleString()} / {usage.monthly_limit > 0 ? usage.monthly_limit.toLocaleString() : 'Unlimited'}</span>
          </Label>
          <Progress value={monthlyUsage} indicatorClassName={monthlyUsage > 80 ? "bg-red-500" : "bg-teal-500"} />
        </div>
        <div>
          <Label className="flex justify-between mb-1">
            <span>Daily API Calls Used</span>
            <span className="font-bold">{usage.api_calls_today.toLocaleString()} / {usage.daily_limit > 0 ? usage.daily_limit.toLocaleString() : 'Unlimited'}</span>
          </Label>
          <Progress value={dailyUsage} indicatorClassName={dailyUsage > 80 ? "bg-yellow-500" : "bg-teal-500"} />
        </div>
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
      toast.error("Error", { description: "Username, Email, and Password are required."});
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
            <Input id="username" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Temporary Password</Label>
            <Input id="password" type="text" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" value={newUser.company_name} onChange={(e) => setNewUser({...newUser, company_name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact">Contact Person</Label>
            <Input id="contact" value={newUser.contact_person} onChange={(e) => setNewUser({...newUser, contact_person: e.target.value})} />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={newUser.role} onValueChange={(val: AuthUser['role']) => setNewUser({...newUser, role: val})}>
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
            <Select value={newUser.subscription_tier} onValueChange={(val: any) => setNewUser({...newUser, subscription_tier: val})}>
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
            <Input id="limit" type="number" value={newUser.api_calls_limit} onChange={(e) => setNewUser({...newUser, api_calls_limit: parseInt(e.target.value) || 0})} />
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
        <UserListTable users={users} />
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
      toast.error("Error", { description: "Please select a user to update."});
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
              <Select value={updateData.subscription_tier} onValueChange={(val: any) => setUpdateData({...updateData, subscription_tier: val})}>
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
              <Input id="limit" type="number" value={updateData.api_calls_limit} onChange={(e) => setUpdateData({...updateData, api_calls_limit: parseInt(e.target.value) || 0})} />
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

const UserListTable: React.FC<{ users: AuthUser[] }> = ({ users }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Username</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Sub Tier</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {users.map((user) => (
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
        </TableRow>
      ))}
    </TableBody>
  </Table>
);


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
      <TabsList className="w-full justify-start h-12 bg-gray-100">
        <TabsTrigger value="profile" className="flex items-center gap-2 text-base data-[state=active]:bg-white">
          <User className="h-5 w-5" /> Profile
        </TabsTrigger>
        <TabsTrigger value="user_management" className="flex items-center gap-2 text-base data-[state=active]:bg-white">
          <UsersIcon className="h-5 w-5 text-[#0B3D91]" /> User Management
        </TabsTrigger>
        <TabsTrigger value="subscriptions" className="flex items-center gap-2 text-base data-[state=active]:bg-white">
          <Star className="h-5 w-5 text-yellow-500" /> Manage Subscriptions
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