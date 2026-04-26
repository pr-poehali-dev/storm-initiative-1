"""
Сохранение и загрузка данных пользователя (проекты, канвасы, тема).
Требует X-User-Id и X-Auth-Token заголовков (проверка по userId).
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    headers = event.get("headers") or {}
    user_id_raw = headers.get("X-User-Id") or headers.get("x-user-id")
    if not user_id_raw:
        return {
            "statusCode": 401,
            "headers": cors_headers(),
            "body": json.dumps({"error": "Не авторизован"}),
        }

    try:
        user_id = int(user_id_raw)
    except ValueError:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"error": "Некорректный userId"}),
        }

    method = event.get("httpMethod", "GET")
    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == "GET":
            cur.execute(
                f"SELECT projects, canvases, theme FROM {SCHEMA}.user_data WHERE user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            if not row:
                return {
                    "statusCode": 200,
                    "headers": cors_headers(),
                    "body": json.dumps({"projects": [], "canvases": {}, "theme": "dark"}),
                }
            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "projects": row[0],
                    "canvases": row[1],
                    "theme": row[2],
                }),
            }

        elif method == "POST":
            body = json.loads(event.get("body") or "{}")
            projects = body.get("projects", [])
            canvases = body.get("canvases", {})
            theme = body.get("theme", "dark")

            cur.execute(
                f"""INSERT INTO {SCHEMA}.user_data (user_id, projects, canvases, theme, updated_at)
                    VALUES (%s, %s, %s, %s, NOW())
                    ON CONFLICT (user_id) DO UPDATE
                    SET projects = EXCLUDED.projects,
                        canvases = EXCLUDED.canvases,
                        theme = EXCLUDED.theme,
                        updated_at = NOW()""",
                (user_id, json.dumps(projects), json.dumps(canvases), theme),
            )
            conn.commit()
            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({"ok": True}),
            }
    finally:
        cur.close()
        conn.close()

    return {
        "statusCode": 405,
        "headers": cors_headers(),
        "body": json.dumps({"error": "Method not allowed"}),
    }
