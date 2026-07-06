/* gap_moe_survey_public/survey.js
 * Static survey controller + Google Apps Script submission helper.
 * Works on GitHub Pages / Netlify / any static hosting.
 */

// ── 状態管理 ──
const sections = ['sec-intro','sec-char','sec-impression','sec-compare','sec-attr','sec-done'];
const progLabels = ['はじめに','1/5 キャラクター確認','2–4/5 各画像評価','4/5 比較評価','5/5 属性入力','完了'];
const progPct   = [0, 15, 45, 70, 88, 100];
let currentSec = 0;
let timerInterval = null;
let timerDone = false;
const startedAt = new Date();

function goTo(idx) {
  document.getElementById(sections[currentSec]).classList.remove('active');
  currentSec = idx;
  document.getElementById(sections[currentSec]).classList.add('active');
  document.getElementById('prog-label').textContent = progLabels[idx];
  document.getElementById('prog-fill').style.width = progPct[idx] + '%';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (idx === 2) startTimer();
}

// ── タイマー ──
function startTimer() {
  timerDone = false;
  document.getElementById('impression-questions').style.display = 'none';
  document.getElementById('btn-next-impression').disabled = true;
  let count = 5;
  document.getElementById('timer-count').textContent = count;

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    count--;
    document.getElementById('timer-count').textContent = count;
    if (count <= 0) {
      clearInterval(timerInterval);
      showQuestions();
    }
  }, 1000);
}

function showQuestions() {
  timerDone = true;
  document.getElementById('impression-questions').style.display = 'block';
  document.getElementById('impression-questions').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => {
    document.getElementById('btn-next-impression').disabled = false;
  }, 500);
}

// ── UI選択 ──
document.querySelectorAll('.sd-buttons').forEach(group => {
  group.querySelectorAll('.sd-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.sd-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
});

document.querySelectorAll('.choice-item').forEach(item => {
  item.addEventListener('click', (e) => {
    const input = item.querySelector('input');
    if (!input) return;

    if (input.type === 'radio') {
      const name = input.name;
      document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
        r.closest('.choice-item').classList.remove('selected');
      });
      input.checked = true;
      item.classList.add('selected');
    } else {
      input.checked = !input.checked;
      item.classList.toggle('selected', input.checked);
    }
  });
});

function selectRank(btn, rankId) {
  const group = document.querySelector(`[data-rank="${rankId}"]`);
  group.querySelectorAll('.rank-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

// ── 回答取得ヘルパー ──
function getScaleValue(name) {
  const selected = document.querySelector(`.sd-buttons[data-name="${name}"] .sd-btn.selected`);
  return selected ? Number(selected.dataset.val) : null;
}

function getCheckboxValues(listId) {
  return Array.from(document.querySelectorAll(`#${listId} input[type="checkbox"]:checked`)).map(i => i.value);
}

function getRadioValue(name) {
  const selected = document.querySelector(`input[type="radio"][name="${name}"]:checked`);
  return selected ? selected.value : null;
}

function getRankValue(rankId) {
  const selected = document.querySelector(`[data-rank="${rankId}"] .rank-btn.selected`);
  return selected ? selected.dataset.val : null;
}

function getTextValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function generateParticipantId() {
  const key = 'gap_moe_participant_id';
  let id = localStorage.getItem(key);
  if (!id) {
    const random = Math.random().toString(36).slice(2, 10);
    id = `p_${Date.now()}_${random}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function collectSurveyData() {
  const completedAt = new Date();
  const elapsedMs = completedAt.getTime() - startedAt.getTime();
  const cfg = window.SURVEY_CONFIG || {};

  return {
    meta: {
      study_id: cfg.studyId || 'gap_moe_v1',
      character_id: cfg.characterId || 'unknown_character',
      condition_set: cfg.conditionSet || 'unknown_condition',
      participant_id: generateParticipantId(),
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      elapsed_ms: elapsedMs,
      user_agent: navigator.userAgent,
      page_url: location.href,
      timer_done: timerDone
    },
    responses: {
      // Block A: 変化の知覚
      a1_color: getScaleValue('a1_color'),
      a1_style: getScaleValue('a1_style'),
      a1_atm: getScaleValue('a1_atm'),
      a1_exposure: getScaleValue('a1_exposure'),
      a2_changed_elements: getCheckboxValues('a2-list'),

      // Block B: ギャップの方向性
      b1_gap_direction: getCheckboxValues('b1-list'),
      b2_direction_appropriateness: getScaleValue('b2'),

      // Block C: 核心
      c1_main_factor: getRadioValue('c1'),
      c2_feelings: getCheckboxValues('c2-list'),
      c3_reason: getTextValue('c3_reason'),

      // Block D: 同一人物性・変化量
      d1_identity_shift: getScaleValue('d1_id'),
      d2_identity_importance: getScaleValue('d2'),
      d3_amount_of_change: getScaleValue('d3'),

      // Block E: 萌え受容度
      e1_moe: getScaleValue('e1_moe'),
      e1_throb: getScaleValue('e1_throb'),
      e1_like: getScaleValue('e1_like'),
      e1_cute: getScaleValue('e1_cute'),
      e2_preference_change: getScaleValue('e2'),

      // Block F: 比較評価・順位付け
      f1_rank_1_amount: getRankValue('f1_1'),
      f1_rank_2_amount: getRankValue('f1_2'),
      f1_rank_3_amount: getRankValue('f1_3'),
      f2_rank_1_moe: getRankValue('f2_1'),
      f2_rank_2_moe: getRankValue('f2_2'),
      f2_rank_3_moe: getRankValue('f2_3'),
      f3_rank_reason: getTextValue('f3_reason'),

      // Block G: 属性
      g1_anime_frequency: getRadioValue('g1'),
      g2_empathy: getRadioValue('g2'),
      g3_age: getTextValue('g3_age'),
      g3_gender: getTextValue('g3_gender')
    }
  };
}

function validateSurveyData(data) {
  const r = data.responses;
  const missing = [];

  const requiredScales = [
    'a1_color','a1_style','a1_atm','a1_exposure','b2_direction_appropriateness',
    'c1_main_factor','d1_identity_shift','d2_identity_importance','d3_amount_of_change',
    'e1_moe','e1_throb','e1_like','e1_cute','e2_preference_change',
    'f1_rank_1_amount','f1_rank_2_amount','f1_rank_3_amount',
    'f2_rank_1_moe','f2_rank_2_moe','f2_rank_3_moe','g1_anime_frequency','g2_empathy'
  ];

  requiredScales.forEach(key => {
    if (r[key] === null || r[key] === undefined || r[key] === '') missing.push(key);
  });

  if (!r.a2_changed_elements.length) missing.push('a2_changed_elements');
  if (!r.b1_gap_direction.length) missing.push('b1_gap_direction');
  if (!r.c2_feelings.length) missing.push('c2_feelings');

  const f1 = [r.f1_rank_1_amount, r.f1_rank_2_amount, r.f1_rank_3_amount];
  const f2 = [r.f2_rank_1_moe, r.f2_rank_2_moe, r.f2_rank_3_moe];
  const hasDuplicate = arr => arr.some(v => v) && new Set(arr).size !== arr.length;
  if (hasDuplicate(f1)) missing.push('f1_rank_unique');
  if (hasDuplicate(f2)) missing.push('f2_rank_unique');

  return missing;
}

function setSubmitStatus(message, isError = false) {
  const wrap = document.getElementById('submit-status');
  const text = document.getElementById('submit-status-text');
  if (!wrap || !text) return;
  wrap.style.display = 'flex';
  wrap.style.borderColor = isError ? 'rgba(251,146,60,0.35)' : 'rgba(167,139,250,0.2)';
  text.textContent = message;
}

function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `gap_moe_response_${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function saveBackup(data) {
  const key = 'gap_moe_pending_responses';
  const old = JSON.parse(localStorage.getItem(key) || '[]');
  old.push(data);
  localStorage.setItem(key, JSON.stringify(old));
}

async function submitSurvey() {
  const submitBtn = document.getElementById('submit-btn');
  const data = collectSurveyData();
  const missing = validateSurveyData(data);

  if (missing.length) {
    setSubmitStatus(`未回答または順位重複があります: ${missing.join(', ')}。必要箇所を確認してください。`, true);
    return;
  }

  saveBackup(data);
  submitBtn.disabled = true;
  setSubmitStatus('回答を送信中です...');

  const endpoint = (window.SURVEY_CONFIG && window.SURVEY_CONFIG.endpointUrl || '').trim();

  if (!endpoint) {
    downloadJson(data);
    setSubmitStatus('送信先URLが未設定なので，回答JSONをローカル保存しました。Google Apps Script URLを設定すると自動収集できます。');
    setTimeout(() => goTo(5), 600);
    return;
  }

  try {
    // Apps ScriptのCORS/リダイレクト回避のため no-cors + text/plain を使う。
    // 成功レスポンスの中身は読めないが，送信自体は行われる。
    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    setSubmitStatus('回答を送信しました。ご協力ありがとうございました。');
    setTimeout(() => goTo(5), 600);
  } catch (err) {
    submitBtn.disabled = false;
    downloadJson(data);
    setSubmitStatus('送信に失敗しました。バックアップとして回答JSONを保存しました。ネットワークまたはApps Script URLを確認してください。', true);
    console.error(err);
  }
}

// 初期ロード
goTo(0);
