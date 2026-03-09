"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getJoinRequestsForProject, approveJoinRequest, rejectJoinRequest } from "@/lib/join-requests";
import type { JoinRequest } from "@/types/join-request";
import { Check, X, Loader2, Mail } from "lucide-react";

interface JoinRequestsReceivedProps {
  projectId: string;
}

export function JoinRequestsReceived({ projectId }: JoinRequestsReceivedProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getJoinRequestsForProject(projectId);
        setRequests(data);
      } catch (error) {
        console.error("Error fetching join requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [projectId]);

  const pendingRequests = requests.filter((r) => r.status === "pending");

  const handleApprove = async (request: JoinRequest) => {
    if (!request.id) return;
    setProcessingId(request.id);
    try {
      await approveJoinRequest(request.id, projectId, request.userName, request.userEmail);
      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "approved" as const } : r))
      );
      toast({
        title: "Member approved",
        description: `${request.userName} has been added to your team.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: JoinRequest) => {
    if (!request.id) return;
    setProcessingId(request.id);
    try {
      await rejectJoinRequest(request.id);
      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "rejected" as const } : r))
      );
      toast({
        title: "Request declined",
        description: `${request.userName}'s request has been declined.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to decline request.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return null;
  if (requests.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {pendingRequests.length > 0 && (
        <p className="text-xs font-medium text-amber-400">
          {pendingRequests.length} pending request{pendingRequests.length !== 1 ? "s" : ""}
        </p>
      )}
      {requests.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 text-sm"
        >
          <div className="min-w-0">
            <p className="text-white font-medium truncate">{r.userName}</p>
            <p className="text-gray-500 text-xs flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {r.userEmail}
            </p>
            {r.message && (
              <p className="text-gray-400 text-xs mt-1 italic">&quot;{r.message}&quot;</p>
            )}
          </div>
          {r.status === "pending" ? (
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                onClick={() => handleApprove(r)}
                disabled={processingId === r.id}
              >
                {processingId === r.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => handleReject(r)}
                disabled={processingId === r.id}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Badge
              variant="outline"
              className={
                r.status === "approved"
                  ? "border-green-500/30 text-green-400 text-xs"
                  : "border-red-500/30 text-red-400 text-xs"
              }
            >
              {r.status}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
