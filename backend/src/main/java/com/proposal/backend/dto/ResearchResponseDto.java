package com.proposal.backend.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class ResearchResponseDto {

    private List<ResearchFindingDto> findings = new ArrayList<>();

    private List<ResearchSourceDto> sources = new ArrayList<>();
}
