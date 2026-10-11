import React from 'react';

/**
 * Coated person icon: Person wearing a formal suit coat with V-lapel and tie.
 * Represents HoD / Leadership.
 */
export function CoatedPerson({ className = "w-4 h-4" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Head */}
      <circle cx="12" cy="7" r="4" />
      {/* Coat Shoulders / Body */}
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      {/* Suit Lapel / Coat Collar */}
      <path d="M9.5 15l2.5 3 2.5-3" />
      {/* Tie */}
      <path d="M12 18v3" />
    </svg>
  );
}

/**
 * Bag carrying person icon: Person wearing a backpack (symmetric straps & chest clip).
 * Represents Student.
 */
export function BagCarryingPerson({ className = "w-4 h-4" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Backpack visible behind shoulders */}
      <path d="M7 11V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      {/* Head */}
      <circle cx="12" cy="7" r="3.5" />
      {/* Torso / Shoulders */}
      <path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
      {/* Left and right backpack straps on chest */}
      <path d="M9.5 14v7" />
      <path d="M14.5 14v7" />
      {/* Chest strap connecting the backpack straps */}
      <path d="M9.5 17.5h5" />
    </svg>
  );
}
