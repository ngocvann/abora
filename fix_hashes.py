import subprocess

HASH = "$2a$10$MJLZZgwTDpyaowJkKeVDGOzpZ8Q.hlqEmJlcY.6E3Oa5K67qSVOau"

sqls = [
    f"UPDATE users SET password_hash = '{HASH}' WHERE id >= 1",
    "UPDATE users SET role = 'ADMIN' WHERE id = 1",
    "SELECT id, email, role, LEFT(password_hash, 7) as pfx FROM users ORDER BY id",
]

for sql in sqls:
    result = subprocess.run(
        ["mysql", "-u", "abora", "-p1306", "abora", "-e", sql],
        capture_output=True, text=True
    )
    if result.stdout.strip():
        print(result.stdout)
    if result.returncode != 0 and "Warning" not in result.stderr:
        err = result.stderr.replace("mysql: [Warning] Using a password on the command line interface can be insecure.\n", "")
        if err.strip():
            print("ERR:", err[:200])

print("Done!")
