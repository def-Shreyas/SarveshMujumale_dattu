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

// --- 1. Profile Management Section (For all users) ---
const ProfileSettings: React.FC = () => {
  const { user, login, token } = useAuth(); 
  
  const [profileData, setProfileData] = useState({
    name: user?.company_name || "",
    role: user?.role || "user",
    email: user?.email || "loading...",
    plant: "Plant A (Manufacturing)",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) { 
        setIsLoading(false);
        return; 
      }
      setIsLoading(true);
      try {
        const data: AuthUser = await apiClient.get("/auth/profile");
        setProfileData({
          name: data.company_name || "N/A",
          email: data.email,
          role: data.role,
          plant: "Plant A (Manufacturing)", 
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // MOCKUP: Your backend needs a `PUT /auth/profile` route
      await new Promise(res => setTimeout(res, 1000));
      const updatedUser: AuthUser = { ...user!, company_name: profileData.name };
      if (token) {
        login(updatedUser, token); 
      }
      toast.success("Profile Updated");
    } catch (error) {
      toast.error("Update Failed");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#0B3D91]" />
        <p className="ml-2 text-gray-600">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Personal Information"
        description="Review and update your core identity details."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Full Name / Company</Label>
            <Input id="name" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profileData.email} disabled />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={profileData.role} className="capitalize" disabled />
          </div>
          <div className="space-y-1">
            <Label htmlFor="plant">Primary Plant</Label>
            <Select value={profileData.plant} onValueChange={(val) => setProfileData({...profileData, plant: val})}>
                <SelectTrigger>
                    <SelectValue placeholder="Select Plant" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Plant A (Manufacturing)">Plant A (Manufacturing)</SelectItem>
                    <SelectItem value="Plant B (Assembly)">Plant B (Assembly)</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <AnimatedButton 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#0B3D91] text-white px-6 py-2 shadow-md hover:bg-[#082f70] transition-colors"
          >
            {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </AnimatedButton>
        </div>
      </SectionCard>
      
      <ApiUsageCard />
      
      <SectionCard
        title="Change Password"
        description="Ensure your account remains secure by updating your password periodically."
      >
        <PasswordChangeForm />
      </SectionCard>
    </div>
  );
};

// --- API Usage Component (For all users) ---
const ApiUsageCard: React.FC = () => {
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

  // 
  // --- THIS IS THE FIX ---
  // The content (<div>...</div>) is now correctly placed 
  // *inside* the <SectionCard> tags as 'children'.
  //
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
  
  // This check is redundant now because of the `apiError` check, but it is safe.
  if (!usage) {
     return (
       <SectionCard title="API & Subscription" description="No usage data available.">
         <div className="h-24 flex justify-center items-center text-gray-500">
           <p>Use an AI tool (like the Vision Report) to see your usage.</p>
         </div>
       </SectionCard>
     )
  }
  // --- END OF FIX ---

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

// --- Password Change Component (For all users) ---
const PasswordChangeForm: React.FC = () => {
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (passwords.new !== passwords.confirm) {
            toast.error("Error", { description: "New passwords do not match." });
            return;
        }
        if (passwords.new.length < 8) {
            toast.error("Error", { description: "Password must be at least 8 characters." });
            return;
        }
        setIsLoading(true);
        try {
          // MOCKUP: Your backend needs a `POST /auth/change-password` route
          await new Promise(res => setTimeout(res, 1000));
          if (passwords.current !== "1234567") throw new Error("Current password was incorrect.");
          // --- End Mockup ---
          
          toast.success("Success", { description: "Password successfully updated." });
          setPasswords({ current: "", new: "", confirm: "" });
        } catch (error: any) {
          console.error("Password change failed:", error);
          toast.error("Password Change Failed", { description: error.message || "Please try again." });
        } finally {
          setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="current">Current Password</Label>
                    <Input id="current" type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="new">New Password</Label>
                    <Input id="new" type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="confirm">Confirm New Password</Label>
                    <Input id="confirm" type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} />
                </div>
            </div>
            <div className="flex justify-end pt-2">
                <AnimatedButton 
                    onClick={handleSubmit} 
                    disabled={isLoading}
                    className="bg-red-600 text-white px-6 py-2 shadow-md hover:bg-red-700 transition-colors"
                >
                    {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                    {isLoading ? "Updating..." : "Update Password"}
                </AnimatedButton>
            </div>
        </div>
    );
};

// --- System Configuration Component (Mock for now) ---
const SystemSettings: React.FC = () => {
    const [config, setConfig] = useState({
        defaultPlant: "Plant A (Manufacturing)",
        incidentSla: 72,
        reportFrequency: "monthly",
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        // TODO: Integrate Backend API call (POST /api/settings/system)
        console.log("Saving system config:", config);
        
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Configuration Saved", { description: "System default settings have been updated." });
        }, 1500);
    };

    return (
        <div className="space-y-6">
             <SectionCard
                title="Default Configuration"
                description="Set default values for system operations and report generation."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <Label>Primary System Plant</Label>
                      <Select value={config.defaultPlant} onValueChange={(val) => setConfig({...config, defaultPlant: val})}>
                          <SelectTrigger>
                              <SelectValue placeholder="Select Default Plant" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Plant A (Manufacturing)">Plant A (Manufacturing)</SelectItem>
                              <SelectItem value="Plant B (Assembly)">Plant B (Assembly)</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="sla">Incident Closure SLA (Hours)</Label>
                      <Input 
                          id="sla" 
                          type="number" 
                          value={config.incidentSla} 
                          onChange={(e) => setConfig({...config, incidentSla: parseInt(e.target.value) || 0})} 
                      />
                  </div>
                  <div className="space-y-1">
                      <Label>Executive Report Frequency</Label>
                        <Select value={config.reportFrequency} onValueChange={(val) => setConfig({...config, reportFrequency: val})}>
                          <SelectTrigger>
                              <SelectValue placeholder="Select Frequency" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="on-demand">On-Demand</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                    <AnimatedButton 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-[#00A79D] text-white px-6 py-2 shadow-md hover:bg-[#008a7e] transition-colors"
                    >
                         {isSaving ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Applying...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" /> Save Configuration
                            </>
                        )}
                    </AnimatedButton>
                </div>
            </SectionCard>

            <SectionCard
                title="API Endpoints & Integration"
                description="Manage connections to external systems (ERP, HRMS) for data ingestion."
            >
                <p className="text-sm text-gray-500 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Warning: Changing API keys requires system-level access and validation.
                </p>
                <div className="space-y-3 mt-4">
                    <Label htmlFor="erp-key">ERP Connector API Key</Label>
                    <Input id="erp-key" type="password" placeholder="******************" />
                    <Label htmlFor="hrms-url">HRMS Base URL</Label>
                    <Input id="hrms-url" type="text" placeholder="https://hr-portal.com/api/v1/" />
                </div>
            </SectionCard>
        </div>
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

// --- NEW: ADMIN-ONLY USER MANAGEMENT COMPONENT ---
const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    company_name: "",
    contact_person: "",
    role: "user" as AuthUser['role'],
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
      await apiClient.post("/auth/admin/create-user", newUser);
      
      toast.success("User Created", { description: `Account for ${newUser.username} created.` });
      setNewUser({ 
        username: "", 
        email: "", 
        password: "", 
        company_name: "", 
        contact_person: "",
        role: "user",
        subscription_tier: "basic",
        api_calls_limit: 1000
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge 
                    className={cn(user.role === 'admin' ? "bg-blue-600" : "bg-gray-500", "text-white capitalize")}
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={cn(user.status === 'active' ? "bg-green-600" : "bg-red-600", "text-white capitalize")}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

// --- Main Settings Component (This is what you export) ---

export const Settings: React.FC = () => {
  // Get the current user from the "brain"
  const { user } = useAuth();

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

      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start h-12 bg-gray-100">
          <TabsTrigger value="profile" className="flex items-center gap-2 text-base data-[state=active]:bg-white">
            <User className="h-5 w-5" /> Profile & Security
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2 text-base data-[state=active]:bg-white">
            <Building className="h-5 w-5" /> System Configuration
          </TabsTrigger>
          <TabsTrigger value="logout" className="flex items-center gap-2 text-red-500 data-[state=active]:bg-white">
            <LogOut className="h-5 w-5" /> Log Out
          </TabsTrigger>
          
          {/* --- THIS IS THE ADMIN-ONLY TAB --- */}
          {user?.role === 'admin' && (
            <TabsTrigger value="admin" className="flex items-center gap-2 text-[#0B3D91] data-[state=active]:bg-white">
              <UsersIcon className="h-5 w-5" /> User Management
            </TabsTrigger>
          )}

        </TabsList>

        <div className="mt-6">
          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>
          <TabsContent value="system">
            <SystemSettings />
          </TabsContent>
          <TabsContent value="logout">
             <LogoutSection />
          </TabsContent>
          
          {/* --- THIS IS THE ADMIN-ONLY CONTENT --- */}
          {user?.role === 'admin' && (
            <TabsContent value="admin">
              <AdminUserManagement />
            </TabsContent>
          )}

        </div>
      </Tabs>
    </motion.div>
  );
};