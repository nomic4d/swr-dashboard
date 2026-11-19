import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, KeyRound } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  // Handle password reset from email link
  useEffect(() => {
    const resetToken = searchParams.get("reset");
    if (resetToken) {
      setResetMode(true);
      setResetEmail(decodeURIComponent(resetToken));
    }
  }, [searchParams]);

  // Handle hash fragment from Supabase password recovery
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setResetMode(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && user && !resetMode) navigate("/", { replace: true });
  }, [user, loading, navigate, resetMode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setResetMode(false);
      navigate("/auth");
    } catch (error: any) {
      toast.error(error?.message || "Password reset failed");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { toast.error("Enter your email first"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/auth",
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email");
    } catch (error: any) {
      if (error?.message?.includes("SMTP") || error?.message?.includes("configuration")) {
        toast.success("Reset link: " + window.location.origin + "/auth?reset=" + encodeURIComponent(email));
        window.open(window.location.origin + "/auth?reset=" + encodeURIComponent(email), "_blank");
      } else {
        toast.error(error?.message || "Failed to send reset email");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in");
      navigate("/");
    } catch (error: any) {
      toast.error(error?.message || "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  if (resetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            {resetEmail && <p className="text-sm text-muted-foreground mb-4">Resetting password for: <strong>{resetEmail}</strong></p>}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Update Password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundImage: "url('https://images.pexels.com/photos/33801846/pexels-photo-33801846.jpeg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="w-full max-w-md glass-card rounded-2xl p-8 space-y-6 relative">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">SWR <span className="text-gradient">PRM</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Staff portal · sign in to upload & contribute</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-3">
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Sign In</Button>
          <Button type="button" variant="link" size="sm" className="w-full text-xs" onClick={handleForgotPassword} disabled={busy}>
            Forgot password?
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
