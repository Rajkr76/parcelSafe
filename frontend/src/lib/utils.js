import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}

export function getStatusColor(status) {
  const colors = {
    REQUEST_CREATED: 'bg-blue-500/20 text-blue-400',
    AGENT_ACCEPTED: 'bg-yellow-500/20 text-yellow-400',
    PARCEL_PHOTO_UPLOADED: 'bg-purple-500/20 text-purple-400',
    USER_CONFIRMED: 'bg-cyan-500/20 text-cyan-400',
    OUT_FOR_DELIVERY: 'bg-orange-500/20 text-orange-400',
    DELIVERED: 'bg-emerald-500/20 text-emerald-400',
    CANCELLED: 'bg-neutral-500/20 text-neutral-400',
    FAILED: 'bg-red-500/20 text-red-400',
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    APPROVED: 'bg-emerald-500/20 text-emerald-400',
    REJECTED: 'bg-red-500/20 text-red-400',
    SUSPENDED: 'bg-red-500/20 text-red-400',
  };
  return colors[status] || 'bg-neutral-500/20 text-neutral-400';
}

export function getStatusLabel(status) {
  const labels = {
    REQUEST_CREATED: 'Created',
    AGENT_ACCEPTED: 'Accepted',
    PARCEL_PHOTO_UPLOADED: 'Photo Uploaded',
    USER_CONFIRMED: 'Confirmed',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    FAILED: 'Failed',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    SUSPENDED: 'Suspended',
  };
  return labels[status] || status;
}
