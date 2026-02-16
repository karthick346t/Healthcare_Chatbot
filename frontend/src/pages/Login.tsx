import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../hooks/useAuth";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Heart,
  Activity,
  Shield,
  Stethoscope,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, googleLogin, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  // Load remembered email
  useEffect(() => {
    const saved = localStorage.getItem("healthbot_remember_email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (rememberMe) {
        localStorage.setItem("healthbot_remember_email", email);
      } else {
        localStorage.removeItem("healthbot_remember_email");
      }

      await login(email, password);
      setSuccess(true);
      setTimeout(() => navigate("/", { replace: true }), 600);
    } catch (err: any) {
      setError(err.message || "Login failed");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    setIsSubmitting(true);
    try {
      await googleLogin(credentialResponse.credential);
      setSuccess(true);
      setTimeout(() => navigate("/", { replace: true }), 600);
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page min-h-screen flex">
      {/* Left Branding Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 login-gradient-bg relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Floating animated shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="login-float-shape login-float-shape-1" />
          <div className="login-float-shape login-float-shape-2" />
          <div className="login-float-shape login-float-shape-3" />
        </div>

        <div className="relative z-10 text-center text-white max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center login-pulse-slow">
              <Heart className="w-10 h-10 text-white" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            HealthBot
          </h1>
          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            Your intelligent healthcare companion. Get personalized medical insights, track your health, and book appointments — all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-4">
            {[
              { icon: Activity, text: "AI-Powered Health Insights" },
              { icon: Stethoscope, text: "Smart Appointment Booking" },
              { icon: Shield, text: "HIPAA-Compliant Security" },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 login-stagger-in"
                style={{ animationDelay: `${0.6 + i * 0.15}s` }}
              >
                <feature.icon className="w-5 h-5 text-white/90 flex-shrink-0" />
                <span className="text-white/90 text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-gray-50 to-primary-50/30">
        <div
          className={`w-full max-w-md login-card-enter ${shake ? "login-shake" : ""}`}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Heart className="w-7 h-7 text-white" fill="currentColor" />
            </div>
          </div>

          {/* Glass card */}
          <div className="login-glass rounded-3xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-500 text-sm">
                Sign in to access your health dashboard
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 animate-fadeIn text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="mb-6 flex items-center gap-2 bg-green-50 text-green-600 px-4 py-3 rounded-xl border border-green-200 animate-fadeIn text-sm">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Login successful! Redirecting...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="login-field-enter" style={{ animationDelay: "0.1s" }}>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    autoComplete="email"
                    aria-label="Email address"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="login-field-enter" style={{ animationDelay: "0.2s" }}>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    aria-label="Password"
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between login-field-enter" style={{ animationDelay: "0.3s" }}>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-4.5 h-4.5 rounded border-2 border-gray-300 peer-checked:border-primary-500 peer-checked:bg-primary-500 flex items-center justify-center transition-all duration-200">
                      {rememberMe && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 select-none">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <div className="login-field-enter" style={{ animationDelay: "0.4s" }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : success ? (
                    <>
                      <Check className="w-4 h-4" />
                      Success!
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-gray-400 uppercase tracking-wider">
                  or continue with
                </span>
              </div>
            </div>

            {/* Google Sign-In */}
            <div className="flex justify-center login-field-enter" style={{ animationDelay: "0.5s" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Sign-In failed. Please try again.")}
                shape="pill"
                size="large"
                width="100%"
                text="signin_with"
                theme="outline"
              />
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-gray-500 mt-7">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-semibold hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
}
