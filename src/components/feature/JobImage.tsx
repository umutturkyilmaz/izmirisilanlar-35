import { useState } from 'react';
import { ASSETS } from '@/lib/assets';

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  placeholder?: string;
};

/** Kırık upload URL’lerinde placeholder’a düşer (Railway disk kaybı vb.) */
export default function JobImage({
  src,
  alt,
  className,
  placeholder = ASSETS.jobPlaceholder,
}: Props) {
  const [failed, setFailed] = useState(false);
  const url = !failed && src ? src : placeholder;
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
