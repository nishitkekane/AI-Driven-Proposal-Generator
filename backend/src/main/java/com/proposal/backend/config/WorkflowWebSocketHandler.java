package com.proposal.backend.config;

import java.io.IOException;
import java.net.URI;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class WorkflowWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowWebSocketHandler.class);

    private final Map<UUID, Set<WebSocketSession>> proposalSessions = new ConcurrentHashMap<>();
    private final Map<String, WebSocketSession> allSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        allSessions.put(session.getId(), session);

        UUID proposalId = extractProposalId(session);
        if (proposalId != null) {
            proposalSessions.computeIfAbsent(proposalId, k -> ConcurrentHashMap.newKeySet()).add(session);
            logger.info("WebSocket session {} registered for proposal {}", session.getId(), proposalId);
        } else {
            logger.info("WebSocket session {} connected without proposalId", session.getId());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        allSessions.remove(session.getId());

        UUID proposalId = extractProposalId(session);
        if (proposalId != null) {
            Set<WebSocketSession> sessions = proposalSessions.get(proposalId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    proposalSessions.remove(proposalId);
                }
            }
            logger.info("WebSocket session {} removed for proposal {}", session.getId(), proposalId);
        }
    }

    public void sendToProposal(UUID proposalId, String message) {
        Set<WebSocketSession> sessions = proposalSessions.getOrDefault(proposalId, Collections.emptySet());
        if (sessions.isEmpty()) {
            logger.debug("No active WebSocket sessions found for proposal {}", proposalId);
            return;
        }

        TextMessage textMessage = new TextMessage(message);
        sessions.forEach(session -> {
            if (session.isOpen()) {
                try {
                    synchronized (session) {
                        session.sendMessage(textMessage);
                    }
                } catch (IOException e) {
                    logger.error("Error sending WebSocket message to session {} for proposal {}: {}",
                            session.getId(), proposalId, e.getMessage());
                }
            }
        });
    }

    public void sendToAll(String message) {
        TextMessage textMessage = new TextMessage(message);
        allSessions.values().forEach(session -> {
            if (session.isOpen()) {
                try {
                    synchronized (session) {
                        session.sendMessage(textMessage);
                    }
                } catch (IOException e) {
                    logger.error("Error broadcasting WebSocket message to session {}: {}",
                            session.getId(), e.getMessage());
                }
            }
        });
    }

    private UUID extractProposalId(WebSocketSession session) {
        try {
            URI uri = session.getUri();
            if (uri != null && uri.getQuery() != null) {
                String[] params = uri.getQuery().split("&");
                for (String param : params) {
                    String[] pair = param.split("=");
                    if (pair.length == 2 && "proposalId".equalsIgnoreCase(pair[0])) {
                        return UUID.fromString(pair[1]);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Could not extract valid proposalId UUID from session URI: {}", e.getMessage());
        }
        return null;
    }
}