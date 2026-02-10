import rebaseLogo from '@/assets/rebase-logo.png';

interface LogoProps {
  className?: string;
}

const Logo = ({ className = "h-8 w-auto" }: LogoProps) => {
  return (
    <img
      src={rebaseLogo}
      alt="Rebase"
      className={className}
    />
  );
};

export default Logo;
