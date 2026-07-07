import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [displayName, setDisplayName] = useState("");
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const effectivePassword = password || "@ABCD1234!";
      const { error } = await supabase.auth.signUp({
        email,
        password: effectivePassword,
        options: {
          data: { full_name: displayName },
        },
      });
      if (error) throw error;
      toast.success("Account created");
      navigate("/");
    } catch (error: any) {
      toast.error(error?.message || "Sign-up failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error?.message || "Google sign-in failed");
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

        <Button onClick={handleGoogle} variant="outline" className="w-full" disabled={busy}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </Button>

        <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-3 pt-3">
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Sign In</Button>
              <Button type="button" variant="link" size="sm" className="w-full text-xs" onClick={handleForgotPassword} disabled={busy}>
                Forgot password?
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-3 pt-3">
              <div><Label>Display Name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div><Label>Password (min 6)</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Account</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
