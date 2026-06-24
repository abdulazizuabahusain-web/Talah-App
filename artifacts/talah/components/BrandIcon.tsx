import React from "react";
import { SvgXml } from "react-native-svg";

const INSTAGRAM = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#f09433"/>
      <stop offset="50%" stop-color="#dc2743"/>
      <stop offset="100%" stop-color="#bc1888"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#ig)"/>
  <rect x="8" y="8" width="16" height="16" rx="4.5" fill="none" stroke="white" stroke-width="1.5"/>
  <circle cx="16" cy="16" r="4.5" fill="none" stroke="white" stroke-width="1.5"/>
  <circle cx="22.5" cy="9.5" r="1.3" fill="white"/>
</svg>`;

const SNAPCHAT = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#FFFC00"/>
  <path d="M16 6c-3.3 0-6 2.7-6 6v4c-.6.3-1.1.9-1.1 1.6 0 .5.3 1 .7 1.3-.3.8-1 1.5-1.9 1.9.6.2 1.5.4 2.7.2.4.7 1.2 1.5 2.5 1.8.2.6.5.9.9.9.4 0 .7-.3.9-.9 1.3-.3 2.1-1.1 2.5-1.8 1.2.2 2.1 0 2.7-.2-.9-.4-1.6-1.1-1.9-1.9.4-.3.7-.8.7-1.3 0-.7-.5-1.3-1.1-1.6V12c0-3.3-2.7-6-6-6z" fill="#222"/>
</svg>`;

const TIKTOK = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#010101"/>
  <path d="M22 9.2c-1.3-.2-2.4-1-3-2.2H17v13c0 1.4-1.1 2.5-2.5 2.5S12 21.4 12 20s1.1-2.5 2.5-2.5c.3 0 .7.1 1 .2v-2.6c-.3-.1-.6-.1-1-.1-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5V14.1c.9.5 1.9.8 3 .9V12.4c-1-.2-1.8-.7-2.4-1.4.7.2 1.3.3 2 .3l.9-2.1H22z" fill="white"/>
  <path d="M22.9 9.3H22c-.7 0-1.3-.1-2-.3.6.7 1.4 1.2 2.4 1.4l.5-1.1z" fill="#FE2C55"/>
  <path d="M14.5 17.1c-.3-.1-.7-.2-1-.2-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5" fill="#25F4EE" fill-opacity="0.7"/>
</svg>`;

const WHATSAPP = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#25D366"/>
  <path d="M16 6C10.5 6 6 10.5 6 16c0 1.8.5 3.5 1.3 5L6 26l5.2-1.3C12.8 25.5 14.4 26 16 26c5.5 0 10-4.5 10-10S21.5 6 16 6zm5.4 14.4c-.2.6-1.2 1.2-1.7 1.2-.4 0-.9.1-2.8-.6-2.3-.9-3.8-3.2-3.9-3.4-.1-.2-1-1.3-1-2.5s.6-1.8.8-2c.2-.2.5-.3.7-.3.2 0 .3 0 .5.1.2 0 .3.1.5.5.2.5.7 1.7.7 1.8.1.1.1.3 0 .4-.1.1-.1.2-.2.4-.1.1-.2.3-.3.4-.1.1-.2.2-.1.5.2.3.8 1.3 1.7 2 1.1 1 2 1.3 2.3 1.4.3.1.4 0 .6-.2.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.3.1 1.7.8 2 1 .3.2.5.3.5.4.1.3-.1.9-.3 1.5z" fill="white"/>
</svg>`;

const TWITTER_X = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#000000"/>
  <path d="M18.2 14.3L24.8 7h-1.6l-5.7 6.4L12.8 7H7.5l6.9 9.8L7.5 25h1.6l6-6.7 4.8 6.7h5.3l-7-9.7zm-2.1 2.4l-.7-1L9.7 8.2h2.3l4.5 6.3.7 1 5.8 8.2h-2.3l-4.6-7z" fill="white"/>
</svg>`;

export type BrandKey = "instagram" | "snapchat" | "tiktok" | "whatsapp" | "twitter_x";

const SVGS: Record<BrandKey, string> = {
  instagram: INSTAGRAM,
  snapchat: SNAPCHAT,
  tiktok: TIKTOK,
  whatsapp: WHATSAPP,
  twitter_x: TWITTER_X,
};

export function BrandIcon({ brand, size = 32 }: { brand: BrandKey; size?: number }) {
  return <SvgXml xml={SVGS[brand]} width={size} height={size} />;
}
