"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getJoinRequestsForProject, approveJoinRequest, rejectJoinRequest } from "@/lib/join-requests";
import type { JoinRequest } from "@/types/join-request";
import { Check, X, Loader2, Mail, UserPlus, Inbox } from "lucide-react";

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

  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-violet-400" />
            <h3 className="text-lg font-semibold text-white">Join Requests</h3>
          </div>
          {pendingRequests.length > 0 && (
            <Badge className="bg-amber-500 text-white">
              {pendingRequests.length} pending
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-6">
            <Inbox className="h-10 w-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No join requests yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="pb-2 text-gray-400 font-medium">Name</th>
                  <th className="pb-2 text-gray-400 font-medium">Email</th>
                  <th className="pb-2 text-gray-400 font-medium">Message</th>
                  <th className="pb-2 text-gray-400 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((r) => (
                  <tr key={r.id} className="group">
                    <td className="py-3 pr-3">
                      <p className="text-white font-medium">{r.userName}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <p className="text-gray-400 flex items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[180px]">{r.userEmail}</span>
                      </p>
                    </td>
                    <td className="py-3 pr-3">
                      {r.message ? (
                        <p className="text-gray-400 italic truncate max-w-[200px]">&quot;{r.message}&quot;</p>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {r.status === "pending" ? (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                            onClick={() => handleApprove(r)}
                            disabled={processingId === r.id}
                          >
                            {processingId === r.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            onClick={() => handleReject(r)}
                            disabled={processingId === r.id}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className={
                            r.status === "approved"
                              ? "border-green-500/30 text-green-400"
                              : "border-red-500/30 text-red-400"
                          }
                        >
                          {r.status === "approved" ? "Approved" : "Declined"}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
