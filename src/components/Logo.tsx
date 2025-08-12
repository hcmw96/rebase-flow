interface LogoProps {
  className?: string;
}

const Logo = ({ className = "h-8 w-auto" }: LogoProps) => {
  return (
    <svg
      viewBox="0 0 200 50"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main REBASE text */}
      <text
        x="10"
        y="35"
        className="fill-primary"
        style={{
          fontFamily: 'serif',
          fontSize: '24px',
          fontWeight: 'bold',
          letterSpacing: '2px'
        }}
      >
        REBASE
      </text>
      
      {/* Decorative element - wellness symbol */}
      <circle
        cx="175"
        cy="25"
        r="12"
        className="stroke-primary"
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx="175"
        cy="25"
        r="6"
        className="fill-primary/20"
      />
      <circle
        cx="175"
        cy="25"
        r="3"
        className="fill-primary"
      />
    </svg>
  );
};

export default Logo;