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
