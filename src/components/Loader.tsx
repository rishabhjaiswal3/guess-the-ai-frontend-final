import type { CSSProperties } from 'react';

type LoaderSize = 'sm' | 'md' | 'lg';

type LoaderProps = {
  size?: LoaderSize;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

const sizeClass: Record<LoaderSize, string> = {
  sm: 'gta-spinner--sm',
  md: '',
  lg: 'gta-spinner--lg',
};

export function Loader({ size = 'md', label = 'Loading', className = '', style }: LoaderProps) {
  return (
    <span className={`gta-loader ${className}`.trim()} role="status" aria-live="polite" aria-label={label} style={style}>
      <span className={`gta-spinner ${sizeClass[size]}`.trim()} aria-hidden="true" />
    </span>
  );
}

export function FullPageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="gta-loader gta-loader--page" role="status" aria-live="polite" aria-label={label}>
      <span className="gta-spinner gta-spinner--lg" aria-hidden="true" />
    </div>
  );
}

