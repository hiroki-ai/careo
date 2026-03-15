"use client";

import { useEffect, useState } from "react";

export interface DiscussionMessage {
  name: string;
  role: string;
  message: string;
}

export interface BoardMeeting {
  id: string;
  session_index: number;
  topic_owner: string;
  topic: string;
  topic_owner_opening: string;
  discussion: DiscussionMessage[];
  conclusion: string;
  recommended_action: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export function useBoardMeeting() {
  const [meeting, setMeeting] = useState<BoardMeeting | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMeeting = async () => {
    try {
      const res = await fetch("/api/board-meeting");
      const data = await res.json();
      setMeeting(data);
    } catch {
      setMeeting(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeeting(); }, []);

  const respond = async (id: string, status: "approved" | "rejected") => {
    await fetch("/api/board-meeting", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setMeeting(null);
  };

  return { meeting, loading, respond };
}
