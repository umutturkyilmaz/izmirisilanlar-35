import { ASSETS } from '@/lib/assets';

type Props = {
  variant?: 'band' | 'pay';
  className?: string;
};

/** iyzico resmi logo paketi: "iyzico ile Öde" + Visa / Mastercard (gündüz renkli, gece beyaz). */
export default function PaymentLogos({ variant = 'band', className = '' }: Props) {
  const colored = variant === 'band' ? ASSETS.iyzicoBandColored : ASSETS.iyzicoPayColored;
  const white = variant === 'band' ? ASSETS.iyzicoBandWhite : ASSETS.iyzicoPayWhite;
  const alt =
    variant === 'band'
      ? 'iyzico ile Öde, Mastercard, Visa, American Express, Troy'
      : 'iyzico ile Öde';
  const size = variant === 'band' ? 'h-6 md:h-7' : 'h-5';

  return (
    <span className={`inline-flex items-center ${className}`}>
      <img src={colored} alt={alt} className={`${size} w-auto dark:hidden`} loading="lazy" />
      <img src={white} alt={alt} className={`${size} w-auto hidden dark:block`} loading="lazy" />
    </span>
  );
}
