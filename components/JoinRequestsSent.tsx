"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getJoinRequestsForUser, withdrawJoinRequest } from "@/lib/join-requests";
import type { JoinRequest } from "@/types/join-request";
import { Loader2, Send, X } from "lucide-react";

interface JoinRequestsSentProps {
  userId: string;
}

export function JoinRequestsSent({ userId }: JoinRequestsSentProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getJoinRequestsForUser(userId);
        setRequests(data);
      } catch (error) {
        console.error("Error fetching sent requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [userId]);

  const handleWithdraw = async (request: JoinRequest) => {
    if (!request.id) return;
    setWithdrawingId(request.id);
    try {
      await withdrawJoinRequest(request.id);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      toast({
        title: "Request withdrawn",
        description: `Your request to join "${request.projectTitle}" has been withdrawn.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to withdraw request.",
        variant: "destructive",
      });
    } finally {
      setWithdrawingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (requests.length === 0) return null;

  const statusColors: Record<string, string> = {
    pending: "border-amber-500/30 text-amber-400",
    approved: "border-green-500/30 text-green-400",
    rejected: "border-red-500/30 text-red-400",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Send className="h-5 w-5 text-violet-400" />
        My Join Requests
      </h2>
      <div className="space-y-3">
        {requests.map((r) => (
          <Card key={r.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{r.projectTitle}</p>
                <p className="text-xs text-gray-500">
                  Sent {r.createdAt?.toLocaleDateString?.("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={statusColors[r.status] || ""}>
                  {r.status}
                </Badge>
                {r.status === "pending" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => handleWithdraw(r)}
                    disabled={withdrawingId === r.id}
                  >
                    {withdrawingId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
