# 칼럼 추가 가이드 (Claude Code 전용)

## 칼럼 추가 명령 형식

아래 형식으로 말하면 column.html에 카드를 추가하고 자동으로 git push합니다.

```
칼럼 추가해줘
제목: [글 제목]
카테고리: [절세 / 투자 / 연금 / 부동산 / 금융상품]
날짜: [YYYY.MM.DD]
링크: [네이버 블로그 URL]
한줄요약: [짧은 설명 1~2줄]
```

---

## 카테고리별 설정값

| 카테고리 | 이모지 | 배경색 |
|---|---|---|
| 절세 | 🏦 | `linear-gradient(135deg,#0e1a2b,#1a3a5c)` |
| 투자 | 📈 | `linear-gradient(135deg,#1a0e0e,#2e1515)` |
| 연금 | 🌿 | `linear-gradient(135deg,#1a1a0e,#2a2a0a)` |
| 부동산 | 🏠 | `linear-gradient(135deg,#0e1a14,#142a1e)` |
| 금융상품 | 💳 | `linear-gradient(135deg,#1a0e1a,#2a1530)` |
| 기타 | 💡 | `linear-gradient(135deg,#0e1520,#0d2040)` |

---

## 카드 HTML 템플릿

새 카드를 추가할 때 아래 구조를 `</div> <!-- /columns-grid -->` 바로 위에 삽입합니다.

```html
    <!-- 칼럼 N -->
    <a class="col-card" href="[링크]" target="_blank" data-tags="[카테고리]">
      <div class="col-thumb" style="background: [배경색];">
        <div class="col-thumb-emoji">[이모지]</div>
        <div class="col-thumb-label">[카테고리]</div>
      </div>
      <div class="col-info">
        <div class="col-tag">[카테고리]</div>
        <div class="col-title">[제목]</div>
        <div class="col-excerpt">[한줄요약]</div>
        <div class="col-meta">
          <div class="col-meta-left">[YYYY.MM]</div>
          <div class="col-naver-badge">N 블로그</div>
        </div>
      </div>
    </a>
```

---

## 삽입 위치

`column.html`에서 아래 주석을 찾아 **바로 위**에 새 카드를 추가합니다.

```html
  </div><!-- /columns-grid -->
```

---

## 전체 작업 순서 (Claude Code가 실행)

1. `column.html` 열기
2. 마지막 칼럼 카드 다음에 새 카드 삽입
3. `git add column.html`
4. `git commit -m "칼럼 추가: [제목]"`
5. `git push`
