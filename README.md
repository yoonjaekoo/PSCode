# PSCode

경량 competitive programming 데스크톱 에디터 (Tauri 2 + React + Monaco).  
PS(Competitive Programming) 전용 도구로, 빠른 코드 작성과 즉각적인 실행 환경을 제공합니다.

## 🚀 배포 및 자동화 (CI/CD)

### GitHub Actions 자동 배포
- **자동 빌드**: `v*` 형태의 태그(예: `v0.1.0`)를 푸시하면 GitHub Actions가 자동으로 빌드를 실행합니다.
- **Windows (.exe)**: Windows용 설치 파일(`PSCode_Setup.exe`)이 자동 빌드되어 Release에 업로드됩니다.
- **Android (.apk)**: Android용 APK(`PSCode_Android.apk`)가 자동 빌드되어 Release에 업로드됩니다.
  - Android에서는 로컬 GCC 컴파일이 불가능하므로 **OnlineCompiler.io**를 통해 코드를 컴파일/실행합니다.
- **Release 자동 생성**: 빌드된 결과물은 GitHub Release에 초안(Draft)으로 업로드되어 즉시 배포 가능합니다.

### Android APK 사용 시 주의사항
- Android 앱은 로컬 GCC 컴파일러를 사용할 수 없습니다.
- **OnlineCompiler.io API 키**를 발급받아 설정에서 등록하고 "Use Online Compiler"를 활성화해야 합니다.
  - [OnlineCompiler.io](https://onlinecompiler.io)에서 회원가입 후 API 키를 발급받으세요.
  - 설정 창(`Ctrl+,`)에서 API Key를 입력하고 체크박스를 활성화하세요.
  - 이후 모든 컴파일/실행이 OnlineCompiler.io API를 통해 이루어집니다.

### 간편 배포 스크립트
제공된 스크립트를 사용하여 커밋, 푸시, 태그 생성을 한 번에 처리할 수 있습니다:
- **`deploy.bat`**: 더블 클릭만으로 실행 가능.
- **`./build-deploy.ps1`**: 커밋 메시지를 입력받아 메인 브랜치에 푸시하고, 선택 시 배포용 태그까지 생성합니다.

---

## ✨ 주요 기능

### 지능형 코드 에디터 (Monaco)
- **대규모 PS 스니펫 지원**: 
  - 기본: `bits`, `fastio`, `ll`, `cinn`, `cinv` 등
  - 알고리즘: `bfs`, `dfs`, `dijkstra`, `binarysearch`, `prime` 등
  - 자료구조: `segtree`, `unionfind`, `pqmin` 등
  - 기타: `modpow`, `comb`, `bitmask` 등
- **코드 가독성 도구**:
  - **코드 정렬**: `Ctrl+Shift+F` 또는 하단 버튼을 통해 들여쓰기 자동 정리.
  - **자동 띄어쓰기**: 연산자 및 키워드 사이의 공백을 자동으로 교정.

### 환경 구성 자동화
- **컴파일러 자동 설치**: 설정 창(`Ctrl+,`)에서 **버튼 클릭 한 번으로 MSYS2 및 MinGW64 GCC를 자동 설치**할 수 있습니다. (Windows 전용)
- **지능형 탐지**: 시스템에 설치된 컴파일러 경로를 자동으로 찾아 연결합니다.

### 워크스페이스 관리
- **자동 폴더링**: 날짜별 문제 폴더 (`projects/YYYY-MM-DD/`) 자동 생성.
- **기본 템플릿**: 새 파일 생성 시 최적화된 C++ Boilerplate (`bits/stdc++.h`, `fastio`) 즉시 제공.
- **자동 저장**: 입력과 동시에 변경 사항을 안전하게 저장.

---

## 🛠 사전 요구사항

### 공통
- Node.js 20+
- Rust ([rustup](https://rustup.rs/))

### Windows (데스크톱)
- Visual Studio Build Tools, WebView2
- **C++17 컴파일러**: [MSYS2](https://www.msys2.org/) mingw64 권장
  - **프로그램 내에서 자동 설치 기능을 제공합니다.** 수동 설치 시 기본 경로는 `C:\msys64\mingw64\bin\g++.exe`입니다.

### Android APK 빌드 (선택사항, GitHub Actions에서 자동 처리)
- Android APK는 GitHub Actions에서 자동으로 빌드되며, 로컬에서 빌드하려면 다음이 필요합니다:
  - JDK 17+
  - Android SDK (API 34+)
  - Android NDK 27+
  - Rust Android targets: `aarch64-linux-android`, `armv7-linux-androideabi`, `i686-linux-android`, `x86_64-linux-android`

### OnlineCompiler.io (Android 필수)
- Android에서는 로컬 GCC 대신 [OnlineCompiler.io](https://onlinecompiler.io) API를 통해 코드를 컴파일합니다.
- 설정 창(`Ctrl+,`)에서 API Key를 등록하고 "Use Online Compiler"를 활성화하세요.

---

## ⌨️ 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `F5` / `Ctrl+Enter` | 컴파일 + 실행 |
| `Ctrl+S` | 저장 |
| `Ctrl+Shift+F` | 코드 자동 정렬 |
| `Ctrl+Shift+P` | 명령 팔레트 |
| `Ctrl+N` | 새 문제 |
| `Ctrl+,` | 설정 |
| `Ctrl+B` | 사이드바 토글 |
| `` Ctrl+` `` | 출력 콘솔 토글 |

---

## 📂 작업 환경

- **작업 폴더**: `Documents/PSCode` (설정에서 변경 가능)
- **설정 파일**: `%APPDATA%\com.pscode.app\.pscode\settings.json`
