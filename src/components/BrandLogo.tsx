import React from 'react';

interface BrandLogoProps {
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 64 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Tactile rounded badge */}
      <rect x="6" y="8" width="68" height="66" rx="22" fill="#E65C3B" />
      <rect x="6" y="4" width="68" height="66" rx="22" fill="#FF7A59" />
      {/* Friendly Brain Silhouette */}
      <path
        d="M29 25C23.5 25 19 29.5 19 35C19 37.5 20 39.8 21.6 41.5C20.6 43 20 44.9 20 47C20 52 24 56 29 56H38V23C35 23 32.2 23.8 29 25Z"
        fill="#FFFDFB"
      />
      <path
        d="M51 25C56.5 25 61 29.5 61 35C61 37.5 60 39.8 58.4 41.5C59.4 43 60 44.9 60 47C60 52 56 56 51 56H42V23C45 23 47.8 23.8 51 25Z"
        fill="#FFF3EA"
      />
      {/* Neural curve details */}
      <path
        d="M27 34C27 31.8 28.8 30 31 30M26 44C26 46.2 27.8 48 30 48M53 34C53 31.8 51.2 30 49 30M54 44C54 46.2 52.2 48 50 48"
        stroke="#FF7A59"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Sunny Star Spark */}
      <path
        d="M59 10L61.4 15.6L67.4 16.2L62.8 20.2L64.1 26L59 23L53.9 26L55.2 20.2L50.6 16.2L56.6 15.6L59 10Z"
        fill="#FFD166"
        stroke="#2B2523"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
};
