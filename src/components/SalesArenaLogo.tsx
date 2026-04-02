import logoIconBranco from "@/assets/logo-branco.svg";
import logoIconPreto from "@/assets/logo-preto.svg";
import logoFullBranco from "@/assets/logo-branco-completo.svg";

interface SalesArenaLogoProps {
  variant?: "full" | "header" | "compact";
  className?: string;
}

const SalesArenaLogo = ({ variant = "full", className = "" }: SalesArenaLogoProps) => {
  if (variant === "compact") {
    return (
      <div className={`${className}`}>
        <img src={logoIconPreto} alt="Liberdade Medica" className="w-8 h-auto block dark:hidden" />
        <img src={logoIconBranco} alt="Liberdade Medica" className="w-8 h-auto hidden dark:block" />
      </div>
    );
  }

  if (variant === "header") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <img src={logoFullBranco} alt="Liberdade Medica" className="w-36 h-auto block dark:hidden invert" />
        <img src={logoFullBranco} alt="Liberdade Medica" className="w-36 h-auto hidden dark:block" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src={logoFullBranco} alt="Liberdade Medica" className="w-44 h-auto block dark:hidden invert" />
      <img src={logoFullBranco} alt="Liberdade Medica" className="w-44 h-auto hidden dark:block" />
    </div>
  );
};

export default SalesArenaLogo;
