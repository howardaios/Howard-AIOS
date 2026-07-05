from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str = "Howard AIOS"

    APP_VERSION: str = "0.1.0"

    ENV: str = "dev"

    LOG_LEVEL: str = "INFO"

    DATA_PATH: str = "./data"

    class Config:
        env_file = ".env"


settings = Settings()
