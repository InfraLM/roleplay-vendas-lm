import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 tech-grid">
      <div className="text-center animate-fade-in">
        <h1 className="text-8xl font-bold mb-4">
          <span className="gradient-text">404</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oops! Página não encontrada
        </p>
        <Button className="btn-primary" onClick={() => navigate("/")}>
          <Home className="w-4 h-4 mr-2" />
          Voltar ao início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
