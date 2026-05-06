# 라저형 무료 가이드북 랜딩페이지

## 실행 방법
1. 로컬 확인만 할 때는 `index.html`을 브라우저로 열면 됩니다.
2. 로컬 파일 모드에서는 이메일이 localStorage에 저장되고 `download.html`로 이동합니다.
3. Vercel 배포 환경에서는 `/api/leads`를 통해 Supabase `leads` 테이블에 저장됩니다.
4. 다운로드 페이지에서는 웹 보기와 PDF 다운로드를 모두 제공합니다.

## Supabase 설정
1. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다.
2. Vercel 환경변수에 아래 값을 추가합니다.

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
```

`SUPABASE_SERVICE_ROLE_KEY`는 브라우저에 노출하면 안 됩니다. 반드시 Vercel Serverless Function 환경변수로만 사용합니다.

## 관리자 페이지
- `/admin.html`에서 관리자 비밀번호를 입력합니다.
- 이메일 리스트를 조회하고 엑셀용 CSV로 다운로드할 수 있습니다.
- HTML 파일과 PDF 파일을 세트로 업로드하면 `download.html`의 웹 보기/PDF 다운로드 버튼이 같은 버전으로 연결됩니다.
- 로컬 파일 모드에서는 API가 없으므로 관리자 기능은 `vercel dev` 또는 배포 환경에서 테스트합니다.

## Vercel 배포
1. Vercel 프로젝트 Root Directory를 이 폴더(`MVP landingpage`)로 지정합니다.
2. 환경변수를 추가합니다.
3. 배포 후 이메일 제출 → 다운로드 페이지 이동 → Supabase 저장을 확인합니다.

## 파일 구조
- `index.html` : 랜딩페이지
- `download.html` : 다운로드 페이지 + 초기 안내방 CTA
- `style.css` : 스타일
- `script.js` : 이메일 제출 + 이동
- `api/leads.js` : Vercel Serverless Function + Supabase 저장
- `supabase/schema.sql` : 리드 수집 테이블
- `assets/guidebook-mockup.png` : 목업 이미지
- `assets/razer-profile.webp` : 프로필 이미지
- `assets/guidebook.html` : 무료 가이드북 HTML
- `assets/guidebook.pdf` : 무료 가이드북 PDF

## 나중에 바꿀 것
- 도메인: 브랜드명이 확정되면 Vercel에서 연결
