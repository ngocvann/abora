import subprocess, json, urllib.request, urllib.error

BASE = "http://localhost:8080"

def api(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return (json.loads(raw) if raw else {}), resp.status
    except urllib.error.HTTPError as e:
        raw = e.read()
        return (json.loads(raw) if raw else {}), e.code

OK = "[OK]"; FAIL = "[FAIL]"; INFO = "[INFO]"

print("=" * 60)
print("  ABORA SYSTEM TEST RESULTS")
print("=" * 60)

# === LOGIN ===
print("\n--- [1] LOGIN ---")
logins = [
    ("ngcvan04@gmail.com",      "password123", "Admin"),
    ("le.thu.huong@gmail.com",  "password123", "Le Thu Huong"),
    ("do.thanh.tung@gmail.com", "password123", "Do Thanh Tung"),
]
tokens = {}
for email, pwd, label in logins:
    r, c = api("POST", "/api/auth/login", {"usernameOrEmail": email, "password": pwd})
    if c == 200 and r.get("accessToken"):
        tokens[email] = r["accessToken"]
        print(f"  {OK} {label}: login success")
    else:
        print(f"  {FAIL} {label}: HTTP {c} -> {r}")

admin_tok = tokens.get("ngcvan04@gmail.com")
user_tok  = tokens.get("le.thu.huong@gmail.com")

# === STORIES ===
print("\n--- [2] STORIES (top views) ---")
r, c = api("GET", "/api/stories?page=0&size=5&sort=viewCount,desc")
if c == 200:
    print(f"  {OK} Total={r.get('totalElements')} stories")
    for s in r.get("content", []):
        print(f"       {s['title']}: {s['viewCount']} views")
else:
    print(f"  {FAIL} {c}: {r}")

# === STORY DETAIL ===
print("\n--- [3] STORY DETAIL ---")
r, c = api("GET", "/api/stories/mua-ha-nam-ay")
if c == 200:
    print(f"  {OK} Title: {r['title']}, Chapters: {r.get('chapterCount')}, Views: {r.get('viewCount')}")
else:
    print(f"  {FAIL} {c}: {r}")

# === CHAPTER ===
print("\n--- [4] CHAPTER READ ---")
r, c = api("GET", "/api/stories/mua-ha-nam-ay/chapters/1")
if c == 200:
    print(f"  {OK} Chapter: {r.get('title')}, Words: {r.get('wordCount')}")
else:
    r2, c2 = api("GET", "/api/chapters/1")
    if c2 == 200:
        print(f"  {OK} Chapter: {r2.get('title')}, Words: {r2.get('wordCount')}")
    else:
        print(f"  {FAIL} {c}/{c2}")

# === CATEGORIES ===
print("\n--- [5] CATEGORIES ---")
r, c = api("GET", "/api/categories")
cats = r if isinstance(r, list) else r.get("content", [])
if c == 200:
    print(f"  {OK} {len(cats)} categories: {', '.join(x.get('name','?') for x in cats[:5])} ...")
else:
    print(f"  {FAIL} {c}")

# === STORIES BY CATEGORY ===
print("\n--- [6] FILTER BY CATEGORY (Horror/Kinh di) ---")
horror_id = next((x['id'] for x in cats if 'Kinh' in x.get('name','')), None)
if horror_id:
    r, c = api("GET", f"/api/stories?categoryId={horror_id}&page=0&size=3")
    if c == 200:
        print(f"  {OK} Horror stories: {r.get('totalElements',0)}")
        for s in r.get("content", []):
            print(f"       - {s['title']}")
    else:
        print(f"  {INFO} Filter by category: {c}")
else:
    print(f"  {INFO} No horror category found")

# === NOTIFICATIONS ===
print("\n--- [7] NOTIFICATIONS ---")
if user_tok:
    r, c = api("GET", "/api/user/notifications?page=0&size=5", token=user_tok)
    if c == 200:
        items = r.get("content", []) if isinstance(r, dict) else r
        print(f"  {OK} Notifications: {r.get('totalElements', len(items))}")
        for n in items[:3]:
            print(f"       [{n.get('type','?')}] {str(n.get('message',''))[:55]}")
    else:
        print(f"  {FAIL} {c}: {r}")

# === READING HISTORY ===
print("\n--- [8] READING HISTORY ---")
if user_tok:
    r, c = api("GET", "/api/user/reading-history", token=user_tok)
    if c == 200:
        items = r if isinstance(r, list) else r.get("content", r.get("items", []))
        print(f"  {OK} Library items: {len(items)}")
        for item in items[:3]:
            sn = item.get("story", {}).get("title", item.get("storyTitle", "?"))
            st = item.get("status", "?")
            print(f"       {sn} [{st}]")
    else:
        print(f"  {FAIL} {c}: {str(r)[:100]}")

# === COMMENTS ===
print("\n--- [9] COMMENTS ---")
r, c = api("GET", "/api/chapters/13/comments?page=0&size=3")
if c == 200:
    print(f"  {OK} Comments on ch13 (Phong 404): {r.get('totalElements',0)}")
    for cm in r.get("content", [])[:2]:
        user = cm.get("user", cm.get("author", {}))
        name = user.get("displayName", user.get("username","?"))
        print(f"       {name}: {str(cm.get('content',''))[:50]}")
else:
    print(f"  {FAIL} {c}: {r}")

# === SEARCH ===
print("\n--- [10] SEARCH ---")
for q, label in [("lang man", "Romance"), ("kinh di", "Horror"), ("boss", "Boss")]:
    r, c = api("GET", f"/api/stories?search={q.replace(' ', '+')}&page=0&size=3")
    if c != 200:
        r, c = api("GET", f"/api/stories/search?q={q.replace(' ', '+')}&page=0&size=3")
    total = r.get("totalElements", r.get("total", "?")) if c == 200 else "ERROR"
    print(f"  {OK if c==200 else FAIL} '{q}' ({label}): {total} results (HTTP {c})")

print("\n" + "=" * 60)
print("  ALL TESTS DONE")
print("=" * 60)
