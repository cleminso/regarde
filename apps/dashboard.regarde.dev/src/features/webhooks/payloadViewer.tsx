"use client";

import { useState } from "react";

interface PayloadViewerProps {
  payload?: Record<string, unknown>;
  headers?: Record<string, string>;
  response?: Record<string, unknown>;
}

export function PayloadViewer({
  payload,
  headers,
  response,
}: PayloadViewerProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<
    "payload" | "headers" | "response"
  >("payload");

  const formatJson = (data: unknown): string => {
    if (data === undefined || data === null) return "{}";
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return data;
      }
    }
    return JSON.stringify(data, null, 2);
  };

  const getContent = () => {
    switch (activeTab) {
      case "payload":
        return formatJson(payload);
      case "headers":
        return formatJson(headers);
      case "response":
        return formatJson(response);
      default:
        return "{}";
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Tab List */}
      <div className="flex gap-2 rounded-sm bg-sidebar-accent p-1">
        <button
          onClick={() => setActiveTab("payload")}
          className={`flex items-center justify-center rounded-sm px-1.5 py-0.5 font-mono text-sm ${
            activeTab === "payload"
              ? "border border-border bg-background text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Payload
        </button>
        <button
          onClick={() => setActiveTab("headers")}
          className={`flex items-center justify-center rounded-sm px-1.5 py-0.5 font-mono text-sm ${
            activeTab === "headers"
              ? "border border-border bg-background text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Headers
        </button>
        <button
          onClick={() => setActiveTab("response")}
          className={`flex items-center justify-center rounded-sm px-1.5 py-0.5 font-mono text-sm ${
            activeTab === "response"
              ? "border border-border bg-background text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Responses
        </button>
      </div>

      <div className="h-2 w-full" />

      {/* Tab Content */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-sm bg-sidebar-accent">
        <pre className="h-full flex-1 overflow-auto p-2 font-mono text-sm whitespace-pre-wrap">
          {getContent()}
        </pre>
      </div>
    </div>
  );
}
