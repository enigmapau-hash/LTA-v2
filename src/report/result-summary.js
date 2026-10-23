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

  function renderHeadline(section) {
    const rawAnswer = String(section.answer || "");
    const answer = section.id === "diagnosis"
      ? rawAnswer.replace(/^Lectura provisional:\s*Plan principal:/, "Plan probable:")
        .replace(/^Lectura provisional:\s*/, "")
      : rawAnswer;
    if (section.id === "diagnosis" && answer.includes(" · Cómo ganar: ")) {
      const [plan, condition] = answer.split(" · Cómo ganar: ");
      return `<div class="result-summary__plan"><p class="result-summary__answer">${escapeHtml(plan)}</p><p class="result-summary__win-condition"><strong>Cómo ganar:</strong> ${escapeHtml(condition)}</p></div>`;
    }
    if (section.id === "correction" && answer.includes(" · Perfil: ")) {
      const [need, profile] = answer.split(" · Perfil: ");
      const opportunity = need.startsWith("Oportunidad: ");
      const focus = need.replace(/^(Oportunidad|Necesidad):\s*/, "");
      const distinctProfile = focus.toLocaleLowerCase("es") !== profile.toLocaleLowerCase("es");
      const label = opportunity ? "Oportunidad de mejora" : "Necesidad prioritaria";
      return `<div class="result-summary__recommendation-heading"><p class="result-summary__answer">${escapeHtml(label)}: ${escapeHtml(focus)}</p>${distinctProfile ? `<p class="result-summary__profile"><strong>Perfil sugerido:</strong> ${escapeHtml(profile)}</p>` : ""}</div>`;
    }
    return `<p class="result-summary__answer">${escapeHtml(answer)}</p>`;
  }

  // Compact only known presentation templates. Unrecognised descriptions are left intact.
  function briefSectionExplanation(section) {
    const explanation = String(section.explanation || "").trim();
    if (section.id === "correction" && Array.isArray(section.candidates)) {
      const known = explanation.match(/^Es (?:la respuesta más directa|una alternativa compatible) a «[^»]+»(?: para el plan [^:]+)?:\s*(.+)$/);
      if (known) return known[1].charAt(0).toLocaleUpperCase("es") + known[1].slice(1);
    }
    if (section.id === "protection" && explanation.startsWith("Es la amenaza prioritaria porque ")) {
      return "Por qué importa: " + explanation.slice("Es la amenaza prioritaria porque ".length);
    }
    return explanation;
  }

  function cleanSentence(value) {
    return String(value || "").replace(/\ba el\b/gi, "al");
  }

  const SIGNAL_NAMES = Object.freeze({
    frontline: "primera línea", tanque: "tanque", engage: "iniciación",
    peel: "protección", "follow-up": "seguimiento", dps: "daño sostenido",
    poke: "hostigamiento", pick: "cazadas", "side lane": "presión lateral",
  });

  function displaySignal(value) {
    const original = String(value || "").trim();
    return SIGNAL_NAMES[original.toLocaleLowerCase("es")] || original;
  }

  function renderCandidate(candidate, index) {
    const viability = window.LTARoleViability?.assess(candidate.champion, candidate.role);
    const roleStatus = ({ principal: "Principal · criterio editorial", compatible: "Compatible (cliente Riot)", habitual: "Habitual documentado", situacional: "Situacional", secundaria: "Secundaria", experimental: "Experimental", "sin-verificar": "Sin verificar · provisional" })[viability?.status] || "Sin verificar · provisional";
    const role = ROLE_LABELS[candidate.role]
      ? `<small class="result-summary__candidate-role">Posición: ${escapeHtml(ROLE_LABELS[candidate.role])} · ${escapeHtml(roleStatus)} · ${escapeHtml(viability?.sourcePatch ? "parche " + viability.sourcePatch : "revisión " + (viability?.checkedAt || "pendiente"))}${candidate.otherPrincipalRoles?.length ? " · También principal: " + escapeHtml(candidate.otherPrincipalRoles.map(role=>ROLE_LABELS[role]||role).join(", ")) : ""}</small>` : "";
    const signals = (candidate.justification?.evidence || []).slice(0, 2).map(displaySignal);
    const usefulReason = signals.length
      ? `Señales registradas: ${signals.join(" y ")}.`
      : cleanSentence(candidate.reason);
    const beneficiaries = candidate.justification?.beneficiaries || [];
    const evidence = beneficiaries.length
      ? `<details class="result-summary__candidate-justification"><summary>Cómo encaja con el equipo</summary><small>${escapeHtml(candidate.justification.beneficiarySummary || beneficiaries.map((ally) => ally.text).join(" "))}</small></details>`
      : "";
    const limitation = candidate.limitations?.length
      ? `<small class="result-summary__limitation"><b>Límite:</b> ${escapeHtml(candidate.limitations.join(" · "))}</small>` : "";
    const body = `<small class="result-summary__candidate-reason">${escapeHtml(usefulReason)}</small>${evidence}${limitation}`;
    const title = `<strong>${escapeHtml(candidate.champion)}</strong>`;
    if (index === 0) return `<li class="result-summary__candidate-primary"><div class="result-summary__candidate-head">${title}<span class="result-summary__priority-label">${["principal","compatible","habitual"].includes(candidate.viabilityStatus) ? "Primera alternativa" : "Alternativa provisional · rol sin verificar"}</span></div>${role}${body}</li>`;
    return `<li class="result-summary__candidate-secondary"><details class="result-summary__candidate-more"><summary><span class="result-summary__candidate-name">${title}${role}</span><span class="result-summary__disclosure-label">Ver motivos</span></summary><div class="result-summary__candidate-more-body">${body}</div></details></li>`;
  }

  // A multi-pick recomposition is a DIFFERENT calculation from the individual
  // candidates. Never present it as if it belonged to the ranked list.
  function renderIndependentProposal(section) {
    const recomposition = section.teamRecomposition;
    if (recomposition) {
      const changes = (recomposition.pieces || []).filter((piece) => piece.action === "replace");
      if (!changes.length) return "";
      const replacements = changes.map((piece) =>
        `${escapeHtml(ROLE_LABELS[piece.role] || piece.role)}: ${escapeHtml(piece.from)} → ${escapeHtml(piece.champion)}`).join(" · ");
      const identity = recomposition.identity?.status === "preserved"
        ? `El nuevo diagnóstico mantiene ${escapeHtml(recomposition.identity.primary)}.`
        : "No se ha confirmado el plan del equipo resultante.";
      return `<details class="result-summary__advanced-change"><summary>Otra propuesta: cambiar ${changes.length} campeones</summary>
        <p>Es una recomposición independiente de las alternativas individuales.</p>
        <p>${replacements}</p><p>${identity}</p></details>`;
    }
    const single = section.compositionOptimization;
    if (!single?.change) return "";
    const identity = single.identity?.status === "preserved"
      ? `El nuevo diagnóstico mantiene ${escapeHtml(single.identity.primary)}.`
      : "No se ha confirmado el plan del equipo resultante.";
    return `<details class="result-summary__advanced-change"><summary>Otra propuesta: sustitución individual</summary>
      <p>Se evalúa por separado de la lista de candidatos.</p>
      <p>${escapeHtml(ROLE_LABELS[single.change.role] || single.change.role)}: ${escapeHtml(single.change.from)} → ${escapeHtml(single.change.to)}</p>
      <p>${identity}</p></details>`;
  }

  function renderBan(ban) {
    return `<li><details class="result-summary__ban-detail"><summary><span class="result-summary__ban-name"><strong>${escapeHtml(ban.champion)}</strong><small class="result-summary__ban-threat">${escapeHtml(ban.threat)}</small></span><span class="result-summary__disclosure-label">Ver análisis</span></summary><div class="result-summary__ban-detail-body"><small>${escapeHtml(ban.reason)}</small><small class="result-summary__ban-impact">${escapeHtml(ban.expectedImpact)}</small></div></details></li>`;
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
      currentPicks: picks,
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
              ${renderHeadline(section)}
              ${section.id === "correction" ? `<details class="result-summary__context"><summary>Por qué se recomienda</summary><p>${escapeHtml(briefSectionExplanation(section))}</p></details>` : `<p class="result-summary__section-context">${escapeHtml(briefSectionExplanation(section))}</p>`}
              ${section.optionalLimitation ? `<p class="result-summary__detected-need">Oportunidad opcional: ${escapeHtml(section.optionalLimitation)}</p>` : ""}
              ${section.id === "correction" ? renderIndependentProposal(section) : ""}
              ${section.action ? `<p class="result-summary__action"><strong>Protección:</strong> ${escapeHtml(section.action)}</p>` : ""}
              ${section.riskGuidance ? `<div class="result-summary__risk-guidance" aria-label="Riesgo propio y contramedida">${section.riskGuidance.risk ? `<p><strong>Riesgo propio:</strong> ${escapeHtml(section.riskGuidance.risk)}</p>` : ""}${section.riskGuidance.response ? `<p><strong>Cómo cubrirlo:</strong> ${escapeHtml(section.riskGuidance.response)}</p>` : ""}</div>` : ""}
              ${section.strategicBans?.length ? `<div class="result-summary__ban-integration" aria-label="Bans estratégicos">
                <p><strong>Bans prioritarios</strong></p>
                <ul>
                  ${section.strategicBans.map(renderBan).join("")}
                </ul>
              </div>` : ""}
              ${Array.isArray(section.candidates) ? `<ol class="result-summary__recommendation-list" aria-label="Candidatos priorizados">
                ${section.candidates.map(renderCandidate).join("")}
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
