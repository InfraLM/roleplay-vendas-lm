import VIALogo from "@/assets/VIA_white.svg";

interface ViverDeIALogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ViverDeIALogo = ({ size = "md", className = "" }: ViverDeIALogoProps) => {
  const widths = {
    sm: "w-28",
    md: "w-36",
    lg: "w-44",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={VIALogo} 
        alt="Viver de IA" 
        className={`${widths[size]} h-auto`}
      />
    </div>
  );
};

export default ViverDeIALogo;
