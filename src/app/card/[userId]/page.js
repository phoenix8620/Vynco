"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchUserById } from '@/lib/firestore';
import { motion } from 'framer-motion';
import { UserPlus, QrCode, MapPin, Globe } from 'lucide-react';

export default function CardPreview() {
  const { userId } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!userId) return;
      try {
        const data = await fetchUserById(userId);
        if (data) {
          setProfile(data);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error loading profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sapphire-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-neon border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-sapphire-950 flex items-center justify-center p-6 text-center">
        <div className="glass-panel p-8 rounded-3xl w-full max-w-sm">
          <p className="text-white mb-4">Profile not found.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-white/10 rounded-xl text-white font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleAction = () => {
    router.push(`/verify?connectWith=${userId}`);
  };

  return (
    <div className="min-h-screen bg-sapphire-950 flex md:items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-neon/[0.05] rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sapphire-700/[0.1] rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 glass-panel overflow-hidden flex flex-col glow-border rounded-[2rem] shadow-2xl mt-10 md:mt-0"
      >
        {/* Banner */}
        <div className="h-32 sm:h-40 bg-gradient-to-tr from-sapphire-800 to-cyan-dark relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Content */}
        <div className="px-6 pb-8 text-center relative mt-[-50px]">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full border-4 border-sapphire-900 bg-sapphire-800 overflow-hidden mb-4 relative shadow-[0_0_20px_rgba(0,229,255,0.15)] flex items-center justify-center">
            {profile.photoURL || profile.profileImageUrl ? (
              <img
                src={profile.photoURL || profile.profileImageUrl}
                alt={profile.name || profile.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl text-sapphire-400 font-bold">
                {(profile.name || profile.fullName || "U")[0].toUpperCase()}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {profile.name || profile.fullName || "Unknown User"}
          </h1>

          {(profile.designation || profile.title || profile.organization || profile.company) && (
            <p className="text-cyan-neon text-sm font-medium mb-4">
              {profile.designation || profile.title}
              {(profile.designation || profile.title) && (profile.organization || profile.company) && " @ "}
              {profile.organization || profile.company}
            </p>
          )}

          {profile.location && (
            <div className="flex items-center justify-center gap-1.5 text-sapphire-300 text-sm mb-6">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
          )}

          {profile.bio && (
            <p className="text-sapphire-300 text-sm leading-relaxed mb-6 px-2">
              {profile.bio}
            </p>
          )}

          {/* Socials */}
          {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div className="flex justify-center gap-3 mb-8">
              {Object.entries(profile.socialLinks).map(([key, url]) => {
                if (!url) return null;
                const Icon = Globe;

                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-sapphire-800/50 flex items-center justify-center hover:bg-cyan-neon/20 hover:text-cyan-neon transition-all text-sapphire-400"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleAction}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-dark to-cyan-neon hover:to-cyan-400 text-sapphire-950 font-bold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Save Contact
            </button>

            <button
              onClick={handleAction}
              className="w-full py-3.5 px-4 bg-transparent border border-sapphire-600 hover:border-cyan-neon/50 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5 text-cyan-neon" />
              Create My Card
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
