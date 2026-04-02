import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Pause, Square, User, Bot, Loader2, Lightbulb, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import LiberdadeMedicaLogo from "@/components/LiberdadeMedicaLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { useRoleplay, type Message, type RoleplayData } from "@/hooks/useRoleplay";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryKeys";

const RoleplayChat = () => {
  const navigate = useNavigate();
  const { id: roleplayId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { getRoleplay, getRoleplayMessages, sendMessage, pauseRoleplay, resumeRoleplay, finishRoleplay, isLoading } = useRoleplay();
  
  const [roleplay, setRoleplay] = useState<RoleplayData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const loadData = async () => {
      if (!roleplayId) return;
      
      try {
        setIsLoadingData(true);
        const [roleplayData, messagesData] = await Promise.all([
          getRoleplay(roleplayId),
          getRoleplayMessages(roleplayId)
        ]);
        
        setRoleplay(roleplayData);
        setMessages(messagesData);

        // Se roleplay estava pausado, reativar
        if (roleplayData.status === 'paused') {
          await resumeRoleplay(roleplayId);
          roleplayData.status = 'active';
        }

        // Se não há mensagens, adicionar mensagem inicial da IA
        if (messagesData.length === 0) {
          const initialMessage: Message = {
            id: 'initial',
            sender: 'ai',
            content: `Oi! Vi o anúncio de vocês e fiquei curioso. O que exatamente vocês fazem? 🤔`,
            timestamp: new Date(),
            turn_number: 0
          };
          setMessages([initialMessage]);
        }
      } catch (error) {
        console.error('Error loading roleplay:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o roleplay",
          variant: "destructive",
        });
        navigate('/roleplay');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [roleplayId]);

  const handleSend = async () => {
    if (!inputMessage.trim() || !roleplayId || isSending) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);
    setIsTyping(true);
    
    // Adicionar mensagem do usuário imediatamente
    const currentTurn = messages.length;
    const newUserMessage: Message = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: userMessage,
      timestamp: new Date(),
      turn_number: currentTurn
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await sendMessage(roleplayId, userMessage, currentTurn);
      
      // Se há dica de coaching, adicionar à mensagem do usuário
      if (response.tip) {
        setMessages(prev => prev.map(m => 
          m.id === newUserMessage.id ? { ...m, tip: response.tip } : m
        ));
      }
      
      // Adicionar resposta da IA
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        content: response.message,
        timestamp: new Date(),
        turn_number: response.turnNumber
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Atualizar contador de mensagens localmente
      if (roleplay) {
        setRoleplay({
          ...roleplay,
          message_count: response.turnNumber + 1
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remover mensagem temporária do usuário em caso de erro
      setMessages(prev => prev.filter(m => m.id !== newUserMessage.id));
      setInputMessage(userMessage); // Restaurar input
    } finally {
      setIsSending(false);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handlePause = async () => {
    if (!roleplayId) return;
    
    try {
      await pauseRoleplay(roleplayId);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error pausing roleplay:', error);
    }
  };

  const handleFinish = async () => {
    if (!roleplayId) return;
    
    if (messages.length < 4) {
      toast({
        title: "Conversa muito curta",
        description: "Continue a conversa por mais algumas mensagens para receber uma avaliação completa.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await finishRoleplay(roleplayId);
      
      // Invalidar caches relacionados para atualização automática
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.streak(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.vouchers(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.userRoleplays(user.id) });
      }
      
      navigate(`/roleplay/${roleplayId}/results`, { state: { evaluation: result } });
    } catch (error) {
      console.error('Error finishing roleplay:', error);
    }
  };

  const handleDismissTip = (messageId: string) => {
    setDismissedTips(prev => new Set([...prev, messageId]));
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-10 w-48" />
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-16 w-2/3 ml-auto" />
            <Skeleton className="h-16 w-3/4" />
          </div>
        </main>
      </div>
    );
  }

  const messagesRemaining = (roleplay?.message_limit || 50) - (roleplay?.message_count || 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/roleplay")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <LiberdadeMedicaLogo size="sm" />
                <Badge variant="outline" className="text-xs">
                  {messagesRemaining} msgs restantes
                </Badge>
                {roleplay?.guided_mode && (
                  <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30 animate-pulse">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Modo Guiado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {roleplay?.segments?.name} • {roleplay?.client_profiles?.display_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handlePause} disabled={isLoading} className="rounded-xl">
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </Button>
            <Button variant="destructive" onClick={handleFinish} disabled={isLoading || messages.length < 4} className="rounded-xl">
              <Square className="w-4 h-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              {/* Container da mensagem */}
              <div
                className={`flex gap-3 animate-fade-in ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "ai" && (
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-secondary-foreground" />
                  </div>
                )}
                <Card
                  className={`max-w-[70%] p-4 rounded-2xl ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <div className={`prose prose-sm max-w-none ${
                    msg.sender === "user" 
                      ? "prose-invert text-primary-foreground" 
                      : "text-secondary-foreground"
                  }`}>
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className="mb-1 last:mb-0">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                        ul: ({children}) => <ul className="list-disc pl-5 my-1 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-5 my-1 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="my-0 pl-1">{children}</li>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <span className="text-xs opacity-70 mt-2 block">
                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Card>
                {msg.sender === "user" && (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
              </div>
              
              {/* Dica de coaching (modo guiado) - FORA do flex da mensagem */}
              {msg.sender === "user" && msg.tip && !dismissedTips.has(msg.id) && (
                <div className="flex justify-end mt-3 animate-fade-in">
                  <div className="max-w-[65%] mr-14 relative">
                    {/* Seta apontando para mensagem */}
                    <div className="absolute -top-2 right-8 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-transparent border-b-warning/20" />
                    
                    <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl relative">
                      {/* Botão fechar */}
                      <button
                        onClick={() => handleDismissTip(msg.id)}
                        className="absolute top-2 right-2 p-1 rounded-full text-warning/50 hover:text-warning hover:bg-warning/10 transition-colors"
                        aria-label="Dispensar dica"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Header da dica */}
                      <div className="flex items-center gap-2 mb-2 pr-6">
                        <Lightbulb className="w-4 h-4 text-warning" />
                        <span className="text-xs font-semibold text-warning uppercase tracking-wider">
                          Dica do Coach
                        </span>
                      </div>
                      
                      {/* Conteúdo da dica */}
                      <p className="text-sm text-warning/90 leading-relaxed">{msg.tip}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-secondary-foreground" />
              </div>
              <Card className="p-4 rounded-2xl bg-secondary text-secondary-foreground">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Digitando...</span>
                </div>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Digite sua resposta..."
              className="input-base pr-20"
              maxLength={2000}
              disabled={isSending}
            />
            {inputMessage.length > 0 && (
              <span className={`absolute right-3 bottom-3 text-xs transition-colors ${
                inputMessage.length > 1800 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {inputMessage.length}/2000
              </span>
            )}
          </div>
          <Button 
            onClick={handleSend} 
            className="btn-primary px-6 h-12"
            disabled={!inputMessage.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default RoleplayChat;
