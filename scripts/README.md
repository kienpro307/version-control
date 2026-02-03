# MVM Setup Scripts

Automation tools to simplify MVM installation and verification.

---

## 🔑 `generate-api-key.ps1` (Windows)

Generate a secure API key for MVM REST API.

**Usage:**
```powershell
.\scripts\generate-api-key.ps1
```

**Output:**
```
✅ Generated API Key:
mvm_sk_live_Aa8Bb9Cc0Dd1Ee2Ff3Gg4Hh5Ii6

📋 Add this to your .env.local file:
API_SECRET_KEY=mvm_sk_live_Aa8Bb9Cc0Dd1Ee2Ff3Gg4Hh5Ii6
```

**Alternative (Cross-platform):**
```bash
npm run generate-api-key
```

---

## ✅ `verify-setup.ts`

Verify MVM setup is complete and working.

**Usage:**
```bash
npm run verify-setup
```

**What it checks:**
- ✅ `.env.local` exists and configured
- ✅ Supabase connection works
- ✅ Database schema deployed
- ✅ MCP config present (optional)

**Sample Output:**
```
📋 MVM Setup Verification

🔍 Checking environment variables...
✅ .env.local exists
✅ Supabase URL: https://xxxxx.supabase.co
✅ Supabase anon key configured
✅ API secret key configured

🔍 Testing Supabase connection...
✅ Database connection successful
✅ Found 3 projects

==================================================
✅ All checks passed! MVM is ready to use.
🚀 Run: npm run dev
==================================================
```

**Exit Codes:**
- `0`: All checks passed
- `1`: Setup incomplete

---

## 📦 NPM Scripts

Added to `package.json`:

```json
{
  "scripts": {
    "verify-setup": "ts-node scripts/verify-setup.ts",
    "generate-api-key": "node -e \"...\""
  }
}
```

**Benefits:**
- ✅ Cross-platform (Windows/Mac/Linux)
- ✅ No need to remember PowerShell syntax
- ✅ Consistent behavior

---

## 🛠️ Development

### Adding New Scripts

1. Create script in `scripts/`
2. Add npm script to `package.json`
3. Update this README
4. Test on Windows & Mac

### Testing

```bash
# Test verification script
npm run verify-setup

# Test API key generation
npm run generate-api-key
```

---

## 📚 Related Documentation

- [GETTING_STARTED.md](../docs/GETTING_STARTED.md) - Complete setup guide
- [VERIFICATION_EXAMPLES.md](../docs/VERIFICATION_EXAMPLES.md) - Expected outputs
- [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) - Common issues
