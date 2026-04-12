"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { updateUserProfile } from '@/lib/firestore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  User,
  Bell,
  Palette,
  LogOut,
  ChevronRight,
  Shield,
  Globe,
  Moon,
  Save,
  ArrowRight,
  Mail,
  Phone,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const profileSectionRef = useRef(null);
  const securitySectionRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
    company: '',
    bio: '',
    email: '',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordResetSending, setPasswordResetSending] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!profile && !user) return;

    setFormData({
      fullName: profile?.fullName || profile?.name || '',
      username: profile?.username || '',
      phone: profile?.phone || '',
      company: profile?.company || profile?.organization || '',
      bio: profile?.bio || '',
      email: profile?.email || user?.email || '',
    });
    setNotificationsEnabled(profile?.notificationsEnabled ?? true);
  }, [profile, user]);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!user) return;

    const fullName = formData.fullName.trim();
    const username = formData.username.trim().toLowerCase().replace(/\s+/g, '');

    if (!fullName || !username) {
      setStatus({ type: 'error', message: 'Full name and username are required.' });
      return;
    }

    setSaving(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const previousUsername = profile?.username || '';
      const usernameDocRef = doc(db, 'digital_cards', username);
      const usernameDocSnap = await getDoc(usernameDocRef);

      if (usernameDocSnap.exists() && username !== previousUsername && usernameDocSnap.data()?.uid !== user.uid) {
        setStatus({ type: 'error', message: 'That username is already in use.' });
        return;
      }

      await updateUserProfile(
        user.uid,
        {
          fullName,
          name: fullName,
          username,
          phone: formData.phone.trim(),
          company: formData.company.trim(),
          organization: formData.company.trim(),
          bio: formData.bio.trim(),
          email: user.email || formData.email || '',
          photoURL: profile?.photoURL || user.photoURL || null,
          notificationsEnabled,
        },
        previousUsername
      );

      setStatus({ type: 'success', message: 'Settings saved and your digital card was updated.' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setStatus({ type: 'error', message: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (!user) return;

    const nextValue = !notificationsEnabled;
    setNotificationsEnabled(nextValue);

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          notificationsEnabled: nextValue,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      setNotificationsEnabled(!nextValue);
      setStatus({ type: 'error', message: 'Could not update notification preferences.' });
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setStatus({ type: 'error', message: 'No email address is available for this account.' });
      return;
    }

    setPasswordResetSending(true);
    setStatus({ type: 'idle', message: '' });

    try {
      await sendPasswordResetEmail(auth, user.email);
      setStatus({ type: 'success', message: `Password reset email sent to ${user.email}.` });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      setStatus({ type: 'error', message: 'Unable to send a password reset email right now.' });
    } finally {
      setPasswordResetSending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Could not sign out. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="section-container py-16">
        <div className="glass-panel rounded-2xl p-10 text-center">
          <p className="text-white font-medium">Loading settings...</p>
          <p className="text-sapphire-500 text-sm mt-2">Syncing your account details.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const profileInitial = (formData.fullName || user.email || 'U').charAt(0).toUpperCase();
  const cardUrl = formData.username ? `vynco.app/${formData.username}` : 'vynco.app/example';

  return (
    <div className="section-container py-10">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Settings</h1>
        <p className="text-sapphire-400 mt-1">Manage your account, card, and network preferences.</p>
      </div>

      {status.message && (
        <div className={`mb-8 rounded-2xl border px-4 py-3 text-sm ${
          status.type === 'success'
            ? 'border-cyan-neon/20 bg-cyan-neon/10 text-cyan-neon'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          {status.message}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-sapphire-600 to-sapphire-800 rounded-full mx-auto mb-5 flex items-center justify-center text-white font-bold text-2xl border-2 border-cyan-neon/30 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
              {profileInitial}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{formData.fullName || 'User Name'}</h2>
            <p className="text-sapphire-500 text-sm mb-1">@{formData.username || 'username'}</p>
            <p className="text-sapphire-600 text-xs mb-5">{formData.company || 'Add your organization'}</p>

            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/[0.06]">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{profile?.connectionsCount || 0}</div>
                <div className="text-xs text-sapphire-500">Connections</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{profile?.postsCount || 0}</div>
                <div className="text-xs text-sapphire-500">Posts</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => scrollToSection(profileSectionRef)}
              className="w-full mt-6 py-2.5 rounded-xl text-sm font-semibold border border-cyan-neon/20 text-cyan-neon hover:bg-cyan-neon/10 transition-all"
            >
              Edit Profile
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-sapphire-500 uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => scrollToSection(profileSectionRef)}
                className="w-full flex items-center justify-between rounded-xl border border-white/[0.05] px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-white">Personal Information</div>
                  <div className="text-xs text-sapphire-500">Update your public profile</div>
                </div>
                <ChevronRight className="w-4 h-4 text-sapphire-600" />
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard?tab=card')}
                className="w-full flex items-center justify-between rounded-xl border border-white/[0.05] px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-white">Digital Card Preview</div>
                  <div className="text-xs text-sapphire-500">Open the QR card view</div>
                </div>
                <ArrowRight className="w-4 h-4 text-sapphire-600" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection(securitySectionRef)}
                className="w-full flex items-center justify-between rounded-xl border border-white/[0.05] px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-white">Privacy & Security</div>
                  <div className="text-xs text-sapphire-500">Password and session controls</div>
                </div>
                <Shield className="w-4 h-4 text-sapphire-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div ref={profileSectionRef} className="glass-panel rounded-2xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Profile</h3>
                <p className="text-sapphire-400 text-sm mt-1">Edit the details that appear on your card and in your network.</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-cyan-neon bg-cyan-neon/[0.08] border border-cyan-neon/15 rounded-full px-3 py-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Live sync enabled
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSaveProfile}>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sapphire-400 text-sm font-medium mb-2 block">Full Name</label>
                  <Input
                    icon={User}
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="text-sapphire-400 text-sm font-medium mb-2 block">Username</label>
                  <Input
                    icon={Globe}
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="Choose a unique username"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sapphire-400 text-sm font-medium mb-2 block">Email Address</label>
                  <Input
                    icon={Mail}
                    value={formData.email}
                    disabled
                    className="opacity-80"
                  />
                </div>

                <div>
                  <label className="text-sapphire-400 text-sm font-medium mb-2 block">Phone Number</label>
                  <Input
                    icon={Phone}
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <label className="text-sapphire-400 text-sm font-medium mb-2 block">Company / College</label>
                <Input
                  icon={Building2}
                  value={formData.company}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Enter your company or college"
                />
              </div>

              <div>
                <label className="text-sapphire-400 text-sm font-medium mb-2 block">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Write a short bio for your profile"
                  rows={4}
                  className="w-full rounded-2xl glass-input px-4 py-3 bg-sapphire-800/40 text-white placeholder:text-sapphire-700 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" disabled={saving} className="sm:w-auto">
                  {saving ? 'Saving...' : 'Save Changes'}
                  {!saving && <Save className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="sm:w-auto"
                  onClick={() => router.push('/dashboard?tab=card')}
                >
                  Preview Card
                </Button>
              </div>
            </form>
          </div>

          <div className="glass-panel rounded-2xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Preferences</h3>
                <p className="text-sapphire-400 text-sm mt-1">Control notifications and how your profile appears.</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-sapphire-400 bg-sapphire-800/50 border border-white/[0.06] rounded-full px-3 py-1.5">
                <Palette className="w-3.5 h-3.5" /> Sapphire Night
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-5 rounded-2xl border border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sapphire-700/50 flex items-center justify-center border border-white/[0.04]">
                    <Bell className="w-5 h-5 text-cyan-dark" />
                  </div>
                  <div>
                    <span className="text-white font-medium block text-sm">Notifications</span>
                    <span className="text-sapphire-500 text-xs">Push, email, and in-app alerts</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                    notificationsEnabled ? 'bg-cyan-neon' : 'bg-sapphire-700'
                  }`}
                  onClick={handleNotificationToggle}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                      notificationsEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-5 rounded-2xl border border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sapphire-700/50 flex items-center justify-center border border-white/[0.04]">
                    <Moon className="w-5 h-5 text-cyan-dark" />
                  </div>
                  <div>
                    <span className="text-white font-medium block text-sm">Display</span>
                    <span className="text-sapphire-500 text-xs">Dark mode is always on</span>
                  </div>
                </div>

                <span className="text-xs text-sapphire-600 bg-sapphire-800/50 px-3 py-1 rounded-lg">Active</span>
              </div>
            </div>
          </div>

          <div ref={securitySectionRef} className="glass-panel rounded-2xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Privacy & Security</h3>
                <p className="text-sapphire-400 text-sm mt-1">Keep your account protected and your session under control.</p>
              </div>
              <Shield className="w-5 h-5 text-cyan-neon" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={passwordResetSending}
                className="rounded-2xl border border-white/[0.05] px-5 py-4 text-left hover:bg-white/[0.02] transition-colors disabled:opacity-60"
              >
                <div className="text-sm font-semibold text-white">Reset Password</div>
                <div className="text-xs text-sapphire-500 mt-1">Send a password reset email to {user.email}</div>
                <div className="mt-3 text-xs font-medium text-cyan-neon">
                  {passwordResetSending ? 'Sending...' : 'Send reset email'}
                </div>
              </button>

              <div className="rounded-2xl border border-white/[0.05] px-5 py-4">
                <div className="text-sm font-semibold text-white">Current Card URL</div>
                <div className="text-xs text-sapphire-500 mt-1 break-all">{cardUrl}</div>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard?tab=card')}
                  className="mt-3 text-xs font-medium text-cyan-neon hover:text-cyan-dark transition-colors"
                >
                  Open card preview
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-sapphire-500 uppercase tracking-wider mb-4">Session</h3>
            <button
              onClick={handleSignOut}
              className="w-full glass-panel rounded-2xl p-5 flex items-center justify-center gap-3 text-red-400 font-semibold hover:bg-red-500/[0.05] hover:border-red-500/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
