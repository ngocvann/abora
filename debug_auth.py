import json, urllib.request, urllib.error

BASE = "http://localhost:8080"

# Login
req = urllib.request.Request(
    BASE + "/api/auth/login",
    data=json.dumps({"usernameOrEmail": "le.thu.huong@gmail.com", "password": "password123"}).encode(),
    headers={"Content-Type": "application/json"}
)
r = urllib.request.urlopen(req)
data = json.loads(r.read())
token = data.get("accessToken", "")
print(f"Token: {token[:50]}...")

# Test with explicit headers similar to browser
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
    "Origin": "http://localhost:5173",
    "Accept": "application/json",
}

for path in ["/api/user/profile", "/api/users/me", "/api/user/me"]:
    req2 = urllib.request.Request(BASE + path, headers=headers)
    try:
        r2 = urllib.request.urlopen(req2)
        print(f"[{r2.status}] {path} -> {json.loads(r2.read()).get('displayName','ok')}")
    except urllib.error.HTTPError as e:
        print(f"[{e.code}] {path}")

# Test comment endpoint
for path in ["/api/chapters/13/comments?page=0&size=3"]:
    req3 = urllib.request.Request(BASE + path, headers=headers)
    try:
        r3 = urllib.request.urlopen(req3)
        d = json.loads(r3.read())
        print(f"[{r3.status}] {path} -> {d.get('totalElements', '?')} comments")
    except urllib.error.HTTPError as e:
        body = e.read()
        print(f"[{e.code}] {path} -> {body[:100]}")
