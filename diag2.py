import json, urllib.request, urllib.error

BASE = "http://localhost:8080"

def get_raw(path, token=None):
    h = {"Authorization": "Bearer " + token} if token else {}
    req = urllib.request.Request(BASE + path, headers=h)
    try:
        r = urllib.request.urlopen(req)
        raw = r.read()
        return raw, r.status
    except urllib.error.HTTPError as e:
        return e.read(), e.code

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

# Login
ru, _ = post("/api/auth/login", {"usernameOrEmail": "le.thu.huong@gmail.com", "password": "password123"})
ra, _ = post("/api/auth/login", {"usernameOrEmail": "ngcvan04@gmail.com", "password": "password123"})
ut = ru.get("accessToken")
at = ra.get("accessToken")

# Check actual comments path - list all chapters first
print("=== CHAPTERS IN DB ===")
raw, code = get_raw("/api/stories/boss-lanh-lung-em-buong-binh/chapters")
if code == 200:
    chapters = json.loads(raw)
    items = chapters if isinstance(chapters, list) else chapters.get("content", [])
    for ch in items[:3]:
        print(f"  Chapter id={ch.get('id')} num={ch.get('chapterNumber')} title={ch.get('title','?')[:40]}")
else:
    print(f"  HTTP {code}")

# Try exact chapter IDs from DB
print("\n=== COMMENTS TEST ===")
for chid in [1, 2, 3, 4, 5]:
    raw, code = get_raw(f"/api/chapters/{chid}/comments")
    body_str = raw.decode("utf-8", errors="replace")[:100] if raw else "(empty)"
    if code == 200:
        items = json.loads(raw)
        print(f"  [OK] ch{chid}: {len(items)} comments")
        break
    else:
        print(f"  [{code}] ch{chid}: {body_str}")

# Try with auth token
print("\n=== COMMENTS WITH AUTH ===")
raw, code = get_raw("/api/chapters/1/comments", ut)
print(f"  With user auth: HTTP {code}, body={raw[:80] if raw else '(empty)'}")

# Check what stories look like with a genre field
print("\n=== STORY RESPONSE FIELDS ===")
raw, code = get_raw("/api/stories/can-phong-404")
if code == 200:
    d = json.loads(raw)
    print(f"  Fields: {list(d.keys())}")
    print(f"  categories: {d.get('categories')}")
    print(f"  genre: {d.get('genre')}")

# Test story follow with correct path
print("\n=== STORY FOLLOW ===")
r, c = post("/api/stories/boss-lanh-lung-em-buong-binh/follow", {}, ut)
print(f"  POST /follow: HTTP {c} -> {r}")
# Try toggle/unfollow variants
r2, c2 = post("/api/stories/boss-lanh-lung-em-buong-binh/toggle-follow", {}, ut)
print(f"  POST /toggle-follow: HTTP {c2} -> {r2}")
r3, c3 = post("/api/story-follows", {"storyId": 5}, ut)
print(f"  POST /story-follows: HTTP {c3} -> {r3}")

print("\nDone.")
