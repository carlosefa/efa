import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatThreads, useChatMessages, useSendMessage } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Chat() {
  const { user } = useAuth();
  const { data: threads = [], isLoading } = useChatThreads();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const { data: messages = [] } = useChatMessages(selectedThreadId || undefined);
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!selectedThreadId || !newMessage.trim()) return;
    sendMessage.mutate({ threadId: selectedThreadId, content: newMessage.trim() });
    setNewMessage("");
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Threads List */}
      <Card className="w-80 flex-shrink-0">
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Conversas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-14rem)]">
            {threads.length === 0 ? (
              <p className="p-4 text-center text-muted-foreground">Nenhuma conversa</p>
            ) : (
              threads.map((thread) => (
                <button key={thread.id} onClick={() => setSelectedThreadId(thread.id)} className={`w-full p-4 text-left hover:bg-muted/50 transition-colors border-b ${selectedThreadId === thread.id ? "bg-muted" : ""}`}>
                  <p className="font-medium">{thread.name || "Conversa Direta"}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true, locale: ptBR })}</p>
                </button>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col">
        {!selectedThreadId ? (
          <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">Selecione uma conversa</CardContent>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.sender_id === user?.id ? "flex-row-reverse" : ""}`}>
                    <Avatar className="h-8 w-8"><AvatarImage src={msg.sender?.avatar_url || ""} /><AvatarFallback>{msg.sender?.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                    <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t flex gap-2">
              <Input placeholder="Digite sua mensagem..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} />
              <Button onClick={handleSend} disabled={!newMessage.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
