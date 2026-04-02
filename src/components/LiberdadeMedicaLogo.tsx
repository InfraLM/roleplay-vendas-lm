import logoIconBranco from "@/assets/logo-branco.svg";
import logoIconPreto from "@/assets/logo-preto.svg";
import logoFullBranco from "@/assets/logo-branco-completo.svg";

interface LiberdadeMedicaLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
  className?: string;
}

const LiberdadeMedicaLogo = ({ size = "md", variant = "full", className = "" }: LiberdadeMedicaLogoProps) => {
  const widths = {
    sm: "w-32",
    md: "w-40",
    lg: "w-52",
  };

  const iconWidths = {
    sm: "w-8",
    md: "w-10",
    lg: "w-14",
  };

  if (variant === "icon") {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src={logoIconPreto}
          alt="Liberdade Medica"
          className={`${iconWidths[size]} h-auto block dark:hidden`}
        />
        <img
          src={logoIconBranco}
          alt="Liberdade Medica"
          className={`${iconWidths[size]} h-auto hidden dark:block`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo completa: preto no claro (via invert), branco no escuro */}
      <img
        src={logoFullBranco}
        alt="Liberdade Medica"
        className={`${widths[size]} h-auto block dark:hidden invert`}
      />
      <img
        src={logoFullBranco}
        alt="Liberdade Medica"
        className={`${widths[size]} h-auto hidden dark:block`}
      />
    </div>
  );
};

export default LiberdadeMedicaLogo;
