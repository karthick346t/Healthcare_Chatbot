import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../hooks/useAuth";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Heart,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Fair", color: "bg-yellow-500" };
  if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500" };
  return { score: 4, label: "Strong", color: "bg-green-500" };
}

export default function Register() {
  const navigate = useNavigate();
  const { register, googleLogin, isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      setSuccess(true);
      setTimeout(() => navigate("/", { replace: true }), 600);
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
            Join HealthBot
          </h1>
          <p className="text-lg text-white/80 mb-6 leading-relaxed">
            Create your account and start your journey toward smarter, personalized healthcare.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { value: "10K+", label: "Users" },
              { value: "50+", label: "Doctors" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm rounded-xl py-4 px-2 login-stagger-in"
                style={{ animationDelay: `${0.6 + i * 0.15}s` }}
              >
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-white/70 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Register Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-gray-50 to-primary-50/30">
        <div className={`w-full max-w-md login-card-enter ${shake ? "login-shake" : ""}`}>
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Heart className="w-7 h-7 text-white" fill="currentColor" />
            </div>
          </div>

          <div className="login-glass rounded-3xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Create Account
              </h2>
              <p className="text-gray-500 text-sm">
                Start your health journey today
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 animate-fadeIn text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-5 flex items-center gap-2 bg-green-50 text-green-600 px-4 py-3 rounded-xl border border-green-200 animate-fadeIn text-sm">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Account created! Redirecting...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="login-field-enter" style={{ animationDelay: "0.1s" }}>
                <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                  <input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    autoFocus
                    autoComplete="name"
                    aria-label="Full name"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="login-field-enter" style={{ animationDelay: "0.15s" }}>
                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    aria-label="Email address"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-field-enter" style={{ animationDelay: "0.2s" }}>
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    autoComplete="new-password"
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

                {/* Password Strength */}
                {password.length > 0 && (
                  <div className="mt-2 animate-fadeIn">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            level <= strength.score ? strength.color : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      strength.score <= 1 ? "text-red-500" :
                      strength.score === 2 ? "text-yellow-500" :
                      strength.score === 3 ? "text-blue-500" :
                      "text-green-500"
                    }`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="login-field-enter" style={{ animationDelay: "0.25s" }}>
                <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                  <input
                    id="reg-confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    autoComplete="new-password"
                    aria-label="Confirm password"
                    className={`w-full pl-11 pr-12 py-3 rounded-xl border bg-white/80 text-gray-900 placeholder-gray-400 focus:ring-2 outline-none text-sm ${
                      passwordsMismatch
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : passwordsMatch
                        ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                        : "border-gray-200 focus:border-primary-500 focus:ring-primary-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p className="text-xs text-red-500 mt-1 animate-fadeIn">Passwords don't match</p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-green-500 mt-1 animate-fadeIn flex items-center gap-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="login-field-enter pt-1" style={{ animationDelay: "0.3s" }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : success ? (
                    <>
                      <Check className="w-4 h-4" />
                      Success!
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
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
            <div className="flex justify-center login-field-enter" style={{ animationDelay: "0.4s" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Sign-In failed. Please try again.")}
                shape="pill"
                size="large"
                width="100%"
                text="signup_with"
                theme="outline"
              />
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By creating an account, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
