import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Mail, Loader2 } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault(); // Prevent page refresh
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      await fetch(`${BACKEND_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      toast.success("Check your inbox", {
        description: "If an account exists, we've sent reset instructions.",
      });
    } catch {
      toast.error("Connection error", {
        description: "Something went wrong. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-fit flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200 shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-50 rounded-full">
              <Mail className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Forgot password?
          </CardTitle>
          <CardDescription className="text-center text-slate-500">
            No worries, we'll send you reset instructions.
          </CardDescription>
        </CardHeader>

        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 mt-2">
            <Button
              type="submit"
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>

            <a
              href="/login"
              className="flex items-center justify-center text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to login
            </a>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}