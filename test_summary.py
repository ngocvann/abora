import json, urllib.request, urllib.error

BASE = "http://localhost:8080"

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
        try: return json.loads(raw) if raw else {}, e.code
        except: return {}, e.code

def get(path, token=None):
    h = {"Authorization": "Bearer " + token} if token else {}
    req = urllib.request.Request(BASE + path, headers=h)
    try:
        r = urllib.request.urlopen(req)
        raw = r.read()
        return json.loads(raw) if raw else {}, r.status
    except urllib.error.HTTPError as e:
        raw = e.read()
        try: return json.loads(raw) if raw else {}, e.code
        except: return {}, e.code

ru, _ = post("/api/auth/login", {"usernameOrEmail": "le.thu.huong@gmail.com", "password": "password123"})
ru2, _ = post("/api/auth/login", {"usernameOrEmail": "nguyen.van.an@gmail.com", "password": "password123"})
ut = ru.get("accessToken")
ut2 = ru2.get("accessToken")

print("=== USER FOLLOW TEST ===")
# User 3 (le.thu.huong, id=3) follows user 2 (nguyen.van.an, id=2)
r, c = post("/api/users/2/follow", {}, ut)
print(f"  POST /api/users/2/follow: HTTP {c} -> {r}")

r2, c2 = get("/api/users/3/followers")
print(f"  GET /api/users/3/followers: HTTP {c2} -> {r2}")

r3, c3 = get("/api/users/3/follow-status", ut2)
print(f"  GET /api/users/3/follow-status (from user2): HTTP {c3} -> {r3}")

print("\n=== READING LIST TEST ===")
r, c = get("/api/reading-lists?page=0&size=5", ut)
if c == 200:
    items = r.get("content", r if isinstance(r, list) else [])
    print(f"  [OK] Reading lists: {r.get('totalElements', len(items))}")
else:
    print(f"  [{c}] reading-lists: {r}")

print("\n=== STORY SEARCH BY CATEGORY ===")
# Get categories first
cats, _ = get("/api/categories")
romance = next((x for x in cats if "Lãng" in x.get("name","")), None)
if romance:
    r, c = get(f"/api/stories?categoryId={romance['id']}&page=0&size=5")
    if c == 200:
        print(f"  [OK] Romance stories: {r.get('totalElements')} total")
        for s in r.get("content", [])[:3]:
            cats_names = [cat['name'] for cat in s.get('categories', [])]
            print(f"    - {s['title']}: {', '.join(cats_names)}")

print("\n=== ALL SYSTEMS SUMMARY ===")
checks = []
r, c = post("/api/auth/login", {"usernameOrEmail": "le.thu.huong@gmail.com", "password": "password123"})
checks.append(("Auth/Login", c == 200))

r, c = get("/api/stories?page=0&size=1&sort=viewCount,desc")
checks.append(("Stories/Leaderboard", c == 200 and r.get("totalElements", 0) > 0))

r, c = get("/api/stories/can-phong-404")
checks.append(("Story Detail by Slug", c == 200))

r, c = get("/api/stories/can-phong-404/chapters/1")
checks.append(("Chapter Read", c == 200))

r, c = get("/api/categories")
checks.append(("Categories", c == 200 and len(r) > 0))

r, c = get("/api/notifications", ut)
checks.append(("Notifications Auth", c == 200))

r, c = get("/api/users/profile", ut)
checks.append(("User Profile", c == 200))

r, c = get("/api/chapters/4/comments")
checks.append(("Comments Public", c == 200))

r, c = post("/api/users/5/follow", {}, ut)
checks.append(("User Follow", c == 200))

for name, ok in checks:
    print(f"  {'[OK]' if ok else '[FAIL]'} {name}")

passed = sum(1 for _, ok in checks if ok)
print(f"\n  TOTAL: {passed}/{len(checks)} passed")
