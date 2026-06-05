import json, urllib.request, urllib.error

BASE = "http://localhost:8080"

def get(path, token=None):
    h = {"Authorization": "Bearer " + token} if token else {}
    req = urllib.request.Request(BASE + path, headers=h)
    try:
        r = urllib.request.urlopen(req)
        raw = r.read()
        return json.loads(raw) if raw else {}, r.status
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return json.loads(raw) if raw else {}, e.code
        except:
            return {}, e.code

def post(path, body, token=None):
    h = {"Content-Type": "application/json"}
    if token: h["Authorization"] = "Bearer " + token
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), headers=h)
    try:
        r = urllib.request.urlopen(req)
        raw = r.read()
        return json.loads(raw) if raw else {}, r.status
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return json.loads(raw) if raw else {}, e.code
        except:
            return {}, e.code

# Login user + admin
ru, cu = post("/api/auth/login", {"email": "le.thu.huong@gmail.com", "password": "password123"})
ra, ca = post("/api/auth/login", {"email": "ngcvan04@gmail.com", "password": "password123"})
ut = ru.get("accessToken")
at = ra.get("accessToken")
print(f"User login:  HTTP {cu} token={'OK' if ut else 'FAIL'}")
print(f"Admin login: HTTP {ca} token={'OK' if at else 'FAIL'}")

# 1. User profile (correct URL)
print("\n--- User Profile ---")
r, c = get("/api/users/profile", ut)
if c == 200:
    print(f"  [OK] displayName={r.get('displayName')}, username={r.get('username')}, role={r.get('role')}")
else:
    print(f"  [{c}] /api/users/profile -> {r}")

# 2. Notifications (GET /api/notifications)
print("\n--- Notifications ---")
r, c = get("/api/notifications", ut)
if c == 200:
    items = r if isinstance(r, list) else r.get("content", [])
    print(f"  [OK] {len(items)} notifications")
    for n in items[:3]:
        print(f"    [{n.get('type')}] {str(n.get('message',''))[:55]}")
else:
    print(f"  [{c}] {r}")

# 3. Comments (public)
print("\n--- Comments (public) ---")
for cid in [1, 2, 13]:
    r, c = get(f"/api/chapters/{cid}/comments?page=0&size=3")
    if c == 200:
        items = r if isinstance(r, list) else r.get("content", [])
        total = len(items) if isinstance(r, list) else r.get('totalElements', len(items))
        print(f"  [OK] Chapter {cid}: {total} comments")
        for cm in items[:2]:
            author = cm.get("user", cm.get("author", {}))
            name = author.get("displayName", "?")
            print(f"    {name}: {str(cm.get('content',''))[:50]}")
        break
    else:
        print(f"  [{c}] Chapter {cid}")

# 4. Admin endpoints
print("\n--- Admin Endpoints ---")
for path in ["/api/admin/users?page=0&size=3",
             "/api/admin/reports?page=0&size=3",
             "/api/admin/stories?page=0&size=3"]:
    r, c = get(path, at)
    if c == 200:
        items = r.get("content", r if isinstance(r, list) else [])
        total = r.get("totalElements", len(items))
        print(f"  [OK] {path.split('?')[0]} -> {total} items")
        for item in items[:2]:
            name = item.get("displayName", item.get("title", item.get("email", "?")))
            print(f"    - {str(name)[:50]}")
    else:
        print(f"  [{c}] {path}")

# 5. Story follow (authenticated POST)
print("\n--- Story Follow ---")
r, c = post("/api/stories/boss-lanh-lung-em-buong-binh/follow", {}, ut)
print(f"  [{c}] POST /follow -> {r}")

# 6. Summary of all leaderboard results
print("\n--- Final Leaderboard Summary ---")
r, c = get("/api/stories?page=0&size=10&sort=viewCount,desc")
if c == 200:
    print(f"  Total stories: {r.get('totalElements')}")
    print("  Top 10 by views:")
    for i, s in enumerate(r.get("content", []), 1):
        print(f"    {i:2}. {s['title'][:35]:<35} {s['viewCount']:>5} views | {s.get('followCount',0):>2} follows | {s.get('genre','?')}")

print("\n====== ALL TESTS DONE ======")
