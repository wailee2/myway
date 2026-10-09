from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./myway.db"
    jwt_secret: str = "dev-only-change-me-dev-only-change-me-32b"
    jwt_hours: int = 24 * 30
    # Mirrors NEXT_PUBLIC_DEMO on the frontend: seeds demo users + trips and enables /dev endpoints.
    demo: bool = True
    # Until an SMS provider is attached, OTPs are only logged. In demo mode this fixed code is also accepted.
    demo_otp: str = "123456"
    # Shared secret the payment provider signs webhooks with (HMAC-SHA256 of the raw body).
    webhook_secret: str = "dev-webhook-secret"
    cors_origins: str = "http://localhost:3000"


settings = Settings()
