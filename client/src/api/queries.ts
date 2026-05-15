import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RequestItem, AuditLog } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function useRequests() {
  return useQuery({
    queryKey: ["requests"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/requests`);
      if (!res.ok) throw new Error("Failed to fetch requests");
      return res.json() as Promise<RequestItem[]>;
    },
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/audit-logs`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json() as Promise<AuditLog[]>;
    },
  });
}

export function useRequestDocuments(requestId: number | null) {
  return useQuery({
    queryKey: ["documents", requestId],
    queryFn: async () => {
      if (!requestId) return [];
      const res = await fetch(
        `${API_BASE_URL}/requests/${requestId}/documents`
      );
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!requestId,
  });
}

export function useRequestLogs(requestId: number | null) {
  return useQuery({
    queryKey: ["request-logs", requestId],
    queryFn: async () => {
      if (!requestId) return [];
      const res = await fetch(`${API_BASE_URL}/requests/${requestId}/audit-logs`);
      if (!res.ok) throw new Error("Failed to fetch request logs");
      return res.json() as Promise<AuditLog[]>;
    },
    enabled: !!requestId,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; risk: string }) => {
      const res = await fetch(`${API_BASE_URL}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      status,
    }: {
      requestId: number;
      status: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/requests/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["request-logs", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      file,
    }: {
      requestId: number;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("document", file);
      const res = await fetch(`${API_BASE_URL}/requests/${requestId}/documents`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload document");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["request-logs", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentId,
    }: {
      documentId: number;
      requestId: number;
    }) => {
      const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete document");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["request-logs", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useClearDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/requests`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to clear database");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["request-logs"] });
    },
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: number) => {
      const res = await fetch(`${API_BASE_URL}/requests/${requestId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["request-logs"] });
    },
  });
}
