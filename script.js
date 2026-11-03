'use strict';
// 5~7주차 기능을 보존하고 9주차 폼, 10주차 메뉴·내역을 연결합니다.
const $ = (selector) => document.querySelector(selector);
const deliveryForm = $('#delivery-form');
const emailInput = $('#email');
const emailCheck = $('#email-check');
const emailStatus = $('#email-status');
const deliveryType = $('#delivery-type');
const pickup = $('#pickup');
const destination = $('#destination');
const titleInput = $('#delivery-title');
const memoInput = $('#memo');
const specialCare = $('#special-care');
const careNote = $('#care-note');
const formError = $('#form-error');
const finishButton = $('#finish-button');
const saveStatus = $('#save-status');
const failureDemo = $('#simulate-failure');
const typeLabels = { document: '서류', parcel: '소형 물품' };
const regions = ['마포구', '성동구', '강남구'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let currentStep = 0;
let saving = false;
let errorField = null;

function setEmailStatus(message, state) {
  emailStatus.textContent = message;
  emailStatus.className = 'hint ' + state;
}
function checkEmail() {
  const value = emailInput.value.trim();
  const valid = emailPattern.test(value) && value.length <= 100;
  emailInput.setAttribute('aria-invalid', String(!valid));
  emailCheck.disabled = valid;
  emailCheck.textContent = valid ? '확인 완료' : '이메일 형식 확인';
  setEmailStatus(valid ? '조건 충족: 이메일 형식입니다. 실제 발송하지 않습니다.' : '오류: 예시 이메일 형식을 확인해 주세요. 예: student@example.com', valid ? 'success' : 'error');
  if (valid) emailInput.value = value;
  else emailInput.focus();
  return valid;
}
function clearFieldError(field) {
  field.removeAttribute('aria-invalid');
  if (field === errorField) {
    formError.hidden = true;
    formError.textContent = '';
    errorField = null;
  }
}
function resetEmail(shouldFocus) {
  emailInput.value = '';
  clearFieldError(emailInput);
  emailCheck.disabled = false;
  emailCheck.textContent = '이메일 형식 확인';
  setEmailStatus('실제 발송 없이 이메일 형식만 확인합니다.', 'neutral');
  if (shouldFocus) emailInput.focus();
}
emailCheck.addEventListener('click', checkEmail);
$('#email-reset').addEventListener('click', () => resetEmail(true));
emailInput.addEventListener('input', () => {
  clearFieldError(emailInput);
  emailCheck.disabled = false;
  emailCheck.textContent = '이메일 형식 확인';
  const valid = emailPattern.test(emailInput.value.trim());
  setEmailStatus(valid ? '조건 충족: 이메일 형식입니다. 확인 버튼으로 다시 검사할 수 있습니다.' : '수정 중: student@example.com 형태의 예시 주소를 입력해 주세요.', valid ? 'success' : 'neutral');
});
emailInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); checkEmail(); }
});

// 기존 탭: 좌우 화살표, Home, End 키 지원
const tabButtons = [...document.querySelectorAll('[role="tab"]')];
function selectTab(selected) {
  tabButtons.forEach((button) => {
    const active = button === selected;
    button.setAttribute('aria-selected', String(active));
    button.classList.toggle('active', active);
    button.tabIndex = active ? 0 : -1;
    document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
  });
}
tabButtons.forEach((button, index) => {
  button.addEventListener('click', () => selectTab(button));
  button.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabButtons.length;
    else if (event.key === 'ArrowLeft') next = (index + tabButtons.length - 1) % tabButtons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabButtons.length - 1;
    else return;
    event.preventDefault(); selectTab(tabButtons[next]); tabButtons[next].focus();
  });
});
function updateTypeHint() {
  const messages = {
    document: '조건 충족: 서류를 선택했습니다. 봉투에 넣고 젖지 않도록 포장합니다.',
    parcel: '조건 충족: 소형 물품을 선택했습니다. 상자 속 빈 공간을 채워 포장합니다.'
  };
  $('#type-hint').textContent = messages[deliveryType.value] || '종류를 고르면 준비 안내가 표시됩니다.';
  $('#type-hint').className = 'hint ' + (typeLabels[deliveryType.value] ? deliveryType.value : 'neutral');
}
function updateCounts() {
  [[titleInput, '#title-status', 40], [careNote, '#care-status', 80]].forEach(([field, id, max]) => {
    const count = field.value.trim().length;
    $(id).textContent = count + ' / ' + max + '자 · ' + (count >= 5 && count <= max ? '조건 충족' : '최소 5자 필요');
  });
  const count = memoInput.value.length;
  $('#memo-count').textContent = count + ' / 100자' + (count >= 90 ? ' · 최대 글자 수에 가깝습니다.' : ' · 선택 입력');
  $('#memo-count').classList.toggle('near-limit', count >= 90);
}
function syncCare() {
  $('#care-fields').hidden = !specialCare.checked;
  careNote.disabled = !specialCare.checked;
  careNote.required = specialCare.checked;
  if (!specialCare.checked) clearFieldError(careNote);
}
deliveryType.addEventListener('change', updateTypeHint);
specialCare.addEventListener('change', syncCare);
deliveryForm.addEventListener('input', (event) => { clearFieldError(event.target); updateCounts(); });
deliveryForm.addEventListener('change', (event) => clearFieldError(event.target));

// 4단계 흐름: 검토 진입과 최종 확정 모두 form submit으로 처리
const stepIds = ['start-step', 'input-step', 'review-step', 'complete-step'];
const headingIds = ['start-title', 'input-title', 'review-title', 'complete-title'];
const progressItems = [...document.querySelectorAll('#progress li')];
function showStep(step) {
  stepIds.forEach((id, index) => {
    document.getElementById(id).hidden = index !== step;
    if (index === step) progressItems[index].setAttribute('aria-current', 'step');
    else progressItems[index].removeAttribute('aria-current');
  });
  currentStep = step;
  document.getElementById(headingIds[step]).focus();
}
function validateForm() {
  const checks = [
    [titleInput, titleInput.value.trim().length >= 5 && titleInput.value.trim().length <= 40, '연습 제목을 앞뒤 공백을 뺀 5~40자로 입력해 주세요.'],
    [deliveryType, Object.hasOwn(typeLabels, deliveryType.value), '배송 종류를 선택해 주세요.'],
    [pickup, regions.includes(pickup.value), '출발 지역을 선택해 주세요.'],
    [destination, regions.includes(destination.value), '도착 지역을 선택해 주세요.'],
    [emailInput, emailPattern.test(emailInput.value.trim()) && emailInput.value.trim().length <= 100, '예시 이메일 형식을 확인해 주세요. 예: student@example.com'],
    [careNote, !specialCare.checked || (careNote.value.trim().length >= 5 && careNote.value.trim().length <= 80), '특별 포장 방법을 앞뒤 공백을 뺀 5~80자로 입력해 주세요.'],
    [memoInput, memoInput.value.length <= 100, '요청 사항은 100자 이내로 입력해 주세요.']
  ];
  const invalid = checks.find((item) => !item[1]);
  if (invalid) {
    if (currentStep !== 1) showStep(1);
    errorField = invalid[0];
    errorField.setAttribute('aria-invalid', 'true');
    formError.textContent = '오류: ' + invalid[2];
    formError.hidden = false;
    errorField.focus();
    return false;
  }
  formError.hidden = true;
  errorField = null;
  return true;
}
function collectValues() {
  return { title: titleInput.value.trim(), type: deliveryType.value, pickup: pickup.value,
    destination: destination.value, email: emailInput.value.trim(), memo: memoInput.value.trim(),
    specialCare: specialCare.checked, careNote: specialCare.checked ? careNote.value.trim() : '' };
}
function fillReview(data) {
  $('#review-title-value').textContent = data.title;
  $('#review-type').textContent = typeLabels[data.type];
  $('#review-route').textContent = data.pickup + ' → ' + data.destination;
  $('#review-email').textContent = data.email;
  $('#review-memo').textContent = data.memo || '요청 사항 없음';
  $('#review-care').textContent = data.specialCare ? data.careNote : '추가 안 함';
}
$('#start-button').addEventListener('click', () => showStep(1));
$('#back-start').addEventListener('click', () => showStep(0));
$('#back-input').addEventListener('click', () => showStep(1));
function setSaveStatus(message, state) {
  saveStatus.textContent = message;
  saveStatus.className = 'hint ' + state;
}

// localStorage만 사용합니다. 데모 실패는 여기 savePractice의 simulateFailure 분기입니다.
const STORAGE_KEY = 'seoul-delivery-practice-v1';
let records = [];
let activeFilter = 'all';
function isRecord(row) {
  return row && typeof row === 'object' && typeof row.id === 'string' &&
    typeof row.title === 'string' && row.title.length >= 5 && row.title.length <= 40 &&
    Object.hasOwn(typeLabels, row.type) && regions.includes(row.pickup) && regions.includes(row.destination) &&
    typeof row.email === 'string' && row.email.length <= 100 && emailPattern.test(row.email) &&
    typeof row.memo === 'string' && row.memo.length <= 100 && typeof row.specialCare === 'boolean' &&
    typeof row.careNote === 'string' && row.careNote.length <= 80 && (!row.specialCare || row.careNote.length >= 5) &&
    typeof row.savedAt === 'string' && Number.isFinite(Date.parse(row.savedAt));
}
function readRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length > 50 || !parsed.every(isRecord)) throw new Error('INVALID_STORAGE');
  return parsed;
}
function loadRecords() {
  try {
    records = readRecords();
    $('#storage-status').hidden = true;
  } catch (error) {
    records = [];
    $('#storage-status').textContent = '저장 내역을 읽을 수 없습니다. 저장소 접근 제한 또는 데이터 형식 오류입니다. 기존 데이터는 덮어쓰지 않았습니다. 브라우저 설정을 확인하거나 전체 삭제로 이 앱의 내역을 초기화하세요.';
    $('#storage-status').hidden = false;
  }
  renderHistory();
}
async function savePractice(data, simulateFailure) {
  // 서버 요청이 아닌 약 0.8초 비동기 로컬 저장 연습입니다.
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (simulateFailure) throw new Error('DEMO_FAILURE');
  const latest = readRecords(); // 파싱 실패 시 기존 값을 덮어쓰지 않음
  if (latest.length >= 50) throw new Error('HISTORY_FULL');
  const now = new Date();
  const row = { ...data, id: now.getTime() + '-' + Math.random().toString(36).slice(2, 8), savedAt: now.toISOString() };
  const next = [row, ...latest];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  records = next;
  $('#storage-status').hidden = true;
  renderHistory();
  return row;
}
deliveryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (saving || ![1, 2].includes(currentStep)) return;
  if (!validateForm()) return;
  const data = collectValues();
  if (currentStep === 1) { fillReview(data); showStep(2); return; }
  saving = true;
  const simulateFailure = failureDemo.checked;
  const controls = [...deliveryForm.querySelectorAll('input, select, textarea, button')];
  const previousDisabled = controls.map((control) => control.disabled);
  controls.forEach((control) => { control.disabled = true; });
  deliveryForm.setAttribute('aria-busy', 'true');
  finishButton.textContent = '연습 내역 저장 중…';
  setSaveStatus('이 브라우저에 저장 중입니다. 잠시 기다려 주세요. 실제 접수는 하지 않습니다.', 'neutral');
  try {
    await savePractice(data, simulateFailure);
    $('#complete-summary').textContent = '저장 성공: ' + data.title + ' · ' + typeLabels[data.type] + ' · ' + data.pickup + ' → ' + data.destination + '. 배송 연습 내역에서 확인할 수 있습니다.';
    setSaveStatus('저장 성공: 이 브라우저의 연습 내역에 추가했습니다.', 'success');
    showStep(3);
  } catch (error) {
    let message = '로컬 저장에 실패했습니다. 브라우저 저장소 권한·용량·내역 형식을 확인한 뒤 다시 시도해 주세요.';
    if (error.message === 'DEMO_FAILURE') message = '수업용 실패 시뮬레이션입니다. 실제 서버 장애가 아닙니다. 체크를 해제하고 재시도해 주세요.';
    if (error.message === 'HISTORY_FULL') message = '연습 내역이 최대 50건입니다. 내역을 전체 삭제한 후 재시도해 주세요.';
    setSaveStatus('저장 실패: ' + message + ' 입력값은 그대로 유지됩니다.', 'error');
    saveStatus.focus();
  } finally {
    saving = false;
    controls.forEach((control, index) => { control.disabled = previousDisabled[index]; });
    deliveryForm.removeAttribute('aria-busy');
    finishButton.textContent = currentStep === 3 ? '저장 완료' : '확정하고 연습 내역 저장 (재시도 가능)';
  }
});
$('#restart-button').addEventListener('click', () => {
  if (saving) return;
  deliveryForm.reset();
  deliveryForm.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
  formError.textContent = ''; formError.hidden = true; errorField = null;
  resetEmail(false); syncCare(); updateCounts(); updateTypeHint();
  ['review-title-value', 'review-type', 'review-route', 'review-email', 'review-memo', 'review-care', 'complete-summary'].forEach((id) => { document.getElementById(id).textContent = ''; });
  setSaveStatus('최종 확정 시 이 브라우저의 연습 내역에 저장합니다.', 'neutral');
  finishButton.disabled = false; finishButton.textContent = '확정하고 연습 내역 저장';
  deliveryForm.removeAttribute('aria-busy');
  activeFilter = 'all'; renderHistory(); showStep(0);
});

// 10주차: DOM textContent로만 사용자 입력을 출력합니다.
const filterButtons = [...document.querySelectorAll('[data-filter]')];
function renderHistory() {
  filterButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter)));
  const visible = records.filter((row) => activeFilter === 'all' || (activeFilter === 'care' ? row.specialCare : row.type === activeFilter));
  const filterName = filterButtons.find((button) => button.dataset.filter === activeFilter).textContent;
  $('#result-count').textContent = filterName + ' 결과 ' + visible.length + '건 / 전체 ' + records.length + '건';
  $('#history-empty').hidden = visible.length > 0;
  $('#history-empty').textContent = !$('#storage-status').hidden ? '저장 내역을 확인할 수 없습니다. 위 안내를 확인해 주세요.' : records.length === 0 ? '아직 저장한 연습 내역이 없습니다. 배송 안내 연습에서 첫 내역을 만들어 보세요.' : '이 필터에 맞는 내역이 없습니다. 전체 또는 다른 필터를 선택하세요.';
  const list = $('#history-list');
  list.replaceChildren();
  visible.forEach((row) => {
    const item = document.createElement('li');
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = row.title + ' · ' + typeLabels[row.type] + ' · ' + row.pickup + ' → ' + row.destination;
    details.append(summary);
    const description = document.createElement('dl');
    [['저장 시각', new Date(row.savedAt).toLocaleString('ko-KR')], ['예시 이메일', row.email], ['요청 사항', row.memo || '없음'], ['특별 취급', row.specialCare ? row.careNote : '추가 안 함']].forEach(([label, value]) => {
      const term = document.createElement('dt'); term.textContent = label;
      const text = document.createElement('dd'); text.textContent = value;
      description.append(term, text);
    });
    details.append(description); item.append(details); list.append(item);
  });
}
filterButtons.forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.filter; renderHistory(); }));
$('#clear-history').addEventListener('click', () => {
  if (saving) return;
  if (!window.confirm('이 브라우저에 저장된 서울배송 연습 내역을 모두 삭제할까요? 복구할 수 없습니다.')) return;
  try {
    localStorage.removeItem(STORAGE_KEY); records = []; activeFilter = 'all';
    $('#storage-status').hidden = true; renderHistory();
  } catch (error) {
    $('#storage-status').textContent = '내역을 삭제하지 못했습니다. 브라우저 저장소 접근 설정을 확인해 주세요.';
    $('#storage-status').hidden = false;
  }
});
window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY || event.key === null) loadRecords(); });

// 해시가 메뉴 상태의 기준입니다. 기본·맨 위·본문 링크는 서비스 소개로 연결합니다.
const menuLinks = [...document.querySelectorAll('#main-nav a')];
const mobileQuery = window.matchMedia('(max-width: 768px)');
const menuToggle = $('#menu-toggle');
const mainNav = $('#main-nav');
let menuOpen = false;
function syncMenu() {
  menuToggle.hidden = !mobileQuery.matches;
  mainNav.hidden = mobileQuery.matches && !menuOpen;
  menuToggle.setAttribute('aria-expanded', String(mobileQuery.matches && menuOpen));
  menuToggle.textContent = mobileQuery.matches && menuOpen ? '메뉴 닫기' : '메뉴 열기';
}
function syncCurrentMenu() {
  const hash = menuLinks.some((link) => link.hash === location.hash) ? location.hash : '#service';
  menuLinks.forEach((link) => {
    if (link.hash === hash) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  menuOpen = false; syncMenu();
}
menuToggle.addEventListener('click', () => { menuOpen = !menuOpen; syncMenu(); });
menuLinks.forEach((link) => link.addEventListener('click', () => { menuOpen = false; syncMenu(); }));
mobileQuery.addEventListener('change', () => {
  const focusWasInside = mainNav.contains(document.activeElement);
  menuOpen = false; syncMenu();
  if (mobileQuery.matches && focusWasInside) menuToggle.focus();
});
window.addEventListener('hashchange', syncCurrentMenu);
window.addEventListener('popstate', syncCurrentMenu);
syncCare(); updateTypeHint(); updateCounts(); syncCurrentMenu(); loadRecords();
