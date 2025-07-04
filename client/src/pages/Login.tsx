import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';

const providers = [
	{
		name: 'Google',
        id: 'google',
        color: 'bg-white text-[#000000] hover:bg-gray-100 border border-gray-300',
		icon: (
			<svg
				className="w-5 h-5 mr-2"
				viewBox="0 0 48 48"
			>
				<g>
					<path
						fill="#4285F4"
						d="M24 9.5c3.54 0 6.36 1.53 7.82 2.81l5.77-5.77C34.64 3.36 29.82 1 24 1 14.61 1 6.44 6.99 2.69 15.09l6.91 5.36C11.36 14.36 17.14 9.5 24 9.5z"
					/>
					<path
						fill="#34A853"
						d="M46.1 24.5c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.56 37.01 46.1 31.23 46.1 24.5z"
					/>
					<path
						fill="#FBBC05"
						d="M9.6 28.59c-1.13-3.36-1.13-6.82 0-10.18l-6.91-5.36C.99 17.61 0 20.71 0 24s.99 6.39 2.69 10.09l6.91-5.36z"
					/>
					<path
						fill="#EA4335"
						d="M24 46.5c5.82 0 10.64-1.92 14.19-5.24l-7.19-5.6c-2.01 1.35-4.59 2.14-7 2.14-6.86 0-12.64-4.86-14.4-11.36l-6.91 5.36C6.44 41.01 14.61 46.5 24 46.5z"
					/>
				</g>
			</svg>
		),
	},
	{
		name: 'GitHub',
		id: 'github',
		color: 'bg-gray-800',
		icon: (
			<svg
				className="w-5 h-5 mr-2"
				viewBox="0 0 24 24"
			>
				<path
					fill="white"
					d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.577.688.479C21.138 20.2 24 16.447 24 12.021 24 6.484 19.523 2 12 2z"
				/>
			</svg>
		),
	},
];

const LoginPage: React.FC = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [, navigate] = useLocation();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setSuccess(false);
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (error) setError(error.message);
		else {
			setSuccess(true);
			navigate('/dashboard'); // Redirect on success
		}
		setLoading(false);
	};

	const handleOAuth = async (provider: 'google' | 'github') => {
		setLoading(true);
		setError(null);
		setSuccess(false);
		const { error } = await supabase.auth.signInWithOAuth({ provider });
		if (error) setError(error.message);
		setLoading(false);
	};

	return (
		<div className="min-h-screen flex flex-col bg-big-grinch">
			<div className="flex flex-1 items-center justify-center">
				<div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-4">
					<div className="flex flex-col items-center mb-6">
						<img
							src="/appicon-rounded.png"
							alt="WeBudget Logo"
							className="w-16 h-16 mb-2"
                        />
                        <p className="text-gray-600">
							Welcome to WeBudget.  Please sign in to continue.
						</p>
					</div>
					<form
						onSubmit={handleLogin}
						className="space-y-4"
					>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Email
							</label>
							<input
								type="email"
								placeholder="yourname@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Password
							</label>
							<input
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
								required
							/>
						</div>
						{error && (
							<div className="text-red-600 text-sm text-center">{error}</div>
						)}
						{success && (
							<div className="text-green-600 text-sm text-center">
								Login successful!
							</div>
						)}
						<button
							type="submit"
							className="w-full py-2 px-4 bg-big-grinch text-white rounded-lg font-semibold hover:bg-blue-700 transition"
							disabled={loading}
						>
							{loading ? 'Signing in...' : 'Sign In'}
						</button>
					</form>
					<div className="my-6 flex items-center justify-center">
						<span className="h-px w-16 bg-gray-200" />
						<span className="mx-4 text-gray-400 text-sm">
							or continue with
						</span>
						<span className="h-px w-16 bg-gray-200" />
					</div>
					<div className="flex flex-col gap-2">
						{providers.map((p) => (
							<button
								key={p.id}
								onClick={() => handleOAuth(p.id as 'google' | 'github')}
								className={`flex items-center justify-center w-full py-2 px-4 ${p.color} text-white rounded-lg font-semibold hover:opacity-90 transition`}
								disabled={loading}
							>
								{p.icon}Continue with {p.name}
							</button>
						))}
					</div>
				</div>
			</div>
			<div className="py-6 text-gray-400 text-xs text-center">
				&copy; {new Date().getFullYear()} WeBudget. All rights reserved.
			</div>
		</div>
	);
};

export default LoginPage;
