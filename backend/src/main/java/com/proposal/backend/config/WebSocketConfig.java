package com.proposal.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final WorkflowWebSocketHandler workflowWebSocketHandler;

    public WebSocketConfig(WorkflowWebSocketHandler workflowWebSocketHandler) {
        this.workflowWebSocketHandler = workflowWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(workflowWebSocketHandler, "/ws/workflow")
                .setAllowedOriginPatterns("*");
    }
}