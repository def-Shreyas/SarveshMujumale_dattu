import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  User,
  Key,
  Shield,
  LogOut,
  Mail,
  Building,
  Check,
  MapPin,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"; // Assuming Sonner is installed

// --- Utility Components and Functions ---

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

// --- 1. Profile Management Section ---

const ProfileSettings: React.FC = () => {
  const [profileData, setProfileData] = useState({
    name: "Dr. A. Sharma",
    role: "CEO / Managing Director",
    email: "a.sharma@dattu.com",
    plant: "Plant A (Manufacturing)",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // TODO: Integrate Backend API call (PUT /api/user/profile)
    console.log("Saving profile changes:", profileData);
    
    setTimeout(() => {
        setIsSaving(false);
        toast.success("Profile Updated", { description: "Your executive details have been saved." });
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      <SectionCard
        title="Personal Information"
        description="Review and update your core identity details."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profileData.email} disabled />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Role / Designation</Label>
            <Input id="role" value={profileData.role} disabled />
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
            {isSaving ? (
                <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
            ) : (
                <>
                    <Check className="mr-2 h-4 w-4" /> Save Changes
                </>
            )}
          </AnimatedButton>
        </div>
      </SectionCard>
      
      <SectionCard
        title="Change Password"
        description="Ensure your account remains secure by updating your password periodically."
      >
        <PasswordChangeForm />
      </SectionCard>
    </div>
  );
};

// Sub-component for password change form (Encapsulated state)
const PasswordChangeForm: React.FC = () => {
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = () => {
        if (passwords.new !== passwords.confirm) {
            toast.error("Error", { description: "New passwords do not match." });
            return;
        }
        if (passwords.new.length < 8) {
            toast.error("Error", { description: "Password must be at least 8 characters." });
            return;
        }
        
        setIsLoading(true);
        // TODO: Integrate Backend API call (POST /api/user/change-password)
        console.log("Attempting password change...");
        
        setTimeout(() => {
            setIsLoading(false);
            if (passwords.current === "correct-mock") { // Simulate correct current password check
                toast.success("Success", { description: "Password successfully updated." });
                setPasswords({ current: "", new: "", confirm: "" }); // Clear form
            } else {
                 toast.error("Failure", { description: "Current password was incorrect." });
            }
        }, 2000);
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
                    {isLoading ? (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Updating...
                        </>
                    ) : (
                        <>
                            <Key className="mr-2 h-4 w-4" /> Update Password
                        </>
                    )}
                </AnimatedButton>
            </div>
        </div>
    );
};

// --- 2. System Configuration Section ---

const SystemSettings: React.FC = () => {
    const [config, setConfig] = useState({
        defaultPlant: "Plant A (Manufacturing)",
        incidentSla: 72, // hours
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


// --- 3. Logout & Account Section ---

const LogoutSection: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Clear authentication state (handled by AuthContext)
    toast.info("Logged Out", { description: "You have securely signed out." });
    navigate('/login'); // Redirect to the login page
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
            <p className="text-sm text-gray-600">
                Current user: Dr. A. Sharma (CEO)
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

// --- Main Settings Component ---

export const SettingsPage: React.FC = () => {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <Settings className="h-7 w-7 text-[#0B3D91]" />
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
        </div>
      </Tabs>
    </motion.div>
  );
};