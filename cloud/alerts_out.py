"""Push alerts out of the cloud. Telegram works on any phone (set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID).
How: in Telegram talk to @BotFather -> /newbot -> copy the token. Send any message to your bot, then open
https://api.telegram.org/bot<TOKEN>/getUpdates and copy "chat":{"id": ...}.
The app itself also shows alerts (and a phone notification while it is open)."""
import threading

import config


def _telegram(text):
    try:
        import requests
        requests.post(f"https://api.telegram.org/bot{config.TELEGRAM_BOT_TOKEN}/sendMessage",
                      json={"chat_id": config.TELEGRAM_CHAT_ID, "text": text}, timeout=10)
    except Exception as e:  # noqa: BLE001
        print("[alert] telegram failed:", e)


def send(alert):
    print(f"[alert] {alert['title_en']} - {alert['body_en']}")
    if not (config.TELEGRAM_BOT_TOKEN and config.TELEGRAM_CHAT_ID):
        return
    steps = "\n".join(f"• {s['kn']}" for s in alert["steps"][:2])
    text = (f"🐛 PestPulse – {alert['title_en']}\n{alert['body_en']}\n\n"
            f"{alert['title_kn']}\n{alert['body_kn']}\n{steps}")
    threading.Thread(target=_telegram, args=(text,), daemon=True).start()
