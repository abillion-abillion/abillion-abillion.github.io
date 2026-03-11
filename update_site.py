#!/usr/bin/env python3
"""
김재원 → 남진우 사이트 일괄 수정 스크립트
클로드 코드(Claude Code)에서 실행: python update_site.py

수정 항목:
1. 김재원 → 남진우 (모든 파일)
2. KIM → NAM (모든 파일)
3. 경력 항목 3개 삭제 (index.html)
4. 상담 신청 링크 → consult.html
5. 전화 문의 삭제
6. 글자색 가시성 개선
7. 리뷰 이름 실명화 (reviews.html)
8. Tips 채널명 수정 (tips.html)
9. consult.html 제목 수정
10. consult.html 1페이지로 통합
"""

import re
import os

FILES = ['index.html', 'services.html', 'reviews.html', 'tips.html', 'consult.html']

# ─────────────────────────────────────────────
# 1 & 2. 이름/영문 전역 치환
# ─────────────────────────────────────────────
NAME_REPLACEMENTS = [
    ('김재원', '남진우'),
    ('KIM', 'NAM'),
    ('남진우 · 자산관리 컨설턴트', '남진우 · 자산관리 컨설턴트'),  # 타이틀 유지
]

# ─────────────────────────────────────────────
# 7. 리뷰 이름 매핑 (카카오 이모티콘명 → 익명화)
# ─────────────────────────────────────────────
REVIEW_NAME_MAP = {
    '멋쩍은 튜브 고객':           '박**님',
    '일하기 싫은 네오 고객':      '이**님',
    '째려보는 어피치 고객':       '최**님',
    '피스메이커 프로도 고객':     '정**님',
    '부끄러워하는 라이언 고객':   '남**님 부부',
    '말썽쟁이 네오 고객':         '강**님',
    '엄지척 제이지 고객':         '윤**님',
    '택배 상자를 든 네오 고객':   '조**님',
    '쑥스럽게 인사하는 프로도 고객': '안**님',
    '머리 빗는 네오 고객':        '김**님',
    '눈물 흘리는 제이지 고객':    '오**님',
    '엄지척 튜브 고객':           '한**님',
    '멋쟁이 프로도 고객':         '신**님',
    '익명 고객':                  '류**님',
}


def apply_global_replacements(content: str) -> str:
    """1, 2번: 이름·영문 전역 치환"""
    content = content.replace('김재원', '남진우')
    content = content.replace('JW · KIM', 'JW · NAM')
    content = content.replace('JW · KIM', 'JW · NAM')  # 중복 안전
    # 타이틀 태그 내 KIM만 치환 (대소문자 구분)
    content = re.sub(r'\bKIM\b', 'NAM', content)
    return content


def fix_index(content: str) -> str:
    """3, 4, 5, 6번 적용 (index.html)"""

    # 3. 경력 항목 3개 삭제
    careers_to_remove = [
        # CFP
        r'<li class="career-item">\s*<span class="career-year">2022</span>.*?</li>',
        # 투자자산운용사
        r'<li class="career-item">\s*<span class="career-year">2021</span>.*?</li>',
        # 종합 자산관리 컨설팅 독립
        r'<li class="career-item">\s*<span class="career-year">2024</span>.*?</li>',
    ]
    for pattern in careers_to_remove:
        content = re.sub(pattern, '', content, flags=re.DOTALL)

    # 4. 상담 신청 링크 → consult.html
    content = content.replace(
        'href="https://open.kakao.com/o/example"',
        'href="consult.html"'
    )
    content = content.replace('href="#contact"', 'href="consult.html"')

    # 5. 전화 문의 버튼 삭제
    content = re.sub(
        r'<a\s+href="tel:[^"]*"[^>]*>.*?전화 문의.*?</a>',
        '', content, flags=re.DOTALL
    )

    # 6. 글자색 가시성 개선
    content = content.replace('rgba(240,235,225,0.65)', 'rgba(240,235,225,0.88)')
    content = content.replace('rgba(240,235,225,0.7)',  'rgba(240,235,225,0.90)')
    content = content.replace('rgba(240,235,225,0.55)', 'rgba(240,235,225,0.80)')
    content = content.replace("color: var(--mid);", "color: #9a9a9a;")

    return content


def fix_services(content: str) -> str:
    """4, 5, 6번 적용 (services.html)"""

    # 4. 상담 신청 링크
    content = content.replace(
        'href="https://open.kakao.com/o/example"',
        'href="consult.html"'
    )
    content = content.replace('href="index.html#contact"', 'href="consult.html"')

    # 5. 전화 문의 삭제
    content = re.sub(
        r'<a\s+href="tel:[^"]*"[^>]*>.*?전화 문의.*?</a>',
        '', content, flags=re.DOTALL
    )

    # 6. 가시성 개선
    content = content.replace('rgba(240,235,225,0.65)', 'rgba(240,235,225,0.88)')
    content = content.replace('rgba(240,235,225,0.7)',  'rgba(240,235,225,0.90)')
    content = content.replace('rgba(240,235,225,0.55)', 'rgba(240,235,225,0.80)')
    content = content.replace('#bbb', '#d0ccc6')
    content = content.replace('#888', '#9a9a9a')
    content = content.replace('color: var(--text-muted)', 'color: #9a9a9a')

    return content


def fix_reviews(content: str) -> str:
    """6, 7번 적용 (reviews.html)"""

    # 7. 리뷰 이름 치환
    for old, new in REVIEW_NAME_MAP.items():
        content = content.replace(old, new)

    # index.html의 이○○ 등 패턴도 치환
    content = content.replace('이○○ 고객', '이**님')
    content = content.replace('박○○ 고객', '박**님')
    content = content.replace('최○○ 고객', '최**님')

    # 6. 가시성 개선
    content = content.replace('var(--text-muted)', '#9a9a9a')
    content = content.replace("color: #888", "color: #9a9a9a")
    content = content.replace('rgba(240,235,225,0.75)', 'rgba(240,235,225,0.92)')

    return content


def fix_tips(content: str) -> str:
    """6, 8번 적용 (tips.html)"""

    # 8. 채널명 수정
    content = content.replace('Honey Money Mustard', '자산관리사 허머니')
    content = content.replace('HoneyMoneyMustard', '자산관리사 허머니')
    content = content.replace('@honeymoneymustard', '@자산관리사허머니')

    # 6. 가시성 개선
    content = content.replace('var(--text-muted)', '#9a9a9a')
    content = content.replace("color: #888", "color: #9a9a9a")
    content = content.replace('rgba(240,235,225,0.65)', 'rgba(240,235,225,0.88)')

    return content


def fix_consult(content: str) -> str:
    """4, 5, 6, 9, 10번 적용 (consult.html)"""

    # 4. 카카오 링크 → consult 내부에서는 완료 후 오픈채팅으로 가는 거라 유지
    #    단, 혹시 남아있는 #contact 링크 정리
    content = content.replace('href="#contact"', 'href="consult.html"')

    # 5. 전화 문의 삭제
    content = re.sub(
        r'<a\s+href="tel:[^"]*"[^>]*>.*?전화 문의.*?</a>',
        '', content, flags=re.DOTALL
    )

    # 9. 제목 수정
    content = content.replace(
        '상담 전 사전설문<br><em>작성해주세요</em>',
        '상담 전<br><em>드리는 말씀</em>'
    )
    content = content.replace(
        '상담 전 사전설문 작성해주세요',
        '상담 전 드리는 말씀'
    )

    # 6. 가시성 개선
    content = content.replace('rgba(240,235,225,0.65)', 'rgba(240,235,225,0.88)')
    content = content.replace('rgba(240,235,225,0.7)',  'rgba(240,235,225,0.90)')
    content = content.replace('rgba(240,235,225,0.75)', 'rgba(240,235,225,0.92)')
    content = content.replace("color: var(--mid);", "color: #9a9a9a;")
    content = content.replace('color: rgba(240,235,225,0.65)', 'color: rgba(240,235,225,0.88)')

    # 10. 1페이지 통합 — 2페이지 구조 제거
    content = _merge_consult_pages(content)

    return content


def _merge_consult_pages(content: str) -> str:
    """
    10번: consult.html의 2페이지 구조를 1페이지로 통합
    - progress bar / step dots 숨김
    - page1/page2 div를 단일 form으로 통합
    - 다음 단계 버튼 제거, 제출 버튼을 맨 하단으로
    - goPage2() / goPage1() 함수 제거, validatePage1() + validatePage2() 통합
    """

    # progress wrap 숨기기
    content = content.replace(
        '<div class="progress-wrap" id="progress-wrap">',
        '<div class="progress-wrap" id="progress-wrap" style="display:none">'
    )

    # page1 → 항상 표시 (active 유지)
    # page2 → active로 변경 + display block 강제 (CSS 오버라이드)
    content = content.replace(
        '<div class="form-page" id="page2">',
        '<div class="form-page active" id="page2">'
    )

    # "다음 단계" 버튼 전체 블록 제거
    content = re.sub(
        r'<div class="form-actions">[\s\S]*?<button class="btn-next"[^>]*>[\s\S]*?</button>\s*</div>\s*</div>\s*<!-- PAGE 2',
        '</div>\n\n  <!-- PAGE 2',
        content
    )

    # page1/page2 div 경계를 없애고 단일 흐름으로: page-title 두 번째 것 제거
    content = re.sub(
        r'<div class="page-title">\s*<span>Page 2 / 2</span>\s*재무 현황\s*</div>',
        '<div class="section-divider-inner" style="height:1px;background:rgba(184,151,58,0.2);margin:40px 0 36px;"></div>\n    <h3 style="font-family:\'Cormorant Garamond\',serif;font-size:18px;font-weight:300;color:var(--white);margin-bottom:28px;letter-spacing:0.05em;">재무 현황</h3>',
        content
    )

    # page1 title도 자연스럽게
    content = re.sub(
        r'<div class="page-title">\s*<span>Page 1 / 2</span>\s*기본 정보\s*</div>',
        '<h3 style="font-family:\'Cormorant Garamond\',serif;font-size:18px;font-weight:300;color:var(--white);margin-bottom:28px;letter-spacing:0.05em;">기본 정보</h3>',
        content
    )

    # 이전 버튼 제거
    content = re.sub(
        r'<button class="btn-prev"[^>]*>[\s\S]*?</button>',
        '',
        content
    )

    # form-actions justify: space-between → flex-end (이전 버튼 없으니)
    content = content.replace(
        'justify-content: space-between;',
        'justify-content: flex-end;'
    )

    # JS: submitForm에서 validatePage1 + validatePage2 모두 체크하도록
    old_submit_check = "  function submitForm() {\n    if (!validatePage2()) return;"
    new_submit_check = "  function submitForm() {\n    if (!validatePage1()) return;\n    if (!validatePage2()) return;"
    content = content.replace(old_submit_check, new_submit_check)

    # goPage1 / goPage2 함수 무력화 (혹시 호출되면 아무것도 안 하게)
    content = content.replace(
        'function goPage2() {',
        'function goPage2() { return; // 1페이지 통합으로 미사용\n  if(false){'
    )
    content = content.replace(
        'function goPage1() {',
        'function goPage1() { return; // 1페이지 통합으로 미사용\n  if(false){'
    )

    # updateProgress 초기화 제거 (progress 숨겨져 있으므로 무방)
    # CSS: .form-page display:block 강제
    content = content.replace(
        '.form-page { display: none; }',
        '.form-page { display: none; }\n  .form-page.active { display: block !important; }'
    )

    return content


# ─────────────────────────────────────────────
# 메인 실행
# ─────────────────────────────────────────────
def main():
    fixers = {
        'index.html':    fix_index,
        'services.html': fix_services,
        'reviews.html':  fix_reviews,
        'tips.html':     fix_tips,
        'consult.html':  fix_consult,
    }

    for filename in FILES:
        if not os.path.exists(filename):
            print(f'⚠️  {filename} 없음 — 건너뜀')
            continue

        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1, 2번: 전역 이름 치환
        content = apply_global_replacements(content)

        # 파일별 추가 수정
        if filename in fixers:
            content = fixers[filename](content)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f'✅  {filename} 수정 완료')

    print('\n🎉 모든 파일 수정 완료!')
    print('   → GitHub에 push하면 반영됩니다.')


if __name__ == '__main__':
    main()
