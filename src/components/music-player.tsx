"use client";

import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const TRACKS = [
  { title: "Track 00", src: "/music/M00.mp3" },
  { title: "Track 01", src: "/music/M01.mp3" },
  { title: "Track 02", src: "/music/M02.mp3" },
  { title: "Track 03", src: "/music/M03.mp3" },
  { title: "Track 04", src: "/music/M04.mp3" },
  { title: "Track 05", src: "/music/M05.mp3" },
  { title: "Track 06", src: "/music/M06.mp3" },
  { title: "Track 07", src: "/music/M07.MP3" },
];

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [volume, setVolume] = useState(1);
  const [restoredTime, setRestoredTime] = useState<number | null>(null);

  // Load state from session storage on mount
  useEffect(() => {
    const loadSavedState = () => {
      const saved = sessionStorage.getItem("da_music_player");
      if (saved) {
        try {
          const { track, playing, time, volume: savedVolume } = JSON.parse(saved);
          setCurrentTrack(track);
          setIsPlaying(playing);
          if (savedVolume !== undefined) {
            setVolume(savedVolume);
          }
          if (typeof time === "number") {
            setRestoredTime(time);
          }
        } catch (e) {
          console.error("Failed to parse saved music state", e);
          setIsPlaying(true);
        }
      } else {
        setIsPlaying(true);
      }
      setHasLoaded(true);
    };

    loadSavedState();
  }, []);

  // Save state to session storage periodically
  useEffect(() => {
    if (!hasLoaded) return;

    const saveState = () => {
      sessionStorage.setItem(
        "da_music_player",
        JSON.stringify({
          track: currentTrack,
          playing: isPlaying,
          time: audioRef.current?.currentTime || 0,
          volume: volume,
        }),
      );
    };

    saveState();
    const interval = setInterval(saveState, 5000);

    // Also save on beforeunload to capture the final state
    const handleBeforeUnload = () => saveState();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentTrack, isPlaying, hasLoaded, volume]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    // Clear restored time on manual track change
    setRestoredTime(null);
    setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
  };

  const prevTrack = () => {
    // Clear restored time on manual track change
    setRestoredTime(null);
    setCurrentTrack((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Effect to handle play/pause and volume synchronization
  useEffect(() => {
    if (!hasLoaded || !audioRef.current) return;

    const audio = audioRef.current;
    audio.volume = volume;

    if (isPlaying) {
      audio.play().catch((e) => {
        console.error("Autoplay prevented:", e);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
    // Trigger when track changes, play state changes or volume changes
  }, [isPlaying, hasLoaded, currentTrack, volume]);

  // Handle Metadata Loaded to restore time
  const handleLoadedMetadata = () => {
    if (audioRef.current && restoredTime !== null) {
      audioRef.current.currentTime = restoredTime;
      // Reset after applying
      setRestoredTime(null);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-white backdrop-blur-md border-t border-white/10 p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 w-1/3">
          <div className="relative w-10 h-10 rounded overflow-hidden">
            <Image src="/icon.png" alt="Noticias Musicales Logo" fill className="object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{TRACKS[currentTrack].title}</span>
            <span className="text-xs text-gray-400">Noticias Musicales en el Diario de Avisos</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 w-1/3">
          <div className="flex items-center gap-6">
            <button onClick={prevTrack} className="hover:text-amber-500 transition-colors">
              <SkipBack size={20} />
            </button>
            <button onClick={togglePlay} className="p-3 bg-white text-black rounded-full hover:scale-105 transition-transform">
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="hover:text-amber-500 transition-colors">
              <SkipForward size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 w-1/3">
          <Volume2 size={18} className="text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
          />
        </div>

        <audio ref={audioRef} src={TRACKS[currentTrack].src} onEnded={nextTrack} onLoadedMetadata={handleLoadedMetadata} />
      </div>
    </div>
  );
}
