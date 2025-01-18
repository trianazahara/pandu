import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2 } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
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
        } finally {
            setIsLoading(false);
        }
    };

    return (
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
                <div className="bg-white rounded-lg p-8 shadow-md w-[400px] animate-fadeIn">
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative w-24 h-24 mb-4 animate-scaleIn">
                            <img 
                                src="/images/logo.jpg" 
                                alt="Logo PANDU" 
                                className="w-full h-full animate-pulse-subtle"
                            />
                            
                        </div>
                        <h2 className="text-2xl font-bold mb-1 animate-slideDown">PANDU</h2>
                        <p className="text-gray-600 text-sm animate-slideUp">Silahkan masuk ke akun anda</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Input username dengan icon yang diperbaiki posisinya */}
                        <div className="relative group animate-slideRight">
                            <div className="absolute top-0 left-0 h-full flex items-center pl-3">
                                <User 
                                    className={`w-5 h-5 transition-colors duration-300 
                                    ${focusedField === 'username' ? 'text-emerald-500' : 'text-gray-400'}`}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Username"
                                className={`w-full pl-10 pr-4 py-2 bg-blue-50 border border-gray-300 rounded 
                                transition-all duration-300 focus:outline-none focus:border-emerald-500 focus:ring-2 
                                focus:ring-emerald-500/20 group-hover:border-emerald-400`}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={() => setFocusedField('username')}
                                onBlur={() => setFocusedField(null)}
                                required
                            />
                        </div>
                        
                        {/* Input password dengan icon yang diperbaiki posisinya */}
                        <div className="relative group animate-slideLeft">
                            <div className="absolute top-0 left-0 h-full flex items-center pl-3">
                                <Lock 
                                    className={`w-5 h-5 transition-colors duration-300
                                    ${focusedField === 'password' ? 'text-emerald-500' : 'text-gray-400'}`}
                                />
                            </div>
                            <input
                                type="password"
                                placeholder="Password"
                                className={`w-full pl-10 pr-4 py-2 bg-blue-50 border border-gray-300 rounded 
                                transition-all duration-300 focus:outline-none focus:border-emerald-500 focus:ring-2 
                                focus:ring-emerald-500/20 group-hover:border-emerald-400`}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-500 text-white py-2 rounded hover:bg-emerald-600 
                            transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 
                            disabled:cursor-not-allowed animate-slideUp relative overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        <span>MEMPROSES...</span>
                                    </>
                                ) : (
                                    <span>MASUK</span>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-white/20 transform -translate-x-full 
                                group-hover:translate-x-0 transition-transform duration-300" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};


export default Login;