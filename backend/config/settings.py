"""
Django settings for Threat Hunting Platform.

Loads configuration from environment variables via .env file.
Splunk credentials are NEVER hard-coded.
"""

import os
from pathlib import Path
from datetime import timedelta

from dotenv import load_dotenv

# ------------------------------------------------------------------
# BASE DIRECTORY & ENV
# ------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# ------------------------------------------------------------------
# CORE SETTINGS
# ------------------------------------------------------------------
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "insecure-dev-key-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "true").lower() in ("true", "1", "yes")
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# ------------------------------------------------------------------
# INSTALLED APPS
# ------------------------------------------------------------------
INSTALLED_APPS = [
    # Django built-in
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    # Project apps
    "api",
    "investigations",
    "detections",
    "mitre",
    "reports",
]

# ------------------------------------------------------------------
# MIDDLEWARE
# ------------------------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # Must be high up
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ------------------------------------------------------------------
# DATABASE
# ------------------------------------------------------------------
DB_ENGINE = os.getenv("DB_ENGINE", "sqlite3")

if DB_ENGINE == "postgresql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "threathunt_db"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# ------------------------------------------------------------------
# PASSWORD VALIDATION
# ------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ------------------------------------------------------------------
# INTERNATIONALIZATION
# ------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------------------
# STATIC FILES
# ------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ------------------------------------------------------------------
# DEFAULT PRIMARY KEY
# ------------------------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ------------------------------------------------------------------
# REST FRAMEWORK
# ------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/minute",
        "user": "120/minute",
    },
}

# ------------------------------------------------------------------
# JWT CONFIGURATION
# ------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", "60"))
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=int(os.getenv("JWT_REFRESH_TOKEN_LIFETIME_DAYS", "7"))
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ------------------------------------------------------------------
# CORS
# ------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000"
).split(",")
CORS_ALLOW_CREDENTIALS = True

# ------------------------------------------------------------------
# SECURITY HEADERS (used when DEBUG=False)
# ------------------------------------------------------------------
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_CONTENT_TYPE_NOSNIFF = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True

# ------------------------------------------------------------------
# SPLUNK CONFIGURATION (read from env — never hard-code)
# ------------------------------------------------------------------
SPLUNK_HOST = os.getenv("SPLUNK_HOST", "localhost")
SPLUNK_PORT = int(os.getenv("SPLUNK_PORT", "8089"))
SPLUNK_USERNAME = os.getenv("SPLUNK_USERNAME", "")
SPLUNK_PASSWORD = os.getenv("SPLUNK_PASSWORD", "")
SPLUNK_INDEX = os.getenv("SPLUNK_INDEX", "threathunt")
SPLUNK_VERIFY_SSL = os.getenv("SPLUNK_VERIFY_SSL", "false").lower() in ("true", "1", "yes")

# ------------------------------------------------------------------
# REPORT OUTPUT
# ------------------------------------------------------------------
REPORT_OUTPUT_DIR = BASE_DIR / "reports_output"
REPORT_OUTPUT_DIR.mkdir(exist_ok=True)

# ------------------------------------------------------------------
# LOGGING
# ------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "file": {
            "class": "logging.FileHandler",
            "filename": BASE_DIR / "debug.log",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "INFO",
    },
    "loggers": {
        "django": {"level": "INFO"},
        "splunk": {"level": "DEBUG"},
        "investigations": {"level": "DEBUG"},
        "detections": {"level": "DEBUG"},
    },
}
