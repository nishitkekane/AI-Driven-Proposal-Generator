import { useEffect, useRef, useCallback, useState } from 'react';

const DEFAULT_WS_URL = (() => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiUrl) {
    const wsProto = apiUrl.startsWith('https') ? 'wss' : 'ws';
    return `${apiUrl.replace(/^https?/, wsProto).replace(/\/+$/, '')}/ws/workflow`;
  }
  return 'ws://localhost:8080/ws/workflow';
})();

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || DEFAULT_WS_URL;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1500; // first retry delay; doubles each attempt

/**
 * useWorkflowWebSocket
 *
 * Opens a WebSocket connection scoped to a specific proposalId and dispatches
 * incoming agent orchestration events to the provided `onMessage` callback.
 *
 * Connection URL: ws://localhost:8080/ws/workflow?proposalId=<UUID>
 *
 * Incoming message shape (JSON):
 *   { proposalId: string, status: string, payload: object | null }
 *
 * @param {string|null} proposalId - The proposal UUID to subscribe to. Pass null to skip connecting.
 * @param {function}    onMessage  - Callback: (status: string, payload: any) => void
 *
 * @returns {{ isConnected: boolean, disconnect: function }}
 */
export default function useWorkflowWebSocket(proposalId, onMessage) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef        = useRef(null);
  const retriesRef   = useRef(0);
  const onMessageRef = useRef(onMessage);
  const isMountedRef = useRef(true);
  const manualCloseRef = useRef(false);

  // Keep onMessage ref current so the WS handler always calls the latest version
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!proposalId || !isMountedRef.current) return;

    const url = `${WS_BASE_URL}?proposalId=${proposalId}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) { ws.close(); return; }
      setIsConnected(true);
      retriesRef.current = 0;
      console.info(`[WorkflowWS] Connected — proposalId: ${proposalId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { status, payload } = data;
        if (status && onMessageRef.current) {
          onMessageRef.current(status, payload ?? null);
        }
      } catch (err) {
        console.warn('[WorkflowWS] Could not parse message:', event.data, err);
      }
    };

    ws.onerror = (err) => {
      console.warn('[WorkflowWS] Error:', err);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      if (!isMountedRef.current || manualCloseRef.current) return;

      // Unexpected close — attempt reconnect with backoff (capped at 5s)
      if (retriesRef.current < 20) {
        const delay = Math.min(5000, RETRY_BASE_MS * Math.pow(1.5, retriesRef.current));
        retriesRef.current++;
        console.info(
          `[WorkflowWS] Closed (code ${event.code}). Reconnecting in ${delay}ms (attempt ${retriesRef.current}/20)…`
        );
        setTimeout(() => {
          if (isMountedRef.current && !manualCloseRef.current) connect();
        }, delay);
      } else {
        console.warn(`[WorkflowWS] Max reconnect attempts reached for proposal ${proposalId}.`);
      }
    };
  }, [proposalId]);

  // Open connection whenever proposalId changes
  useEffect(() => {
    if (!proposalId) return;
    isMountedRef.current  = true;
    manualCloseRef.current = false;
    retriesRef.current    = 0;
    connect();

    return () => {
      isMountedRef.current   = true; // keep true until after cleanup
      manualCloseRef.current = true;
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [proposalId, connect]);

  // Cleanup on hook unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  return { isConnected, disconnect };
}
