import json, urllib.request, urllib.error

BASE = "http://localhost:8080"

def get(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(BASE + path, headers=headers)
    try:
        r = urllib.request.urlopen(req)
        raw = r.read()
        return json.loads(raw) if raw else {}, r.status
    except urllib.error.HTTPError as e:
        raw = e.read()
        return json.loads(raw) if raw else {}, e.code

def post(path, body, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    data = json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=data, headers=headers)
    try:
        r = urllib.request.urlopen(req)
        raw = r.read()
        return json.loads(raw) if raw else {}, r.status
    except urllib.error.HTTPError as e:
        raw = e.read()
        return json.loads(raw) if raw else {}, e.code

# Login
r, c = post("/api/auth/login", {"usernameOrEmail": "le.thu.huong@gmail.com", "password": "password123"})
token = r.get("accessToken") if c == 200 else None
print(f"Login: HTTP {c}, token={'ok' if token else 'MISSING'}")

# 1. Story detail slugs
print("\n--- Story Detail ---")
for slug in ["ngan-ha-goi-ten-em", "can-phong-404", "boss-lanh-lung-em-buong-binh"]:
    r, c = get("/api/stories/" + slug)
    title = r.get("title", "?")
    print(f"  [{c}] /api/stories/{slug} -> {title[:35]}")

# 2. Chapter read
print("\n--- Chapter Read ---")
for path in ["/api/stories/can-phong-404/chapters/1",
             "/api/stories/1/chapters/1",
             "/api/chapters/13"]:
    r, c = get(path)
    print(f"  [{c}] {path} -> {r.get('title','?')[:40]}")

# 3. Notifications
print("\n--- Notifications ---")
for path in ["/api/user/notifications?page=0&size=5",
             "/api/notifications?page=0&size=5"]:
    r, c = get(path, token)
    if c == 200:
        items = r.get("content", r if isinstance(r, list) else [])
        print(f"  [OK] {path} -> {r.get('totalElements', len(items))} notifications")
        for n in items[:2]:
            print(f"       [{n.get('type')}] {str(n.get('message',''))[:50]}")
        break
    else:
        print(f"  [{c}] {path}")

# 4. Comments
print("\n--- Comments ---")
for path in ["/api/chapters/13/comments?page=0&size=5",
             "/api/chapters/13/comments",
             "/api/comments?chapterId=13&page=0&size=5"]:
    r, c = get(path)
    if c == 200:
        items = r.get("content", r if isinstance(r, list) else [])
        print(f"  [OK] {path} -> {r.get('totalElements', len(items))} comments")
        for cm in items[:2]:
            author = cm.get("user", cm.get("author", {}))
            name = author.get("displayName", author.get("username", "?"))
            print(f"       {name}: {str(cm.get('content',''))[:50]}")
        break
    else:
        print(f"  [{c}] {path}")

# 5. Leaderboard specific
print("\n--- Leaderboard ---")
r, c = get("/api/stories?page=0&size=5&sort=viewCount,desc")
print(f"  [{c}] viewCount sort: {r.get('totalElements')} total")
r2, c2 = get("/api/stories?page=0&size=5&sort=followCount,desc")
print(f"  [{c2}] followCount sort: {r2.get('totalElements')} total")

print("\nDone.")
