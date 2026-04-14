"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Loader2, Phone } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'firebase/auth';
import { sendConnectionRequest } from '@/lib/firestore';

export default function Verify() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectWithId = searchParams.get('connectWith'); // Scanned user ID
  
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {}
      });
    }
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Please fill in both name and phone number.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`; 
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
    } catch (err) {
      console.error(err);
      setError('Failed to send OTP. Ensure phone format is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      if (user.displayName !== name) {
        await updateProfile(user, { displayName: name });
      }

      if (connectWithId) {
        await sendConnectionRequest({
          senderId: user.uid,
          senderName: name,
          senderProfileImageUrl: user.photoURL,
          receiverId: connectWithId,
          receiverName: "Unknown User",
          receiverProfileImageUrl: null,
          message: "Hi! I scanned your QR code and would like to connect."
        });
      }

      router.push('/preview');
    } catch (err) {
      console.error(err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sapphire-950 flex md:items-center justify-center p-4 sm:p-6 lg:p-8">
      <div id="recaptcha-container"></div>
      
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-neon/[0.05] rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10 glass-panel p-8 rounded-[2rem] glow-border shadow-2xl mt-10 md:mt-0"
      >
        <div className="w-16 h-16 bg-sapphire-800 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner border border-sapphire-700">
          <Shield className="w-8 h-8 text-cyan-neon" />
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {step === 'phone' ? 'Verify your Identity' : 'Enter OTP'}
        </h2>
        <p className="text-sapphire-400 text-sm text-center mb-8">
          {step === 'phone' 
            ? 'We need to verify your phone number to securely save this connection.'
            : `We sent a code to ${phone}`
          }
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-sapphire-300 mb-1.5 ml-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-sapphire-900/50 border border-sapphire-700 focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon text-white rounded-xl px-4 py-3 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-sapphire-300 mb-1.5 ml-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-sapphire-400" />
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-sapphire-900/50 border border-sapphire-700 focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon text-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 py-3.5 px-4 bg-gradient-to-r from-cyan-dark to-cyan-neon hover:to-cyan-400 text-sapphire-950 font-bold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
             <div>
              <label className="block text-xs font-medium text-sapphire-300 mb-1.5 ml-1">6-Digit Code</label>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-sapphire-900/50 border border-sapphire-700 focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon text-white rounded-xl px-4 py-3 outline-none transition-all tracking-widest text-center text-lg font-bold"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 py-3.5 px-4 bg-gradient-to-r from-cyan-dark to-cyan-neon hover:to-cyan-400 text-sapphire-950 font-bold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Connect'}
            </button>
            <button 
              type="button" 
              onClick={() => { setStep('phone'); setOtp(''); }}
              className="w-full mt-2 py-3 px-4 text-sapphire-400 text-sm font-medium hover:text-white transition-all text-center"
            >
              Change Phone Number
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
