"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'firebase/auth';
import { createDirectConnection, ensureUserExists } from '@/lib/firestore';

const RESEND_COOLDOWN_SECONDS = 300;
const RETRY_COOLDOWN_SECONDS = 5;

const formatCountdown = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export default function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectWithId = searchParams.get('connectWith');
  const connectWithName = searchParams.get('connectWithName') || '';
  const isContactSaveFlow = Boolean(connectWithId);

  const personName = connectWithName.trim() || 'this person';
  const possessiveName = personName.toLowerCase().endsWith('s') ? `${personName}'` : `${personName}'s`;

  const [step, setStep] = useState('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [retryCooldown, setRetryCooldown] = useState(0);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // no-op: recaptcha may already be disposed
        }
      }
      recaptchaVerifierRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0 && retryCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setRetryCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown, retryCooldown]);

  const normalizePhoneNumber = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('+')) {
      const digits = trimmed.replace(/[^\d+]/g, '');
      return /^\+\d{8,15}$/.test(digits) ? digits : null;
    }

    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
    return null;
  };

  const getFirebaseErrorMessage = (err) => {
    if (!err?.code && err?.message) {
      return err.message;
    }

    switch (err?.code) {
      case 'auth/invalid-phone-number':
        return 'Enter a valid phone number in international format, or a 10-digit US number.';
      case 'auth/too-many-requests':
        return 'Too many OTP requests. Please wait a bit and try again.';
      case 'auth/quota-exceeded':
        return 'SMS quota exceeded for this project. Try again later.';
      case 'auth/captcha-check-failed':
        return 'reCAPTCHA verification failed. Refresh the page and try again.';
      case 'auth/code-expired':
        return 'The code expired. Please resend a new code.';
      case 'auth/billing-not-enabled':
        return 'Phone authentication is not enabled. Please contact support to enable it.';
      case 'auth/invalid-verification-code':
        return 'The code is incorrect. Please try again.';
      default:
        return 'Failed to send or verify the code. Check the phone number and try again.';
    }
  };

  const getVerifyErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-verification-code':
        return 'The code is incorrect. Please try again.';
      case 'auth/code-expired':
        return 'The code expired. Please resend a new one.';
      case 'auth/invalid-verification-id':
      case 'auth/session-expired':
        return 'Your verification session expired. Please resend a new code.';
      case 'auth/missing-verification-code':
        return 'Please enter the 6-digit OTP code.';
      case 'auth/invalid-app-credential':
        return 'Verification failed due to app credentials. Refresh and try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait before trying again.';
      default:
        return 'Failed to verify the code. Please try again.';
    }
  };

  const getRecaptchaVerifier = () => {
    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {},
        });
      } catch {
        return null;
      }
    }

    return recaptchaVerifierRef.current;
  };

  const sendOtp = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Please fill in both name and phone number.');
      return;
    }

    const formattedPhone = normalizePhoneNumber(phone);
    if (!formattedPhone) {
      setError('Enter a valid phone number with country code, or a 10-digit US number.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const appVerifier = getRecaptchaVerifier();
      if (!appVerifier) {
        throw new Error('reCAPTCHA failed to initialize. Refresh the page and try again.');
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setVerifiedPhone(formattedPhone);
      setStep('otp');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    await sendOtp();
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setError('');
    setOtp('');
    setConfirmationResult(null);

    try {
      await sendOtp();
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (retryCooldown > 0) {
      setError(`Please wait ${retryCooldown}s before trying again.`);
      return;
    }

    const otpCode = otp.trim();

    if (!otpCode) {
      setError('Please enter the OTP.');
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      setError('Enter a valid 6-digit OTP code.');
      return;
    }

    if (!confirmationResult) {
      setError('No verification session found. Please resend the code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await confirmationResult.confirm(otpCode);
      const user = result.user;

      if (user.displayName !== name) {
        await updateProfile(user, { displayName: name });
      }

      await ensureUserExists({
        uid: user.uid,
        fullName: name,
        phoneNumber: verifiedPhone || phone,
      });

      if (connectWithId) {
        await createDirectConnection(user.uid, connectWithId);
        router.push('/preview');
      } else {
        router.push('/share');
      }
    } catch (err) {
      const code = err?.code;
      setRetryCooldown(RETRY_COOLDOWN_SECONDS);
      if (code === 'auth/invalid-verification-code') {
        setOtp('');
      }
      setError(getVerifyErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sapphire-950 flex items-center justify-center p-4 sm:p-6">
      <div id="recaptcha-container" style={{ display: 'none' }}></div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[430px] bg-white border border-sapphire-700 rounded-[2.2rem] px-5 sm:px-6 py-6 shadow-[0_28px_70px_rgba(16,18,35,0.14)]"
      >
        {step === 'phone' && (
          <button
            type="button"
            onClick={() => {
              if (isContactSaveFlow) {
                router.push(`/card/${connectWithId}`);
                return;
              }
              router.back();
            }}
            className="inline-flex items-center gap-1.5 text-sapphire-500 hover:text-[#33374f] transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <h2 className="mt-4 text-[34px] leading-none tracking-[-0.03em] font-semibold text-[#151826]">
          {step === 'phone' ? (isContactSaveFlow ? `Save ${possessiveName} contact` : 'Create your card') : 'Enter OTP'}
        </h2>
        <p className="text-sapphire-500 text-[15px] mt-2 mb-7 leading-relaxed">
          {step === 'phone'
            ? isContactSaveFlow
              ? 'We will also create your own card. Takes 10 seconds.'
              : 'Verify your phone number to create your digital card. Takes 10 seconds.'
            : `We sent a code to ${verifiedPhone || phone}`}
        </p>

        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-[16px] font-semibold text-[#44495d] mb-2">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full bg-white border border-sapphire-600 focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon/30 text-[#13172a] rounded-2xl px-5 py-4 text-[18px] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[16px] font-semibold text-[#44495d] mb-2">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#f2f1fb] border border-cyan-neon focus:border-cyan-neon focus:ring-2 focus:ring-cyan-neon/20 text-[#2e3160] rounded-2xl px-5 py-4 text-[30px] leading-none outline-none transition-all"
              />
              <p className="text-sapphire-500 text-sm mt-2">We'll send a one-time code to verify</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-4 bg-gradient-to-r from-cyan-dark to-cyan-neon hover:brightness-105 text-white font-bold rounded-2xl shadow-[0_10px_24px_rgba(91,76,230,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-[32px] leading-none"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP ->'}
            </button>

            <div className="pt-5 mt-1 border-t border-sapphire-700">
              <p className="text-center text-sapphire-500 text-[15px] leading-relaxed">
                {isContactSaveFlow
                  ? `You'll get ${possessiveName} contact + your own shareable QR card`
                  : 'You\'ll get your own shareable QR card'}
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-[16px] font-semibold text-[#44495d] mb-2">6-Digit Code</label>
              <input
                type="text"
                value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-[#f2f1fb] border border-cyan-neon focus:border-cyan-neon focus:ring-2 focus:ring-cyan-neon/20 text-[#2e3160] rounded-2xl px-5 py-4 outline-none transition-all tracking-[0.35em] text-center text-[28px] leading-none font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={loading || retryCooldown > 0}
              className="w-full py-4 px-4 bg-gradient-to-r from-cyan-dark to-cyan-neon hover:brightness-105 text-white font-bold rounded-2xl shadow-[0_10px_24px_rgba(91,76,230,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-[26px] leading-none"
            >
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : retryCooldown > 0
                  ? `Retry in ${retryCooldown}s`
                  : isContactSaveFlow
                    ? 'Verify & Connect'
                    : 'Verify & Build Card'}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading || loading || resendCooldown > 0}
              className="w-full py-1 px-4 text-sapphire-500 text-sm font-medium hover:text-[#22263a] transition-all text-center disabled:opacity-60"
            >
              {resendLoading
                ? 'Resending...'
                : resendCooldown > 0
                  ? `Resend in ${formatCountdown(resendCooldown)}`
                  : "Didn't get a code? Resend"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setConfirmationResult(null);
                setVerifiedPhone('');
              }}
              className="w-full py-1 px-4 text-sapphire-500 text-sm font-medium hover:text-[#22263a] transition-all text-center"
            >
              Change Phone Number
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}