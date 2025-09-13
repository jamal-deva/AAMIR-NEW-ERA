import React, { useRef, useState, useEffect } from "react";
import { Maximize2, X, Play, Pause } from "lucide-react";

// Check if device is mobile
const isMobile = () => window.innerWidth < 768;

// Optimized intersection observer options for mobile
const getObserverOptions = () => ({
  rootMargin: isMobile() ? '50px' : '100px',
  threshold: isMobile() ? 0.05 : 0.1
});

interface VideoThumbnailProps {
  src: string;
  title: string;
  aspectRatio?: "video" | "vertical";
  className?: string;
  isShowreel?: boolean;
  thumbnailIndex?: number;
}

export function VideoThumbnail({
  src, 
  title,
  aspectRatio = "video",
  className = "",
  isShowreel = false,
  thumbnailIndex,
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  const aspectClasses = aspectRatio === "vertical" ? "aspect-[9/16]" : "aspect-video";
  
  // Mobile-optimized class names
  const containerClasses = `relative group cursor-pointer ${aspectClasses} rounded-lg sm:rounded-xl overflow-hidden shadow-md sm:shadow-lg transition-all duration-300 ${
    isFullscreen 
      ? 'fixed inset-0 z-[9999] !rounded-none !aspect-auto w-screen h-screen bg-black' 
      : (isMobile() ? '' : 'hover:shadow-xl hover:scale-105')
  } ${className}`;

  // Get thumbnail path
  const getThumbnailPath = () => {
    if (thumbnailIndex) {
      return `/thumbnails/${thumbnailIndex}.jpg`;
    }
    return null;
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      getObserverOptions()
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const handleClick = async () => {
    if (!videoRef.current) return;

    // Add haptic feedback on mobile
    if (isMobile() && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!videoLoaded) {
        setIsLoading(true);
        // Only load the video source if it hasn't been loaded yet
        videoRef.current.src = src;
        videoRef.current.load();
      }
      
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing video:', error);
        setIsLoading(false);
      }
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Add haptic feedback on mobile
    if (isMobile() && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen();
    }
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Mobile-optimized button sizes
  const playButtonSize = aspectRatio === 'vertical' 
    ? (isFullscreen ? 'w-16 sm:w-20 h-16 sm:h-20' : 'w-10 sm:w-12 h-10 sm:h-12')
    : (isFullscreen ? 'w-20 sm:w-24 h-20 sm:h-24' : 'w-12 sm:w-16 h-12 sm:h-16');

  const thumbnailPath = getThumbnailPath();

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onClick={handleClick}
      style={{ 
        willChange: isMobile() ? 'auto' : 'transform',
        touchAction: 'manipulation' // Optimize touch interactions
      }}
    >
      {/* Static thumbnail image */}
      {thumbnailPath && isInView && (
        <img
          src={thumbnailPath}
          alt={`${title} thumbnail`}
          className={`absolute inset-0 w-full h-full ${
            isFullscreen ? 'object-contain' : 'object-cover'
          } transition-opacity duration-300 ${
            isPlaying ? 'opacity-0' : 'opacity-100'
          }`}
          loading={isMobile() ? "lazy" : "eager"}
          decoding="async"
          onLoad={() => setThumbnailLoaded(true)}
          onError={() => {
            console.warn(`Thumbnail not found: ${thumbnailPath}`);
            setThumbnailLoaded(false);
          }}
        />
      )}

      {/* Video element */}
      {isInView && (
        <video 
          ref={videoRef}
          className={`absolute inset-0 w-full h-full ${
            isFullscreen ? 'object-contain' : 'object-cover'
          } transition-opacity duration-300 ${
            isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
          loop={isShowreel}
          playsInline
          preload={isMobile() ? "none" : "metadata"}
          muted={isMobile()} // Muted by default on mobile for autoplay policies
          onLoadedData={() => {
            console.log('Video loaded data');
            setVideoLoaded(true);
          }}
          onPlay={() => {
            console.log('Video started playing');
            setIsPlaying(true);
            setIsLoading(false);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadStart={() => {
            console.log('Video load started');
          }}
          onCanPlay={() => {
            console.log('Video can play');
          }}
          onError={() => {
            console.log('Video error occurred');
            setIsLoading(false);
            setIsPlaying(false);
            console.error('Video failed to load:', src);
          }}
          style={{ willChange: 'opacity' }}
        />
      )}

      {/* Fallback background when thumbnail is loading or not available */}
      {(!thumbnailLoaded && !thumbnailPath) && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-white/40 text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bosenAlt">LOADING</p>
          </div>
        </div>
      )}

      {/* Play/Pause button overlay */}
      <div className={`absolute inset-0 flex items-center justify-center z-10 ${
        isLoading ? 'bg-black/20' : ''
      }`}>
        <div className={`bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${playButtonSize} ${
          isLoading ? 'animate-pulse' : (isMobile() ? '' : 'group-hover:bg-white/30')
        } ${isPlaying && !isLoading ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          {isLoading ? (
            <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className={`text-white ${
              aspectRatio === 'vertical' 
                ? (isFullscreen ? 'w-6 sm:w-8 h-6 sm:h-8' : 'w-4 sm:w-5 h-4 sm:h-5')
                : (isFullscreen ? 'w-8 sm:w-10 h-8 sm:h-10' : 'w-5 sm:w-6 h-5 sm:h-6')
            }`} />
          ) : (
            <Play className={`text-white ml-1 ${
              aspectRatio === 'vertical' 
                ? (isFullscreen ? 'w-6 sm:w-8 h-6 sm:h-8' : 'w-4 sm:w-5 h-4 sm:h-5')
                : (isFullscreen ? 'w-8 sm:w-10 h-8 sm:h-10' : 'w-5 sm:w-6 h-5 sm:h-6')
            }`} />
          )}
        </div>
      </div>

      {/* Hover overlay */}
      {!isFullscreen && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      )}
      
      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className={`absolute bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-300 z-20 ${
          isFullscreen 
            ? 'top-4 sm:top-8 right-4 sm:right-8 w-10 sm:w-12 h-10 sm:h-12 opacity-100' 
            : 'top-2 sm:top-4 right-2 sm:right-4 w-8 sm:w-10 h-8 sm:h-10 opacity-0 group-hover:opacity-100'
        }`}
      >
        {isFullscreen ? (
          <X size={isMobile() ? 16 : 20} className="text-white" />
        ) : (
          <Maximize2 size={isMobile() ? 12 : 16} className="text-white" />
        )}
      </button>
      
      {/* Title Badge */}
      <div className={`absolute transition-all duration-300 z-20 ${
        isFullscreen 
          ? 'bottom-4 sm:bottom-8 left-4 sm:left-8 opacity-100' 
          : 'bottom-2 sm:bottom-4 left-2 sm:left-4 opacity-0 group-hover:opacity-100'
      }`}>
        <span className={`text-white font-bosenAlt bg-black/50 px-3 py-1 rounded-full ${
          isFullscreen ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
        }`}>
          {title}
        </span>
      </div>
    </div>
  );
}

export default VideoThumbnail;