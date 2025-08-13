import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'clinician' | 'hospital'>('clinician');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);
  const videoSources = ["/public/blue-siren-mp4.mp4", "/public/patient-mp4.mp4"];
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        // Registration only for clinicians - hospitals are pre-registered
        if (role === 'hospital') {
          throw new Error("Hospital registration is not available. Please contact your administrator.");
        }
        const res = await fetch("http://localhost:5001/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Registration failed");
        }
        // Auto-login after registration - fall through to login logic
      }
      
      // Login
      if (role === 'hospital') {
        // Hospital login with name + password
        const res = await fetch("http://localhost:5001/auth/hospital-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ hospitalName, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.message || "Hospital login failed");
        }
        navigate('/hospital/dashboard');
      } else {
        // User login with email + password
        const res = await fetch("http://localhost:5001/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.message || "Login failed");
        }
        navigate('/triage');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-end">
      {/* Background Video */}
      <video
        autoPlay
        loop={false}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        key={videoIndex}
        onEnded={() => {
          if (videoIndex < videoSources.length - 1) {
            setVideoIndex(videoIndex + 1);
          } else {
            setVideoIndex(0); // Loop back to first video for continuous playback
          }
        }}
      >
        <source src={videoSources[videoIndex]} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      

      {/* Login Card on the right */}
      <div className="relative z-20 w-full max-w-md ml-auto mr-16 my-16 space-y-8 bg-white/40 backdrop-blur-lg rounded-xl shadow-lg p-8 border border-white border-opacity-30">
        <div className="flex flex-col items-center">
        {/* Lifeline AI Logo */}
        <svg
          width="200"
          height="60"
          viewBox="0 0 200 60"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          className="mb-4"
        >
          {/* Lifeline (heartbeat) */}
          <polyline
            points="30,30 40,30 43,20 47,40 51,25 55,30 65,30"
            stroke="#1d3557"
            strokeWidth="2"
            fill="none"
          />
          {/* AI Node */}
          <circle cx="72" cy="30" r="4" fill="#457b9d" />
          <line x1="72" y1="30" x2="82" y2="30" stroke="#457b9d" strokeWidth="2" />
          <circle cx="86" cy="30" r="2" fill="#457b9d" />
          {/* Text */}
          <text
            x="95"
            y="35"
            fontFamily="Segoe UI, sans-serif"
            fontSize="20"
            fill="#1d3557"
          >
            Lifeline
          </text>
          <text
            x="160"
            y="35"
            fontFamily="Segoe UI, sans-serif"
            fontSize="18"
            fill="#a8dadc"
          >
            AI
          </text>
        </svg>

        <h2 className="text-center text-2xl font-bold text-gray-900">
          {isRegister ? 'Create an account' : 'Sign in to your account'}
        </h2>
        <div className="mt-4 flex justify-center gap-3" role="tablist" aria-label="Select role">
          {(['clinician','hospital'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-4 py-1 rounded-full text-sm font-medium border transition-colors ${role===r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/70 backdrop-blur border-gray-300 text-gray-700 hover:bg-white'}`}
              aria-pressed={role===r}
            >
              {r === 'clinician' ? 'Clinician' : 'Hospital'}
            </button>
          ))}
        </div>
      </div>


      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {role === 'hospital' ? (
            // Hospital login fields
            <div>
              <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700">
                Hospital Name
              </label>
              <input
                id="hospitalName"
                name="hospitalName"
                type="text"
                autoComplete="organization"
                required
                value={hospitalName}
                onChange={e => setHospitalName(e.target.value)}
                placeholder="Enter exact hospital name"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the hospital name exactly as registered in the system
              </p>
            </div>
          ) : (
            // Clinician login fields
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {role === 'hospital' && (
              <p className="mt-1 text-xs text-gray-500">
                Default password: 12345
              </p>
            )}
          </div>
        </div>

        {error && <div className="text-red-600 text-sm text-center">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {loading ? (
            role === 'hospital' ? "Signing in..." : (isRegister ? "Registering..." : "Signing in...")
          ) : (
            role === 'hospital' ? "Sign in as Hospital" : (isRegister ? `Register as ${role === 'hospital' ? 'Hospital' : 'Clinician'}` : `Sign in as ${role === 'hospital' ? 'Hospital' : 'Clinician'}`)
          )}
        </button>
      </form>

      {/* Only show register toggle for clinicians */}
      {role !== 'hospital' && (
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-medical-800 hover:text-medical-600 font-medium transition-colors duration-200"
            onClick={() => { setIsRegister(r => !r); setError(""); }}
          >
            {isRegister ? "Already have an account? Sign in" : "Don't have an account? Register"}
          </button>
        </div>
      )}

      {/* Only show Google OAuth for clinicians */}
      {role !== 'hospital' && (
        <div className="mt-6">
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-300" />
            <span className="mx-4 text-medical-800">Or continue with</span>
            <div className="flex-grow border-t border-gray-300" />
          </div>

          <div className="mt-4 flex gap-4">
            {/* Google Login */}
            <a
              href={`http://localhost:5001/auth/google?role=${role}`}
              className="flex-1 flex items-center justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-gray-700 hover:bg-gray-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
                <g>
                  <path fill="#EA4335" d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"/>
                  <path fill="#4285F4" d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"/>
                  <path fill="#FBBC05" d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"/>
                  <path fill="#34A853" d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"/>
                </g>
              </svg>
              Google
            </a>
          </div>
        </div>
      )}

    </div>
  </div>
);
}

export default LoginForm;
