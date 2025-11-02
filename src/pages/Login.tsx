import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateCredentials } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = () => {
    if (validateCredentials(username, password)) {
      localStorage.setItem("auth", "true");
      toast.success("✅ Logged in successfully");
      navigate("/unsafety");
    } else {
      toast.error("❌ Invalid credentials");
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
        <h2 className="text-xl mb-4 font-bold text-center">Login</h2>

        <Input
          placeholder="Username"
          className="mb-3"
          onChange={(e) => setUsername(e.target.value)}
        />

        <Input
          placeholder="Password"
          type="password"
          className="mb-4"
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button className="w-full" onClick={login}>
          Login
        </Button>
      </div>
    </div>
  );
}