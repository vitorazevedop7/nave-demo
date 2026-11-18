import type { CSSProperties } from 'react';

export const btnNav: CSSProperties = {
  background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '6px', color: '#101826',
};

export const btnHoje: CSSProperties = {
  background: 'transparent', border: '1px solid rgba(0,0,0,0.15)',
  borderRadius: '8px', cursor: 'pointer', padding: '5px 12px',
  fontSize: '12px', fontWeight: 600, color: '#475569', fontFamily: 'inherit',
};

export const overlayStyle: CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 500,
  background: 'rgba(0,0,0,0.3)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export const cardStyle: CSSProperties = {
  background: '#fff', borderRadius: '20px',
  padding: '1.5rem', width: '100%', maxWidth: '440px',
  maxHeight: '80vh', overflowY: 'auto',
  boxShadow: '0 20px 44px rgba(15,23,42,0.18)',
};

export const btnClose: CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#667b94',
  display: 'flex', alignItems: 'center',
};
