"use client";

import dynamic from 'next/dynamic';
import { LucideProps } from 'lucide-react';
import React from 'react';

// Loading placeholder component
const IconLoading = ({ className, ...props }: any) => (
  <div className={`${className || ''} animate-pulse bg-gray-200 rounded w-4 h-4`} />
);

// Dynamic imports for commonly used icons
export const CopyIcon = dynamic(
  () => import('lucide-react').then((mod) => ({ default: mod.Copy })),
  { loading: () => <IconLoading />, ssr: false }
);

export const CheckIcon = dynamic(
  () => import('lucide-react').then((mod) => ({ default: mod.Check })),
  { loading: () => <IconLoading />, ssr: false }
);

export const QrCodeIcon = dynamic(
  () => import('lucide-react').then((mod) => ({ default: mod.QrCode })),
  { loading: () => <IconLoading />, ssr: false }
);

export const UserIcon = dynamic(
  () => import('lucide-react').then((mod) => ({ default: mod.User })),
  { loading: () => <IconLoading />, ssr: false }
);

export const MenuIcon = dynamic(
  () => import('lucide-react').then((mod) => ({ default: mod.Menu })),
  { loading: () => <IconLoading />, ssr: false }
);

export const XIcon = dynamic(
  () => import('lucide-react').then((mod) => ({ default: mod.X })),
  { loading: () => <IconLoading />, ssr: false }
);

export const ChevronDownIcon = dynamic(
  () => import('lucide-react').then((mod) => ({ default: mod.ChevronDown })),
  { loading: () => <IconLoading />, ssr: false }
);

export const EyeIcon = dynamic(
  () => import('lucide-react').then((mod) => ({ default: mod.Eye })),
  { loading: () => <IconLoading />, ssr: false }
);

export const EyeOffIcon = dynamic(
  () => import('lucide-react').then((mod) => ({ default: mod.EyeOff })),
  { loading: () => <IconLoading />, ssr: false }
);

export const LogOutIcon = dynamic(
  () => import('lucide-react').then((mod) => ({ default: mod.LogOut })),
  { loading: () => <IconLoading />, ssr: false }
);

export const SheetIcon = dynamic(
  () => import('lucide-react').then((mod) => ({ default: mod.Sheet })),
  { loading: () => <IconLoading />, ssr: false }
);