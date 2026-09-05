package com.proposal.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "rate_card")
public class RateCard {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @com.fasterxml.jackson.annotation.JsonProperty("item_name")
    @Column(name = "item_name", nullable = false)
    private String itemName;

    @com.fasterxml.jackson.annotation.JsonProperty("category")
    @Column(nullable = false)
    private String category;

    @com.fasterxml.jackson.annotation.JsonProperty("unit")
    @Column(nullable = false)
    private String unit;

    @com.fasterxml.jackson.annotation.JsonProperty("price")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @com.fasterxml.jackson.annotation.JsonProperty("currency")
    @Column(nullable = false)
    private String currency = "USD";

    @com.fasterxml.jackson.annotation.JsonProperty("effective_date")
    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }
}