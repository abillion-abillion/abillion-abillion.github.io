# diagnosis.html 허수 방지 패치 (C방식)

## 수정 1: CSS 추가 (기존 .btn-start:hover 스타일 바로 아래에 추가)

```css
/* ── 허수 방지 에러 스타일 ── */
.form-input.input-error,
.form-select.input-error {
  border-color: #e05a5a !important;
  background: rgba(224,90,90,0.06) !important;
}
.field-error-msg {
  font-size: 0.68rem;
  color: #e05a5a;
  margin-top: 0.3rem;
  min-height: 1em;
  display: block;
}
.field-ok-msg {
  font-size: 0.68rem;
  color: #4caf7d;
  margin-top: 0.3rem;
  min-height: 1em;
  display: block;
}
.fake-warn-box {
  background: rgba(224,90,90,0.08);
  border: 1px solid rgba(224,90,90,0.3);
  border-radius: 8px;
  padding: 0.7rem 1rem;
  font-size: 0.75rem;
  color: #e8b0b0;
  line-height: 1.6;
  margin-bottom: 1.2rem;
  display: none;
}
.fake-warn-box.visible { display: block; }
```

---

## 수정 2: HTML — 기본정보 입력 폼 전체 교체

기존:
```html
    <div class="info-grid">
      <div class="info-field">
        <label>이름</label>
        <input class="form-input" type="text" id="infoName" placeholder="이름을 입력해주세요" />
      </div>
      <div class="info-field">
        <label>연락처</label>
        <input class="form-input" type="tel" id="infoPhone" placeholder="010-xxxx-xxxx" />
      </div>
```

교체:
```html
    <!-- 심리적 유인 문구 -->
    <div style="background:rgba(201,169,110,0.07);border:1px solid rgba(201,169,110,0.2);border-radius:10px;padding:0.85rem 1.1rem;margin-bottom:1.4rem;font-size:0.76rem;color:#c9a96e;line-height:1.7;">
      ✦ 입력하신 번호로 <strong>맞춤 보고서 해설과 추가 절세 자료</strong>를 보내드립니다<br/>
      ✦ 상담 신청 없이 자료만 받아보셔도 됩니다 · 부담 없이 입력해주세요
    </div>

    <div id="fakeWarnBox" class="fake-warn-box">
      ⚠ 정확한 이름과 연락처를 입력해야 <strong>맞춤 보고서</strong>가 생성됩니다.<br/>
      허수 정보로는 개인화된 분석 결과를 받아보실 수 없습니다.
    </div>

    <div class="info-grid">
      <div class="info-field">
        <label>이름</label>
        <input class="form-input" type="text" id="infoName" placeholder="실명을 입력해주세요" oninput="validateName(this)" />
        <span id="nameMsg" class="field-error-msg"></span>
      </div>
      <div class="info-field">
        <label>연락처</label>
        <input class="form-input" type="tel" id="infoPhone" placeholder="010-xxxx-xxxx" oninput="validatePhone(this)" />
        <span id="phoneMsg" class="field-error-msg"></span>
      </div>
```

---

## 수정 3: JS — startQuiz() 함수 교체 + 검증 함수 추가

### 3-1. startQuiz() 함수 내부 교체

기존:
```js
  if (!name) { alert('이름을 입력해주세요.'); return; }
  if (!phone) { alert('연락처를 입력해주세요.'); return; }
  if (!gender) { alert('성별을 선택해주세요.'); return; }
  if (!age) { alert('연령대를 선택해주세요.'); return; }
  if (!job) { alert('직업 유형을 선택해주세요.'); return; }
```

교체:
```js
  if (!name) { showFieldError('infoName', 'nameMsg', '이름을 입력해주세요.'); return; }
  if (isFakeName(name)) { showFieldError('infoName', 'nameMsg', '정확한 실명을 입력해주세요.'); showFakeWarn(); return; }
  if (!phone) { showFieldError('infoPhone', 'phoneMsg', '연락처를 입력해주세요.'); return; }
  if (isFakePhone(phone)) { showFieldError('infoPhone', 'phoneMsg', '유효한 휴대폰 번호를 입력해주세요.'); showFakeWarn(); return; }
  if (!gender) { alert('성별을 선택해주세요.'); return; }
  if (!age) { alert('연령대를 선택해주세요.'); return; }
  if (!job) { alert('직업 유형을 선택해주세요.'); return; }
```

### 3-2. startQuiz() 함수 바로 위에 아래 함수들 추가

```js
// ─── 허수 방지 ────────────────────────────────────────────────
function isFakeName(name) {
  const n = name.trim().toLowerCase();
  // 1글자 이하
  if (n.length < 2) return true;
  // 흔한 테스트 이름
  const fakes = ['홍길동','테스트','test','ㅎㄱㄷ','ㄱㄴㄷ','ㅁㄴㅇ','aaa','abc','111','123','이름','name','user'];
  if (fakes.some(f => n.includes(f))) return true;
  // 같은 글자 반복 (ㅋㅋㅋ, aaa 등)
  if (/^(.)\1+$/.test(n)) return true;
  // 숫자로만 구성
  if (/^\d+$/.test(n)) return true;
  return false;
}

function isFakePhone(phone) {
  const cleaned = phone.replace(/[^0-9]/g, '');
  // 형식 체크: 01X로 시작하는 10~11자리
  if (!/^01[016789]\d{7,8}$/.test(cleaned)) return true;
  // 반복 숫자 (01011111111, 01000000000 등)
  if (/^01[016789](\d)\1{6,}$/.test(cleaned)) return true;
  // 순차 숫자 (01012345678)
  if (cleaned === '01012345678' || cleaned === '01098765432') return true;
  // 000/999 패턴
  if (/^010(0000|9999)\d{4}$/.test(cleaned)) return true;
  return false;
}

function showFieldError(inputId, msgId, msg) {
  const el = document.getElementById(inputId);
  const msgEl = document.getElementById(msgId);
  if (el) { el.classList.add('input-error'); el.classList.remove('input-ok'); }
  if (msgEl) { msgEl.textContent = msg; msgEl.className = 'field-error-msg'; }
}

function showFieldOk(inputId, msgId, msg) {
  const el = document.getElementById(inputId);
  const msgEl = document.getElementById(msgId);
  if (el) { el.classList.remove('input-error'); }
  if (msgEl) { msgEl.textContent = msg; msgEl.className = 'field-ok-msg'; }
}

function clearFieldState(inputId, msgId) {
  const el = document.getElementById(inputId);
  const msgEl = document.getElementById(msgId);
  if (el) { el.classList.remove('input-error'); }
  if (msgEl) { msgEl.textContent = ''; }
}

function showFakeWarn() {
  const box = document.getElementById('fakeWarnBox');
  if (box) box.classList.add('visible');
}

function validateName(el) {
  const val = el.value.trim();
  if (!val) { clearFieldState('infoName', 'nameMsg'); return; }
  if (isFakeName(val)) {
    showFieldError('infoName', 'nameMsg', '정확한 실명을 입력해주세요 (맞춤 보고서 발송용)');
    showFakeWarn();
  } else {
    showFieldOk('infoName', 'nameMsg', '✓ 확인되었습니다');
    document.getElementById('fakeWarnBox').classList.remove('visible');
  }
}

function validatePhone(el) {
  const val = el.value.trim();
  if (!val) { clearFieldState('infoPhone', 'phoneMsg'); return; }
  if (isFakePhone(val)) {
    showFieldError('infoPhone', 'phoneMsg', '정확한 휴대폰 번호를 입력해주세요 (보고서 발송용)');
    showFakeWarn();
  } else {
    showFieldOk('infoPhone', 'phoneMsg', '✓ 확인되었습니다');
  }
}
// ─────────────────────────────────────────────────────────────
```
