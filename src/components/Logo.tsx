import rebaseLogo from '@/assets/rebase-logo.png';

interface LogoProps {
  className?: string;
  invert?: boolean;
}

const Logo = ({ className = "h-8 w-auto", invert = true }: LogoProps) => {
  return (
    <img
      src={rebaseLogo}
      alt="Rebase"
      className={`${className} ${invert ? 'invert' : ''}`}
    />
  );
};

export default Logo;
