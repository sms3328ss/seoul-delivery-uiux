// 5주차: 이메일 형식 확인과 안내 상태
const emailInput = document.querySelector('#email');
const emailCheck = document.querySelector('#email-check');
const emailReset = document.querySelector('#email-reset');
const emailStatus = document.querySelector('#email-status');

function setEmailStatus(message, state) {
  emailStatus.textContent = message;
  emailStatus.className = 'hint ' + state;
}

function checkEmail() {
  const value = emailInput.value.trim();
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  emailCheck.disabled = false;
  emailCheck.textContent = '이메일 형식 확인';
  if (value === '') {
    setEmailStatus('이메일을 입력해 주세요. 예: student@example.com', 'error');
    emailInput.setAttribute('aria-invalid', 'true');
    emailInput.focus();
    return false;
  }
  if (!pattern.test(value)) {
    setEmailStatus('이메일 형식을 확인해 주세요. 예: student@example.com', 'error');
    emailInput.setAttribute('aria-invalid', 'true');
    emailInput.focus();
    return false;
  }
  emailInput.value = value;
  emailInput.setAttribute('aria-invalid', 'false');
  setEmailStatus('이메일 형식을 확인했습니다. 실제 이메일은 발송하지 않습니다.', 'success');
  emailCheck.textContent = '확인 완료';
  emailCheck.disabled = true;
  return true;
}

function resetEmail(shouldFocus) {
  emailInput.value = '';
  emailInput.removeAttribute('aria-invalid');
  emailCheck.disabled = false;
  emailCheck.textContent = '이메일 형식 확인';
  setEmailStatus('실제 발송 없이 이메일 형식만 확인합니다.', 'neutral');
  if (shouldFocus) emailInput.focus();
}

emailCheck.addEventListener('click', checkEmail);
emailReset.addEventListener('click', function() { resetEmail(true); });
emailInput.addEventListener('input', function() {
  emailCheck.disabled = false;
  emailCheck.textContent = '이메일 형식 확인';
  emailInput.removeAttribute('aria-invalid');
  setEmailStatus('입력한 이메일을 다시 확인해 주세요.', 'neutral');
});
emailInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    checkEmail();
  }
});

// 6주차: click, input, change 이벤트와 탭 3개
const tabButtons = [...document.querySelectorAll('[role="tab"]')];
function selectTab(selected) {
  tabButtons.forEach(function(button) {
    const active = button === selected;
    button.setAttribute('aria-selected', String(active));
    button.classList.toggle('active', active);
    button.tabIndex = active ? 0 : -1;
    document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
  });
}
tabButtons.forEach(function(button, index) {
  button.addEventListener('click', function() { selectTab(button); });
  button.addEventListener('keydown', function(event) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabButtons.length;
    else if (event.key === 'ArrowLeft') next = (index + tabButtons.length - 1) % tabButtons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabButtons.length - 1;
    else return;
    event.preventDefault();
    selectTab(tabButtons[next]);
    tabButtons[next].focus();
  });
});

const deliveryType = document.querySelector('#delivery-type');
const typeHint = document.querySelector('#type-hint');
function updateTypeHint() {
  if (deliveryType.value === 'document') {
    typeHint.textContent = '서류는 봉투에 넣고 젖지 않도록 포장하는 상황으로 연습합니다.';
    typeHint.className = 'hint document';
  } else if (deliveryType.value === 'parcel') {
    typeHint.textContent = '소형 물품은 상자에 넣고 빈 공간을 채워 포장하는 상황으로 연습합니다.';
    typeHint.className = 'hint parcel';
  } else {
    typeHint.textContent = '종류를 고르면 준비 안내가 표시됩니다.';
    typeHint.className = 'hint neutral';
  }
}
deliveryType.addEventListener('change', updateTypeHint);

const memoInput = document.querySelector('#memo');
const memoCount = document.querySelector('#memo-count');
function updateMemoCount() {
  const count = memoInput.value.length;
  memoCount.textContent = count + ' / 100자';
  memoCount.classList.toggle('near-limit', count >= 90);
}
memoInput.addEventListener('input', updateMemoCount);

// 7주차: 시작 → 입력·선택 → 확인 → 완료
const deliveryForm = document.querySelector('#delivery-form');
const pickup = document.querySelector('#pickup');
const destination = document.querySelector('#destination');
const formError = document.querySelector('#form-error');
const finishButton = document.querySelector('#finish-button');
const stepIds = ['start-step', 'input-step', 'review-step', 'complete-step'];
const headingIds = ['start-title', 'input-title', 'review-title', 'complete-title'];
const progressItems = document.querySelectorAll('#progress li');
const typeLabels = { document: '서류', parcel: '소형 물품' };
let currentStep = 0;

function showStep(nextStep) {
  stepIds.forEach(function(id, index) {
    document.getElementById(id).hidden = index !== nextStep;
    if (index === nextStep) progressItems[index].setAttribute('aria-current', 'step');
    else progressItems[index].removeAttribute('aria-current');
  });
  currentStep = nextStep;
  document.getElementById(headingIds[nextStep]).focus();
}
function showFormError(message, field) {
  formError.textContent = message;
  formError.hidden = false;
  field.focus();
}

document.querySelector('#start-button').addEventListener('click', function() { showStep(1); });
document.querySelector('#back-start').addEventListener('click', function() { showStep(0); });
document.querySelector('#back-input').addEventListener('click', function() { showStep(1); });

deliveryForm.addEventListener('submit', function(event) {
  event.preventDefault();
  formError.hidden = true;
  if (!typeLabels[deliveryType.value]) {
    showFormError('배송 종류를 선택해 주세요.', deliveryType);
    return;
  }
  if (pickup.value === '') {
    showFormError('출발 지역을 선택해 주세요.', pickup);
    return;
  }
  if (destination.value === '') {
    showFormError('도착 지역을 선택해 주세요.', destination);
    return;
  }
  if (!checkEmail()) {
    showFormError('이메일 안내를 확인하고 예시 주소로 수정해 주세요.', emailInput);
    return;
  }
  document.querySelector('#review-type').textContent = typeLabels[deliveryType.value];
  document.querySelector('#review-route').textContent = pickup.value + ' → ' + destination.value;
  document.querySelector('#review-email').textContent = emailInput.value.trim();
  document.querySelector('#review-memo').textContent = memoInput.value.trim() || '요청 사항 없음';
  showStep(2);
});

finishButton.addEventListener('click', function() {
  if (currentStep !== 2) return;
  finishButton.disabled = true;
  document.querySelector('#complete-summary').textContent = typeLabels[deliveryType.value] + ' · ' + pickup.value + ' → ' + destination.value + ' · ' + emailInput.value.trim() + ' 내용을 확인하고 연습을 마쳤습니다.';
  showStep(3);
});

document.querySelector('#restart-button').addEventListener('click', function() {
  deliveryForm.reset();
  resetEmail(false);
  updateTypeHint();
  updateMemoCount();
  formError.textContent = '';
  formError.hidden = true;
  ['review-type', 'review-route', 'review-email', 'review-memo', 'complete-summary'].forEach(function(id) {
    document.getElementById(id).textContent = '';
  });
  finishButton.disabled = false;
  showStep(0);
});
