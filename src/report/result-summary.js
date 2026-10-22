(() => {
  const result = document.getElementById("result");
  if (!result) return;

  const escapeHtml = window.LTAUtils?.escapeHtml || ((value) => String(value));
  const ROLE_LABELS = Object.freeze({ top: "TOP", jungle: "JUNGLA", mid: "MID", botline: "BOTLINE", support: "SUPPORT" });
  const diagnoseComposition = window.LTADiagnosticEngine?.diagnoseComposition;
  const proposeCorrections = window.LTACorrectionEngine?.proposeCorrections;
  const protectComposition = window.LTAProtectionEngine?.protectComposition;
  const optimizeComposition = window.LTACompositionOptimizer?.optimizeComposition;
  const recommendProfiles = window.LTAStrategicRecommendationEngine?.recommendProfiles;
  const mapCandidates = window.LTAChampionshipCandidateMapper?.mapCandidates;
  const evaluateCandidates = window.LTACandidateEvaluator?.evaluateCandidates;
  const presentRecommendations = window.LTAStrategicRecommendationPresenter?.presentRecommendations;
  const presentForReport = window.LTAStrategicRecommendationPresenterIntegration?.presentForReport;
  const polishRecommendation = window.LTAStrategicRecommendationPolisher?.polishRecommendation;
  const optimizeStrategicComposition = window.LTAStrategicCompositionOptimizer?.optimizeStrategicComposition;
  const recomposeStrategicTeam = window.LTAStrategicTeamRecomposer?.recomposeStrategicTeam;
  const assessStrategicRisks = window.LTAStrategicRiskAnalyzer?.assessStrategicRisks;
  const adviseCounterplay = window.LTAStrategicCounterplayAdvisor?.adviseCounterplay;
  const prioritizeBans = window.LTABanPrioritizer?.prioritizeBans;
  const presentBanRecommendations = window.LTABanRecommendationPresenter?.presentBanRecommendations;
  const buildStrategicReport = window.LTAStrategicReportBuilder?.buildStrategicReport;
  const explainFinalRecommendation = window.LTAFinalRecommendationExplanations?.explainFinalRecommendation;

  let refreshQueued = false;

  const text = (node) => node?.textContent?.trim() || "";

  function clearSummary() {
    delete result.dataset.summarySignature;
    result.querySelector(".result-summary")?.remove();
  }

  function renderStrategicReport(items) {
    if (![diagnoseComposition, proposeCorrections, protectComposition, optimizeComposition, recommendProfiles, mapCandidates, evaluateCandidates, presentRecommendations, presentForReport, polishRecommendation, optimizeStrategicComposition, recomposeStrategicTeam, assessStrategicRisks, adviseCounterplay, prioritizeBans, presentBanRecommendations, buildStrategicReport, explainFinalRecommendation].every((fn) => typeof fn === "function")) return "";
    const picks = items.map((item) => ({
      role: item.role,
      champion: item.champion,
      identity: item.identity,
      function: item.functionLabel,
      tempo: item.tempo,
      strengths: item.strengths,
      weaknesses: item.weaknesses,
    }));
    const diagnosis = diagnoseComposition(picks);
    const correction = proposeCorrections({
      picks,
      diagnosis,
      candidatesByRole: window.LTAStrategicReportCandidatesByRole || {},
    });
    const protection = protectComposition({ diagnosis, correction });
    const optimizer = optimizeComposition({ diagnosis, correction });
    const recommendations = recommendProfiles({ diagnosis, optimizer });
    const candidatesByRole = window.LTAStrategicReportCandidatesByRole || {};
    const mappedCandidates = mapCandidates({
      diagnosis,
      optimizer,
      recommendations,
      candidatesByRole,
      selectedChampions: picks.map((pick) => pick.champion),
      currentPicks: picks,
    });
    const evaluatedCandidates = evaluateCandidates({ diagnosis, optimizer, recommendations, mappedCandidates });
    const presentation = presentRecommendations({ optimizer, recommendations, mappedCandidates, evaluatedCandidates });
    const integration = presentForReport({ optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation });
    const polished = polishRecommendation({ optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration });
    const recommendation = polished.status === "polished" ? polished : integration;
    const compositionOptimization = optimizeStrategicComposition({
      optimizer,
      recommendations,
      mappedCandidates,
      evaluatedCandidates,
      presentation,
      integration,
      polished,
    });
    const teamRecomposition = recomposeStrategicTeam({
      optimizer,
      recommendations,
      mappedCandidates,
      evaluatedCandidates,
      presentation,
      integration,
      polished,
    });
    const strategicRisks = assessStrategicRisks({
      optimizer,
      recommendations,
      mappedCandidates,
      evaluatedCandidates,
      presentation,
      integration,
      polished,
      strategicCompositionOptimization: compositionOptimization,
      teamRecomposition,
    });
    const strategicCounterplay = adviseCounterplay({ strategicRisks });
    const strategicBans = prioritizeBans({
      diagnosis,
      strategicRisks,
      strategicCounterplay,
      protection,
      mappedCandidates,
      championCatalog: candidatesByRole,
    });
    const strategicBanPresentation = presentBanRecommendations({ banPrioritizer: strategicBans });
    // Enrich only the report, after every decision engine has finished.
    const explainedRecommendation = explainFinalRecommendation({
      section: recommendation.section, picks, diagnosis, correction, optimizer,
      mappedCandidates, evaluatedCandidates, presentation,
    });
    const report = buildStrategicReport({
      diagnosis,
      correction,
      protection,
      recommendation: explainedRecommendation,
      compositionOptimization,
      teamRecomposition,
      strategicRisks,
      strategicCounterplay,
      strategicBans,
      strategicBanPresentation,
    });

    return `
      <section class="result-summary__strategy" aria-labelledby="composition-analysis-title">
        <div class="result-summary__strategy-heading">
          <p class="result-summary__eyebrow">Informe estratégico</p>
          <h3 id="composition-analysis-title">${escapeHtml(report.title)}</h3>
        </div>
        <div class="result-summary__strategy-grid">
          ${report.sections.map((section) => `
            <article class="result-summary__strategy-card" data-report-section="${escapeHtml(section.id)}">
              <h4>${escapeHtml(section.title)}</h4>
              <p class="result-summary__answer">${escapeHtml(section.answer)}</p>
              <p>${escapeHtml(section.explanation)}</p>
              ${section.detectedNeed ? `<p class="result-summary__detected-need"><strong>Carencia detectada:</strong> ${escapeHtml(section.detectedNeed)}</p>` : section.optionalLimitation ? `<p class="result-summary__detected-need"><strong>Límite del estilo, no carencia demostrada:</strong> ${escapeHtml(section.optionalLimitation)}</p>` : ""}
              ${section.teamRecomposition ? `<p class="result-summary__action"><strong>Equipo propuesto:</strong> ${section.teamRecomposition.pieces.map((piece) => `${escapeHtml(piece.role)}: ${escapeHtml(piece.champion)}${piece.action === "replace" ? ` (antes ${escapeHtml(piece.from)})` : ""}`).join(" · ")}.</p>
                <p class="result-summary__action"><strong>Objetivo del cambio:</strong> ${escapeHtml(section.teamRecomposition.improvement)}${section.teamRecomposition.weaknessesCorrected.length ? ` · Limitación abordada: ${escapeHtml(section.teamRecomposition.weaknessesCorrected.join("; "))}` : ""}</p>
                <p>${escapeHtml(section.teamRecomposition.explanation)} ${escapeHtml(section.teamRecomposition.identity.status === "preserved" ? `Identidad conservada: ${section.teamRecomposition.identity.primary}.` : `Identidad propuesta sin confirmar: ${section.teamRecomposition.identity.proposed || "pendiente"}.`)}</p>` : section.compositionOptimization ? `<p class="result-summary__action"><strong>Composición propuesta:</strong> ${escapeHtml(section.compositionOptimization.change.role)}: ${escapeHtml(section.compositionOptimization.change.from)} → ${escapeHtml(section.compositionOptimization.change.to)}. Busca reforzar ${escapeHtml(section.compositionOptimization.improvement)}; aborda ${escapeHtml(section.compositionOptimization.limitationCorrected)}.</p>
                <p>${escapeHtml(section.compositionOptimization.identity.status === "preserved" ? `Identidad conservada: ${section.compositionOptimization.identity.primary}.` : `Identidad propuesta sin confirmar: ${section.compositionOptimization.identity.proposed || "pendiente"}.`)}</p>` : ""}
              ${section.improves ? `<p class="result-summary__action"><strong>Refuerza:</strong> ${escapeHtml(section.improves)}</p>` : ""}
              ${section.action ? `<p class="result-summary__action"><strong>Protección:</strong> ${escapeHtml(section.action)}</p>` : ""}
              ${section.riskGuidance ? `<p class="result-summary__action result-summary__risk-guidance" aria-label="Riesgo propio y contramedida">${section.riskGuidance.risk ? `<strong>Riesgo propio:</strong> ${escapeHtml(section.riskGuidance.risk)} ` : ""}${section.riskGuidance.response ? `<strong>Cómo cubrirlo:</strong> ${escapeHtml(section.riskGuidance.response)}` : ""}</p>` : ""}
              ${section.strategicBans?.length ? `<div class="result-summary__ban-integration" aria-label="Bans estratégicos">
                <p><strong>Bans prioritarios</strong></p>
                <ul>
                  ${section.strategicBans.map((ban) => `<li><strong>${escapeHtml(ban.champion)}</strong><small class="result-summary__ban-threat">${escapeHtml(ban.threat)}</small><small>${escapeHtml(ban.reason)}</small><small class="result-summary__ban-impact">${escapeHtml(ban.expectedImpact)}</small></li>`).join("")}
                </ul>
              </div>` : ""}
              ${Array.isArray(section.candidates) ? `<ol class="result-summary__recommendation-list" aria-label="Candidatos priorizados">
                ${section.candidates.map((candidate) => `
                  <li>
                    <strong>${escapeHtml(candidate.champion)}</strong>
                    ${ROLE_LABELS[candidate.role] ? `<small class="result-summary__candidate-role">Posición: ${escapeHtml(ROLE_LABELS[candidate.role])} · ${escapeHtml(({ habitual: "Habitual", situacional: "Situacional", experimental: "Experimental", "sin-verificar": "Rol sin verificar" })[window.LTARoleViability?.assess(candidate.champion, candidate.role)?.status] || "Rol sin verificar")} (26.21)</small>` : ""}
                    <small>${escapeHtml(candidate.reason)}</small>
                    ${candidate.justification ? `<details class="result-summary__candidate-justification">
                      <summary>Justificación estratégica de ${escapeHtml(candidate.champion)}</summary>
                      <small>${escapeHtml(candidate.justification.contribution)}</small>
                      ${candidate.justification.effect ? `<small class="result-summary__candidate-effect">${escapeHtml(candidate.justification.effect.text)}</small>` : ""}
                      ${candidate.justification.beneficiaries.length ? `<div class="result-summary__beneficiaries"><small><b>Compañeros beneficiados (equipo actual):</b></small><ul>${candidate.justification.beneficiaries.map((ally) => `<li>${escapeHtml(ally.text)}</li>`).join("")}</ul></div>` : ""}
                    </details>` : candidate.strengths.length ? `<small><b>Aporta:</b> ${escapeHtml(candidate.strengths.join(" · "))}</small>` : ""}
                    ${candidate.limitations.length ? `<small class="result-summary__limitation"><b>Límite:</b> ${escapeHtml(candidate.limitations.join(" · "))}</small>` : ""}
                  </li>
                `).join("")}
              </ol>` : ""}
            </article>
          `).join("")}
        </div>
        ${report.closing?.status === "presented" ? `<p class="result-summary__strategic-closing">${escapeHtml(report.closing.text)}</p>` : ""}
      </section>
    `;
  }

  function buildSummary() {
    const table = result.querySelector(".composition-table");
    if (!table) {
      clearSummary();
      return;
    }

    const rows = Array.from(table.querySelectorAll("tbody tr"));
    if (!rows.length) {
      clearSummary();
      return;
    }

    const items = rows.map((row) => {
      const role = row.dataset.role;
      const roleLabel = text(row.querySelector('[data-label="Rol"]'));
      const champion = text(row.querySelector('[data-label="Campeón"] .champion-name'));
      const identity = row.dataset.identity || text(row.querySelector('[data-label="Identidad"]'));
      const functionLabel = row.dataset.function || text(row.querySelector('[data-label="Función"]'));
      const tempo = row.dataset.tempo || text(row.querySelector('[data-label="Ritmo"]'));
      const strengths = row.dataset.strengths || text(row.querySelector('[data-label="Fortalezas"]'));
      const weaknesses = row.dataset.weaknesses || text(row.querySelector('[data-label="Debilidades"]'));
      const missing = row.classList.contains("is-missing");
      const unknown = row.classList.contains("is-unknown");
      return { role, roleLabel, champion, identity, functionLabel, tempo, strengths, weaknesses, missing, unknown };
    });

    const signature = items
      .map((item) => [item.role, item.champion, item.identity, item.functionLabel, item.tempo, item.strengths, item.weaknesses, item.missing, item.unknown].join("|"))
      .join(";");

    if (result.dataset.summarySignature === signature && result.querySelector(".result-summary")) return;
    result.dataset.summarySignature = signature;

    result.querySelector(".result-summary")?.remove();

    const completed = items.filter((item) => item.champion && item.champion !== "—" && !item.missing).length;
    const problems = items.filter((item) => item.missing || item.unknown || !item.champion || item.champion === "—").length;
    const ready = problems === 0;

    const missingRoles = items
      .filter((item) => !item.champion || item.champion === "—")
      .map((item) => item.roleLabel);
    const invalidChampions = items
      .filter((item) => item.champion && item.champion !== "—" && (item.missing || item.unknown))
      .map((item) => item.champion);

    const summary = document.createElement("section");
    summary.className = `result-summary${ready ? " is-ready" : " is-pending"}`;
    summary.innerHTML = `
      <div class="result-summary__header">
        <div>
          <p class="result-summary__eyebrow">${ready ? "Equipo completo" : "Composición incompleta"}</p>
          <h3>${ready ? "Composición lista" : "Completa tu equipo"}</h3>
          ${ready ? "" : `<p class="result-summary__subhead">${missingRoles.length
            ? `Faltan: ${missingRoles.map(escapeHtml).join(" · ")}.`
            : `Revisa: ${invalidChampions.map(escapeHtml).join(" · ")}.`}</p>`}
        </div>
        <div class="result-summary__stats">
          <span class="result-summary__stat${ready ? " is-good" : " is-warning"}">
            <strong>${completed}/5</strong>
            <small>Roles elegidos</small>
          </span>
        </div>
      </div>

      ${ready ? renderStrategicReport(items) : ""}
    `;

    const tableSection = table.closest(".table-wrap") || table.parentElement;
    if (ready) {
      tableSection?.after(summary);
    } else {
      tableSection?.before(summary);
    }
  }

  function scheduleBuild() {
    if (refreshQueued) return;
    refreshQueued = true;
    window.requestAnimationFrame(() => {
      refreshQueued = false;
      buildSummary();
    });
  }

  const observer = new MutationObserver(scheduleBuild);
  observer.observe(result, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  scheduleBuild();
})();
