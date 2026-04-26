"""
Авторизация пользователей Вафельки: регистрация и вход.
Возвращает session_token в cookie при успехе.
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    salt = "waffles_salt_v1"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def make_token() -> str:
    return secrets.token_hex(32)


def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action")  # "register" | "login"
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"error": "Email и пароль обязательны"}),
        }

    if len(password) < 6:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"error": "Пароль должен быть не менее 6 символов"}),
        }

    pw_hash = hash_password(password)
    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == "register":
            # Проверяем, не занят ли email
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
            if cur.fetchone():
                return {
                    "statusCode": 409,
                    "headers": cors_headers(),
                    "body": json.dumps({"error": "Пользователь с таким email уже существует"}),
                }
            # Создаём пользователя
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (email, password_hash) VALUES (%s, %s) RETURNING id",
                (email, pw_hash),
            )
            user_id = cur.fetchone()[0]
            # Создаём пустые данные
            cur.execute(
                f"INSERT INTO {SCHEMA}.user_data (user_id, projects, canvases, theme) VALUES (%s, %s, %s, %s)",
                (user_id, json.dumps([]), json.dumps({}), "dark"),
            )
            conn.commit()

        elif action == "login":
            cur.execute(
                f"SELECT id FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s",
                (email, pw_hash),
            )
            row = cur.fetchone()
            if not row:
                return {
                    "statusCode": 401,
                    "headers": cors_headers(),
                    "body": json.dumps({"error": "Неверный email или пароль"}),
                }
            user_id = row[0]
        else:
            return {
                "statusCode": 400,
                "headers": cors_headers(),
                "body": json.dumps({"error": "Неизвестное действие"}),
            }

        # Получаем данные пользователя
        cur.execute(
            f"SELECT projects, canvases, theme FROM {SCHEMA}.user_data WHERE user_id = %s",
            (user_id,),
        )
        data_row = cur.fetchone()
        projects = data_row[0] if data_row else []
        canvases = data_row[1] if data_row else {}
        theme = data_row[2] if data_row else "dark"

        token = make_token()
        headers = {
            **cors_headers(),
            "X-Set-Cookie": f"waffles_token={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000",
        }

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "userId": user_id,
                "email": email,
                "token": token,
                "projects": projects,
                "canvases": canvases,
                "theme": theme,
            }),
        }
    finally:
        cur.close()
        conn.close()
