import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const success = await login(username, password);
            if (success) {
                navigate('/dashboard');
            } else {
                setError('Login gagal. Silakan coba lagi.');
            }
        } catch (err) {
            console.error('Error detail:', err);
            setError('Terjadi kesalahan saat login');
        }
    };

    return (
        // Container penuh dengan background
        <div className="w-screen h-screen overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0">
                <img 
                    src="/images/background.jpg" 
                    className="w-full h-full object-cover"
                    alt="background"
                />
            </div>
            
            {/* Container untuk card login */}
            <div className="absolute inset-0 flex items-center justify-center">
                {/* Card login */}
                <div className="bg-white rounded-lg p-8 shadow-md w-[400px]">
                    <div className="flex flex-col items-center mb-6">
                        <img 
                            src="/images/logo.jpg" 
                            alt="Logo PANDU" 
                            className="w-24 h-24 mb-4"
                        />
                        <h2 className="text-2xl font-bold mb-1">PANDU</h2>
                        <p className="text-gray-600 text-sm">Silahkan masuk ke akun anda</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full px-4 py-2 bg-blue-50 border border-gray-300 rounded focus:outline-none focus:border-emerald-500"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-4 py-2 bg-blue-50 border border-gray-300 rounded focus:outline-none focus:border-emerald-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button 
                            type="submit"
                            className="w-full bg-emerald-500 text-white py-2 rounded hover:bg-emerald-600 transition-colors"
                        >
                            MASUK
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;