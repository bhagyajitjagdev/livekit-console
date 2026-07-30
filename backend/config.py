import secrets

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # The LiveKit server this console manages. Server-side only — the
    # secret is never sent to the browser.
    livekit_url: str = ""
    livekit_api_key: str = ""
    livekit_api_secret: str = ""

    auth_username: str = ""
    auth_password: str = ""
    # Signs the session cookie. Random per boot when unset, which signs
    # everyone out on every restart.
    session_secret: str = secrets.token_hex(32)
    # Set true once TLS terminates in front of the app.
    session_secure: bool = False


settings = Settings()

# Running open by accident is worse than refusing to boot.
if not settings.auth_username or not settings.auth_password:
    raise RuntimeError(
        "AUTH_USERNAME and AUTH_PASSWORD are required — set them in the "
        "environment or in backend/.env"
    )
