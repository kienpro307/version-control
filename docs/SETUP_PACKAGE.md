# MVM Integration Package

> 🚀 Setup MVM làm External Memory cho AI Agents!

## 📍 Setup Checklist

| Step | What | Where | Frequency |
|------|------|-------|-----------|
| 1 | [MACHINE_SETUP.md](./MACHINE_SETUP.md) | MCP config | 1x per machine |
| 2 | Create `.mvm-project` | Each project | 1x per project |

---

## Quick Setup (1 command)

```powershell
# Windows
node D:\VersionControl\my-version-manager\scripts\mvm-setup.js <your-project-path> <project-uuid>

# Mac
node ~/Dev/my-version-manager/scripts/mvm-setup.js <your-project-path> <project-uuid>
```

**Example:**
```powershell
node D:\VersionControl\my-version-manager\scripts\mvm-setup.js D:\VersionControl\AllUpgrade b5f5d972-77c3-4f52-9a7d-5293b045df07
```

---

## Project UUIDs (Copy sẵn)

| Project | UUID |
|---------|------|
| Android/All Translate React Native | `b5f5d972-77c3-4f52-9a7d-5293b045df07` |
| IOS/AppServicesKit | `bdd75689-b0a2-4c99-991b-3232523e78a4` |
| IOS/DocumentTranslationKit | `5bd20795-6c58-47a1-9ed2-1441221b3e56` |
| IOS/TranslationKit | `1fe67274-56c0-4a74-91b8-f4425fc7f2c3` |
| IOS/ImageTranslationKit | `dfa5f6f3-7781-40e3-97a6-eec9ed08b668` |
| IOS/VoiceTranslationKit | `12ca6186-30bb-468e-bacb-276a14a12843` |
| IOS/IOSTemplate | `a345eb61-9368-4190-8c6e-ef9a7e73df1d` |
| IOS/XTranslate | `27ee3896-c91b-4ac4-b8c6-7cf52f620830` |
| Web/FastMail | `c190acc9-fcc3-442e-80e3-c5656cdaa147` |
| Web/HuyenkenPortfolio | `659aed64-799f-42d2-9dca-b789dde2cee7` |
| Web/MyVersionManager | `1601b9ca-f19c-4bd6-97ba-9f41de6c2a0d` |

---

## Sau khi setup xong

Gõ `/mvm` trong project để:
- Xem pending tasks
- Xem context dump
- Thêm/hoàn thành tasks
- Update progress
- Tạo context dump

---

## One-time Global Setup (Optional)

Để AI tự động nhận biết MVM, paste vào `~/.gemini/GEMINI.md`:

```
Khi bắt đầu session, kiểm tra file .mvm-project trong workspace.
Nếu có, đọc projectId và query MVM database.
```
